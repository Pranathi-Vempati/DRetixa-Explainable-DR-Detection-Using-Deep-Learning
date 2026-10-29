export interface SampleFundusCase {
  id: string;
  patientId: string;
  eye: 'OD (Right Eye)' | 'OS (Left Eye)';
  groundTruthStage: 0 | 1 | 2 | 3 | 4;
  imageTitle: string;
  clinicalSummary: string;
  imageSrc: string; // SVG data uri for high-fidelity realistic rendering
  predictedProbabilities: number[];
  opticDisc: { x: number; y: number; r: number };
  fovea: { x: number; y: number };
  lesions: {
    microaneurysms: Array<{ x: number; y: number; r: number }>;
    hemorrhages: Array<{ x: number; y: number; rx: number; ry: number; rot: number }>;
    hardExudates: Array<{ x: number; y: number; size: number }>;
    softExudates: Array<{ x: number; y: number; rx: number; ry: number }>;
    neovascularization?: Array<{ path: string }>;
  };
}

// Generate an SVG fundus image data URI
function generateFundusSvg(
  eye: 'OD' | 'OS',
  stage: 0 | 1 | 2 | 3 | 4,
  discX: number,
  discY: number,
  foveaX: number,
  foveaY: number
): string {
  // SVG 512x512
  const discFill = '#ffdfa9';
  const discCup = '#ffeecb';
  
  // Lesion overlays based on stage
  let lesionSvg = '';
  
  if (stage >= 1) {
    // Microaneurysms (tiny dark red dots)
    const maPoints = stage === 1 
      ? [[260, 240], [290, 270], [240, 290]]
      : stage === 2
      ? [[250, 220], [280, 250], [230, 270], [310, 290], [210, 230], [270, 310]]
      : stage === 3
      ? [[240, 200], [270, 230], [210, 260], [320, 270], [190, 220], [280, 330], [330, 210], [200, 310]]
      : [[230, 190], [260, 210], [200, 250], [330, 250], [180, 210], [270, 340], [340, 200], [190, 320], [360, 260]];
    
    maPoints.forEach(([x, y]) => {
      lesionSvg += `<circle cx="${x}" cy="${y}" r="2.5" fill="#660000" opacity="0.9" />`;
      lesionSvg += `<circle cx="${x}" cy="${y}" r="1.5" fill="#4a0000" />`;
    });
  }

  if (stage >= 2) {
    // Blot hemorrhages & hard exudates
    const hemPoints = stage === 2 
      ? [[270, 210, 6, 4, 30], [220, 280, 5, 7, -20], [310, 240, 8, 5, 45]]
      : stage === 3
      ? [[260, 190, 8, 5, 20], [210, 270, 7, 9, -15], [320, 230, 10, 6, 40], [180, 220, 9, 7, 10], [290, 320, 8, 6, -30], [340, 280, 11, 7, 60]]
      : [[250, 180, 9, 6, 25], [200, 260, 8, 10, -20], [330, 220, 12, 7, 45], [170, 210, 10, 8, 15], [280, 330, 9, 7, -35], [350, 270, 13, 8, 55], [230, 350, 11, 7, 10]];

    hemPoints.forEach(([x, y, rx, ry, rot]) => {
      lesionSvg += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#7a0909" opacity="0.88" />`;
    });

    // Hard exudates (yellow crystalline waxy patches)
    const exudates = [
      [285, 230, 4], [290, 234, 3.5], [295, 228, 4.5], [302, 233, 3],
      [265, 300, 3], [270, 305, 4], [275, 298, 3.5]
    ];
    exudates.forEach(([x, y, sz]) => {
      lesionSvg += `<polygon points="${x},${y-sz} ${x+sz},${y} ${x},${y+sz} ${x-sz},${y}" fill="#fff49c" stroke="#e0cb5c" stroke-width="0.7" opacity="0.95" />`;
    });
  }

  if (stage >= 3) {
    // Soft exudates (cotton-wool spots: whitish fluffy lesions)
    const cws = [
      [230, 230, 14, 9],
      [310, 310, 12, 8],
      [190, 260, 16, 10]
    ];
    cws.forEach(([x, y, rx, ry]) => {
      lesionSvg += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#f2f5e8" opacity="0.75" filter="url(#blur-cws)" />`;
    });
  }

  if (stage === 4) {
    // Neovascularization (frond-like network of abnormal fragile capillaries near disc or arcades)
    lesionSvg += `
      <g stroke="#9b0e14" stroke-width="1.8" fill="none" opacity="0.95">
        <path d="M ${discX-15} ${discY-15} Q ${discX-35} ${discY-40} ${discX-50} ${discY-30} T ${discX-65} ${discY-55}" />
        <path d="M ${discX-25} ${discY-30} Q ${discX-40} ${discY-20} ${discX-55} ${discY-15}" />
        <path d="M ${discX-20} ${discY-10} Q ${discX-45} ${discY+5} ${discX-60} ${discY-10}" />
        <path d="M ${foveaX-40} ${foveaY-60} Q ${foveaX-20} ${foveaY-80} ${foveaX+10} ${foveaY-70}" />
        <path d="M ${foveaX-10} ${foveaY-75} Q ${foveaX+25} ${foveaY-90} ${foveaX+40} ${foveaY-75}" />
      </g>
      <!-- Vitreous hemorrhage haze -->
      <path d="M 220 330 Q 280 300 360 340 Q 300 380 220 330 Z" fill="#580808" opacity="0.65" filter="url(#blur-cws)" />
    `;
  }

  // Vessel tree paths
  const vesselTree = eye === 'OD' ? `
    <!-- Main superior temporal arcade -->
    <path d="M ${discX} ${discY} Q ${discX+20} ${discY-70} ${discX+80} ${discY-110} T ${discX+190} ${discY-120}" stroke="#781111" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <path d="M ${discX} ${discY} Q ${discX+15} ${discY-75} ${discX+75} ${discY-115} T ${discX+185} ${discY-125}" stroke="#b02222" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Inferior temporal arcade -->
    <path d="M ${discX} ${discY} Q ${discX+25} ${discY+70} ${discX+85} ${discY+115} T ${discX+195} ${discY+125}" stroke="#781111" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M ${discX} ${discY} Q ${discX+20} ${discY+75} ${discX+80} ${discY+120} T ${discX+190} ${discY+130}" stroke="#b02222" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <!-- Nasal arcades -->
    <path d="M ${discX} ${discY} Q ${discX-40} ${discY-40} ${discX-70} ${discY-70}" stroke="#8a1717" stroke-width="3.5" fill="none"/>
    <path d="M ${discX} ${discY} Q ${discX-40} ${discY+40} ${discX-75} ${discY+75}" stroke="#8a1717" stroke-width="3.2" fill="none"/>
    <!-- Macular capillaries -->
    <path d="M ${discX+70} ${discY-50} Q ${foveaX-20} ${foveaY-30} ${foveaX} ${foveaY-25}" stroke="#a82323" stroke-width="1.6" fill="none" opacity="0.7"/>
    <path d="M ${discX+70} ${discY+50} Q ${foveaX-20} ${foveaY+30} ${foveaX} ${foveaY+25}" stroke="#a82323" stroke-width="1.6" fill="none" opacity="0.7"/>
  ` : `
    <!-- OS left eye arcades -->
    <path d="M ${discX} ${discY} Q ${discX-20} ${discY-70} ${discX-80} ${discY-110} T ${discX-190} ${discY-120}" stroke="#781111" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <path d="M ${discX} ${discY} Q ${discX-15} ${discY-75} ${discX-75} ${discY-115} T ${discX-185} ${discY-125}" stroke="#b02222" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M ${discX} ${discY} Q ${discX-25} ${discY+70} ${discX-85} ${discY+115} T ${discX-195} ${discY+125}" stroke="#781111" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M ${discX} ${discY} Q ${discX-20} ${discY+75} ${discX-80} ${discY+120} T ${discX-190} ${discY+130}" stroke="#b02222" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M ${discX} ${discY} Q ${discX+40} ${discY-40} ${discX+70} ${discY-70}" stroke="#8a1717" stroke-width="3.5" fill="none"/>
    <path d="M ${discX} ${discY} Q ${discX+40} ${discY+40} ${discX+75} ${discY+75}" stroke="#8a1717" stroke-width="3.2" fill="none"/>
  `;

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
      <defs>
        <!-- Background circular aperture mask -->
        <radialGradient id="fundus-grad" cx="45%" cy="48%" r="52%">
          <stop offset="0%" stop-color="#df5a23"/>
          <stop offset="40%" stop-color="#ba3c14"/>
          <stop offset="75%" stop-color="#7e2009"/>
          <stop offset="92%" stop-color="#460d03"/>
          <stop offset="100%" stop-color="#140200"/>
        </radialGradient>
        <radialGradient id="disc-grad" cx="45%" cy="45%" r="50%">
          <stop offset="0%" stop-color="${discCup}"/>
          <stop offset="70%" stop-color="${discFill}"/>
          <stop offset="100%" stop-color="#d68f4e"/>
        </radialGradient>
        <radialGradient id="fovea-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4c0f04" stop-opacity="0.8"/>
          <stop offset="60%" stop-color="#731b08" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#ba3c14" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur-cws" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
        <clipPath id="circle-aperture">
          <circle cx="256" cy="256" r="236"/>
        </clipPath>
      </defs>

      <!-- Black surrounding canvas (standard ophthalmic field) -->
      <rect width="512" height="512" fill="#000000"/>

      <!-- Fundus Globe -->
      <g clip-path="url(#circle-aperture)">
        <circle cx="256" cy="256" r="236" fill="url(#fundus-grad)"/>

        <!-- Choroidal background striae & texture -->
        <circle cx="256" cy="256" r="236" fill="none" stroke="#601405" stroke-width="12" opacity="0.3"/>

        <!-- Optic Disc (Anatomical Landmark 1) -->
        <circle cx="${discX}" cy="${discY}" r="32" fill="url(#disc-grad)"/>
        <circle cx="${discX + (eye === 'OD' ? -4 : 4)}" cy="${discY}" r="15" fill="${discCup}" opacity="0.95"/>

        <!-- Fovea Centralis (Anatomical Landmark 2 - Avascular Zone) -->
        <circle cx="${foveaX}" cy="${foveaY}" r="34" fill="url(#fovea-grad)"/>
        <circle cx="${foveaX}" cy="${foveaY}" r="3" fill="#ffeebb" opacity="0.5"/>

        <!-- Retinal Vascular Tree -->
        ${vesselTree}

        <!-- Diabetic Lesions -->
        ${lesionSvg}

        <!-- Vignette and peripheral edge drop-off -->
        <circle cx="256" cy="256" r="236" fill="none" stroke="#000000" stroke-width="20" opacity="0.7"/>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
}

