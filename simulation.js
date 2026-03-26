// ============================================================
// Smart Traffic Junction Simulation
// Dynamic signal timing — Rule-based OR Q-Learning ML agent
// ============================================================

const canvas = document.getElementById('simulation');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Road geometry
const ROAD_W = 120;
const LANE_W = ROAD_W / 2;
const CENTER = W / 2;
const ZEBRA_W = 24;

const JCT_LEFT   = CENTER - ROAD_W / 2;
const JCT_RIGHT  = CENTER + ROAD_W / 2;
const JCT_TOP    = CENTER - ROAD_W / 2;
const JCT_BOTTOM = CENTER + ROAD_W / 2;

// ---- Data structures ----
const directions = ['north', 'south', 'east', 'west'];

const vehicleQueues     = { north: [], south: [], east: [], west: [] };
const pedestrianQueues  = { north: [], south: [], east: [], west: [] };

let movingVehicles    = [];
let movingPedestrians = [];

// ---- Traffic light state ----
const YELLOW_DURATION = 2000;
const MIN_GREEN = 3000;
const MAX_GREEN = 15000;
const BASE_GREEN = 5000;
const TIME_PER_UNIT = 500;

let currentPhase   = 0;
let phaseStartTime = 0;
let phaseDuration  = BASE_GREEN;
let inYellow       = false;
let yellowStart    = 0;

// Track entities cleared during a phase (for ML reward)
let entitiesClearedThisPhase = 0;

// ---- ML Agent ----
const mlAgent = new QLearningAgent();
let useML = false;           // toggle between rule-based and ML
let mlTrainingSpeed = 1;     // 1x, 2x, 5x speed multiplier for fast training

// Performance comparison
const perfStats = {
  ruleBasedCleared: 0,
  mlCleared: 0,
  ruleBasedTotalWait: 0,
  mlTotalWait: 0,
  ruleBasedSamples: 0,
  mlSamples: 0,
};

// ---- Light colour helpers ----
function getVehicleLight(dir) {
  if (inYellow) {
    if (currentPhase === 0 && (dir === 'north' || dir === 'south')) return 'yellow';
    if (currentPhase === 1 && (dir === 'east'  || dir === 'west'))  return 'yellow';
    return 'red';
  }
  if (currentPhase === 0 && (dir === 'north' || dir === 'south')) return 'green';
  if (currentPhase === 1 && (dir === 'east'  || dir === 'west'))  return 'green';
  return 'red';
}

function getPedestrianLight() {
  if (inYellow) return 'red';
  return currentPhase === 2 ? 'green' : 'red';
}

// ---- Phase decision (rule-based) ----
function decideNextPhaseRuleBased() {
  const nsV = vehicleQueues.north.length + vehicleQueues.south.length;
  const ewV = vehicleQueues.east.length  + vehicleQueues.west.length;
  const totalP = directions.reduce((s, d) => s + pedestrianQueues[d].length, 0);

  const scores = [
    { phase: 0, score: nsV },
    { phase: 1, score: ewV },
    { phase: 2, score: totalP },
  ];

  let candidates = scores.filter(s => s.phase !== currentPhase && s.score > 0);
  if (candidates.length === 0) candidates = scores.filter(s => s.score > 0);
  if (candidates.length === 0) return { phase: (currentPhase + 1) % 3, duration: MIN_GREEN };

  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates[0];
  const duration = Math.min(MAX_GREEN, Math.max(MIN_GREEN, BASE_GREEN + chosen.score * TIME_PER_UNIT));
  return { phase: chosen.phase, duration };
}

// ---- Phase decision (ML) ----
function decideNextPhaseML() {
  return mlAgent.decide(vehicleQueues, pedestrianQueues, currentPhase, entitiesClearedThisPhase);
}

// ---- Decide wrapper ----
function decideNextPhase() {
  return useML ? decideNextPhaseML() : decideNextPhaseRuleBased();
}

// ---- Release entities ----
function releaseForPhase(phase) {
  entitiesClearedThisPhase = 0;
  if (phase === 0) {
    releaseVehicles('north');
    releaseVehicles('south');
  } else if (phase === 1) {
    releaseVehicles('east');
    releaseVehicles('west');
  } else {
    directions.forEach(d => releasePedestrians(d));
  }
}

