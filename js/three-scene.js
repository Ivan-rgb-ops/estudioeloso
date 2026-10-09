/**
 * Estudio El Oso — Photography
 * js/three-scene.js
 *
 * Master 3D Cine Camera & Multi-Element Optical Lens System
 * Built with Three.js (r158) + GSAP & ScrollTrigger
 */

import * as THREE from 'three';

/* ── GSAP & ScrollTrigger Initialization ── */
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── DOM Container & WebGL Renderer ── */
const container = document.getElementById('wrap');
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

/* ── Scene & Atmospheric Depth ── */
const scene = new THREE.Scene();
const BG_COLOR = 0x100e0b;
scene.background = new THREE.Color(BG_COLOR);
scene.fog = new THREE.FogExp2(BG_COLOR, 0.055);

/* ── Perspective Camera ── */
// Start positioned to view the full camera at beauty 3/4 angle
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.05, 120);
camera.position.set(0, 0, 6.2);

/* ════════════════════════════════════════════════════════════════
   PROCEDURAL TEXTURE GENERATORS (Zero-latency high-res canvas)
   ════════════════════════════════════════════════════════════════ */

/**
 * High-res front ring typography with correct upright circular orientation
 */
function createFrontRingTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2;

  // Base metallic dark disc
  ctx.fillStyle = '#141417';
  ctx.fillRect(0, 0, size, size);

  // Micro radial brush lines for anodized metal texture
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 360; i += 1.5) {
    ctx.rotate(Math.PI / 120);
    ctx.beginPath();
    ctx.moveTo(r * 0.62, 0);
    ctx.lineTo(r * 0.98, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Concentric decorative grooves
  ctx.strokeStyle = '#28282e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
  ctx.arc(cx, cy, r * 0.70, 0, Math.PI * 2);
  ctx.stroke();

  // Top Arc: "ESTUDIO EL OSO ◈ CINE PRO MASTER"
  ctx.save();
  ctx.font = '700 23px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#f0f0f4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text1 = 'ESTUDIO EL OSO  ◈  CINE PRO MASTER';
  const chars1 = text1.split('');
  const arcStart1 = -Math.PI * 0.82;
  const arcEnd1 = -Math.PI * 0.18;
  const step1 = (arcEnd1 - arcStart1) / (chars1.length - 1);
  const textRadius1 = r * 0.82;

  chars1.forEach((ch, i) => {
    const a = arcStart1 + i * step1;
    ctx.save();
    ctx.translate(cx + textRadius1 * Math.cos(a), cy + textRadius1 * Math.sin(a));
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });

  // Bottom Arc: "FE 24-70mm F/2.8 · NANO AR COATING · Ø82mm"
  ctx.font = '600 20px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#e8ba60'; // Warm optic gold

  const text2 = 'FE 24-70mm F/2.8  ◈  NANO AR COATING  ◈  Ø82mm';
  const chars2 = text2.split('');
  const arcStart2 = Math.PI * 0.82;
  const arcEnd2 = Math.PI * 0.18;
  const step2 = (arcEnd2 - arcStart2) / (chars2.length - 1);
  const textRadius2 = r * 0.82;

  chars2.forEach((ch, i) => {
    const a = arcStart2 + i * step2;
    ctx.save();
    ctx.translate(cx + textRadius2 * Math.cos(a), cy + textRadius2 * Math.sin(a));
    ctx.rotate(a - Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();

  // Gold indicator notches
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#d4a359';
  ctx.lineWidth = 2;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 18) {
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, r * 0.93);
    ctx.lineTo(0, r * 0.96);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Circular mask clipping
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

/**
 * Ribbed grip texture for zoom ring knurling
 */
function createRibbedNormalTexture(density = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = density;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');

  for (let x = 0; x < density; x++) {
    const v = Math.sin((x / density) * Math.PI * 16) * 0.5 + 0.5;
    const c = Math.floor(v * 255);
    ctx.fillStyle = `rgb(${c},${c},${c})`;
    ctx.fillRect(x, 0, 1, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 1);
  return tex;
}

/**
 * Diamond knurled pattern for the focus grip ring
 */
function createDiamondKnurlTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const step = 8;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const grad = ctx.createRadialGradient(x + step / 2, y + step / 2, 0, x + step / 2, y + step / 2, step / 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#808080');
      grad.addColorStop(1, '#101010');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, step, step);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 2);
  return tex;
}

/**
 * Camera body pebble leatherette bump map
 */
function createLeatheretteTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2 + 0.8;
    const val = Math.random() * 80 + 175;
    ctx.fillStyle = `rgb(${val},${val},${val})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/**
 * Circular soft bokeh particle texture for atmospheric studio dust
 */
function createBokehTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.25, 'rgba(235, 210, 160, 0.6)');
  grad.addColorStop(0.65, 'rgba(80, 160, 240, 0.18)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Distance scale window texture (0.38m, 0.5m, 1m, 2m, ∞)
 */
function createDistanceScaleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f0f12';
  ctx.fillRect(0, 0, 512, 64);

  // Markers
  ctx.font = '500 16px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';

  const marks = [
    { pos: 60, val: '0.38m', imp: '1.25ft' },
    { pos: 150, val: '0.5m', imp: '1.7ft' },
    { pos: 250, val: '1.0m', imp: '3.3ft' },
    { pos: 350, val: '2.0m', imp: '6.5ft' },
    { pos: 450, val: '∞', imp: '∞' }
  ];

  marks.forEach(m => {
    ctx.fillStyle = '#f0f0f2';
    ctx.fillText(m.val, m.pos, 26);
    ctx.fillStyle = '#d4a359'; // Imperial in gold
    ctx.fillText(m.imp, m.pos, 50);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(m.pos, 2);
    ctx.lineTo(m.pos, 10);
    ctx.stroke();
  });

  return new THREE.CanvasTexture(canvas);
}

/* ════════════════════════════════════════════════════════════════
   LUXURY MATERIALS (PBR with Physical Optical Iridescence)
   ════════════════════════════════════════════════════════════════ */

const ribbedNormalTex = createRibbedNormalTexture();
const diamondKnurlTex = createDiamondKnurlTexture();
const leatheretteBump = createLeatheretteTexture();

// 1. Camera Body Magnesium Alloy
const matBodyChassis = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  metalness: 0.88,
  roughness: 0.35,
  bumpMap: leatheretteBump,
  bumpScale: 0.008
});

// 2. Anodized Dark Metal (Stepped Lens Barrels)
const matLensMetal = new THREE.MeshStandardMaterial({
  color: 0x1b1b20,
  metalness: 0.92,
  roughness: 0.22
});

// 3. Matte Tactile Grip Rubber (Zoom Ring)
const matRibbedRubber = new THREE.MeshStandardMaterial({
  color: 0x141416,
  metalness: 0.08,
  roughness: 0.82,
  bumpMap: ribbedNormalTex,
  bumpScale: 0.035
});

// 4. Diamond Knurled Metal (Focus Ring)
const matFocusKnurl = new THREE.MeshStandardMaterial({
  color: 0x1f1f24,
  metalness: 0.85,
  roughness: 0.36,
  bumpMap: diamondKnurlTex,
  bumpScale: 0.04
});

// 5. Polished Chrome / Titanium Chamfers
const matTitaniumChrome = new THREE.MeshStandardMaterial({
  color: 0xb5bcc7,
  metalness: 0.98,
  roughness: 0.06
});

// 6. Iconic Luxury Cinema Red Accent Ring
const matCinemaRed = new THREE.MeshStandardMaterial({
  color: 0xc41e1e,
  metalness: 0.82,
  roughness: 0.22
});

// 7. Laser-Etched Gold Inlay
const matGoldAccent = new THREE.MeshStandardMaterial({
  color: 0xd4a359,
  metalness: 0.98,
  roughness: 0.12
});

// 8. Front Optical Glass: High-transmission Physical Material with Thin-Film Iridescence
const matFrontGlass = new THREE.MeshPhysicalMaterial({
  transmission: 0.94,
  thickness: 0.40,
  roughness: 0.012,
  metalness: 0.02,
  ior: 1.54,
  reflectivity: 0.90,
  clearcoat: 1.0,
  clearcoatRoughness: 0.02,
  iridescence: 0.88, // Genuine multi-coating optical interference (emerald/magenta)
  iridescenceIOR: 1.34,
  iridescenceThicknessRange: [180, 480],
  transparent: true,
  opacity: 0.96,
  side: THREE.DoubleSide
});

// 9. Internal Optics Glass (Floating Doublet)
const matInternalGlass = new THREE.MeshPhysicalMaterial({
  transmission: 0.90,
  thickness: 0.28,
  roughness: 0.02,
  metalness: 0.05,
  ior: 1.62,
  reflectivity: 0.92,
  iridescence: 0.65,
  iridescenceIOR: 1.4,
  iridescenceThicknessRange: [220, 520],
  transparent: true,
  opacity: 0.90,
  side: THREE.DoubleSide
});

/* ════════════════════════════════════════════════════════════════
   3D ARCHITECTURE: CAMERA BODY + MASTER CINE LENS
   ════════════════════════════════════════════════════════════════ */

const MASTER_RIG = new THREE.Group();
scene.add(MASTER_RIG);

const CAMERA_BODY = new THREE.Group();
MASTER_RIG.add(CAMERA_BODY);

const LENS_ASSEMBLY = new THREE.Group();
MASTER_RIG.add(LENS_ASSEMBLY);

/* ── 1. CAMERA BODY SCULPTING (High-End Mirrorless Chassis) ── */
{
  // Main chassis box with subtle bevel
  const chassisGeo = new THREE.BoxGeometry(2.6, 1.55, 0.72);
  const chassisMesh = new THREE.Mesh(chassisGeo, matBodyChassis);
  chassisMesh.position.set(0.24, -0.05, -0.55);
  chassisMesh.castShadow = true;
  CAMERA_BODY.add(chassisMesh);

  // Right-hand sculpted grip
  const gripGeo = new THREE.BoxGeometry(0.58, 1.52, 0.52);
  const gripMesh = new THREE.Mesh(gripGeo, matBodyChassis);
  gripMesh.position.set(1.28, -0.06, -0.32);
  gripMesh.rotation.y = -0.08;
  gripMesh.castShadow = true;
  CAMERA_BODY.add(gripMesh);

  // Top Viewfinder / Prism Hump
  const prismGeo = new THREE.CylinderGeometry(0.44, 0.55, 0.48, 4);
  prismGeo.rotateY(Math.PI / 4);
  const prismMesh = new THREE.Mesh(prismGeo, matLensMetal);
  prismMesh.position.set(0, 0.88, -0.55);
  prismMesh.castShadow = true;
  CAMERA_BODY.add(prismMesh);

  // Hotshoe mount with contact points
  const hotshoeGeo = new THREE.BoxGeometry(0.30, 0.06, 0.34);
  const hotshoeMesh = new THREE.Mesh(hotshoeGeo, matTitaniumChrome);
  hotshoeMesh.position.set(0, 1.14, -0.55);
  CAMERA_BODY.add(hotshoeMesh);

  // Top Dial 1: Shutter Speed / ISO Dial
  const dial1Geo = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 32);
  const dial1 = new THREE.Mesh(dial1Geo, matTitaniumChrome);
  dial1.position.set(0.74, 0.78, -0.55);
  dial1.castShadow = true;
  CAMERA_BODY.add(dial1);

  // Top Dial 2: Mode Dial (M / A / S / P)
  const dial2Geo = new THREE.CylinderGeometry(0.23, 0.23, 0.14, 32);
  const dial2 = new THREE.Mesh(dial2Geo, matLensMetal);
  dial2.position.set(-0.76, 0.76, -0.55);
  dial2.castShadow = true;
  CAMERA_BODY.add(dial2);

  // Shutter Button with Chrome Collar
  const collarGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.12, 24);
  const collar = new THREE.Mesh(collarGeo, matLensMetal);
  collar.position.set(1.22, 0.78, -0.36);
  const shutterBtnGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.16, 24);
  const shutterBtn = new THREE.Mesh(shutterBtnGeo, matTitaniumChrome);
  shutterBtn.position.set(1.22, 0.82, -0.36);
  CAMERA_BODY.add(collar);
  CAMERA_BODY.add(shutterBtn);

  // Stainless Steel Bayonet Mount Flange
  const mountRingGeo = new THREE.TorusGeometry(1.08, 0.038, 16, 64);
  const mountRing = new THREE.Mesh(mountRingGeo, matTitaniumChrome);
  mountRing.position.set(0, 0, -0.18);
  CAMERA_BODY.add(mountRing);

  // Luxury Brand Badge Plate: "ESTUDIO EL OSO"
  const badgePlateGeo = new THREE.BoxGeometry(0.68, 0.13, 0.02);
  const badgePlate = new THREE.Mesh(badgePlateGeo, matLensMetal);
  badgePlate.position.set(-0.76, 0.46, -0.18);
  CAMERA_BODY.add(badgePlate);

  const badgeInlayGeo = new THREE.BoxGeometry(0.60, 0.04, 0.025);
  const badgeInlay = new THREE.Mesh(badgeInlayGeo, matGoldAccent);
  badgeInlay.position.set(-0.76, 0.46, -0.17);
  CAMERA_BODY.add(badgeInlay);
}

/* ── 2. MASTER CINE LENS BARREL ── */
let zoomRingMesh, focusRingMesh, distanceScaleGroup;

{
  // Stage 1: Base Mount Barrel
  const baseBarrelGeo = new THREE.CylinderGeometry(1.02, 1.02, 0.32, 64);
  baseBarrelGeo.rotateX(Math.PI / 2);
  const baseBarrel = new THREE.Mesh(baseBarrelGeo, matLensMetal);
  baseBarrel.position.z = 0.02;
  baseBarrel.castShadow = true;
  LENS_ASSEMBLY.add(baseBarrel);

  // Stage 2: Ribbed Zoom Ring
  const zoomRingGeo = new THREE.CylinderGeometry(1.045, 1.045, 0.48, 64);
  zoomRingGeo.rotateX(Math.PI / 2);
  zoomRingMesh = new THREE.Mesh(zoomRingGeo, matRibbedRubber);
  zoomRingMesh.position.z = 0.40;
  zoomRingMesh.castShadow = true;
  LENS_ASSEMBLY.add(zoomRingMesh);

  // Stage 3: Distance Scale Housing & Window
  const scaleHousingGeo = new THREE.CylinderGeometry(1.025, 1.025, 0.34, 64);
  scaleHousingGeo.rotateX(Math.PI / 2);
  const scaleHousing = new THREE.Mesh(scaleHousingGeo, matLensMetal);
  scaleHousing.position.z = 0.80;
  LENS_ASSEMBLY.add(scaleHousing);

  // Internal Revolving Distance Barrel
  distanceScaleGroup = new THREE.Group();
  distanceScaleGroup.position.z = 0.80;
  const scaleTex = createDistanceScaleTexture();
  const scaleInnerGeo = new THREE.CylinderGeometry(1.005, 1.005, 0.22, 48, 1, true, -Math.PI / 4, Math.PI / 2);
  scaleInnerGeo.rotateX(Math.PI / 2);
  const scaleInnerMat = new THREE.MeshBasicMaterial({ map: scaleTex });
  const scaleInnerMesh = new THREE.Mesh(scaleInnerGeo, scaleInnerMat);
  distanceScaleGroup.add(scaleInnerMesh);
  LENS_ASSEMBLY.add(distanceScaleGroup);

  // Transparent Acrylic Scale Window Glass
  const scaleWinGeo = new THREE.CylinderGeometry(1.03, 1.03, 0.20, 32, 1, true, -Math.PI / 5, Math.PI / 2.5);
  scaleWinGeo.rotateX(Math.PI / 2);
  const scaleWinMat = new THREE.MeshPhysicalMaterial({
    transmission: 0.94,
    roughness: 0.04,
    ior: 1.5,
    transparent: true,
    opacity: 0.88
  });
  const scaleWin = new THREE.Mesh(scaleWinGeo, scaleWinMat);
  scaleWin.position.z = 0.80;
  LENS_ASSEMBLY.add(scaleWin);

  // Stage 4: Broad Diamond-Knurled Focus Ring
  const focusRingGeo = new THREE.CylinderGeometry(1.04, 1.04, 0.54, 64);
  focusRingGeo.rotateX(Math.PI / 2);
  focusRingMesh = new THREE.Mesh(focusRingGeo, matFocusKnurl);
  focusRingMesh.position.z = 1.22;
  focusRingMesh.castShadow = true;
  LENS_ASSEMBLY.add(focusRingMesh);

  // Stage 5: Cinema Red Accent Ring
  const redRingGeo = new THREE.TorusGeometry(1.025, 0.016, 16, 64);
  const redRing = new THREE.Mesh(redRingGeo, matCinemaRed);
  redRing.position.z = 1.52;
  LENS_ASSEMBLY.add(redRing);

  // Titanium Bevel Spacer
  const bevelRingGeo = new THREE.TorusGeometry(1.02, 0.020, 16, 64);
  const bevelRing = new THREE.Mesh(bevelRingGeo, matTitaniumChrome);
  bevelRing.position.z = 1.56;
  LENS_ASSEMBLY.add(bevelRing);

  // Stage 6: Front Barrel & Filter Threads
  const frontBarrelGeo = new THREE.CylinderGeometry(1.015, 1.015, 0.24, 64);
  frontBarrelGeo.rotateX(Math.PI / 2);
  const frontBarrel = new THREE.Mesh(frontBarrelGeo, matLensMetal);
  frontBarrel.position.z = 1.68;
  LENS_ASSEMBLY.add(frontBarrel);

  // Front Filter Thread Lip
  const filterLipGeo = new THREE.TorusGeometry(0.97, 0.034, 16, 64);
  const filterLip = new THREE.Mesh(filterLipGeo, matLensMetal);
  filterLip.position.z = 1.80;
  LENS_ASSEMBLY.add(filterLip);

  // Stage 7: Front Printed Ring with Studio Branding & Specs
  const frontRingTex = createFrontRingTexture();
  const frontRingGeo = new THREE.RingGeometry(0.68, 0.96, 64);
  const frontRingMat = new THREE.MeshStandardMaterial({
    map: frontRingTex,
    metalness: 0.85,
    roughness: 0.28,
    side: THREE.DoubleSide
  });
  const frontRing = new THREE.Mesh(frontRingGeo, frontRingMat);
  frontRing.position.z = 1.81;
  frontRing.rotation.y = Math.PI;
  LENS_ASSEMBLY.add(frontRing);

  // Inner Gold Retaining Ring
  const innerGoldGeo = new THREE.TorusGeometry(0.675, 0.012, 16, 64);
  const innerGold = new THREE.Mesh(innerGoldGeo, matGoldAccent);
  innerGold.position.z = 1.815;
  LENS_ASSEMBLY.add(innerGold);
}

/* ── 3. COMPOUND OPTICAL GLASS SYSTEM ── */
let frontOpticMesh, internalDoubletMesh;

{
  // Element 1: Front Aspherical Doublet (Curved Meniscus)
  const frontOpticGeo = new THREE.SphereGeometry(0.67, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.36);
  frontOpticMesh = new THREE.Mesh(frontOpticGeo, matFrontGlass);
  frontOpticMesh.position.z = 1.66;
  frontOpticMesh.rotation.x = Math.PI / 2;
  LENS_ASSEMBLY.add(frontOpticMesh);

  // Element 2: Internal Floating Focus Optic
  const doubletGeo = new THREE.SphereGeometry(0.56, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.28);
  internalDoubletMesh = new THREE.Mesh(doubletGeo, matInternalGlass);
  internalDoubletMesh.position.z = 1.02;
  internalDoubletMesh.rotation.x = -Math.PI / 2;
  LENS_ASSEMBLY.add(internalDoubletMesh);

  // Deep Rear Element
  const rearOpticGeo = new THREE.CircleGeometry(0.48, 36);
  const rearOptic = new THREE.Mesh(rearOpticGeo, matFrontGlass);
  rearOptic.position.z = -0.05;
  LENS_ASSEMBLY.add(rearOptic);
}

/* ── 4. 12-BLADE KINETIC MECHANICAL APERTURE DIAPHRAGM ── */
const DIAPHRAGM_GROUP = new THREE.Group();
DIAPHRAGM_GROUP.position.z = 0.58;
LENS_ASSEMBLY.add(DIAPHRAGM_GROUP);

const BLADE_COUNT = 12;
const matIrisBlade = new THREE.MeshStandardMaterial({
  color: 0x121215,
  metalness: 0.92,
  roughness: 0.16,
  side: THREE.DoubleSide
});

for (let i = 0; i < BLADE_COUNT; i++) {
  const angle = (i / BLADE_COUNT) * Math.PI * 2;
  const shape = new THREE.Shape();
  const r0 = 0.08, r1 = 0.54, sw = 0.18;
  shape.moveTo(0, r0);
  shape.quadraticCurveTo(sw * 0.85, r1 * 0.48, sw * 0.42, r1);
  shape.quadraticCurveTo(0, r1 * 1.01, -sw * 0.42, r1);
  shape.quadraticCurveTo(-sw * 0.85, r1 * 0.48, 0, r0);

  const bladeMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 20), matIrisBlade);
  bladeMesh.rotation.z = angle;
  DIAPHRAGM_GROUP.add(bladeMesh);
}

// Circular Aperture Chamber Ring (kept open in center!)
const irisRimGeo = new THREE.RingGeometry(0.20, 0.62, 36);
const irisRimMat = new THREE.MeshBasicMaterial({ color: 0x08080b, side: THREE.DoubleSide });
const irisRim = new THREE.Mesh(irisRimGeo, irisRimMat);
irisRim.position.z = -0.02;
DIAPHRAGM_GROUP.add(irisRim);

/* ── 5. CINEMATIC OPTICAL BOKEH / ATMOSPHERIC PARTICLES ── */
const BOKEH_COUNT = 50;
const bokehGeo = new THREE.BufferGeometry();
const bokehPositions = new Float32Array(BOKEH_COUNT * 3);
const bokehSpeeds = [];

for (let i = 0; i < BOKEH_COUNT; i++) {
  bokehPositions[i * 3 + 0] = (Math.random() - 0.5) * 10.0;
  bokehPositions[i * 3 + 1] = (Math.random() - 0.5) * 7.0;
  bokehPositions[i * 3 + 2] = Math.random() * 6.0 - 1.0;
  bokehSpeeds.push({
    y: Math.random() * 0.0018 + 0.0006,
    phase: Math.random() * Math.PI * 2
  });
}

bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPositions, 3));
const bokehTex = createBokehTexture();
const bokehMat = new THREE.PointsMaterial({
  size: 0.42,
  map: bokehTex,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const bokehField = new THREE.Points(bokehGeo, bokehMat);
scene.add(bokehField);

/* ════════════════════════════════════════════════════════════════
   STUDIO LIGHTING RIG
   ════════════════════════════════════════════════════════════════ */

const ambLight = new THREE.AmbientLight(0x222230, 0.55);
scene.add(ambLight);

// Key Softbox (Top Right)
const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
keyLight.position.set(5, 6, 5);
keyLight.castShadow = true;
scene.add(keyLight);

// Anamorphic Cyan Rim Light (Highlighting chamfer edges)
const blueRimLight = new THREE.PointLight(0x2870ff, 4.2, 16);
blueRimLight.position.set(-5, 3, 3);
scene.add(blueRimLight);

// Warm Amber Interior Light
const goldRimLight = new THREE.PointLight(0xe8aa4a, 3.2, 14);
goldRimLight.position.set(4, -3, 2.5);
scene.add(goldRimLight);

// Top Specular Catchlight
const spotCatch = new THREE.SpotLight(0xffffff, 2.8, 22, 0.35, 0.85);
spotCatch.position.set(0, 10, 3.5);
scene.add(spotCatch);

// Dynamic Mouse Glint Light (Glides across front glass curve)
const glintLight = new THREE.PointLight(0xaaddff, 2.0, 7);
glintLight.position.set(0, 0, 2.5);
scene.add(glintLight);

/* ════════════════════════════════════════════════════════════════
   ANIMATION STATE & GSAP SCROLL-TRIGGER CHOREOGRAPHY
   ════════════════════════════════════════════════════════════════ */

// Initial state: Start far enough back with beauty 3/4 angle
const anim = {
  p: 0,
  camZ: 6.2,
  // 3/4 beauty view: clearly displays chassis, grip, dials, barrel, and glass
  rigRotY: -0.42,
  rigRotX: 0.14,
  focusRot: 0,
  zoomRot: 0,
  diaphragmScale: 1.0,
  diaphragmRot: 0,
  sceneOpacity: 1.0,
  keyIntensity: 3.4,
  blueIntensity: 4.2,
  goldIntensity: 3.2
};

// UI Element References
const elBrand    = document.getElementById('brand');
const elNav      = document.getElementById('nav');
const elHero     = document.getElementById('hero');
const elHeroH1   = elHero ? elHero.querySelector('h1') : null;
const elHeroP    = elHero ? elHero.querySelector('p') : null;
const elHint     = elHero ? elHero.querySelector('.hint') : null;
const elBAR      = document.getElementById('bar');
const elARR      = document.getElementById('arr');
const elTG       = document.getElementById('tg');
const elST       = document.getElementById('st');
const elSS       = document.getElementById('ss');
const scrollTrack = document.getElementById('scroll-track');

/* ── Mouse Coordinates ── */
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (!e.touches.length) return;
  const t = e.touches[0];
  mouse.x = (t.clientX / window.innerWidth - 0.5) * 2;
  mouse.y = -(t.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

let resizeDebounceTimer = null;
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    if (ScrollTrigger) ScrollTrigger.refresh();
  }, 120);
});

/* ── Page Load Entrance Animation ── */
if (gsap) {
  const introTl = gsap.timeline({ delay: 0.15 });
  const eyebrow = elHero ? elHero.querySelector('.eyebrow') : null;

  if (eyebrow) {
    introTl.fromTo(eyebrow, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' });
  }
  if (elHeroH1) {
    introTl.fromTo(elHeroH1, { opacity: 0, y: 32, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }, '-=0.65');
  }
  if (elHeroP) {
    introTl.fromTo(elHeroP, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.75');
  }
  if (elHint) {
    const hintItems = [elHint, elARR, elTG].filter(Boolean);
    introTl.fromTo(hintItems, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power2.out' }, '-=0.5');
  }
}

/* ── GSAP ScrollTrigger Master Timeline (Flawless Scrub with Inertia) ── */
let scrollTl = null;

if (gsap && ScrollTrigger && scrollTrack) {
  const elGrid = document.getElementById('grid');
  const elVig = document.getElementById('vig');

  scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollTrack,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate: (self) => {
        anim.p = self.progress;

        if (elBAR) {
          elBAR.style.transform = `scaleX(${self.progress})`;
        }

        // Direct, bulletproof opacity management for 3D container and overlays
        if (self.progress >= 0.85) {
          const fadeP = (self.progress - 0.85) / 0.15;
          const op = Math.max(0, 1 - fadeP);
          container.style.opacity = op;
          container.style.visibility = op <= 0 ? 'hidden' : 'visible';
          if (elGrid) { elGrid.style.opacity = op; elGrid.style.visibility = op <= 0 ? 'hidden' : 'visible'; }
          if (elVig) { elVig.style.opacity = op; elVig.style.visibility = op <= 0 ? 'hidden' : 'visible'; }
        } else {
          container.style.opacity = '1';
          container.style.visibility = 'visible';
          if (elGrid) { elGrid.style.opacity = '1'; elGrid.style.visibility = 'visible'; }
          if (elVig) { elVig.style.opacity = '1'; elVig.style.visibility = 'visible'; }
        }

        // Subtitle status updates
        const pct = Math.round(self.progress * 100);
        if (elST && elSS && elTG) {
          if (pct < 35) {
            elST.textContent = 'ESTUDIO EL OSO'; elSS.textContent = 'Fotografía de eventos'; elTG.textContent = 'Scroll para acercarte';
          } else if (pct < 70) {
            elST.textContent = 'CADA DETALLE'; elSS.textContent = 'Cine Optics · 24-70mm'; elTG.textContent = 'Estudio El Oso';
          } else {
            elST.textContent = 'EL MOMENTO'; elSS.textContent = 'Congelado para siempre'; elTG.textContent = 'Estudio El Oso';
          }
        }
      },
      onLeave: () => {
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
        if (elGrid) { elGrid.style.opacity = '0'; elGrid.style.visibility = 'hidden'; }
        if (elVig) { elVig.style.opacity = '0'; elVig.style.visibility = 'hidden'; }
      },
      onEnterBack: () => {
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        if (elGrid) { elGrid.style.opacity = '1'; elGrid.style.visibility = 'visible'; }
        if (elVig) { elVig.style.opacity = '1'; elVig.style.visibility = 'visible'; }
      },
      onLeaveBack: () => {
        container.style.opacity = '1';
        container.style.visibility = 'visible';
        if (elGrid) { elGrid.style.opacity = '1'; elGrid.style.visibility = 'visible'; }
        if (elVig) { elVig.style.opacity = '1'; elVig.style.visibility = 'visible'; }
        if (elHero) { elHero.style.opacity = '1'; elHero.style.visibility = 'visible'; }
      }
    }
  });

  // Step 1: Hero text smoothly lifts, scales, and dissolves (0% to 24%)
  if (elHero) {
    scrollTl.fromTo(elHero,
      { opacity: 1, y: 0, scale: 1 },
      {
        opacity: 0,
        y: -50,
        scale: 0.92,
        ease: 'power2.inOut',
        duration: 0.24
      },
      0
    );
  }

  // Scroll arrow and hint fade out early (0% to 14%)
  if (elARR) scrollTl.fromTo(elARR, { opacity: 1, y: 0 }, { opacity: 0, y: 12, ease: 'power1.out', duration: 0.14 }, 0);
  if (elTG) scrollTl.fromTo(elTG, { opacity: 1, y: 0 }, { opacity: 0, y: 10, ease: 'power1.out', duration: 0.14 }, 0);

  // Step 2: Camera pivots from beauty 3/4 view to align front-and-center (0% to 45%)
  scrollTl.fromTo(anim,
    { rigRotY: -0.42, rigRotX: 0.14 },
    {
      rigRotY: 0,
      rigRotX: 0,
      ease: 'power2.out',
      duration: 0.45
    },
    0
  );

  // Step 3: Macro Push into the Lens Barrel & Kinematics (0% to 100%)
  // Safely zooms close to front element (from z:6.2 to z:2.05) without clipping inside!
  scrollTl.fromTo(anim,
    {
      camZ: 6.2,
      focusRot: 0,
      zoomRot: 0,
      diaphragmScale: 1.0,
      diaphragmRot: 0,
      keyIntensity: 3.4,
      blueIntensity: 4.2,
      goldIntensity: 3.2
    },
    {
      camZ: 2.05,
      focusRot: Math.PI * 1.5, // Focus ring visibly spins
      zoomRot: Math.PI * 0.5,
      diaphragmScale: 0.76, // Diaphragm constricts realistically down to f/5.6
      diaphragmRot: Math.PI * 0.3,
      keyIntensity: 4.8,
      blueIntensity: 5.5,
      goldIntensity: 4.2,
      ease: 'power2.inOut',
      duration: 1.0
    },
    0
  );

  // Step 5: Header Brand and Navigation glide in seamlessly (76% to 94%)
  const elNavToggle = document.getElementById('nav-toggle');
  const elSiteHeader = document.getElementById('site-header');

  if (elBrand) {
    scrollTl.fromTo(elBrand,
      { opacity: 0, y: -16, visibility: 'hidden' },
      {
        opacity: 1,
        y: 0,
        visibility: 'visible',
        ease: 'power2.out',
        duration: 0.18,
        onStart: () => { elBrand.style.visibility = 'visible'; },
        onReverseComplete: () => { elBrand.style.visibility = 'hidden'; }
      },
      0.76
    );
  }

  if (elNav) {
    scrollTl.fromTo(elNav,
      { opacity: 0, y: -16, visibility: 'hidden' },
      {
        opacity: 1,
        y: 0,
        visibility: () => window.innerWidth > 768 ? 'visible' : 'hidden',
        ease: 'power2.out',
        duration: 0.18,
        onStart: () => {
          if (window.innerWidth > 768) elNav.style.visibility = 'visible';
          document.body.classList.add('show-header-blur');
          if (elSiteHeader) elSiteHeader.classList.add('is-scrolled');
        },
        onReverseComplete: () => {
          elNav.style.visibility = 'hidden';
          document.body.classList.remove('show-header-blur');
          if (elSiteHeader) elSiteHeader.classList.remove('is-scrolled');
        }
      },
      0.78
    );
  }

  if (elNavToggle) {
    scrollTl.fromTo(elNavToggle,
      { opacity: 0, y: -16, visibility: 'hidden' },
      {
        opacity: 1,
        y: 0,
        visibility: 'visible',
        ease: 'power2.out',
        duration: 0.18,
        onStart: () => { elNavToggle.style.visibility = 'visible'; },
        onReverseComplete: () => { elNavToggle.style.visibility = 'hidden'; }
      },
      0.78
    );
  }

  // Bulletproof failsafe: when user scrolls back to top, ensure 3D container & hero are 100% visible
  window.addEventListener('scroll', () => {
    if (window.scrollY <= 20) {
      if (container) {
        container.style.opacity = '1';
        container.style.visibility = 'visible';
      }
      if (elGrid) {
        elGrid.style.opacity = '1';
        elGrid.style.visibility = 'visible';
      }
      if (elVig) {
        elVig.style.opacity = '1';
        elVig.style.visibility = 'visible';
      }
      if (elHero) {
        elHero.style.opacity = '1';
        elHero.style.visibility = 'visible';
      }
    }
  }, { passive: true });
}

window.__DEBUG = {
  anim,
  camera,
  MASTER_RIG,
  container,
  scrollTl
};

const clock = new THREE.Clock();

function renderFrame() {
  requestAnimationFrame(renderFrame);
  const time = clock.getElapsedTime();

  // 1. Smooth mouse coordinate interpolation
  mouse.targetX += (mouse.x - mouse.targetX) * 0.055;
  mouse.targetY += (mouse.y - mouse.targetY) * 0.055;

  // 2. Camera position driven by GSAP with subtle organic breathing
  camera.position.z = anim.camZ;
  camera.position.y = Math.sin(time * 0.35) * 0.03 * (1 - anim.p * 0.8);

  // 3. Master Rig Rotation = GSAP Scroll Animation Base + Interactive Mouse Tilt
  MASTER_RIG.rotation.x = anim.rigRotX - mouse.targetY * 0.12;
  MASTER_RIG.rotation.y = anim.rigRotY + mouse.targetX * 0.16;

  // 4. Optical Glint Light tracking mouse across front glass curve
  glintLight.position.x = mouse.targetX * 1.8;
  glintLight.position.y = mouse.targetY * 1.4;

  // 5. Mechanical Kinematics
  if (focusRingMesh) {
    focusRingMesh.rotation.z = anim.focusRot + time * 0.04;
  }
  if (zoomRingMesh) {
    zoomRingMesh.rotation.z = anim.zoomRot;
  }
  if (distanceScaleGroup) {
    distanceScaleGroup.rotation.z = anim.focusRot * 0.6;
  }

  // 6. Compound Optical Parallax & Aperture Diaphragm
  if (internalDoubletMesh) {
    internalDoubletMesh.position.z = 1.02 - anim.p * 0.14; // Internal group shifts with zoom!
  }
  if (DIAPHRAGM_GROUP) {
    DIAPHRAGM_GROUP.scale.setScalar(anim.diaphragmScale);
    DIAPHRAGM_GROUP.rotation.z = anim.diaphragmRot;
  }

  // 7. Dynamic Lighting Intensities
  keyLight.intensity = anim.keyIntensity;
  blueRimLight.intensity = anim.blueIntensity;
  goldRimLight.intensity = anim.goldIntensity;

  // 8. Atmospheric Floating Bokeh Drift
  const posAttr = bokehGeo.attributes.position;
  for (let i = 0; i < BOKEH_COUNT; i++) {
    let y = posAttr.getY(i) + bokehSpeeds[i].y;
    if (y > 3.6) y = -3.6;
    posAttr.setY(i, y);

    let x = posAttr.getX(i) + Math.sin(time * 0.4 + bokehSpeeds[i].phase) * 0.001;
    posAttr.setX(i, x);
  }
  posAttr.needsUpdate = true;

  renderer.render(scene, camera);
}

renderFrame();