export const SAMPLE_FUNDUS_CASES: SampleFundusCase[] = [
  {
    id: 'case_grade_0',
    patientId: 'RET-0091-OD',
    eye: 'OD (Right Eye)',
    groundTruthStage: 0,
    imageTitle: 'Case 0: Healthy Retinal Fundus (Grade 0: No DR)',
    clinicalSummary: 'Normal fundus examination with intact retinal microvasculature, sharp optic disc margin, clear foveal avascular zone (FAZ), and zero microaneurysms or hemorrhagic lesions.',
    opticDisc: { x: 145, y: 256, r: 32 },
    fovea: { x: 310, y: 260 },
    predictedProbabilities: [0.962, 0.027, 0.008, 0.002, 0.001],
    imageSrc: generateFundusSvg('OD', 0, 145, 256, 310, 260),
    lesions: {
      microaneurysms: [],
      hemorrhages: [],
      hardExudates: [],
      softExudates: []
    }
  },
  {
    id: 'case_grade_1',
    patientId: 'RET-0418-OD',
    eye: 'OD (Right Eye)',
    groundTruthStage: 1,
    imageTitle: 'Case 1: Early Microvascular Dilation (Grade 1: Mild DR)',
    clinicalSummary: 'Isolated punctate microaneurysms detected in the temporal parafoveal region. No hard exudates, cotton-wool spots, or macro-hemorrhages.',
    opticDisc: { x: 145, y: 256, r: 32 },
    fovea: { x: 310, y: 260 },
    predictedProbabilities: [0.068, 0.884, 0.038, 0.007, 0.003],
    imageSrc: generateFundusSvg('OD', 1, 145, 256, 310, 260),
    lesions: {
      microaneurysms: [{ x: 260, y: 240, r: 2.5 }, { x: 290, y: 270, r: 2.5 }, { x: 240, y: 290, r: 2.5 }],
      hemorrhages: [],
      hardExudates: [],
      softExudates: []
    }
  },
  {
    id: 'case_grade_2',
    patientId: 'RET-1072-OS',
    eye: 'OS (Left Eye)',
    groundTruthStage: 2,
    imageTitle: 'Case 2: Exudative & Petechial Changes (Grade 2: Moderate DR)',
    clinicalSummary: 'Multiple dot/blot retinal hemorrhages and characteristic lipid hard exudate clusters bordering the macula. Capillary hyperpermeability evident.',
    opticDisc: { x: 367, y: 256, r: 32 },
    fovea: { x: 202, y: 260 },
    predictedProbabilities: [0.015, 0.058, 0.865, 0.052, 0.010],
    imageSrc: generateFundusSvg('OS', 2, 367, 256, 202, 260),
    lesions: {
      microaneurysms: [{ x: 250, y: 220, r: 2.5 }, { x: 280, y: 250, r: 2.5 }, { x: 230, y: 270, r: 2.5 }],
      hemorrhages: [{ x: 270, y: 210, rx: 6, ry: 4, rot: 30 }, { x: 220, y: 280, rx: 5, ry: 7, rot: -20 }],
      hardExudates: [{ x: 285, y: 230, size: 4 }, { x: 295, y: 228, size: 4.5 }, { x: 265, y: 300, size: 3 }],
      softExudates: []
    }
  },
  {
    id: 'case_grade_3',
    patientId: 'RET-2315-OD',
    eye: 'OD (Right Eye)',
    groundTruthStage: 3,
    imageTitle: 'Case 3: Severe Ischemic NPDR (Grade 3: Severe DR)',
    clinicalSummary: 'Extensive multi-quadrant intraretinal hemorrhages, multiple fluffy cotton-wool spots (localized nerve fiber layer micro-infarctions), and early IRMA.',
    opticDisc: { x: 145, y: 256, r: 32 },
    fovea: { x: 310, y: 260 },
    predictedProbabilities: [0.002, 0.012, 0.071, 0.874, 0.041],
    imageSrc: generateFundusSvg('OD', 3, 145, 256, 310, 260),
    lesions: {
      microaneurysms: [{ x: 240, y: 200, r: 2.5 }, { x: 270, y: 230, r: 2.5 }, { x: 210, y: 260, r: 2.5 }, { x: 320, y: 270, r: 2.5 }],
      hemorrhages: [{ x: 260, y: 190, rx: 8, ry: 5, rot: 20 }, { x: 320, y: 230, rx: 10, ry: 6, rot: 40 }, { x: 290, y: 320, rx: 8, ry: 6, rot: -30 }],
      hardExudates: [{ x: 285, y: 230, size: 4 }, { x: 295, y: 228, size: 4.5 }],
      softExudates: [{ x: 230, y: 230, rx: 14, ry: 9 }, { x: 310, y: 310, rx: 12, ry: 8 }]
    }
  },
  {
    id: 'case_grade_4',
    patientId: 'RET-3890-OD',
    eye: 'OD (Right Eye)',
    groundTruthStage: 4,
    imageTitle: 'Case 4: Active Proliferative DR (Grade 4: PDR)',
    clinicalSummary: 'Frond-like pathologic neovascularization bridging the upper vascular arcade, extensive hemorrhagic activity, and vitreous hemorrhage pooling.',
    opticDisc: { x: 145, y: 256, r: 32 },
    fovea: { x: 310, y: 260 },
    predictedProbabilities: [0.001, 0.004, 0.021, 0.082, 0.892],
    imageSrc: generateFundusSvg('OD', 4, 145, 256, 310, 260),
    lesions: {
      microaneurysms: [{ x: 230, y: 190, r: 2.5 }, { x: 260, y: 210, r: 2.5 }, { x: 340, y: 200, r: 2.5 }],
      hemorrhages: [{ x: 250, y: 180, rx: 9, ry: 6, rot: 25 }, { x: 330, y: 220, rx: 12, ry: 7, rot: 45 }, { x: 350, y: 270, rx: 13, ry: 8, rot: 55 }],
      hardExudates: [{ x: 285, y: 230, size: 4 }],
      softExudates: [{ x: 230, y: 230, rx: 14, ry: 9 }],
      neovascularization: [{ path: 'M 130 241 Q 110 216 95 226' }]
    }
  }
];