function releaseVehicles(dir) {
  const q = vehicleQueues[dir];
  entitiesClearedThisPhase += q.length;
  q.forEach(v => { v.moving = true; movingVehicles.push(v); });
  vehicleQueues[dir] = [];
}

function releasePedestrians(dir) {
  const q = pedestrianQueues[dir];
  entitiesClearedThisPhase += q.length;
  q.forEach(p => { p.moving = true; movingPedestrians.push(p); });
  pedestrianQueues[dir] = [];
}

// ---- Factories ----
const VEHICLE_COLORS = ['#e74c3c','#3498db','#f1c40f','#e67e22','#9b59b6','#1abc9c','#ecf0f1'];

function createVehicle(dir) {
  const color = VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)];
  const vw = 20 + Math.random() * 10;
  const vh = 30 + Math.random() * 10;
  const qi = vehicleQueues[dir].length;
  let x, y;
  if (dir === 'north')      { x = CENTER + LANE_W / 2;  y = JCT_TOP - 20 - qi * 40; }
  else if (dir === 'south') { x = CENTER - LANE_W / 2;  y = JCT_BOTTOM + 20 + qi * 40; }
  else if (dir === 'east')  { x = JCT_RIGHT + 20 + qi * 40; y = CENTER + LANE_W / 2; }
  else                      { x = JCT_LEFT - 20 - qi * 40;  y = CENTER - LANE_W / 2; }
  return { dir, x, y, w: vw, h: vh, color, moving: false, speed: 2 + Math.random() };
}

function createPedestrian(dir) {
  const qi = pedestrianQueues[dir].length;
  let x, y;
  if (dir === 'north')      { x = JCT_LEFT - 10 - (qi % 3) * 14;  y = JCT_TOP - ZEBRA_W / 2 + Math.floor(qi / 3) * 14; }
  else if (dir === 'south') { x = JCT_RIGHT + 10 + (qi % 3) * 14; y = JCT_BOTTOM + ZEBRA_W / 2 - Math.floor(qi / 3) * 14; }
  else if (dir === 'east')  { x = JCT_RIGHT + ZEBRA_W / 2 - Math.floor(qi / 3) * 14; y = JCT_TOP - 10 - (qi % 3) * 14; }
  else                      { x = JCT_LEFT - ZEBRA_W / 2 + Math.floor(qi / 3) * 14;  y = JCT_BOTTOM + 10 + (qi % 3) * 14; }

  let tx, ty;
  if (dir === 'north')      { tx = JCT_RIGHT + 20; ty = y; }
  else if (dir === 'south') { tx = JCT_LEFT - 20;  ty = y; }
  else if (dir === 'east')  { tx = x; ty = JCT_BOTTOM + 20; }
  else                      { tx = x; ty = JCT_TOP - 20; }

  return { dir, x, y, tx, ty, moving: false, speed: 1 + Math.random() * 0.5, radius: 5 };
}

