/**
 * Studio Bear — Photography
 * js/three-scene.js
 *
 * 3D camera-lens scene built with Three.js.
 * Depends on: three@0.158.0 (loaded as ES module via importmap)
 */

import * as THREE from 'three';

/* ── Utilities ── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const remap = (v, ia, ib, oa, ob) => lerp(oa, ob, clamp((v - ia) / (ib - ia), 0, 1));
const ease  = t => t < .5 ? 2*t*t : -1 + (4 - 2*t) * t;

/* ── Renderer ── */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace  = THREE.SRGBColorSpace;
document.getElementById('wrap').appendChild(renderer.domElement);

/* ── Scene ── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d1d1f);
scene.fog = new THREE.FogExp2(0x1d1d1f, 0.07);

/* ── Color palettes (background cycle when fully zoomed) ── */
const PALETTES = [
  { bg: new THREE.Color(0x1d1d1f), fog: new THREE.Color(0x1d1d1f), body: '#1d1d1f' },
  { bg: new THREE.Color(0x2a2a2d), fog: new THREE.Color(0x2a2a2d), body: '#2a2a2d' },
  { bg: new THREE.Color(0x242426), fog: new THREE.Color(0x242426), body: '#242426' },
  { bg: new THREE.Color(0x26262a), fog: new THREE.Color(0x26262a), body: '#26262a' },
  { bg: new THREE.Color(0x22222a), fog: new THREE.Color(0x22222a), body: '#22222a' },
];
const bgCurrent  = new THREE.Color(0x1d1d1f);
const fogCurrent = new THREE.Color(0x1d1d1f);
let paletteIndex = 0, paletteTarget = 0, paletteMix = 0, paletteTimer = 0;

/* ── Camera ── */
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.01, 200);
camera.position.set(0, 0, 4.2);

/* ── Lights ── */
scene.add(new THREE.AmbientLight(0x1a1a3a, 0.25));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
keyLight.position.set(3, 5, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const blueLight = new THREE.PointLight(0x3355ff, 2.2, 14);
blueLight.position.set(-4, 2, 3);
scene.add(blueLight);

const goldLight = new THREE.PointLight(0xc9a84c, 1.5, 10);
goldLight.position.set(3, -2, 2);
scene.add(goldLight);

const rimLight = new THREE.PointLight(0xffffff, 0.5, 8);
rimLight.position.set(0, 0, 6);
scene.add(rimLight);

const cyanLight = new THREE.PointLight(0x4cc9c9, 0.8, 12);
cyanLight.position.set(-2, -3, 4);
scene.add(cyanLight);

const spotLight = new THREE.SpotLight(0xffffff, 2.4, 22, 0.3, 0.85);
spotLight.position.set(0, 10, 2);
spotLight.castShadow = true;
scene.add(spotLight);

/* ── Starfield ── */
{
  const count = 500;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - .5) * 90;
    pos[i*3+1] = (Math.random() - .5) * 90;
    pos[i*3+2] = (Math.random() - .5) * 60 - 8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffffff, size: .05, transparent: true, opacity: .5
  })));
}

