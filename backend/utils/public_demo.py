import json
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory

from utils.image_model import CLASSES, file_sha256

DEMO_FILES = {"image": "demo-image.jpg", "heatmap": "demo-gradcam.jpg"}


def write_public_demo(classifier, sample):
    path, label = sample
    directory = classifier.directory
    with TemporaryDirectory(dir=directory) as staging:
        staging = Path(staging)
        image = staging / DEMO_FILES["image"]
        overlay = staging / DEMO_FILES["heatmap"]
        shutil.copyfile(path, image)
        inference = classifier.predict(image, overlay)
        metadata = {
            "dataset_label": CLASSES[label],
            "image_sha256": file_sha256(image),
            "heatmap_sha256": file_sha256(overlay) if overlay.is_file() else None,
            "inference": inference,
        }
        manifest = staging / "demo.json"
        manifest.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        for filename in DEMO_FILES.values():
            if (staging / filename).is_file():
                (staging / filename).replace(directory / filename)
        manifest.replace(directory / manifest.name)


def load_public_demo(classifier):
    if classifier.status != "ready":
        return None
    directory = classifier.directory
    try:
        data = json.loads((directory / "demo.json").read_text(encoding="utf-8"))
        if (data["inference"]["model_sha256"] != classifier.metadata["model_sha256"]
                or data["dataset_label"] not in CLASSES):
            return None
        for kind, filename in DEMO_FILES.items():
            expected = data[f"{kind}_sha256"]
            if expected and file_sha256(directory / filename) != expected:
                return None
        return data if data["image_sha256"] else None
    except (OSError, ValueError, TypeError, KeyError):
        return None