// ---- Simulation controller ----
const sim = {
  autoSpawnEnabled: false,
  lastSpawn: 0,

  addVehicle(dir) {
    if (vehicleQueues[dir].length >= 10) return;
    vehicleQueues[dir].push(createVehicle(dir));
  },

  addPedestrian(dir) {
    if (pedestrianQueues[dir].length >= 12) return;
    pedestrianQueues[dir].push(createPedestrian(dir));
  },

  toggleAutoSpawn() {
    this.autoSpawnEnabled = document.getElementById('autoSpawn').checked;
  },

  toggleML() {
    useML = document.getElementById('mlToggle').checked;
  },

  setTrainingSpeed(val) {
    mlTrainingSpeed = parseInt(val);
    document.getElementById('speedLabel').textContent = mlTrainingSpeed + 'x';
  },

  fastTrain() {
    // Run headless training for N episodes
    const episodes = 500;
    const stepsPerEpisode = 200;
    const savedEpsilon = mlAgent.epsilon;

    for (let ep = 0; ep < episodes; ep++) {
      // Create virtual queues
      const vQ = { north: [], south: [], east: [], west: [] };
      const pQ = { north: [], south: [], east: [], west: [] };
      let phase = 0;
      let cleared = 0;

      for (let step = 0; step < stepsPerEpisode; step++) {
        // Random spawns
        directions.forEach(d => {
          if (Math.random() < 0.3) vQ[d].push(1);
          if (Math.random() < 0.15) pQ[d].push(1);
          // Cap queues
          if (vQ[d].length > 10) vQ[d].length = 10;
          if (pQ[d].length > 12) pQ[d].length = 12;
        });

        // Agent decides
        const decision = mlAgent.decide(vQ, pQ, phase, cleared);
        phase = decision.phase;

        // Simulate clearing
        cleared = 0;
        if (phase === 0) {
          cleared = vQ.north.length + vQ.south.length;
          vQ.north = []; vQ.south = [];
        } else if (phase === 1) {
          cleared = vQ.east.length + vQ.west.length;
          vQ.east = []; vQ.west = [];
        } else {
          cleared = directions.reduce((s, d) => s + pQ[d].length, 0);
          directions.forEach(d => pQ[d] = []);
        }
      }
    }

    // After fast training, lower epsilon significantly
    mlAgent.epsilon = Math.max(mlAgent.epsilonMin, mlAgent.epsilon);
    alert(`Fast training complete!\n${episodes} episodes x ${stepsPerEpisode} steps\nQ-table size: ${Object.keys(mlAgent.qTable).length} entries\nExploration rate: ${(mlAgent.epsilon * 100).toFixed(1)}%`);
  },

  exportModel() {
    const json = mlAgent.exportModel();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traffic-ml-model.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importModel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        mlAgent.importModel(ev.target.result);
        alert('Model loaded! Q-table entries: ' + Object.keys(mlAgent.qTable).length);
      };
      reader.readAsText(file);
    };
    input.click();
  },

  resetML() {
    Object.assign(mlAgent, new QLearningAgent());
    alert('ML agent reset to untrained state.');
  },

  autoSpawn(now) {
    if (!this.autoSpawnEnabled) return;
    if (now - this.lastSpawn < 800 / mlTrainingSpeed) return;
    this.lastSpawn = now;
    if (Math.random() < 0.6) {
      const dir = directions[Math.floor(Math.random() * 4)];
      this.addVehicle(dir);
    }
    if (Math.random() < 0.4) {
      const dir = directions[Math.floor(Math.random() * 4)];
      this.addPedestrian(dir);
    }
  }
};

// ---- Update ----
function update(now) {
  const speedFactor = useML ? mlTrainingSpeed : 1;
  const effectiveYellowDuration = YELLOW_DURATION / speedFactor;

  if (inYellow) {
    if (now - yellowStart >= effectiveYellowDuration) {
      const next = decideNextPhase();
      currentPhase = next.phase;
      phaseDuration = next.duration / speedFactor;
      phaseStartTime = now;
      inYellow = false;
      releaseForPhase(currentPhase);
    }
  } else {
    if (now - phaseStartTime >= phaseDuration) {
      // Track performance before clearing
      const totalWaiting = directions.reduce((s, d) =>
        s + vehicleQueues[d].length + pedestrianQueues[d].length, 0);
      if (useML) {
        perfStats.mlTotalWait += totalWaiting;
        perfStats.mlSamples++;
        perfStats.mlCleared += entitiesClearedThisPhase;
      } else {
        perfStats.ruleBasedTotalWait += totalWaiting;
        perfStats.ruleBasedSamples++;
        perfStats.ruleBasedCleared += entitiesClearedThisPhase;
      }

      inYellow = true;
      yellowStart = now;
    }
  }

  // Feed waiting data to ML agent each frame
  if (useML) mlAgent.recordWaiting(vehicleQueues, pedestrianQueues);

  // Move vehicles
  const vSpeed = speedFactor;
  movingVehicles.forEach(v => {
    if (v.dir === 'north')      v.y += v.speed * vSpeed;
    else if (v.dir === 'south') v.y -= v.speed * vSpeed;
    else if (v.dir === 'east')  v.x -= v.speed * vSpeed;
    else                        v.x += v.speed * vSpeed;
  });
  movingVehicles = movingVehicles.filter(v =>
    v.x > -50 && v.x < W + 50 && v.y > -50 && v.y < H + 50
  );

  // Move pedestrians
  movingPedestrians.forEach(p => {
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 2) {
      p.x += (dx / dist) * p.speed * vSpeed;
      p.y += (dy / dist) * p.speed * vSpeed;
    } else {
      p.done = true;
    }
  });
  movingPedestrians = movingPedestrians.filter(p => !p.done);

  sim.autoSpawn(now);
}