/* ── Texture helpers ── */
function makeGlassTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2;

  // Base gradient
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  bg.addColorStop(0,   '#1a1a1a');
  bg.addColorStop(.55, '#111114');
  bg.addColorStop(1,   '#0a0a0e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Yellow-green flare
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .72;
  const gy = ctx.createRadialGradient(cx * .55, cy * .55, 0, cx * .55, cy * .55, r * .7);
  gy.addColorStop(0,  'rgba(220,210,60,0.9)');
  gy.addColorStop(.5, 'rgba(180,200,30,0.4)');
  gy.addColorStop(1,  'rgba(180,200,30,0)');
  ctx.fillStyle = gy;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, Math.PI, Math.PI * 1.75); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Magenta flare
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .65;
  const gm = ctx.createRadialGradient(cx * .45, cy * 1.45, 0, cx * .45, cy * 1.45, r * .75);
  gm.addColorStop(0,   'rgba(200,50,200,0.95)');
  gm.addColorStop(.45, 'rgba(160,20,180,0.5)');
  gm.addColorStop(1,   'rgba(140,0,160,0)');
  ctx.fillStyle = gm;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, Math.PI * 1.4, Math.PI * 2.1); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Cyan flare
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .45;
  const gs = ctx.createRadialGradient(cx * 1.5, cy, 0, cx * 1.5, cy, r * .6);
  gs.addColorStop(0,  'rgba(160,200,220,0.8)');
  gs.addColorStop(.5, 'rgba(100,160,180,0.3)');
  gs.addColorStop(1,  'rgba(80,120,140,0)');
  ctx.fillStyle = gs;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -.6, .9); ctx.closePath(); ctx.fill();
  ctx.restore();

  // White specular highlight
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = .55;
  const gh = ctx.createRadialGradient(cx * 1.3, cy * .38, 0, cx * 1.3, cy * .38, r * .32);
  gh.addColorStop(0,  'rgba(255,255,255,0.9)');
  gh.addColorStop(.4, 'rgba(220,230,255,0.4)');
  gh.addColorStop(1,  'rgba(200,220,255,0)');
  ctx.fillStyle = gh;
  ctx.beginPath(); ctx.arc(cx * 1.3, cy * .38, r * .32, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Clip to circle
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath(); ctx.arc(cx, cy, r - .5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

function makeRingTexture(textLeft, textRight, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2, r = size / 2 - 4;

  // Ring face
  const rg = ctx.createRadialGradient(cx, cy, r * .7, cx, cy, r);
  rg.addColorStop(0,  '#2a2a2e');
  rg.addColorStop(.5, '#232326');
  rg.addColorStop(1,  '#1c1c1f');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // Arc text — left side
  ctx.font = `bold ${size * .045}px 'Inter',sans-serif`;
  ctx.fillStyle = '#888a90';
  const chars1 = [...textLeft];
  ctx.save();
  ctx.translate(cx, cy);
  const aStart1 = -Math.PI * .72, aStep1 = Math.PI * .9 / Math.max(chars1.length - 1, 1);
  chars1.forEach((ch, i) => {
    const a = aStart1 + i * aStep1;
    ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.translate(0, -r * .84); ctx.rotate(-Math.PI / 2); ctx.fillText(ch, 0, 0); ctx.restore();
  });
  ctx.restore();

  // Arc text — right side
  const chars2 = [...textRight];
  ctx.save();
  ctx.translate(cx, cy);
  const aStart2 = .05, aStep2 = Math.PI * .55 / Math.max(chars2.length - 1, 1);
  chars2.forEach((ch, i) => {
    const a = aStart2 + i * aStep2;
    ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.translate(0, -r * .84); ctx.rotate(-Math.PI / 2); ctx.fillText(ch, 0, 0); ctx.restore();
  });
  ctx.restore();

  // Clip to circle
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

/* ── Materials ── */
const matDark   = new THREE.MeshStandardMaterial({ color: 0x252528, metalness: .85, roughness: .28 });
const matDark2  = new THREE.MeshStandardMaterial({ color: 0x1e1e21, metalness: .9,  roughness: .22 });
const matRubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: .05, roughness: .92 });
const matChrome = new THREE.MeshStandardMaterial({ color: 0x9aa0ab, metalness: .98, roughness: .08 });
const matGold   = new THREE.MeshStandardMaterial({ color: 0xc9a84c, metalness: .99, roughness: .09 });
const matGlass  = new THREE.MeshPhysicalMaterial({
  map: makeGlassTexture(),
  transmission: .85, thickness: .25, roughness: .02, metalness: .04,
  ior: 1.52, reflectivity: .85, envMapIntensity: 2.8,
  transparent: true, opacity: .94, side: THREE.DoubleSide
});

/* ── Geometry helpers ── */
const mkDisc     = (r, mat, segs = 96) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, segs), mat); m.castShadow = true; return m; };
const mkTorus    = (r, tube, mat, segs = 80) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 14, segs), mat); m.castShadow = true; return m; };
const mkCylinder = (rt, rb, h, mat, segs = 64, open = true) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs, 1, open), mat); m.castShadow = true; return m; };

/* ── Lens assembly ── */
const ROOT = new THREE.Group(); scene.add(ROOT);
const LENS = new THREE.Group(); ROOT.add(LENS);

const barrel    = mkCylinder(1.02, 1.02, 1.2, matDark2, 64, true);
barrel.rotation.x = Math.PI / 2;
LENS.add(barrel);

const backDisc  = mkDisc(1.02, matDark2); backDisc.position.z = -.61; LENS.add(backDisc);
const outerBezel = mkTorus(1.0, .055, matDark); outerBezel.position.z = .01; LENS.add(outerBezel);

