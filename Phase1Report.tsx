import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  FolderTree, 
  Cpu, 
  Database, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const Phase1Report: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2">
          <span>Final-Year B.Tech Project</span>
          <span>•</span>
          <span>Phase 1 Architecture Analysis</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          DRetixa: Explainable Diabetic Retinopathy Detection Using Deep Learning
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Comprehensive project report analysis, technical feasibility assessment, execution workflow, and mathematical/architectural specifications for academic project defense and thesis documentation.
        </p>
      </div>

      {/* Section 1: Execution Workflow */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          1. Summary of Required Execution Workflow
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          The proposed DRetixa system operates through an end-to-end multi-stage pipeline designed to provide both clinical severity classification and interpretable visual explanations:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-mono text-emerald-400 font-bold">Step 1</span>
            <div className="font-semibold text-white">Acquisition & Validation</div>
            <p className="text-slate-400 text-[11px]">Validates file type (JPG/PNG), resolution, and color channels; rejects corrupted or non-retinal inputs.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-mono text-emerald-400 font-bold">Step 2</span>
            <div className="font-semibold text-white">Retinal Preprocessing</div>
            <p className="text-slate-400 text-[11px]">Circular mask auto-crop, standardized 512×512 resize, CLAHE contrast enhancement, and Ben Graham color normalization.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-mono text-emerald-400 font-bold">Step 3</span>
            <div className="font-semibold text-white">DenseNet-121 Inference</div>
            <p className="text-slate-400 text-[11px]">Forward pass through deep convolutional feature blocks; generates 5-class softmax probabilities (Grades 0–4).</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-mono text-emerald-400 font-bold">Step 4</span>
            <div className="font-semibold text-white">Grad-CAM XAI</div>
            <p className="text-slate-400 text-[11px]">Hooks into final conv block (<code className="text-emerald-300">denseblock4</code>); computes class gradients and overlays activation heatmap.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="font-mono text-emerald-400 font-bold">Step 5</span>
            <div className="font-semibold text-white">Clinical Reporting</div>
            <p className="text-slate-400 text-[11px]">Displays predicted stage, confidence, ICDR 4-2-1 criteria findings, anatomical landmarks, and urgent referral guidance.</p>
          </div>
        </div>
      </div>

      {/* Section 2: Proposed Project Folder Structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-emerald-400" />
          2. Proposed Final Project Folder Structure
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          The project is structured into clear, decoupled modules ensuring full reproducibility on standard academic laptops:
        </p>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
          <pre>{`DRetixa/
├── app.py                     # Interactive Streamlit Web Demonstration Interface
├── config.py                  # Global hyperparameters, class mappings, paths, constants
├── requirements.txt           # Verified Python 3.10/3.11 package dependencies
├── preprocess.py              # Preprocessing (Crop, CLAHE, Ben Graham, PyTorch transforms)
├── predict.py                 # Single-image and batch inference pipeline
├── train.py                   # PyTorch training loop with AdamW, Cosine LR, Checkpointing
├── evaluate.py                # Academic metrics: Confusion Matrix, QWK, Precision, Recall, F1
├── gradcam.py                 # Explainable AI: Gradient-weighted Class Activation Mapping
├── localization.py            # Optic Disc & Fovea Centralis landmark detection
├── segmentation.py            # Lesion segmentation interface (MA, Hemorrhages, Exudates)
├── utils.py                   # Logging, image I/O, device helpers, visualization utilities
├── models/
│   └── classifier.py          # DenseNet-121 architecture with custom classification head
├── data/
│   ├── raw/                   # Raw fundus images from APTOS 2019 / EyePACS / Messidor
│   ├── processed/             # Cropped and enhanced 512x512 training images
│   ├── train.csv              # Training annotations (id_code, diagnosis)
│   └── test.csv               # Test annotations for independent evaluation
├── saved_models/
│   └── dretixa_densenet121_best.pth  # Saved model state dict and epoch metadata
├── outputs/
│   ├── confusion_matrix.png   # Generated academic 5x5 confusion matrix
│   ├── loss_curves.png        # Training vs Validation loss curve
│   └── sample_gradcam.png     # Publication-ready Grad-CAM overlay comparison
└── tests/
    ├── test_preprocessing.py  # Unit test for cropping, CLAHE, and tensor shapes
    └── test_input_validation.py # Unit test for corrupted/invalid file handling`}</pre>
        </div>
      </div>

      {/* Section 3: Required Software and Libraries */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          3. Required Software and Libraries
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 text-sm">System & Core Frameworks</div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <strong className="text-white">Python 3.10 or 3.11:</strong> Compatible with all major vision libraries on Windows 10/11.</li>
              <li>• <strong className="text-white">PyTorch 2.x & Torchvision:</strong> Native GPU/CPU accelerated tensors and DenseNet backbones.</li>
              <li>• <strong className="text-white">CUDA (Optional):</strong> CUDA 11.8 or 12.1 for NVIDIA RTX/GTX GPUs; CPU fallback fully supported.</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
            <div className="font-semibold text-sky-400 text-sm">Computer Vision & Interfaces</div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <strong className="text-white">OpenCV (opencv-python-headless):</strong> Fast array-based CLAHE and morphological filtering.</li>
              <li>• <strong className="text-white">scikit-learn:</strong> Multi-class Confusion Matrix, QWK, Precision, Recall, F1.</li>
              <li>• <strong className="text-white">Streamlit:</strong> Lightweight, reactive web UI for live academic project demonstration.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 4: Dataset Requirements */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          4. Dataset Requirements & Mapping Standards
        </h2>
        
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            The recommended benchmark dataset for DRetixa is the <strong className="text-white">APTOS 2019 Blindness Detection</strong> dataset (Kaggle), which provides 3,662 high-resolution retinal fundus photographs graded by clinical ophthalmologists into the 5 International Clinical Diabetic Retinopathy (ICDR) stages:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 font-mono text-center">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-400">0: No DR</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-400">1: Mild DR</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-amber-400">2: Moderate DR</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-orange-400">3: Severe DR</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-red-400">4: Proliferative DR</div>
          </div>
          <p className="pt-2 text-slate-400">
            Split strategy: <strong className="text-white">70% Training (2,563 images)</strong>, <strong className="text-white">15% Validation (549 images)</strong>, and <strong className="text-white">15% Hold-out Test (550 images)</strong> using stratified sampling with a fixed seed (<code className="text-emerald-300">random_state=42</code>) to prevent data leakage.
          </p>
        </div>
      </div>

      {/* Section 5 & 6: Immediate vs External Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 5 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            5. Features Developed Immediately
          </h2>
          <ul className="text-xs space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>End-to-End DenseNet-121 Architecture:</strong> Full PyTorch implementation with feature hooks for Grad-CAM.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Medical Image Preprocessing:</strong> Circular ROI crop, CLAHE contrast enhancement, and Ben Graham color normalization.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Grad-CAM Visual Explainability:</strong> Mathematical gradient pooling over final feature maps with colormap overlays.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Academic Evaluation Suite:</strong> Confusion Matrix, QWK, Precision, Recall, F1, and learning curves.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Streamlit & React Web Demonstration:</strong> Complete interface with error handling and medical disclaimers.</span>
            </li>
          </ul>
        </div>

        {/* Section 6 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            6. Features Requiring Extra Annotations / Weights
          </h2>
          <ul className="text-xs space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">!</span>
              <span><strong>Pixel-Level Lesion Segmentation (U-Net):</strong> Standard classification datasets (APTOS, EyePACS) only have image-level labels (0–4). True lesion segmentation requires pixel mask annotations from datasets like <strong>IDRiD</strong> or <strong>DDR</strong>. (DRetixa provides the candidate morphological detection interface).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">!</span>
              <span><strong>Supervised Fovea & Optic Disc Regression:</strong> Anatomical localization operates robustly via morphological brightness and spatial geometric priors, which can be fine-tuned if coordinate labels (e.g. DRIVE/STARE) are provided.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Section 7: Missing Technical Details to Confirm */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          7. Technical Details to Confirm for Your Project Defense
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-semibold text-white mb-1">Target Hardware Profile</div>
            <p className="text-slate-400">Do you have an NVIDIA GPU (e.g., RTX 3050/4060) on your Windows machine, or should we default training configurations for CPU with smaller batch sizes?</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-semibold text-white mb-1">Dataset Availability</div>
            <p className="text-slate-400">Do you already have the APTOS 2019 or EyePACS zip downloaded on your PC, or do you want the exact download script to fetch it automatically?</p>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="font-semibold text-white mb-1">Pretrained Checkpoint</div>
            <p className="text-slate-400">Do you want to train from scratch using ImageNet weights, or load our pre-compiled DRetixa DenseNet-121 checkpoint directly for rapid project demonstration?</p>
          </div>
        </div>
      </div>

      {/* Section 8: Exact Next Steps */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-emerald-400" />
          8. Exact Next Steps for Implementation (Phase 2 Roadmap)
        </h2>
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
          <p>
            Upon your confirmation, we proceed immediately to <strong className="text-white">Phase 2: Environment Setup & Project Directory Scaffolding</strong>:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-mono">
            <li>Generate complete, runnable <code className="text-emerald-300">requirements.txt</code> with guaranteed version compatibility.</li>
            <li>Setup the local virtual environment (<code className="text-emerald-300">.venv</code>) commands in PowerShell.</li>
            <li>Verify all PyTorch, OpenCV, Torchvision, and Streamlit imports without conflicts.</li>
          </ol>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold">Phase 1 Analysis Complete. Awaiting your confirmation to begin Phase 2.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