// ---- Drawing ----
function draw() {
  ctx.clearRect(0, 0, W, H);

  // Grass
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, W, H);

  // Roads
  ctx.fillStyle = '#444';
  ctx.fillRect(JCT_LEFT, 0, ROAD_W, H);
  ctx.fillRect(0, JCT_TOP, W, ROAD_W);

  // Lane markings
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(CENTER, 0); ctx.lineTo(CENTER, JCT_TOP);
  ctx.moveTo(CENTER, JCT_BOTTOM); ctx.lineTo(CENTER, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, CENTER); ctx.lineTo(JCT_LEFT, CENTER);
  ctx.moveTo(JCT_RIGHT, CENTER); ctx.lineTo(W, CENTER);
  ctx.stroke();
  ctx.setLineDash([]);

  // Junction
  ctx.fillStyle = '#555';
  ctx.fillRect(JCT_LEFT, JCT_TOP, ROAD_W, ROAD_W);

  // Zebra crossings
  directions.forEach(d => drawZebraCrossing(d));

  // Stop lines
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(CENTER, JCT_TOP - ZEBRA_W); ctx.lineTo(JCT_RIGHT, JCT_TOP - ZEBRA_W); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(JCT_LEFT, JCT_BOTTOM + ZEBRA_W); ctx.lineTo(CENTER, JCT_BOTTOM + ZEBRA_W); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(JCT_RIGHT + ZEBRA_W, CENTER); ctx.lineTo(JCT_RIGHT + ZEBRA_W, JCT_BOTTOM); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(JCT_LEFT - ZEBRA_W, JCT_TOP); ctx.lineTo(JCT_LEFT - ZEBRA_W, CENTER); ctx.stroke();

  // Traffic lights & pedestrian signals
  directions.forEach(d => { drawTrafficLight(d); drawPedestrianSignal(d); });

  // Entities
  directions.forEach(dir => {
    vehicleQueues[dir].forEach(v => drawVehicle(v));
    pedestrianQueues[dir].forEach(p => drawPedestrian(p));
  });
  movingVehicles.forEach(v => drawVehicle(v));
  movingPedestrians.forEach(p => drawPedestrian(p));

  // ML mode indicator on canvas
  if (useML) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, 10, 160, 28);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ML AGENT ACTIVE', 18, 30);
  }

  updateStats();
}

function drawZebraCrossing(dir) {
  ctx.fillStyle = '#fff';
  const n = 6;
  if (dir === 'north') {
    for (let i = 0; i < n; i++) ctx.fillRect(JCT_LEFT + (ROAD_W / n) * i + 4, JCT_TOP - ZEBRA_W, ROAD_W / n - 8, ZEBRA_W);
  } else if (dir === 'south') {
    for (let i = 0; i < n; i++) ctx.fillRect(JCT_LEFT + (ROAD_W / n) * i + 4, JCT_BOTTOM, ROAD_W / n - 8, ZEBRA_W);
  } else if (dir === 'east') {
    for (let i = 0; i < n; i++) ctx.fillRect(JCT_RIGHT, JCT_TOP + (ROAD_W / n) * i + 4, ZEBRA_W, ROAD_W / n - 8);
  } else {
    for (let i = 0; i < n; i++) ctx.fillRect(JCT_LEFT - ZEBRA_W, JCT_TOP + (ROAD_W / n) * i + 4, ZEBRA_W, ROAD_W / n - 8);
  }
}

