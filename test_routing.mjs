#!/usr/bin/env node
// test_routing.mjs — algorithmic test suite for Smart Escape routing logic
// Run: node test_routing.mjs

/* ── Routing logic (copied verbatim from index.html) ─────────────────────── */
function dijkstra(adj, src) {
  const dist = new Map([[src, 0]]), done = new Set();
  for (;;) {
    let u = null, best = Infinity;
    for (const [k, v] of dist) if (!done.has(k) && v < best) { best = v; u = k; }
    if (u === null) return dist;
    done.add(u);
    for (const [v, c] of (adj.get(u) || [])) {
      const nd = best + c;
      if (!dist.has(v) || nd < dist.get(v)) dist.set(v, nd);
    }
  }
}

function computeRoute(D, start, bN, bE, cX) {
  if (!D || !start) return { status: "none" };
  if (bN.has(start)) return { status: "startBlocked" };
  const adj = new Map(D.nodes.map(n => [n.id, []]));
  D.edges.forEach(e => {
    if (bE.has(e.id)) return;
    if (bN.has(e.from) || bN.has(e.to)) return;
    if (cX.has(e.from) || cX.has(e.to)) return;
    adj.get(e.from).push([e.to, e.cost]);
    adj.get(e.to).push([e.from, e.cost]);
  });
  const dS = dijkstra(adj, start);
  let best = null;
  D.nodes
    .filter(n => n.type === "exit" && !cX.has(n.id) && dS.has(n.id))
    .forEach(n => {
      const c = dS.get(n.id);
      if (!best || c < best.c || (c === best.c && n.id < best.id))
        best = { id: n.id, c };
    });
  if (!best) return { status: "noRoute" };
  const dE = dijkstra(adj, best.id);
  const path = [start];
  let cur = start;
  const MAX = D.nodes.length + 1;
  let steps = 0;
  while (cur !== best.id && steps++ < MAX) {
    const cands = (adj.get(cur) || [])
      .filter(([v, c]) => dE.has(v) && c + dE.get(v) === dE.get(cur))
      .map(([v]) => v).sort();
    if (!cands.length) return { status: "noRoute" };
    path.push(cands[0]); cur = cands[0];
  }
  return { status: "ok", exit: best.id, cost: best.c, path };
}

/* ── Validation logic (copied verbatim) ────────────────────────────────── */
function validate(d) {
  const E = [], push = (k, a) => E.push([k, a]);
  if (!d || typeof d !== "object" || Array.isArray(d)) return [["bad_root"]];
  if (typeof d.building !== "string" || !d.building.trim()) push("bad_building");
  if (!Array.isArray(d.nodes) || d.nodes.length < 2 || d.nodes.length > 60) { push("bad_nodes"); return E; }
  if (!Array.isArray(d.edges) || d.edges.length < 1 || d.edges.length > 150) { push("bad_edges"); return E; }
  const ids = new Map();
  d.nodes.forEach((n, i) => {
    const ok = n && typeof n.id === "string" && n.id &&
               typeof n.label === "string" && n.label.trim() &&
               ["room","junction","exit"].includes(n.type) &&
               Number.isFinite(n.x) && Number.isFinite(n.y);
    if (!ok) { push("bad_node", i+1); return; }
    if (ids.has(n.id)) push("dup_node", n.id); else ids.set(n.id, n);
  });
  const eids = new Map(), pairs = new Set();
  d.edges.forEach((e, i) => {
    if (!e || typeof e.id !== "string" || !e.id ||
        !Number.isInteger(e.cost) || e.cost <= 0) { push("bad_edge", i+1); return; }
    if (eids.has(e.id)) { push("dup_edge", e.id); return; }
    eids.set(e.id, e);
    if (!ids.has(e.from) || !ids.has(e.to)) { push("edge_ref", e.id); return; }
    if (e.from === e.to) { push("loop", e.id); return; }
    const pk = [e.from, e.to].sort().join("\0");
    if (pairs.has(pk)) push("pair", e.id);
    pairs.add(pk);
  });
  const types = [...ids.values()].map(n => n.type);
  if (!types.includes("exit") || !types.some(x => x !== "exit")) push("need_types");
  const s = d.initial_state;
  if (!s || !["blocked_nodes","blocked_edges","closed_exits"].every(k => Array.isArray(s[k]))) {
    push("bad_state");
  } else {
    s.blocked_nodes.forEach(id => { const n = ids.get(id); if (!n || n.type === "exit") push("st_bn", id); });
    s.blocked_edges.forEach(id => { if (!eids.has(id)) push("st_be", id); });
    s.closed_exits.forEach(id  => { const n = ids.get(id); if (!n || n.type !== "exit") push("st_ce", id); });
  }
  return E;
}

