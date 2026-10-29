import { DRStageInfo } from '../types';

export const DR_STAGES: Record<number, DRStageInfo> = {
  0: {
    stage: 0,
    name: 'No Diabetic Retinopathy',
    shortName: 'No DR',
    description: 'No retinal vascular pathology detected. The retinal microvasculature, macula, and optic disc appear healthy.',
    clinicalFindings: [
      'Normal vascular calibers and branching',
      'No microaneurysms or punctate petechial lesions',
      'Clear macula without edema or lipid exudation',
      'Intact optic disc margin with sharp rim'
    ],
    referralGuideline: 'Annual routine screening recommended. Maintain optimal glycemic (HbA1c < 7.0%) and blood pressure control.',
    color: '#10b981', // green
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    badgeBorder: 'border-emerald-500',
  },
  1: {
    stage: 1,
    name: 'Mild Non-Proliferative DR',
    shortName: 'Mild DR',
    description: 'Earliest clinically detectable stage characterized solely by isolated microaneurysms (small balloon-like outpouchings in capillary walls).',
    clinicalFindings: [
      'Isolated microaneurysms (< 5 distinct spots)',
      'No hard exudates or cotton-wool spots',
      'Absence of intraretinal microvascular abnormalities (IRMA)',
      'Absence of retinal hemorrhages'
    ],
    referralGuideline: 'Follow-up ophthalmologic evaluation within 9-12 months. Review glycemic control and renal parameters.',
    color: '#06b6d4', // cyan/teal
    badgeBg: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    badgeBorder: 'border-cyan-500',
  },
  2: {
    stage: 2,
    name: 'Moderate Non-Proliferative DR',
    shortName: 'Moderate DR',
    description: 'Progressive microvascular damage including more widespread microaneurysms, dot-and-blot hemorrhages, venous beading, and hard exudates.',
    clinicalFindings: [
      'Multiple microaneurysms and dot/blot hemorrhages in 1-3 quadrants',
      'Hard exudates (lipid deposits from hyperpermeable capillaries)',
      'Occasional cotton-wool spots (localized nerve fiber layer infarcts)',
      'Sub-threshold for the strict 4-2-1 international grading rule'
    ],
    referralGuideline: 'Ophthalmology referral recommended within 3 to 6 months. Evaluate for diabetic macular edema (DME) via OCT.',
    color: '#f59e0b', // amber
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    badgeBorder: 'border-amber-500',
  },
  3: {
    stage: 3,
    name: 'Severe Non-Proliferative DR',
    shortName: 'Severe DR',
    description: 'Extensive capillary non-perfusion and ischemia meeting the international "4-2-1" screening criteria, carrying high risk of rapid progression to proliferative stage.',
    clinicalFindings: [
      'Meets 4-2-1 criteria (one or more):',
      '• > 20 intraretinal hemorrhages in all 4 quadrants',
      '• Definite venous beading in 2 or more quadrants',
      '• Prominent IRMA in 1 or more quadrants',
      'High ischemic burden with severe non-perfusion'
    ],
    referralGuideline: 'Urgent retina specialist consultation within 2 to 4 weeks. Close monitoring; panretinal photocoagulation (PRP) or anti-VEGF therapy may be indicated.',
    color: '#f97316', // orange
    badgeBg: 'bg-orange-950/60 text-orange-300 border-orange-500/30',
    badgeBorder: 'border-orange-500',
  },
  4: {
    stage: 4,
    name: 'Proliferative Diabetic Retinopathy',
    shortName: 'Proliferative DR',
    description: 'Advanced vision-threatening stage marked by pathologic neovascularization (NVD or NVE) stimulated by chronic retinal hypoxia and VEGF upregulation.',
    clinicalFindings: [
      'Neovascularization of the optic disc (NVD) or elsewhere (NVE)',
      'Preretinal or vitreous hemorrhages',
      'Fibrovascular proliferation with tractional retinal detachment risk',
      'Rubeosis iridis (iris neovascularization) in extreme cases'
    ],
    referralGuideline: 'EMERGENCY / Immediate referral to vitreoretinal specialist within 24-48 hours. Panretinal photocoagulation (PRP), intravitreal anti-VEGF, or vitrectomy required.',
    color: '#ef4444', // red
    badgeBg: 'bg-red-950/60 text-red-300 border-red-500/30',
    badgeBorder: 'border-red-500',
  },
};
