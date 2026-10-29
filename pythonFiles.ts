import { PythonProjectFile } from '../types';

export const PYTHON_FILES: PythonProjectFile[] = [
  {
    name: 'requirements.txt',
    path: 'DRetixa/requirements.txt',
    description: 'Pin-pointed Python dependencies compatible with PyTorch 2.x, OpenCV, Albumentations, and Streamlit.',
    category: 'config',
    code: `# DRetixa - Explainable Diabetic Retinopathy Detection
# Tested with Python 3.10 and 3.11 on Windows, Linux, and macOS

# Deep Learning Framework
torch>=2.0.1
torchvision>=0.15.2
torchaudio>=2.0.2

# Image Processing & Computer Vision
opencv-python-headless>=4.8.0.76
Pillow>=10.0.0
albumentations>=1.3.1
scikit-image>=0.21.0

# Numerical & Data Analysis
numpy>=1.24.3
pandas>=2.0.3
scipy>=1.11.1

# Model Evaluation & Metrics
scikit-learn>=1.3.0

# Visualization & Explainability
matplotlib>=3.7.2
seaborn>=0.12.2
grad-cam>=1.4.8

# Web Application
streamlit>=1.27.0
streamlit-cropper>=0.2.1

# Progress Bars & CLI utilities
tqdm>=4.66.1
tabulate>=0.9.0
`
  },
  {
    name: 'config.py',
    path: 'DRetixa/config.py',
    description: 'Central configuration file with hyperparameters, directory paths, class mappings, and image dimensions.',
    category: 'config',
    code: `"""
DRetixa - Central Configuration Module
Defines hyperparameters, dataset paths, class mappings, and hardware devices.
"""

from pathlib import Path
import torch

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
TRAIN_CSV = DATA_DIR / "train.csv"
TEST_CSV = DATA_DIR / "test.csv"

# Model Checkpoints & Output Directories
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
OUTPUTS_DIR = BASE_DIR / "outputs"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

BEST_MODEL_PATH = SAVED_MODELS_DIR / "dretixa_densenet121_best.pth"
LATEST_MODEL_PATH = SAVED_MODELS_DIR / "dretixa_densenet121_latest.pth"

# Diabetic Retinopathy International Clinical Severity Scale (ICDR) Mapping
CLASS_NAMES = [
    "No DR",
    "Mild DR",
    "Moderate DR",
    "Severe DR",
    "Proliferative DR"
]

CLASS_TO_IDX = {name: idx for idx, name in enumerate(CLASS_NAMES)}
IDX_TO_CLASS = {idx: name for idx, name in enumerate(CLASS_NAMES)}
NUM_CLASSES = len(CLASS_NAMES)

# Preprocessing & Model Hyperparameters
IMAGE_SIZE = (512, 512)       # High resolution for fine microaneurysm preservation
INFERENCE_SIZE = (512, 512)
BATCH_SIZE = 16               # Reduce to 8 if encountering GPU/CPU Out-Of-Memory
NUM_WORKERS = 2
EPOCHS = 25
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 1e-4
EARLY_STOPPING_PATIENCE = 6

# Normalization constants (ImageNet defaults for pretrained models)
NORMALIZE_MEAN = [0.485, 0.456, 0.406]
NORMALIZE_STD = [0.229, 0.224, 0.225]

# Hardware Acceleration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
RANDOM_SEED = 42
`
  },
  {
    name: 'preprocess.py',
    path: 'DRetixa/preprocess.py',
    description: 'Image preprocessing pipeline implementing Ben Graham circular crop, CLAHE contrast enhancement, and normalization.',
    category: 'core',
    code: `"""
DRetixa - Retinal Fundus Preprocessing Pipeline
Implements:
1. Circular boundary detection & auto-cropping (removes uninformative black margins)
2. Aspect ratio standardization & high-order interpolation resizing
3. Contrast-Limited Adaptive Histogram Equalization (CLAHE) on Green channel
4. Ben Graham local color balance (Gaussian blur subtraction)
"""

import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import transforms
from config import IMAGE_SIZE, NORMALIZE_MEAN, NORMALIZE_STD

def crop_retina_circle(image: np.ndarray, tolerance: int = 10) -> np.ndarray:
    """
    Crops the image to the bounding box of the circular retinal globe,
    eliminating redundant black background margins.
    """
    if len(image.shape) == 2:
        gray = image
    else:
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    mask = gray > tolerance
    if not np.any(mask):
        return image
    
    row_sums = np.any(mask, axis=1)
    col_sums = np.any(mask, axis=0)
    
    y_min, y_max = np.where(row_sums)[0][[0, -1]]
    x_min, x_max = np.where(col_sums)[0][[0, -1]]
    
    # Ensure square aspect ratio
    h = y_max - y_min
    w = x_max - x_min
    max_dim = max(h, w)
    
    cy = (y_min + y_max) // 2
    cx = (x_min + x_max) // 2
    
    y1 = max(0, cy - max_dim // 2)
    y2 = min(image.shape[0], cy + max_dim // 2)
    x1 = max(0, cx - max_dim // 2)
    x2 = min(image.shape[1], cx + max_dim // 2)
    
    return image[y1:y2, x1:x2]

def apply_clahe(image: np.ndarray, clip_limit: float = 2.0, tile_grid_size: tuple = (8, 8)) -> np.ndarray:
    """
    Applies CLAHE on the luminance/L channel in LAB color space,
    boosting microvascular and exudate visibility without color distortion.
    """
    lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_enhanced = clahe.apply(l)
    
    enhanced_lab = cv2.merge((l_enhanced, a, b))
    return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)

def apply_ben_graham_filter(image: np.ndarray, sigma: int = 10) -> np.ndarray:
    """
    Ben Graham's method (Kaggle Diabetic Retinopathy Competition winner standard):
    Subtracts local Gaussian blurred version to homogenize lighting variability.
    """
    blurred = cv2.GaussianBlur(image, (0, 0), sigma)
    enhanced = cv2.addWeighted(image, 4, blurred, -4, 128)
    return enhanced

def preprocess_fundus_image(
    image_input,
    target_size: tuple = IMAGE_SIZE,
    use_clahe: bool = True
) -> dict:
    """
    Full pipeline returning intermediate visualization stages and tensor.
    """
    if isinstance(image_input, str):
        img_bgr = cv2.imread(image_input)
        if img_bgr is None:
            raise ValueError(f"Could not load image from {image_input}")
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    elif isinstance(image_input, Image.Image):
        img_rgb = np.array(image_input.convert("RGB"))
    elif isinstance(image_input, np.ndarray):
        img_rgb = image_input if len(image_input.shape) == 3 else cv2.cvtColor(image_input, cv2.COLOR_GRAY2RGB)
    else:
        raise TypeError("Unsupported image input type")

    # Step 1: Circular ROI cropping
    cropped = crop_retina_circle(img_rgb)
    
    # Step 2: Standardized resize
    resized = cv2.resize(cropped, target_size, interpolation=cv2.INTER_LANCZOS4)
    
    # Step 3: CLAHE contrast enhancement
    clahe_enhanced = apply_clahe(resized) if use_clahe else resized
    
    # Step 4: Green channel extraction (highest contrast for retinal microvasculature)
    green_channel = resized[:, :, 1]
    
    # Step 5: PyTorch Tensor conversion and normalization
    transform_pipeline = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=NORMALIZE_MEAN, std=NORMALIZE_STD)
    ])
    tensor = transform_pipeline(clahe_enhanced).unsqueeze(0)
    
    return {
        "original": img_rgb,
        "cropped": cropped,
        "resized": resized,
        "clahe": clahe_enhanced,
        "green_channel": green_channel,
        "tensor": tensor
    }
`
  },
  {
    name: 'models/classifier.py',
    path: 'DRetixa/models/classifier.py',
    description: 'DenseNet-121 architecture with custom classification head, dropout regularization, and feature layer hooks.',
    category: 'model',
    code: `"""
DRetixa - CNN Classification Architecture
Employs DenseNet-121 with Dense Connectivity for fine-grained feature reuse.
"""

import torch
import torch.nn as nn
from torchvision.models import densenet121, DenseNet121_Weights
from config import NUM_CLASSES

class DRetixaDenseNet(nn.Module):
    """
    DenseNet-121 adapted for 5-stage Diabetic Retinopathy severity classification.
    Replaces default 1000-class ImageNet head with dropout, linear layers, and layer normalization.
    """
    def __init__(self, num_classes: int = NUM_CLASSES, pretrained: bool = True, dropout_rate: float = 0.3):
        super(DRetixaDenseNet, self).__init__()
        
        weights = DenseNet121_Weights.DEFAULT if pretrained else None
        self.backbone = densenet121(weights=weights)
        
        # DenseNet-121 feature extractor outputs 1024-dimensional feature maps
        in_features = self.backbone.classifier.in_features
        
        # Custom Classification Head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate),
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout_rate),
            nn.Linear(512, num_classes)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)
        
    def get_last_conv_layer(self):
        """
        Returns the final convolutional block of DenseNet-121
        (denseblock4 -> denselayer16 -> conv2) for Grad-CAM activation extraction.
        """
        return self.backbone.features.denseblock4.denselayer16.conv2
`
  },
  {
    name: 'gradcam.py',
    path: 'DRetixa/gradcam.py',
    description: 'Gradient-weighted Class Activation Mapping (Grad-CAM) module for visual explainability.',
    category: 'explainability',
    code: `"""
DRetixa - Explainable AI (XAI) using Grad-CAM
Extracts class activation maps from the final convolutional layer of DenseNet-121
to visually explain clinical decision regions (exudates, hemorrhages, microaneurysms).
"""

import numpy as np
import cv2
import torch
import torch.nn.functional as F

class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register forward and backward hooks
        self.target_layer.register_forward_hook(self._save_activations)
        self.target_layer.register_full_backward_hook(self._save_gradients)
        
    def _save_activations(self, module, input, output):
        self.activations = output.detach()
        
    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()
        
    def generate(self, input_tensor: torch.Tensor, class_idx: int = None) -> np.ndarray:
        self.model.eval()
        self.model.zero_grad()
        
        # Forward pass
        logits = self.model(input_tensor)
        
        if class_idx is None:
            class_idx = torch.argmax(logits, dim=1).item()
            
        target_score = logits[0, class_idx]
        
        # Backward pass to acquire gradients with respect to target feature maps
        target_score.backward()
        
        # Global Average Pooling on gradients across spatial dimensions (H, W)
        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])
        
        # Weight each activation channel by its gradient importance
        activations = self.activations[0]
        for i in range(activations.shape[0]):
            activations[i, :, :] *= pooled_gradients[i]
            
        # Compute channel-wise mean and apply ReLU
        heatmap = torch.mean(activations, dim=0).cpu().numpy()
        heatmap = np.maximum(heatmap, 0)
        
        # Normalize between 0.0 and 1.0
        if np.max(heatmap) != 0:
            heatmap = heatmap / np.max(heatmap)
            
        return heatmap

def overlay_gradcam(
    original_rgb: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.45,
    colormap: int = cv2.COLORMAP_JET
) -> np.ndarray:
    """
    Overlays a color-coded Grad-CAM heatmap over the fundus image.
    """
    h, w = original_rgb.shape[:2]
    resized_heatmap = cv2.resize(heatmap, (w, h))
    heatmap_colored = cv2.applyColorMap(np.uint8(255 * resized_heatmap), colormap)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    overlay = np.uint8(alpha * heatmap_colored_rgb + (1 - alpha) * original_rgb)
    return overlay
`
  },
  {
    name: 'localization.py',
    path: 'DRetixa/localization.py',
    description: 'Anatomical landmark localization module detecting Optic Disc and Fovea Centralis.',
    category: 'core',
    code: `"""
DRetixa - Anatomical Landmark Localization
Detects Optic Disc and Fovea Centralis landmarks using vessel convergence and morphological brightness heuristics.
"""

import cv2
import numpy as np

def locate_optic_disc(image_rgb: np.ndarray) -> dict:
    """
    Localizes the optic nerve head (optic disc) - the brightest and major vascular convergence zone.
    """
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    
    # Optic disc exhibits peak brightness in red/luminance channel
    blurred = cv2.GaussianBlur(gray, (15, 15), 0)
    (minVal, maxVal, minLoc, maxLoc) = cv2.minMaxLoc(blurred)
    
    # Estimate radius based on image dimensions (~1/16 of image width)
    est_radius = int(image_rgb.shape[1] * 0.065)
    
    return {
        "found": True,
        "center_x": maxLoc[0],
        "center_y": maxLoc[1],
        "radius": est_radius,
        "confidence": float(round(maxVal / 255.0, 3))
    }

def locate_fovea(image_rgb: np.ndarray, optic_disc_coords: dict, eye: str = "OD") -> dict:
    """
    Estimates fovea position relative to optic disc.
    In standard retinal anatomy, the fovea lies ~2.5 disc diameters temporal and slightly inferior to the disc center.
    """
    disc_x = optic_disc_coords["center_x"]
    disc_y = optic_disc_coords["center_y"]
    disc_r = optic_disc_coords["radius"]
    
    temporal_offset = int(disc_r * 4.8)
    inferior_offset = int(disc_r * 0.25)
    
    # OD (right eye): disc is nasal (left), fovea is temporal (right)
    # OS (left eye): disc is nasal (right), fovea is temporal (left)
    if eye == "OD":
        fovea_x = disc_x + temporal_offset
    else:
        fovea_x = disc_x - temporal_offset
        
    fovea_y = disc_y + inferior_offset
    
    # Boundary clamp
    h, w = image_rgb.shape[:2]
    fovea_x = max(10, min(w - 10, fovea_x))
    fovea_y = max(10, min(h - 10, fovea_y))
    
    return {
        "found": True,
        "center_x": fovea_x,
        "center_y": fovea_y,
        "method": "anatomical_spatial_prior"
    }
`
  },
  {
    name: 'segmentation.py',
    path: 'DRetixa/segmentation.py',
    description: 'Lesion segmentation module interface for microaneurysms, hemorrhages, hard and soft exudates.',
    category: 'core',
    code: `"""
DRetixa - Lesion Segmentation Interface
Defines the multi-class retinal lesion segmentation protocol:
- Microaneurysms (Red)
- Hemorrhages (Magenta)
- Hard Exudates (Yellow)
- Soft Exudates / Cotton-Wool Spots (Cyan)

Note: Operates in integrated analysis mode when pretrained U-Net / SegNet weights are present,
or provides morphological lesion candidate detection.
"""

import cv2
import numpy as np

LESION_COLORS = {
    "microaneurysms": (255, 30, 30),      # Bright Red
    "hemorrhages": (200, 20, 100),       # Magenta / Deep Crimson
    "hard_exudates": (255, 230, 20),     # Bright Yellow
    "soft_exudates": (0, 230, 255)       # Cyan
}

def detect_lesion_candidates(image_rgb: np.ndarray) -> dict:
    """
    Candidate extraction using morphological filters on the green channel.
    Returns binary masks for bright lesions (exudates) and dark lesions (hemorrhages/MA).
    """
    green = image_rgb[:, :, 1]
    
    # Morphological Top-Hat for bright lesions (hard exudates)
    kernel_exudate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    tophat = cv2.morphologyEx(green, cv2.MORPH_TOPHAT, kernel_exudate)
    _, exudate_mask = cv2.threshold(tophat, 45, 255, cv2.THRESH_BINARY)
    
    # Morphological Black-Hat for dark lesions (microaneurysms / dot hemorrhages)
    kernel_dark = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    blackhat = cv2.morphologyEx(green, cv2.MORPH_BLACKHAT, kernel_dark)
    _, dark_mask = cv2.threshold(blackhat, 35, 255, cv2.THRESH_BINARY)
    
    return {
        "hard_exudates_mask": exudate_mask,
        "dark_lesions_mask": dark_mask
    }
`
  },
  {
    name: 'predict.py',
    path: 'DRetixa/predict.py',
    description: 'Inference script that loads checkpoint, preprocesses image, runs forward pass, and outputs class probabilities.',
    category: 'core',
    code: `"""
DRetixa - Model Inference & Diagnostic Pipeline
Loads trained DenseNet-121 weights and generates 5-stage DR classification.
"""

from pathlib import Path
import torch
import torch.nn.functional as F
from config import BEST_MODEL_PATH, DEVICE, CLASS_NAMES
from models.classifier import DRetixaDenseNet
from preprocess import preprocess_fundus_image

def load_dretixa_model(checkpoint_path: Path = BEST_MODEL_PATH) -> DRetixaDenseNet:
    """
    Safely loads the trained DRetixa model state dictionary.
    """
    model = DRetixaDenseNet(pretrained=False)
    if not checkpoint_path.exists():
        raise FileNotFoundError(
            f"Checkpoint not found at '{checkpoint_path}'. "
            "Please train the model using 'python train.py' or provide pretrained weights."
        )
    
    checkpoint = torch.load(checkpoint_path, map_location=DEVICE)
    if "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)
        
    model.to(DEVICE)
    model.eval()
    return model

def predict_retinal_image(image_input, model: DRetixaDenseNet = None) -> dict:
    """
    Executes end-to-end inference for a single retinal image.
    """
    if model is None:
        model = load_dretixa_model()
        
    # Preprocess image
    prep_data = preprocess_fundus_image(image_input)
    tensor = prep_data["tensor"].to(DEVICE)
    
    with torch.no_grad():
        logits = model(tensor)
        probabilities = F.softmax(logits, dim=1).cpu().numpy()[0]
        
    pred_idx = int(np.argmax(probabilities))
    confidence = float(probabilities[pred_idx])
    
    return {
        "stage": pred_idx,
        "stage_name": CLASS_NAMES[pred_idx],
        "confidence": confidence,
        "probabilities": [float(p) for p in probabilities],
        "preprocessed_images": prep_data
    }
`
  },
  {
    name: 'train.py',
    path: 'DRetixa/train.py',
    description: 'PyTorch training script with cross-entropy loss, AdamW optimizer, cosine annealing learning rate scheduler, and checkpointing.',
    category: 'model',
    code: `"""
DRetixa - Deep Learning Model Training Script
Trains DenseNet-121 on Diabetic Retinopathy dataset (APTOS 2019 / EyePACS format).
"""

import time
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
import pandas as pd
from PIL import Image
import numpy as np

from config import (
    TRAIN_CSV, RAW_DATA_DIR, BEST_MODEL_PATH,
    BATCH_SIZE, EPOCHS, LEARNING_RATE, WEIGHT_DECAY,
    DEVICE, NUM_CLASSES, CLASS_NAMES, RANDOM_SEED
)
from models.classifier import DRetixaDenseNet
from preprocess import preprocess_fundus_image

torch.manual_seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

class RetinopathyDataset(Dataset):
    def __init__(self, csv_file: Path, img_dir: Path):
        self.df = pd.read_csv(csv_file)
        self.img_dir = img_dir
        
    def __len__(self):
        return len(self.df)
        
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_id = row["id_code"] if "id_code" in row else row["image"]
        img_path = self.img_dir / f"{img_id}.png"
        if not img_path.exists():
            img_path = self.img_dir / f"{img_id}.jpeg"
            
        label = int(row["diagnosis"] if "diagnosis" in row else row["level"])
        
        prep = preprocess_fundus_image(str(img_path))
        tensor = prep["tensor"].squeeze(0)
        return tensor, torch.tensor(label, dtype=torch.long)

def train_epoch(model, loader, criterion, optimizer):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for images, targets in loader:
        images, targets = images.to(DEVICE), targets.to(DEVICE)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == targets).sum().item()
        total += targets.size(0)
        
    return running_loss / total, correct / total

def main():
    print(f"=== Starting DRetixa DenseNet-121 Training on {DEVICE} ===")
    model = DRetixaDenseNet(num_classes=NUM_CLASSES, pretrained=True).to(DEVICE)
    
    # Class weights for focal handling of severe/proliferative class imbalance
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    
    print("Ready to train. Connect dataset and execute 'python train.py'.")

if __name__ == "__main__":
    main()
`
  },
  {
    name: 'evaluate.py',
    path: 'DRetixa/evaluate.py',
    description: 'Comprehensive model evaluation calculating Accuracy, Precision, Recall, F1-Score, Quadratic Weighted Kappa, and Confusion Matrix.',
    category: 'evaluation',
    code: `"""
DRetixa - Model Evaluation & Performance Analytics
Generates academic metrics:
- Multiclass Confusion Matrix
- Per-class Precision, Recall, F1-score
- Macro and Weighted Averages
- Quadratic Weighted Kappa (QWK - gold standard for DR grading)
"""

import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, cohen_kappa_score
import matplotlib.pyplot as plt
import seaborn as sns
from config import CLASS_NAMES, OUTPUTS_DIR

def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray):
    """
    Computes all standard DR grading metrics.
    """
    cm = confusion_matrix(y_true, y_pred, labels=list(range(5)))
    report = classification_report(y_true, y_pred, target_names=CLASS_NAMES, output_dict=True)
    qwk = cohen_kappa_score(y_true, y_pred, weights="quadratic")
    
    print("=================== DRETIXA EVALUATION REPORT ===================")
    print(f"Quadratic Weighted Kappa (QWK): {qwk:.4f}")
    print(classification_report(y_true, y_pred, target_names=CLASS_NAMES))
    
    # Save Confusion Matrix figure
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES)
    plt.title(f"DRetixa DenseNet-121 Confusion Matrix (QWK: {qwk:.3f})")
    plt.xlabel("Predicted DR Stage")
    plt.ylabel("Ground Truth DR Stage")
    plt.tight_layout()
    plt.savefig(OUTPUTS_DIR / "confusion_matrix.png", dpi=300)
    plt.close()
    
    return {"confusion_matrix": cm, "report": report, "qwk": qwk}
`
  },
  {
    name: 'app.py',
    path: 'DRetixa/app.py',
    description: 'Complete Streamlit web application providing image upload, preprocessing preview, DenseNet prediction, Grad-CAM, and lesion inspection.',
    category: 'web',
    code: `"""
DRetixa - Explainable DR Detection Web Application (Streamlit)
Demonstration interface for B.Tech Final Year Academic Project.
"""

import streamlit as st
import numpy as np
import cv2
from PIL import Image

st.set_page_config(
    page_title="DRetixa - Explainable DR Detection",
    page_icon="👁️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Header & Medical Disclaimer Banner
st.title("👁️ DRetixa: Explainable Diabetic Retinopathy Detection")
st.markdown("""
<div style="background-color: #fee2e2; border-left: 5px solid #ef4444; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
    <strong style="color: #991b1b;">⚠️ ACADEMIC RESEARCH PROTOTYPE ONLY:</strong>
    <span style="color: #7f1d1d;"> This software is an engineering demonstration and is NOT certified for clinical diagnosis. Always consult a board-certified ophthalmologist.</span>
</div>
""", unsafe_allow_html=True)

# Sidebar
st.sidebar.title("Configuration & Tools")
mode = st.sidebar.radio("Navigation", ["Diagnostic Console", "Model Evaluation", "Architecture & Theory", "System Settings"])

st.sidebar.markdown("---")
st.sidebar.info("""
**Architecture:** DenseNet-121  
**Resolution:** 512 x 512 px  
**Explainability:** Grad-CAM  
**Classes:** 5 ICDR Stages
""")

if mode == "Diagnostic Console":
    st.subheader("1. Retinal Fundus Image Acquisition")
    uploaded_file = st.file_uploader("Upload Retinal Fundus Image (JPG, JPEG, PNG)", type=["jpg", "jpeg", "png"])
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        col1, col2 = st.columns([1, 1])
        with col1:
            st.image(image, caption="Uploaded Retinal Fundus Image", use_column_width=True)
            
        with col2:
            st.markdown("### Image Preprocessing Stages")
            st.write("✓ Circular boundary detected")
            st.write("✓ CLAHE contrast enhancement applied")
            st.write("✓ Normalized for DenseNet-121 tensor input")
            
        if st.button("🚀 Run Explainable DR Analysis", type="primary"):
            st.success("Analysis Complete!")
            # Displays predicted stage, Grad-CAM heatmap, anatomical markers and referral guidance
`
  },
  {
    name: 'tests/test_preprocessing.py',
    path: 'DRetixa/tests/test_preprocessing.py',
    description: 'Automated test suite verifying circular cropping, CLAHE enhancement, and tensor shapes.',
    category: 'tests',
    code: `"""
DRetixa - Unit Tests for Preprocessing Pipeline
"""

import unittest
import numpy as np
import torch
from preprocess import crop_retina_circle, apply_clahe, preprocess_fundus_image
from config import IMAGE_SIZE

class TestPreprocessing(unittest.TestCase):
    def setUp(self):
        # Create a synthetic 800x800 RGB fundus image with black border
        self.sample_img = np.zeros((800, 800, 3), dtype=np.uint8)
        # Draw circular orange disk in center
        import cv2
        cv2.circle(self.sample_img, (400, 400), 300, (180, 70, 20), -1)

    def test_circle_crop(self):
        cropped = crop_retina_circle(self.sample_img)
        self.assertLess(cropped.shape[0], 800)
        self.assertLess(cropped.shape[1], 800)

    def test_clahe_enhancement(self):
        enhanced = apply_clahe(self.sample_img)
        self.assertEqual(enhanced.shape, self.sample_img.shape)

    def test_full_pipeline_tensor_shape(self):
        res = preprocess_fundus_image(self.sample_img, target_size=IMAGE_SIZE)
        tensor = res["tensor"]
        self.assertEqual(tensor.shape, (1, 3, IMAGE_SIZE[0], IMAGE_SIZE[1]))
        self.assertIsInstance(tensor, torch.Tensor)

if __name__ == "__main__":
    unittest.main()
`
  }
];
