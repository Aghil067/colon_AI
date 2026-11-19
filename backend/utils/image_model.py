import hashlib
import json
from pathlib import Path

DATASET_NAME = "Kvasir v2"
DATASET_URL = "https://datasets.simula.no/kvasir/"
DATASET_ARCHIVE = "https://datasets.simula.no/downloads/kvasir/kvasir-dataset-v2.zip"
CLASSES = (
    "dyed-lifted-polyps", "dyed-resection-margins", "esophagitis", "normal-cecum",
    "normal-pylorus", "normal-z-line", "polyps", "ulcerative-colitis",
)


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class ImageClassifier:
    def __init__(self, directory, logger):
        self.directory = Path(directory)
        self.model = None
        self.metadata = None
        self.status = "unavailable"
        self.logger = logger
        model_path = self.directory / "classifier.keras"
        metadata_path = self.directory / "evaluation.json"
        if not metadata_path.is_file():
            return
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            model_file = metadata.get("model_file", "classifier.keras")
            if model_file not in {"classifier.keras", "classifier.h5"}:
                raise ValueError("Unsupported classifier filename.")
            model_path = self.directory / model_file
            if (metadata["schema_version"] != 1 or metadata["dataset_url"] != DATASET_URL
                    or tuple(metadata["classes"]) != CLASSES
                    or metadata["model_sha256"] != file_sha256(model_path)):
                raise ValueError("The trained model does not match the evaluation manifest.")
            import tensorflow as tf

            model = tf.keras.models.load_model(model_path, compile=False)
            if model.output_shape[-1] != len(CLASSES):
                raise ValueError("Model output does not match the publisher's labels.")
            self.model = model
            self.metadata = metadata
            self.status = "ready"
        except Exception:
            self.logger.exception("Could not load the Kvasir classifier.")
            self.status = "load_error"

    def predict(self, image_path, overlay_path):
        if self.model is None:
            return None

        import numpy as np
        import tensorflow as tf
        from utils.gradcam import make_gradcam_heatmap, save_and_display_gradcam

        pixels = tf.io.decode_jpeg(tf.io.read_file(str(image_path)), channels=3)
        pixels = tf.image.resize(pixels, (224, 224))
        batch = tf.keras.applications.mobilenet_v2.preprocess_input(pixels[None, ...])
        probabilities = self.model(batch, training=False).numpy()[0]
        if not np.all(np.isfinite(probabilities)):
            raise ValueError("Model returned invalid scores.")
        class_index = int(np.argmax(probabilities))
        try:
            overlay = make_gradcam_heatmap(batch, self.model, "out_relu", class_index)
            if np.isfinite(overlay).all() and overlay.max() > 0:
                save_and_display_gradcam(str(image_path), overlay, str(overlay_path))
        except Exception:
            self.logger.exception("Could not generate Grad-CAM for an assessment.")
            overlay_path.unlink(missing_ok=True)

        ranked = sorted(zip(CLASSES, probabilities), key=lambda pair: float(pair[1]), reverse=True)
        return {
            "label": CLASSES[class_index],
            "classes": [{"label": label, "score": round(float(score), 6)} for label, score in ranked],
            "model_sha256": self.metadata["model_sha256"],
            "dataset": self.metadata["dataset"],
            "dataset_url": self.metadata["dataset_url"],
        }

