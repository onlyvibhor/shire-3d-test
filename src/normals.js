// A vertex normal of zero length turns into NaN in the shader (normalize(0)), and post-processing
// smears a NaN pixel into a black flash. Degenerate triangles (in extruded logo outlines, in the
// caps of character limbs) leave such normals behind, so give each one a plain upward normal.
export function repairNormals(geo) {
  const n = geo?.attributes?.normal;
  if (!n) return 0;
  let fixed = 0;
  for (let i = 0; i < n.count; i++) {
    const x = n.getX(i), y = n.getY(i), z = n.getZ(i);
    const l = Math.hypot(x, y, z);
    if (l > 1e-6 && Number.isFinite(l)) continue;
    n.setXYZ(i, 0, 1, 0);
    fixed++;
  }
  if (fixed) n.needsUpdate = true;
  return fixed;
}

// the same for everything under a root, once, after the world is built
export function repairAllNormals(root) {
  const seen = new Set();
  let fixed = 0;
  root.traverse((o) => {
    if (!o.geometry || seen.has(o.geometry)) return;
    seen.add(o.geometry);
    fixed += repairNormals(o.geometry);
  });
  return fixed;
}
