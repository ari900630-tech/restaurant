const THREE = window.THREE;
if (!THREE) {
  throw new Error('Three.js failed to load');
}

const canvas = document.getElementById('c');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140e0a);
scene.fog = new THREE.Fog(0x140e0a, 20, 70);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(10, 13, 15);

scene.add(new THREE.HemisphereLight(0xffe4c0, 0x302019, 2));
const light = new THREE.DirectionalLight(0xffd2a0, 3);
light.position.set(-10, 20, 8);
light.castShadow = true;
light.shadow.mapSize.set(1024, 1024);
scene.add(light);

const material = {
  floor: new THREE.MeshStandardMaterial({ color: 0x777067, roughness: 0.8 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x493027 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x92572d }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9ba1a2, metalness: 0.65, roughness: 0.3 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xe6d1b1 }),
  green: new THREE.MeshStandardMaterial({ color: 0x41634d }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd49b36, metalness: 0.5, roughness: 0.25 })
};

function box(x, y, z, m, a = 0, b = 0, d = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
  mesh.position.set(a, b, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function cyl(r, h, m, a, b, d) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 22), m);
  mesh.position.set(a, b, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

box(28, 0.3, 22, material.floor, 0, -0.15, 0);
box(28, 5, 0.3, material.wall, 0, 2.5, -11);
box(0.3, 5, 22, material.wall, -14, 2.5, 0);
box(0.3, 5, 22, material.wall, 14, 2.5, 0);
box(28, 5, 0.3, material.wall, 0, 2.5, 11);

const tables = [];
function addTable(x, z) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.2, 24), material.wood);
  top.position.y = 1.05;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);
  cyl(0.16, 1, material.metal, x, 0.5, z);

  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const leg = box(0.8, 0.18, 0.8, material.wood, x + Math.cos(a) * 1.5, 0.6, z + Math.sin(a) * 1.5);
    leg.castShadow = true;
    leg.receiveShadow = true;
  }

  g.position.set(x, 0, z);
  scene.add(g);
  tables.push({ x, z, busy: false, group: g });
}

[-8, 0, 8].forEach((x) => {
  addTable(x, -5);
  addTable(x, 1);
});

const stations = [
  ['🍕', -9, 6],
  ['🍔', -4, 6],
  ['🍝', 1, 6],
  ['🍟', 6, 6],
  ['🥤', 10, 6]
];

stations.forEach(([label, x, z]) => {
  box(2.2, 1.2, 1.2, material.metal, x, 0.6, z);
  box(1.6, 0.3, 0.8, material.wood, x, 1.35, z);
});

const player = new THREE.Group();
scene.add(player);

const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 1.1, 12), material.cream);
body.position.y = 1.1;
player.add(body);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), material.gold);
head.position.y = 1.9;
player.add(head);

const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.3, 12), material.green);
hat.position.y = 2.3;
player.add(hat);

const keyState = { left: false, right: false, up: false, down: false };
window.addEventListener('keydown', (event) => {
  const k = event.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keyState.left = true;
  if (k === 'arrowright' || k === 'd') keyState.right = true;
  if (k === 'arrowup' || k === 'w') keyState.up = true;
  if (k === 'arrowdown' || k === 's') keyState.down = true;
});
window.addEventListener('keyup', (event) => {
  const k = event.key.toLowerCase();
  if (k === 'arrowleft' || k === 'a') keyState.left = false;
  if (k === 'arrowright' || k === 'd') keyState.right = false;
  if (k === 'arrowup' || k === 'w') keyState.up = false;
  if (k === 'arrowdown' || k === 's') keyState.down = false;
});

const pointer = { x: 0, y: 0, active: false };
const joy = document.getElementById('joy');
if (joy) {
  const knob = joy.querySelector('i');
  joy.addEventListener('pointerdown', (e) => {
    pointer.active = true;
    joy.setPointerCapture(e.pointerId);
  });
  joy.addEventListener('pointermove', (e) => {
    if (!pointer.active) return;
    const rect = joy.getBoundingClientRect();
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    const max = 40;
    pointer.x = THREE.MathUtils.clamp(px / (rect.width / 2), -1, 1);
    pointer.y = THREE.MathUtils.clamp(py / (rect.height / 2), -1, 1);
    if (knob) knob.style.transform = `translate(${pointer.x * max}px, ${pointer.y * max}px)`;
  });
  joy.addEventListener('pointerup', () => {
    pointer.active = false;
    pointer.x = 0;
    pointer.y = 0;
    if (knob) knob.style.transform = 'translate(0, 0)';
  });
}

function updatePlayer(dt) {
  let dx = 0;
  let dz = 0;

  if (keyState.left) dx -= 1;
  if (keyState.right) dx += 1;
  if (keyState.up) dz -= 1;
  if (keyState.down) dz += 1;

  if (pointer.active) {
    dx += pointer.x;
    dz += pointer.y;
  }

  if (dx !== 0 || dz !== 0) {
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    player.position.x += dx * dt * 6;
    player.position.z += dz * dt * 6;
    player.position.x = THREE.MathUtils.clamp(player.position.x, -11, 11);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -8, 9);
    player.rotation.y = Math.atan2(dx, dz);
  }
}

function updateCamera() {
  camera.position.x += (player.position.x + 6 - camera.position.x) * 0.05;
  camera.position.z += (player.position.z + 8 - camera.position.z) * 0.05;
  camera.position.y = 10;
  camera.lookAt(player.position.x, 1.3, player.position.z);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = 1 / 60;
  updatePlayer(dt);
  updateCamera();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
console.log('Restaurant game initialized');
