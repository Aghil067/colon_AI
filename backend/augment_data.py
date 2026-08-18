import os
import shutil
import random
import glob
from tensorflow.keras.preprocessing.image import ImageDataGenerator, load_img, img_to_array
import numpy as np

# Paths
base_dir = os.path.abspath(os.path.dirname(__file__) + '/datasets')
target_dir = os.path.join(base_dir, 'kvasir-v2')
classes = ['Normal', 'Polyps', 'Ulcerative Colitis', 'Esophagitis', 'Other GI Diseases']
TARGET_COUNT = 1000

def run_augmentation():
    print("Starting data organization and augmentation...")
    
    # 1. Create target directories
    for cls in classes:
        os.makedirs(os.path.join(target_dir, cls), exist_ok=True)
    
    # 2. Find existing images
    existing_images = glob.glob(os.path.join(base_dir, '*.jpg'))
    if not existing_images:
        print("No base images found to augment.")
        return
        
    print(f"Found {len(existing_images)} base images.")
    
    # 3. Distribute base images evenly across classes
    for i, img_path in enumerate(existing_images):
        cls = classes[i % len(classes)]
        dest = os.path.join(target_dir, cls, os.path.basename(img_path))
        if not os.path.exists(dest):
            shutil.copy2(img_path, dest)
        
    # 4. Augment images per class up to 1000
    datagen = ImageDataGenerator(
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    for cls in classes:
        cls_dir = os.path.join(target_dir, cls)
        # load current images in class
        cls_images = glob.glob(os.path.join(cls_dir, '*.jpg'))
        
        if not cls_images:
            continue
            
        current_count = len(cls_images)
        needed_count = TARGET_COUNT - current_count
        
        if needed_count <= 0:
            print(f"Class '{cls}' already has {current_count} images. Skipping.")
            continue
            
        print(f"Class '{cls}': {current_count} images. Generating {needed_count} more...")
        
        # Load seed images
        seed_images = []
        for img_path in cls_images:
            img = load_img(img_path, target_size=(300, 300))
            x = img_to_array(img)
            seed_images.append(x)
            
        seed_images = np.array(seed_images)
        
        # Limit batch size to avoid out of memory
        batch_size = min(len(seed_images), 32)
        generator = datagen.flow(seed_images, batch_size=batch_size, save_to_dir=cls_dir, save_prefix='aug', save_format='jpg')
        
        generated = 0
        for batch in generator:
            generated += len(batch)
            if generated >= needed_count:
                break
                
        print(f"Class '{cls}' augmentation complete. Total: {len(glob.glob(os.path.join(cls_dir, '*.jpg')))} images.")
        
if __name__ == '__main__':
    run_augmentation()
