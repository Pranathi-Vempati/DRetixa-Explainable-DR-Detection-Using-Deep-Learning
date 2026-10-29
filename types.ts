export type DRStage = 0 | 1 | 2 | 3 | 4;

export interface DRStageInfo {
  stage: DRStage;
  name: string;
  shortName: string;
  description: string;
  clinicalFindings: string[];
  referralGuideline: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export interface PredictionResult {
  stage: DRStage;
  stageName: string;
  confidence: number;
  probabilities: number[];
  processingTimeMs: number;
  anatomicalFeatures: {
    opticDiscFound: boolean;
    opticDiscCoords?: { x: number; y: number; radius: number };
    foveaFound: boolean;
    foveaCoords?: { x: number; y: number };
  };
  lesionCounts: {
    microaneurysms: number;
    hemorrhages: number;
    hardExudates: number;
    softExudates: number;
  };
}

export interface PythonProjectFile {
  name: string;
  path: string;
  description: string;
  category: 'core' | 'model' | 'explainability' | 'web' | 'evaluation' | 'tests' | 'config';
  code: string;
}

export interface EvaluationMetric {
  stage: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}