const outerFace = mkDisc(.97, new THREE.MeshStandardMaterial({
  map: makeRingTexture('24-70mm 1:2.8', 'Ø77mm'), metalness: .8, roughness: .3
}));
outerFace.position.z = .02; LENS.add(outerFace);

const focusRing   = mkTorus(.82, .058, matRubber); focusRing.position.z = .08;  LENS.add(focusRing);
const focusFace   = mkDisc(.76, matRubber);         focusFace.position.z = .10;  LENS.add(focusFace);
const focusChrome = mkTorus(.76, .022, matChrome);  focusChrome.position.z = .13; LENS.add(focusChrome);

const innerFace = mkDisc(.73, new THREE.MeshStandardMaterial({
  map: makeRingTexture('ESTUDIO', 'EL OSO'), metalness: .75, roughness: .35
}));
innerFace.position.z = .14; LENS.add(innerFace);

const innerBezel = mkTorus(.64, .028, matDark); innerBezel.position.z = .16; LENS.add(innerBezel);
const goldAccent = mkTorus(.63, .014, matGold);  goldAccent.position.z = .18; LENS.add(goldAccent);
const glass      = mkDisc(.61, matGlass);         glass.position.z      = .22; LENS.add(glass);

/* ── Iris / diaphragm ── */
const DIAPHRAGM = new THREE.Group(); DIAPHRAGM.position.z = .24; LENS.add(DIAPHRAGM);

const irisBack = mkDisc(.60, new THREE.MeshBasicMaterial({ color: 0x060608 }));
irisBack.position.z = -.01; DIAPHRAGM.add(irisBack);

const BLADE_COUNT = 9;
Array.from({ length: BLADE_COUNT }, (_, i) => {
  const angle = (i / BLADE_COUNT) * Math.PI * 2;
  const shape = new THREE.Shape();
  const r0 = 0.0, r1 = 0.58, sw = 0.22;
  shape.moveTo(0, r0);
  shape.quadraticCurveTo(sw * .9, r1 * .55, sw * .5, r1);
  shape.quadraticCurveTo(0, r1 * 1.02, -sw * .5, r1);
  shape.quadraticCurveTo(-sw * .9, r1 * .55, 0, r0);
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 24),
    new THREE.MeshStandardMaterial({ color: 0x0e0e11, metalness: .82, roughness: .18, side: THREE.DoubleSide })
  );
  mesh.rotation.z = angle;
  DIAPHRAGM.add(mesh);
});

const pupil = mkDisc(.18, new THREE.MeshBasicMaterial({ color: 0x020204 }));
pupil.position.z = .02; DIAPHRAGM.add(pupil);

const irisRim = mkTorus(.185, .012, new THREE.MeshStandardMaterial({ color: 0x5a5a66, metalness: .95, roughness: .08 }));
irisRim.position.z = .03; DIAPHRAGM.add(irisRim);

/* ── Input state ── */
let scrollProgress = 0, scrollTarget = 0;
let mouse = { x: 0, y: 0 };

window.addEventListener('scroll', () => {
  const trackHeight = document.getElementById('scroll-track').offsetHeight;
  scrollTarget = trackHeight > 0 ? Math.min(scrollY / trackHeight, 1) : 0;
}, { passive: true });

window.addEventListener('mousemove', e => {
  mouse.x =  (e.clientX / innerWidth  - .5) * 2;
  mouse.y = -(e.clientY / innerHeight - .5) * 2;
});