function drawTrafficLight(dir) {
  const lc = getVehicleLight(dir);
  let x, y;
  if (dir === 'north')      { x = JCT_RIGHT + 8; y = JCT_TOP - ZEBRA_W - 50; }
  else if (dir === 'south') { x = JCT_LEFT - 30;  y = JCT_BOTTOM + ZEBRA_W + 8; }
  else if (dir === 'east')  { x = JCT_RIGHT + ZEBRA_W + 8; y = JCT_BOTTOM + 8; }
  else                      { x = JCT_LEFT - ZEBRA_W - 50; y = JCT_TOP - 30; }

  ctx.fillStyle = '#222'; ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, 22, 52, 4); ctx.fill(); ctx.stroke();

  ctx.beginPath(); ctx.arc(x+11, y+11, 7, 0, Math.PI*2);
  ctx.fillStyle = lc === 'red' ? '#e74c3c' : '#4a1a1a'; ctx.fill();
  ctx.beginPath(); ctx.arc(x+11, y+26, 7, 0, Math.PI*2);
  ctx.fillStyle = lc === 'yellow' ? '#f39c12' : '#4a3a0a'; ctx.fill();
  ctx.beginPath(); ctx.arc(x+11, y+41, 7, 0, Math.PI*2);
  ctx.fillStyle = lc === 'green' ? '#2ecc71' : '#0a3a1a'; ctx.fill();
}

function drawPedestrianSignal(dir) {
  const lc = getPedestrianLight();
  let x, y;
  if (dir === 'north')      { x = JCT_LEFT - 28;  y = JCT_TOP - ZEBRA_W - 10; }
  else if (dir === 'south') { x = JCT_RIGHT + 6;   y = JCT_BOTTOM + ZEBRA_W - 20; }
  else if (dir === 'east')  { x = JCT_RIGHT + ZEBRA_W - 20; y = JCT_TOP - 28; }
  else                      { x = JCT_LEFT - ZEBRA_W - 10;  y = JCT_BOTTOM + 6; }

  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.roundRect(x, y, 22, 30, 4); ctx.fill();
  ctx.beginPath(); ctx.arc(x+11, y+9, 6, 0, Math.PI*2);
  ctx.fillStyle = lc === 'red' ? '#e74c3c' : '#4a1a1a'; ctx.fill();
  ctx.beginPath(); ctx.arc(x+11, y+22, 6, 0, Math.PI*2);
  ctx.fillStyle = lc === 'green' ? '#2ecc71' : '#0a3a1a'; ctx.fill();
}

function drawVehicle(v) {
  ctx.save();
  ctx.translate(v.x, v.y);
  let a = 0;
  if (v.dir === 'south') a = Math.PI;
  else if (v.dir === 'east') a = -Math.PI / 2;
  else if (v.dir === 'west') a = Math.PI / 2;
  ctx.rotate(a);
  ctx.fillStyle = v.color;
  ctx.beginPath(); ctx.roundRect(-v.w/2, -v.h/2, v.w, v.h, 4); ctx.fill();
  ctx.fillStyle = 'rgba(150,200,255,0.5)';
  ctx.fillRect(-v.w/2+3, -v.h/2+3, v.w-6, v.h*0.3);
  ctx.restore();
}

function drawPedestrian(p) {
  ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
  ctx.fillStyle = '#ff9ff3'; ctx.fill();
  ctx.strokeStyle = '#c44dff'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(p.x, p.y - p.radius - 2, 3, 0, Math.PI*2);
  ctx.fillStyle = '#ffeaa7'; ctx.fill();
}

