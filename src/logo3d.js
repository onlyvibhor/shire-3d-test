// The two companies' logos as solid 3D units, built from their vector artwork (src/logos, converted
// from the brand EPS files): every filled path is extruded, one mesh per colour, and mounted on
// both faces of a slab so the logo reads from either side as it turns.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { repairNormals } from './normals.js';
import razorpaySvg from './logos/razorpay.svg?raw';
import grofersSvg from './logos/grofers.svg?raw';

const mats = new Map();
function paint(color, glow = 0.18) {
  const key = color + glow;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, emissive: color, emissiveIntensity: glow }));
  return mats.get(key);
}

// the artwork's filled paths, extruded: { meshes per colour, w, h } in metres, centred, face at z=0
// looking down +z, depth running back into -z
function extrude(svg, width, depthFor) {
  const data = new SVGLoader().parse(svg);
  const items = [];
  const box = new THREE.Box2();
  for (const path of data.paths) {
    const color = '#' + path.color.getHexString();
    for (const shape of SVGLoader.createShapes(path)) {
      for (const p of shape.getPoints()) box.expandByPoint(p);
      items.push({ color, shape });
    }
  }
  const size = box.getSize(new THREE.Vector2());
  const s = width / size.x;
  const c = box.getCenter(new THREE.Vector2());
  // svg y runs down: turning the extrusion half a turn about x sets it upright and keeps the
  // faces' winding (a mirror would turn them inside out)
  const m = new THREE.Matrix4().makeScale(s, -s, -s).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, 0));
  const byColor = new Map();
  for (const { color, shape } of items) {
    const geo = new THREE.ExtrudeGeometry(shape, { depth: depthFor(color) / s, bevelEnabled: false, curveSegments: 10 });
    geo.applyMatrix4(m);
    if (!byColor.has(color)) byColor.set(color, []);
    byColor.get(color).push(geo);
  }
  const out = [];
  for (const [color, list] of byColor) {
    const geo = mergeGeometries(list);
    list.forEach((g) => g.dispose());
    geo.computeVertexNormals();
    repairNormals(geo);
    out.push({ color, geo });
  }
  return { parts: out, w: width, h: size.y * s };
}

function roundedSlab(w, h, depth, r, mat) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 + r, -h / 2);
  sh.lineTo(w / 2 - r, -h / 2);
  sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  sh.lineTo(w / 2, h / 2 - r);
  sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  sh.lineTo(-w / 2 + r, h / 2);
  sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  sh.lineTo(-w / 2, -h / 2 + r);
  sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, curveSegments: 8 });
  geo.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

// the artwork on both faces of a slab
function unit({ svg, width, pad, slabColor, depthFor, colorFor = (c) => c }) {
  const art = extrude(svg, width, depthFor);
  const g = new THREE.Group();
  const T = 0.36; // slab thickness
  g.add(roundedSlab(art.w + pad * 2, art.h + pad * 2, T, Math.min(0.6, (art.h + pad * 2) * 0.22), paint(slabColor, 0.08)));
  for (const side of [1, -1]) {
    for (const { color, geo } of art.parts) {
      const mesh = new THREE.Mesh(geo, paint(colorFor(color)));
      mesh.castShadow = true;
      // the artwork's back sits in the slab's face; its face stands proud of it
      mesh.position.z = side * (T / 2 + 0.06 + depthFor(color) - 0.02);
      if (side < 0) mesh.rotation.y = Math.PI;
      g.add(mesh);
    }
  }
  g.userData.size = { w: art.w + pad * 2, h: art.h + pad * 2 };
  return g;
}

// Razorpay: the reversed logo from the brand file, white with the blue stroke, on a navy slab
export function razorpayLogo(width = 9) {
  return unit({ svg: razorpaySvg, width, pad: 0.55, slabColor: '#1d294f', depthFor: (c) => (c === '#ffffff' ? 0.16 : 0.24) });
}

// Grofers: the orange mark and wordmark on a white slab, the white G standing proud of its circle
export function grofersLogo(width = 8.5) {
  return unit({ svg: grofersSvg, width, pad: 0.5, slabColor: '#fbf7f2', depthFor: (c) => (c === '#ffffff' ? 0.26 : 0.16) });
}