/* ── Sample dataset ─────────────────────────────────────────────────────── */
const D = {
  building: "Sample Building",
  nodes: [
    { id:"R1", label:"Room 1",   type:"room",     x:80,  y:80  },
    { id:"R2", label:"Room 2",   type:"room",     x:80,  y:240 },
    { id:"C1", label:"Junc. 1", type:"junction", x:240, y:80  },
    { id:"C2", label:"Junc. 2", type:"junction", x:400, y:80  },
    { id:"C3", label:"Junc. 3", type:"junction", x:240, y:240 },
    { id:"C4", label:"Junc. 4", type:"junction", x:400, y:240 },
    { id:"E1", label:"Exit 1",  type:"exit",     x:560, y:80  },
    { id:"E2", label:"Exit 2",  type:"exit",     x:560, y:240 }
  ],
  edges: [
    { id:"e1", from:"R1", to:"C1", cost:2 },
    { id:"e2", from:"C1", to:"C2", cost:2 },
    { id:"e3", from:"C2", to:"E1", cost:3 },
    { id:"e4", from:"R1", to:"R2", cost:4 },
    { id:"e5", from:"C1", to:"C3", cost:3 },
    { id:"e6", from:"C2", to:"C4", cost:5 },
    { id:"e7", from:"R2", to:"C3", cost:1 },
    { id:"e8", from:"C3", to:"C4", cost:3 },
    { id:"e9", from:"C4", to:"E2", cost:3 }
  ],
  initial_state: { blocked_nodes:[], blocked_edges:[], closed_exits:[] }
};

/* ── Test helpers ───────────────────────────────────────────────────────── */
let pass = 0, fail = 0;
function check(label, actual, expected) {
  const aStr = JSON.stringify(actual);
  const eStr = JSON.stringify(expected);
  const ok = aStr === eStr;
  if (ok) { console.log(`  ✅ PASS: ${label}`); pass++; }
  else     { console.error(`  ❌ FAIL: ${label}\n     Expected: ${eStr}\n     Got:      ${aStr}`); fail++; }
}
function section(title) { console.log(`\n── ${title} ─`); }

/* ════════════════════════════════════════════════════════════════════════
   TEST SUITE
   ════════════════════════════════════════════════════════════════════════ */

section("Scenario 1: R1 → E1, cost 7 (baseline)");
{
  const r = computeRoute(D, "R1", new Set(), new Set(), new Set());
  check("status=ok",             r.status, "ok");
  check("exit=E1",               r.exit,   "E1");
  check("cost=7",                r.cost,   7);
  check("path=R1-C1-C2-E1",      r.path,   ["R1","C1","C2","E1"]);
}

section("Scenario 2: R1 + block C2 → reroute to E2, cost 11");
{
  const r = computeRoute(D, "R1", new Set(), new Set(["e2"]), new Set());
  // With C2-C1 edge (e2) blocked: R1→C1 cost2, C1→C3 cost3, C3→C4 cost3, C4→E2 cost3 = 11
  check("status=ok",             r.status, "ok");
  check("exit=E2",               r.exit,   "E2");
  check("cost=11",               r.cost,   11);
  check("path=R1-C1-C3-C4-E2",  r.path,   ["R1","C1","C3","C4","E2"]);
}

section("Scenario 3: R1 + close E1 + close E2 → no route");
{
  const r = computeRoute(D, "R1", new Set(), new Set(), new Set(["E1","E2"]));
  check("status=noRoute",        r.status, "noRoute");
}

section("Scenario 4: R2 → E2, cost 7 (R2→C3→C4→E2 = 1+3+3)");
{
  const r = computeRoute(D, "R2", new Set(), new Set(), new Set());
  check("status=ok",             r.status, "ok");
  check("exit=E2",               r.exit,   "E2");
  check("cost=7",                r.cost,   7);
  check("path=R2-C3-C4-E2",     r.path,   ["R2","C3","C4","E2"]);
}

section("Scenario 5: select R1, then block R1 → startBlocked");
{
  const r = computeRoute(D, "R1", new Set(["R1"]), new Set(), new Set());
  check("status=startBlocked",   r.status, "startBlocked");
}

section("Tie-breaking: equal-cost exits — lex-smallest exit ID wins");
{
  // Create a symmetric graph: Start → Ax1 → E_B (cost 5), Start → Ax2 → E_A (cost 5)
  // E_A < E_B lex, so E_A should win.
  const Dtie = {
    building:"TieTest", nodes:[
      {id:"S",  label:"S",  type:"room",     x:0, y:0},
      {id:"Ax1",label:"Ax1",type:"junction", x:1, y:0},
      {id:"Ax2",label:"Ax2",type:"junction", x:2, y:0},
      {id:"E_A",label:"EA", type:"exit",     x:3, y:0},
      {id:"E_B",label:"EB", type:"exit",     x:4, y:0},
    ],
    edges:[
      {id:"a",from:"S",  to:"Ax1",cost:2},
      {id:"b",from:"Ax1",to:"E_B",cost:3},
      {id:"c",from:"S",  to:"Ax2",cost:2},
      {id:"d",from:"Ax2",to:"E_A",cost:3},
    ],
    initial_state:{blocked_nodes:[],blocked_edges:[],closed_exits:[]}
  };
  const r = computeRoute(Dtie, "S", new Set(), new Set(), new Set());
  check("tie: exits equal cost → lex E_A wins", r.exit, "E_A");
  check("tie: cost=5", r.cost, 5);
}