window.addEventListener('touchmove', e => {
  const t = e.touches[0];
  mouse.x =  (t.clientX / innerWidth  - .5) * 2;
  mouse.y = -(t.clientY / innerHeight - .5) * 2;
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ── UI element references ── */
const elBrand  = document.getElementById('brand');
const elNav    = document.getElementById('nav');
const elHero   = document.getElementById('hero');
const elHeroH1 = elHero.querySelector('h1');
const elHeroP  = elHero.querySelector('p');
const elHint   = elHero.querySelector('.hint');
const elSI     = document.getElementById('si');
if (elSI) elSI.style.display = 'none';
const elST     = document.getElementById('st');
const elSS     = document.getElementById('ss');
const elTG     = document.getElementById('tg');
const elBAR    = document.getElementById('bar');
const elARR    = document.getElementById('arr');

/* ── Entrance animation ── */
setTimeout(() => {
  const eyebrow = elHero.querySelector('.eyebrow');
  if (eyebrow) eyebrow.style.opacity = '1';
  elHeroH1.style.opacity  = '1';
  elHeroH1.style.transform = 'translateY(0)';
  elHeroP.style.opacity   = '1';
  elHint.style.opacity    = '1';
}, 120);

/* ── Render loop ── */
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const time = clock.getElapsedTime();
  scrollProgress += (scrollTarget - scrollProgress) * .06;
  const p    = scrollProgress;
  const zoom = ease(clamp(remap(p, 0, 1, 0, 1), 0, 1));

  // UI updates
  elBAR.style.width  = (p * 100) + '%';
  const showHeader = p > .92;
  document.body.classList.toggle('show-header-blur', showHeader);
  elBrand.style.opacity = showHeader ? '1' : '0';
  elNav.style.opacity = showHeader ? '1' : '0';
  elHero.style.opacity = p < .08 ? '1' : '0';
  elARR.style.opacity  = p < .03 ? '1' : '0';
  if (elSI) elSI.style.display = 'none';

  const pct = Math.round(p * 100);
  if (pct < 50) {
    elST.textContent = 'ESTUDIO EL OSO'; elSS.textContent = 'Fotografía de eventos'; elTG.textContent = 'Scroll para acercarte';
  } else if (pct < 80) {
    elST.textContent = 'CADA MOMENTO'; elSS.textContent = 'Para siempre'; elTG.textContent = 'Estudio El Oso';
  } else {
    elST.textContent = 'EL MOMENTO'; elSS.textContent = 'Congelado para siempre'; elTG.textContent = 'Estudio El Oso';
  }

  // Camera
  camera.position.z = lerp(4.2, 0.35, zoom);
  camera.position.y = lerp(0, .08, zoom) * Math.sin(time * .15);

  // Mouse tilt
  ROOT.rotation.x += ((-mouse.y * .12) - ROOT.rotation.x) * .05;
  ROOT.rotation.y += ((mouse.x  * .12) - ROOT.rotation.y) * .05;

  // Lens pose
  LENS.rotation.y  = lerp(0, Math.PI * .08, zoom);
  LENS.rotation.x  = lerp(0, -Math.PI * .04, zoom);
  LENS.position.y  = Math.sin(time * .5) * .05 * lerp(1, 0.1, zoom);

  // Continuous rotations
  focusRing.rotation.z  += .003;
  focusChrome.rotation.z -= .002;
  goldAccent.rotation.z  += .005;
  DIAPHRAGM.rotation.z   -= .0015;

  // Light intensities
  blueLight.intensity = lerp(2.2, 4.5, zoom);
  goldLight.intensity = lerp(1.5, 3.8, zoom);
  rimLight.intensity  = lerp(0.5, 1.8, zoom);

  // Background palette cycling (only when fully zoomed)
  if (p >= 0.99) {
    paletteTimer += .016;
    if (paletteTimer >= 3.5) {
      paletteTimer  = 0;
      paletteIndex  = paletteTarget;
      paletteTarget = (paletteTarget + 1) % PALETTES.length;
      paletteMix    = 0;
    }
    paletteMix = Math.min(paletteMix + .016 / 1.2, 1);
    const t    = ease(paletteMix);
    const from = PALETTES[paletteIndex], to = PALETTES[paletteTarget];
    bgCurrent.lerpColors(from.bg, to.bg, t);
    fogCurrent.lerpColors(from.fog, to.fog, t);
    scene.background.copy(bgCurrent);
    scene.fog.color.copy(fogCurrent);

    const rv  = Math.round(bgCurrent.r * 255);
    const gv  = Math.round(bgCurrent.g * 255);
    const bv  = Math.round(bgCurrent.b * 255);
    const css = `rgb(${rv},${gv},${bv})`;
    document.body.style.background = css;
    document.getElementById('content-sections').style.setProperty('--sb-bg-shift', css);
  } else {
    paletteTimer = 0; paletteIndex = 0; paletteTarget = 0; paletteMix = 0;
    scene.background.setHex(0x1d1d1f);
    scene.fog.color.setHex(0x1d1d1f);
    document.body.style.background = '#1d1d1f';
  }

  renderer.render(scene, camera);
}

frame();
