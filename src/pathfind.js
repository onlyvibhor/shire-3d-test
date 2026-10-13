// Walking routes inside a building. Each room's floor becomes a grid of half-metre cells; a cell is
// blocked if a wall or a piece of furniture (the room's colliders, grown by a body's radius) covers
// it. A* finds the route through the open passages and the route is then pulled straight wherever
// there's a clear line, so you walk naturally instead of zig-zagging cell to cell. The player's
// click-to-move, the floor-plan map and the people who live in the house all walk these routes.

const CELL = 0.5;

export function buildGrid(room, inflate = 0.42) {
  const b = room.bounds;
  const ox = room.origin.x + b.minX;
  const oz = room.origin.z + b.minZ;
  const nx = Math.max(1, Math.ceil((b.maxX - b.minX) / CELL));
  const nz = Math.max(1, Math.ceil((b.maxZ - b.minZ) / CELL));
  const blocked = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = ox + (i + 0.5) * CELL;
      const z = oz + (j + 0.5) * CELL;
      for (const c of room.colliders) {
        if (c.box) {
          const q = c.box;
          if (x > q.minX - inflate && x < q.maxX + inflate && z > q.minZ - inflate && z < q.maxZ + inflate) {
            blocked[j * nx + i] = 1;
            break;
          }
        } else if ((x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + inflate) ** 2) {
          blocked[j * nx + i] = 1;
          break;
        }
      }
    }
  }
  return { ox, oz, nx, nz, blocked, room };
}

const cellOf = (g, x, z) => [Math.floor((x - g.ox) / CELL), Math.floor((z - g.oz) / CELL)];
const inside = (g, i, j) => i >= 0 && j >= 0 && i < g.nx && j < g.nz;
const free = (g, i, j) => inside(g, i, j) && !g.blocked[j * g.nx + i];
const centre = (g, i, j) => ({ x: g.ox + (i + 0.5) * CELL, z: g.oz + (j + 0.5) * CELL });

// the open cell nearest to (x, z): where a click on a table or a wall really sends you
export function nearestFree(g, x, z) {
  let [i0, j0] = cellOf(g, x, z);
  i0 = Math.min(g.nx - 1, Math.max(0, i0));
  j0 = Math.min(g.nz - 1, Math.max(0, j0));
  if (free(g, i0, j0)) return [i0, j0];
  for (let r = 1; r < Math.max(g.nx, g.nz); r++) {
    let best = null;
    let bd = Infinity;
    for (let j = j0 - r; j <= j0 + r; j++) {
      for (let i = i0 - r; i <= i0 + r; i++) {
        if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || !free(g, i, j)) continue;
        const c = centre(g, i, j);
        const d = (c.x - x) ** 2 + (c.z - z) ** 2;
        if (d < bd) {
          bd = d;
          best = [i, j];
        }
      }
    }
    if (best) return best;
  }
  return null;
}

// is the straight line between two points clear of blocked cells?
export function clearLine(g, ax, az, bx, bz) {
  const len = Math.hypot(bx - ax, bz - az);
  const steps = Math.ceil(len / (CELL * 0.35));
  for (let k = 0; k <= steps; k++) {
    const t = steps ? k / steps : 0;
    const [i, j] = cellOf(g, ax + (bx - ax) * t, az + (bz - az) * t);
    if (!free(g, i, j)) return false;
  }
  return true;
}

// A* from (ax, az) to (bx, bz); returns a list of world points to walk through, or null
export function findPath(g, ax, az, bx, bz) {
  const s = nearestFree(g, ax, az);
  const e = nearestFree(g, bx, bz);
  if (!s || !e) return null;
  const end = e[0] === cellOf(g, bx, bz)[0] && e[1] === cellOf(g, bx, bz)[1] ? { x: bx, z: bz } : centre(g, e[0], e[1]);
  if (clearLine(g, ax, az, end.x, end.z)) return [end];
  const N = g.nx * g.nz;
  const gs = new Float32Array(N).fill(Infinity);
  const from = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const open = [];
  const si = s[1] * g.nx + s[0];
  const ei = e[1] * g.nx + e[0];
  const h = (i, j) => Math.hypot(i - e[0], j - e[1]);
  gs[si] = 0;
  open.push([h(s[0], s[1]), si]);
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  let found = false;
  while (open.length) {
    // a small binary heap would be faster; rooms are a few thousand cells, so a sorted pop is plenty
    let bi = 0;
    for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
    const [, cur] = open[bi];
    open[bi] = open[open.length - 1];
    open.pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === ei) {
      found = true;
      break;
    }
    const ci = cur % g.nx;
    const cj = (cur - ci) / g.nx;
    for (const [di, dj, w] of dirs) {
      const ni = ci + di;
      const nj = cj + dj;
      if (!free(g, ni, nj)) continue;
      // no cutting corners past a wall's end
      if (di && dj && (!free(g, ci + di, cj) || !free(g, ci, cj + dj))) continue;
      const n = nj * g.nx + ni;
      const ng = gs[cur] + w;
      if (ng < gs[n]) {
        gs[n] = ng;
        from[n] = cur;
        open.push([ng + h(ni, nj), n]);
      }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let c = ei; c !== -1; c = from[c]) cells.push(c);
  cells.reverse();
  const pts = cells.map((c) => centre(g, c % g.nx, Math.floor(c / g.nx)));
  pts[pts.length - 1] = end;
  // pull the route straight: from each point, jump to the furthest point still in clear sight
  const out = [];
  let px = ax;
  let pz = az;
  let k = 0;
  while (k < pts.length) {
    let far = k;
    for (let m = pts.length - 1; m > k; m--) {
      if (clearLine(g, px, pz, pts[m].x, pts[m].z)) {
        far = m;
        break;
      }
    }
    out.push(pts[far]);
    px = pts[far].x;
    pz = pts[far].z;
    k = far + 1;
  }
  return out;
}

// the length of a route, for picking the nearest of several
export const pathLength = (ax, az, pts) => {
  let L = 0;
  for (const p of pts) {
    L += Math.hypot(p.x - ax, p.z - az);
    ax = p.x;
    az = p.z;
  }
  return L;
};