// ---- Stats UI ----
function updateStats() {
  const statsEl = document.getElementById('statsContent');
  const phaseEl = document.getElementById('phaseInfo');
  const mlEl    = document.getElementById('mlStats');

  const nsV = vehicleQueues.north.length + vehicleQueues.south.length;
  const ewV = vehicleQueues.east.length  + vehicleQueues.west.length;
  const totalP = directions.reduce((s, d) => s + pedestrianQueues[d].length, 0);

  statsEl.innerHTML = `
    <div><strong>N vehicles:</strong> ${vehicleQueues.north.length} | <strong>S:</strong> ${vehicleQueues.south.length}</div>
    <div><strong>E vehicles:</strong> ${vehicleQueues.east.length} | <strong>W:</strong> ${vehicleQueues.west.length}</div>
    <div><strong>Pedestrians:</strong> N:${pedestrianQueues.north.length} S:${pedestrianQueues.south.length} E:${pedestrianQueues.east.length} W:${pedestrianQueues.west.length}</div>
    <hr style="border-color:#333;margin:6px 0">
    <div><strong>N-S:</strong> ${nsV} | <strong>E-W:</strong> ${ewV} | <strong>Peds:</strong> ${totalP}</div>
  `;

  const elapsed = performance.now() - (inYellow ? yellowStart : phaseStartTime);
  const remaining = inYellow
    ? Math.max(0, (YELLOW_DURATION / (useML ? mlTrainingSpeed : 1) - elapsed) / 1000).toFixed(1)
    : Math.max(0, (phaseDuration - elapsed) / 1000).toFixed(1);

  const phaseNames = ['N-S Vehicles Green', 'E-W Vehicles Green', 'All Pedestrians Walk'];
  phaseEl.innerHTML = `
    <div class="${inYellow ? 'yellow' : 'green'}">${inYellow ? 'YELLOW' : phaseNames[currentPhase]}</div>
    <div>Duration: ${(phaseDuration / 1000).toFixed(1)}s | Left: ${remaining}s</div>
    <div style="color:#aaa;font-size:0.8rem;margin-top:4px">
      Mode: <strong style="color:${useML ? '#00ff88' : '#00d4ff'}">${useML ? 'ML Q-Learning' : 'Rule-Based'}</strong>
    </div>
  `;

  // ML stats
  if (mlEl) {
    const s = mlAgent.getStats();
    const rbAvgWait = perfStats.ruleBasedSamples > 0
      ? (perfStats.ruleBasedTotalWait / perfStats.ruleBasedSamples).toFixed(1) : '—';
    const mlAvgWait = perfStats.mlSamples > 0
      ? (perfStats.mlTotalWait / perfStats.mlSamples).toFixed(1) : '—';

    mlEl.innerHTML = `
      <div><strong>Decisions:</strong> ${s.decisions}</div>
      <div><strong>Exploration:</strong> ${(s.epsilon * 100).toFixed(1)}%</div>
      <div><strong>Explore/Exploit:</strong> ${s.explorationRate}% / ${s.exploitationRate}%</div>
      <div><strong>Q-table size:</strong> ${s.qTableSize} entries</div>
      <div><strong>Avg reward:</strong> ${s.avgReward.toFixed(2)}</div>
      <div><strong>Best avg:</strong> ${s.bestAvgReward.toFixed(2)}</div>
      <hr style="border-color:#333;margin:6px 0">
      <div style="color:#00d4ff"><strong>Performance Comparison</strong></div>
      <div>Rule-based avg wait: <strong>${rbAvgWait}</strong></div>
      <div>ML agent avg wait: <strong>${mlAvgWait}</strong></div>
      <div>Rule-based cleared: <strong>${perfStats.ruleBasedCleared}</strong></div>
      <div>ML cleared: <strong>${perfStats.mlCleared}</strong></div>
    `;
  }
}

// Reward chart
const rewardCanvas = document.getElementById('rewardChart');
const rctx = rewardCanvas ? rewardCanvas.getContext('2d') : null;

function drawRewardChart() {
  if (!rctx) return;
  const cw = rewardCanvas.width, ch = rewardCanvas.height;
  rctx.fillStyle = '#111';
  rctx.fillRect(0, 0, cw, ch);

  const history = mlAgent.rewardHistory;
  if (history.length < 2) return;

  const maxR = Math.max(...history, 1);
  const minR = Math.min(...history, -1);
  const range = maxR - minR || 1;

  // Zero line
  const zeroY = ch - ((0 - minR) / range) * ch;
  rctx.strokeStyle = '#444';
  rctx.lineWidth = 1;
  rctx.beginPath();
  rctx.moveTo(0, zeroY);
  rctx.lineTo(cw, zeroY);
  rctx.stroke();

  // Reward line
  rctx.strokeStyle = '#00ff88';
  rctx.lineWidth = 1.5;
  rctx.beginPath();
  for (let i = 0; i < history.length; i++) {
    const x = (i / (history.length - 1)) * cw;
    const y = ch - ((history[i] - minR) / range) * ch;
    if (i === 0) rctx.moveTo(x, y);
    else rctx.lineTo(x, y);
  }
  rctx.stroke();

  // Labels
  rctx.fillStyle = '#888';
  rctx.font = '10px monospace';
  rctx.textAlign = 'left';
  rctx.fillText(`max: ${maxR.toFixed(1)}`, 4, 12);
  rctx.fillText(`min: ${minR.toFixed(1)}`, 4, ch - 4);
}

// ---- Main loop ----
phaseStartTime = performance.now();

function loop() {
  const now = performance.now();
  update(now);
  draw();
  drawRewardChart();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
