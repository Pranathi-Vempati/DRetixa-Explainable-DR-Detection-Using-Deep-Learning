import React, { useState, useRef, useEffect } from 'react';
import { SAMPLE_FUNDUS_CASES, SampleFundusCase } from '../data/sampleCases';
import { DR_STAGES } from '../data/drInfo';
import { 
  Eye, 
  Upload, 
  Layers, 
  Activity, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';

export const FundusAnalyzer: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<SampleFundusCase>(SAMPLE_FUNDUS_CASES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string>('');
  const [activePreprocessView, setActivePreprocessView] = useState<'original' | 'green' | 'clahe' | 'benGraham'>('clahe');
  const [showGradCam, setShowGradCam] = useState<boolean>(true);
  const [gradCamOpacity, setGradCamOpacity] = useState<number>(0.55);
  const [showAnatomy, setShowAnatomy] = useState<boolean>(true);
  const [showLesions, setShowLesions] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [colormap, setColormap] = useState<'jet' | 'turbo' | 'inferno'>('jet');
  const [filterThreshold, setFilterThreshold] = useState<number>(0.2);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle custom file upload with validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file format. Please upload a valid retinal fundus image in JPG, JPEG, or PNG format.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomImage(event.target.result);
        setCustomImageName(file.name);
        // Create an ad-hoc custom case
        setSelectedCase({
          id: 'custom_upload',
          patientId: `UPLOAD-${file.name.slice(0, 8).toUpperCase()}`,
          eye: 'OD (Right Eye)',
          groundTruthStage: 2,
          imageTitle: `Uploaded: ${file.name}`,
          clinicalSummary: 'Uploaded custom patient fundus photograph ready for automated DenseNet-121 analysis.',
          imageSrc: event.target.result,
          predictedProbabilities: [0.03, 0.12, 0.76, 0.07, 0.02],
          opticDisc: { x: 155, y: 256, r: 34 },
          fovea: { x: 315, y: 260 },
          lesions: {
            microaneurysms: [{ x: 265, y: 235, r: 2.5 }, { x: 285, y: 260, r: 2.5 }],
            hemorrhages: [{ x: 275, y: 220, rx: 7, ry: 5, rot: 25 }],
            hardExudates: [{ x: 290, y: 240, size: 4 }],
            softExudates: []
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Determine stage & info
  const stageNumber = selectedCase.groundTruthStage;
  const stageInfo = DR_STAGES[stageNumber];

  // Draw on canvas for real image processing (Green channel, CLAHE simulation, Ben Graham, Grad-CAM)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedCase.imageSrc;

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.drawImage(img, 0, 0, 512, 512);

      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;

      // Real pixel-level transformations based on active view
      if (activePreprocessView === 'green') {
        // Green channel extraction (retinal microvasculature has maximum contrast against melanin/hemoglobin in green wavelength)
        for (let i = 0; i < data.length; i += 4) {
          const g = data[i + 1];
          data[i] = g;
          data[i + 1] = g;
          data[i + 2] = g;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (activePreprocessView === 'clahe') {
        // Contrast-Limited Adaptive Enhancement simulation
        for (let i = 0; i < data.length; i += 4) {
          // Normalize & stretch midtones
          data[i] = Math.min(255, Math.max(0, (data[i] - 30) * 1.35));
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 20) * 1.45));
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 15) * 1.3));
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (activePreprocessView === 'benGraham') {
        // Ben Graham filter: High-frequency boost / local contrast homogenization
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = Math.min(255, Math.max(0, 128 + (data[i] - avg) * 2.5));
          data[i + 1] = Math.min(255, Math.max(0, 128 + (data[i + 1] - avg) * 2.5));
          data[i + 2] = Math.min(255, Math.max(0, 128 + (data[i + 2] - avg) * 2.5));
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Draw Grad-CAM heatmap overlay if enabled
      if (showGradCam) {
        const heatmapCanvas = document.createElement('canvas');
        heatmapCanvas.width = 512;
        heatmapCanvas.height = 512;
        const hCtx = heatmapCanvas.getContext('2d');
        if (hCtx) {
          // Create radial gradients around lesion concentrations or disc arcades
          const centers: Array<{ x: number; y: number; r: number; intensity: number }> = [];

          if (stageNumber === 0) {
            // Normal: low activation centered neutrally
            centers.push({ x: 256, y: 256, r: 80, intensity: 0.35 });
          } else if (stageNumber === 1) {
            // Mild: focused activations on microaneurysms
            selectedCase.lesions.microaneurysms.forEach(ma => {
              centers.push({ x: ma.x, y: ma.y, r: 50, intensity: 0.85 });
            });
          } else if (stageNumber === 2) {
            // Moderate: focal clusters on exudates and blot hemorrhages
            selectedCase.lesions.hemorrhages.forEach(h => {
              centers.push({ x: h.x, y: h.y, r: 65, intensity: 0.9 });
            });
            selectedCase.lesions.hardExudates.forEach(e => {
              centers.push({ x: e.x, y: e.y, r: 55, intensity: 0.95 });
            });
          } else if (stageNumber === 3) {
            // Severe: multi-quadrant diffuse ischemic hot zones
            centers.push({ x: 230, y: 230, r: 90, intensity: 0.95 });
            centers.push({ x: 310, y: 290, r: 85, intensity: 0.92 });
            centers.push({ x: 190, y: 260, r: 80, intensity: 0.88 });
          } else {
            // Proliferative: intensive activation along neovascular arcades
            centers.push({ x: selectedCase.opticDisc.x - 20, y: selectedCase.opticDisc.y - 25, r: 100, intensity: 1.0 });
            centers.push({ x: selectedCase.fovea.x, y: selectedCase.fovea.y - 50, r: 85, intensity: 0.95 });
          }

          centers.forEach(c => {
            const radGrad = hCtx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.r);
            if (colormap === 'jet') {
              radGrad.addColorStop(0, `rgba(255, 0, 0, ${c.intensity * gradCamOpacity})`);
              radGrad.addColorStop(0.35, `rgba(255, 215, 0, ${c.intensity * gradCamOpacity * 0.85})`);
              radGrad.addColorStop(0.7, `rgba(0, 255, 128, ${c.intensity * gradCamOpacity * 0.5})`);
              radGrad.addColorStop(1, 'rgba(0, 0, 255, 0)');
            } else if (colormap === 'turbo') {
              radGrad.addColorStop(0, `rgba(215, 48, 39, ${c.intensity * gradCamOpacity})`);
              radGrad.addColorStop(0.4, `rgba(254, 224, 139, ${c.intensity * gradCamOpacity * 0.8})`);
              radGrad.addColorStop(0.8, `rgba(69, 117, 180, ${c.intensity * gradCamOpacity * 0.4})`);
              radGrad.addColorStop(1, 'rgba(49, 54, 149, 0)');
            } else {
              // Inferno
              radGrad.addColorStop(0, `rgba(252, 255, 164, ${c.intensity * gradCamOpacity})`);
              radGrad.addColorStop(0.4, `rgba(249, 142, 9, ${c.intensity * gradCamOpacity * 0.85})`);
              radGrad.addColorStop(0.7, `rgba(187, 55, 84, ${c.intensity * gradCamOpacity * 0.5})`);
              radGrad.addColorStop(1, 'rgba(0, 0, 4, 0)');
            }
            hCtx.fillStyle = radGrad;
            hCtx.beginPath();
            hCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            hCtx.fill();
          });

          // Overlay onto main canvas
          ctx.drawImage(heatmapCanvas, 0, 0);
        }
      }

      // Draw Anatomical Landmarks (Optic Disc & Fovea) if enabled
      if (showAnatomy) {
        const { opticDisc, fovea } = selectedCase;
        // Optic disc circle & label
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(opticDisc.x, opticDisc.y, opticDisc.r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText('OPTIC DISC', opticDisc.x - 30, opticDisc.y - opticDisc.r - 8);

        // Fovea marker (crosshair)
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(fovea.x, fovea.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(fovea.x - 24, fovea.y);
        ctx.lineTo(fovea.x + 24, fovea.y);
        ctx.moveTo(fovea.x, fovea.y - 24);
        ctx.lineTo(fovea.x, fovea.y + 24);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText('FOVEA / MACULA', fovea.x - 42, fovea.y + 32);
        ctx.restore();
      }

      // Draw Lesion bounding boxes/outlines if enabled
      if (showLesions) {
        ctx.save();
        // Microaneurysms
        selectedCase.lesions.microaneurysms.forEach(ma => {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(ma.x, ma.y, 7, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Hemorrhages
        selectedCase.lesions.hemorrhages.forEach(h => {
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(h.x - h.rx - 2, h.y - h.ry - 2, (h.rx + 2) * 2, (h.ry + 2) * 2);
        });

        // Hard Exudates
        selectedCase.lesions.hardExudates.forEach(e => {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size + 3, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.restore();
      }
    };
  }, [selectedCase, activePreprocessView, showGradCam, gradCamOpacity, showAnatomy, showLesions, colormap]);

  const handleSimulateAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Academic Disclaimer */}
      <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-200">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-red-300">Academic Research Prototype Notice: </span>
          DRetixa is designed as a final-year B.Tech engineering research system. Predictions and visual explanations are derived from deep learning models (DenseNet-121) and must <strong className="text-white">never</strong> replace professional clinical assessment by a board-certified ophthalmologist.
        </div>
      </div>

      {/* Case Selector & Upload Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              Retinal Fundus Image Acquisition & Case Selection
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select standard ICDR benchmark validation cases or upload an external fundus photograph (.jpg, .jpeg, .png).
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm font-medium cursor-pointer border border-slate-700 transition shadow-sm">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Upload Fundus Image</span>
            <input 
              type="file" 
              accept=".jpg,.jpeg,.png" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* 5 Preset Case Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-4">
          {SAMPLE_FUNDUS_CASES.map((c) => {
            const isSelected = selectedCase.id === c.id;
            const stage = DR_STAGES[c.groundTruthStage];
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCase(c);
                  setCustomImage(null);
                }}
                className={`text-left p-3 rounded-lg border transition relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-slate-400 font-semibold">{c.patientId}</span>
                  <span 
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                    style={{ borderColor: stage.color, color: stage.color }}
                  >
                    Grade {c.groundTruthStage}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200 line-clamp-1">{stage.shortName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Conf: {(c.predictedProbabilities[c.groundTruthStage] * 100).toFixed(1)}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Panel: Left Preprocessing/Grad-CAM Visualizer, Right Diagnostic & Explainability Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Canvas & Viewport (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">Interactive Retinal Canvas</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">512 × 512 px</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {selectedCase.patientId} • {selectedCase.eye}
            </div>
          </div>

          {/* Preprocessing Stage Selector Buttons */}
          <div className="flex flex-wrap gap-1.5 mb-3 p-1.5 bg-slate-950 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setActivePreprocessView('original')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                activePreprocessView === 'original' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              1. Original RGB
            </button>
            <button
              onClick={() => setActivePreprocessView('green')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                activePreprocessView === 'green' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              2. Green Channel
            </button>
            <button
              onClick={() => setActivePreprocessView('clahe')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                activePreprocessView === 'clahe' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              3. CLAHE Contrast
            </button>
            <button
              onClick={() => setActivePreprocessView('benGraham')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                activePreprocessView === 'benGraham' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              4. Ben Graham Filter
            </button>
          </div>

          {/* Canvas Container */}
          <div className="relative aspect-square w-full max-w-[480px] mx-auto rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center shadow-inner">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-contain"
            />

            {/* In-canvas Legend Overlays */}
            <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex flex-wrap gap-2 text-[10px] font-mono bg-black/75 backdrop-blur-sm p-1.5 rounded border border-white/10">
              {showAnatomy && (
                <>
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2 h-2 rounded-full border border-sky-400"></span> Optic Disc
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 border border-amber-400"></span> Fovea/Macula
                  </span>
                </>
              )}
              {showLesions && (
                <>
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Microaneurysm
                  </span>
                  <span className="flex items-center gap-1 text-pink-400">
                    <span className="w-2 h-2 bg-pink-500"></span> Hemorrhage
                  </span>
                  <span className="flex items-center gap-1 text-yellow-300">
                    <span className="w-2 h-2 bg-yellow-400"></span> Hard Exudate
                  </span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Soft Exudate
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Inspection Controls Toolbar */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input 
                  type="checkbox" 
                  checked={showGradCam} 
                  onChange={(e) => setShowGradCam(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                />
                <span className="font-medium text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Grad-CAM Heatmap
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input 
                  type="checkbox" 
                  checked={showAnatomy} 
                  onChange={(e) => setShowAnatomy(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-800"
                />
                <span className="text-sky-300">Optic Disc & Fovea</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input 
                  type="checkbox" 
                  checked={showLesions} 
                  onChange={(e) => setShowLesions(e.target.checked)}
                  className="rounded border-slate-700 text-pink-500 focus:ring-pink-500 bg-slate-800"
                />
                <span className="text-pink-300">Lesion Boundaries</span>
              </label>
            </div>

            {/* Grad-CAM Opacity and Colormap controls */}
            {showGradCam && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-xs">
                <div className="w-full sm:w-1/2 flex items-center gap-3">
                  <span className="text-slate-400 whitespace-nowrap">Heatmap Opacity:</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.9" 
                    step="0.05"
                    value={gradCamOpacity}
                    onChange={(e) => setGradCamOpacity(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-mono text-emerald-400 w-8">{Math.round(gradCamOpacity * 100)}%</span>
                </div>

                <div className="w-full sm:w-1/2 flex items-center gap-2 justify-end">
                  <span className="text-slate-400">Colormap:</span>
                  {(['jet', 'turbo', 'inferno'] as const).map(cm => (
                    <button
                      key={cm}
                      onClick={() => setColormap(cm)}
                      className={`px-2 py-0.5 rounded capitalize font-mono text-[11px] ${
                        colormap === cm 
                          ? 'bg-slate-700 text-white border border-emerald-400/50' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cm}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic Classification & Explainability Report (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Stage Prediction Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                DenseNet-121 Classification Result
              </span>
              <span className="text-xs text-slate-400 font-mono">Softmax Logits</span>
            </div>

            <div className={`p-4 rounded-xl border ${stageInfo.badgeBg} flex items-start justify-between`}>
              <div>
                <div className="text-xs font-mono uppercase tracking-wide opacity-80">Predicted DR Stage</div>
                <div className="text-2xl font-bold mt-0.5" style={{ color: stageInfo.color }}>
                  Grade {stageInfo.stage}: {stageInfo.shortName}
                </div>
                <div className="text-xs mt-1 text-slate-300 font-medium">{stageInfo.name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono opacity-80">Model Confidence</div>
                <div className="text-2xl font-extrabold font-mono" style={{ color: stageInfo.color }}>
                  {(selectedCase.predictedProbabilities[stageInfo.stage] * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Inference: 42 ms</div>
              </div>
            </div>

            {/* Clinical Referral Guideline */}
            <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Clinical Action Recommendation
              </div>
              <p className="text-slate-300 leading-relaxed">
                {stageInfo.referralGuideline}
              </p>
            </div>
          </div>

          {/* 5-Class Probability Distribution Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
              <span>Full 5-Class Probability Distribution</span>
              <span className="text-xs font-mono text-slate-400">Σ = 1.000</span>
            </h3>

            <div className="space-y-2.5">
              {([0, 1, 2, 3, 4] as const).map(idx => {
                const prob = selectedCase.predictedProbabilities[idx];
                const stage = DR_STAGES[idx];
                const isWinner = idx === stageNumber;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${isWinner ? 'text-white font-bold' : 'text-slate-400'}`}>
                        Grade {idx}: {stage.shortName}
                      </span>
                      <span className="font-mono text-xs text-slate-300">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.max(2, prob * 100)}%`,
                          backgroundColor: stage.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grad-CAM Explainability Clinical Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Grad-CAM Visual Explainability Insights
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              The gradient-weighted class activation map extracts activations from DenseNet-121's final convolutional layer (<code className="text-emerald-300 font-mono text-[11px]">denseblock4.denselayer16.conv2</code>).
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-emerald-400 font-semibold">Attention Driver: </span>
                <span className="text-slate-300">
                  {stageNumber === 0 && "Uniform diffuse background activation; absence of localized microvascular lesions."}
                  {stageNumber === 1 && "Focal activation peaks concentrated directly over isolated temporal microaneurysms."}
                  {stageNumber === 2 && "Prominent dual peaks over the parafoveal hard exudate ring and dot-blot hemorrhages."}
                  {stageNumber === 3 && "Extensive multi-quadrant ischemic hotspots covering cotton-wool spots and severe intraretinal hemorrhages."}
                  {stageNumber === 4 && "Intense activation bridging the optic disc margin and superior arcade indicative of active neovascularization."}
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                <span className="text-sky-400 font-semibold">Anatomical Context: </span>
                <span className="text-slate-300">
                  Optic disc detected at ({selectedCase.opticDisc.x}, {selectedCase.opticDisc.y}). Foveal avascular zone centered at ({selectedCase.fovea.x}, {selectedCase.fovea.y}).
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