section("Disconnected graph — no route to exits");
{
  const Ddisc = {
    building:"Disc", nodes:[
      {id:"R1",label:"R",type:"room",x:0,y:0},
      {id:"E1",label:"E",type:"exit",x:100,y:0},
    ],
    edges:[],  // NO edges — fully disconnected
    initial_state:{blocked_nodes:[],blocked_edges:[],closed_exits:[]}
  };
  // validate should error on bad_edges (< 1 edge)
  const errs = validate(Ddisc);
  check("disconnected: validation catches 0 edges", errs.map(e=>e[0]).includes("bad_edges"), true);
}

section("Disconnected graph variant — valid JSON, no path");
{
  // Two separate components; start is in one, exits in another
  const Ddisc2 = {
    building:"Disc2", nodes:[
      {id:"R1",label:"R1",type:"room",    x:0,  y:0},
      {id:"R2",label:"R2",type:"room",    x:50, y:0},
      {id:"E1",label:"E1",type:"exit",    x:200,y:0},
      {id:"E2",label:"E2",type:"exit",    x:250,y:0},
    ],
    edges:[
      {id:"a",from:"R1",to:"R2",cost:5},
      {id:"b",from:"E1",to:"E2",cost:5},
    ],
    initial_state:{blocked_nodes:[],blocked_edges:[],closed_exits:[]}
  };
  const errs = validate(Ddisc2);
  check("disconnected2: validation passes", errs.length, 0);
  const r = computeRoute(Ddisc2, "R1", new Set(), new Set(), new Set());
  check("disconnected2: no route", r.status, "noRoute");
}

section("Validation: invalid JSON structure (array at root)");
{
  const errs = validate([1,2,3]);
  check("array at root → bad_root", errs[0][0], "bad_root");
}

section("Validation: duplicate node IDs");
{
  const Ddup = JSON.parse(JSON.stringify(D));
  Ddup.nodes[1] = { ...Ddup.nodes[0] }; // make R2 duplicate of R1
  const errs = validate(Ddup);
  check("dup node id → dup_node error", errs.some(e=>e[0]==="dup_node"), true);
}

section("Validation: self-loop edge");
{
  const Dloop = JSON.parse(JSON.stringify(D));
  Dloop.edges.push({id:"eLoop",from:"C1",to:"C1",cost:1});
  const errs = validate(Dloop);
  check("self-loop → loop error", errs.some(e=>e[0]==="loop"), true);
}

section("Validation: non-integer cost");
{
  const Dfloat = JSON.parse(JSON.stringify(D));
  Dfloat.edges[0].cost = 2.5;
  const errs = validate(Dfloat);
  check("float cost → bad_edge error", errs.some(e=>e[0]==="bad_edge"), true);
}

section("Validation: wrong initial_state category (exit in blocked_nodes)");
{
  const Dbad = JSON.parse(JSON.stringify(D));
  Dbad.initial_state.blocked_nodes = ["E1"]; // E1 is an exit, not room/junction
  const errs = validate(Dbad);
  check("exit in blocked_nodes → st_bn error", errs.some(e=>e[0]==="st_bn"), true);
}

section("Validation: room in closed_exits");
{
  const Dbad2 = JSON.parse(JSON.stringify(D));
  Dbad2.initial_state.closed_exits = ["R1"]; // R1 is a room, not an exit
  const errs = validate(Dbad2);
  check("room in closed_exits → st_ce error", errs.some(e=>e[0]==="st_ce"), true);
}

section("Validation: nonexistent edge in blocked_edges");
{
  const Dbad3 = JSON.parse(JSON.stringify(D));
  Dbad3.initial_state.blocked_edges = ["eNONEXIST"];
  const errs = validate(Dbad3);
  check("nonexistent edge in blocked_edges → st_be error", errs.some(e=>e[0]==="st_be"), true);
}

/* ── Summary ─────────────────────────────────────────────────────────────── */
console.log(`\n${"═".repeat(50)}`);
console.log(`Tests: ${pass + fail}   ✅ Passed: ${pass}   ❌ Failed: ${fail}`);
if (fail === 0) console.log("All tests PASSED ✨");
else process.exit(1);
