// APEX-EDGE Google AI Edge Manufacturing Gateway Controller Code

// 1. STATE MANAGEMENT
const state = {
  activeTab: 'dashboard',
  systemTime: '',
  isEmergencyHalted: false,
  globalOEE: 89.2,
  throughput: 14230,
  defectRate: 1.24,
  fps: 29.8,
  selectedTelemetryNode: 'node101',
  selectedVisionNode: 'node101',
  confidenceCutoff: 0.85,
  conveyorSpeed: 1.2,
  renderBBoxes: true,
  renderScanline: true,
  filterDefectsOnly: false,
  alertCount: 0,
  
  // Google AI Edge Node portfolio
  nodes: {
    node101: {
      id: 'node101',
      name: 'Edge Node 101 - PaliGemma VLM Inspector',
      ip: '192.168.1.101',
      status: 'online',
      model: 'PaliGemma-3B-Defect v1.0.4',
      hw: 'Google Coral Dev Board + Edge TPU (15W)',
      uptime: '12d 04h',
      temp: 48,
      cpu: 35,
      mem: '3.4 GB / 8.0 GB',
      vibration: 2.1,
      networkLatency: 4,
      history: { cpu: [], temp: [], vibration: [] }
    },
    node102: {
      id: 'node102',
      name: 'Edge Node 102 - MediaPipe Coral Detector',
      ip: '192.168.1.102',
      status: 'online',
      model: 'MobileNetV2-SSD-MediaPipe v2.1.0',
      hw: 'Raspberry Pi 5 + Google Coral USB (10W)',
      uptime: '84d 18h',
      temp: 42,
      cpu: 22,
      mem: '5.1 GB / 16.0 GB',
      vibration: 3.5,
      networkLatency: 3,
      history: { cpu: [], temp: [], vibration: [] }
    },
    node103: {
      id: 'node103',
      name: 'Edge Node 103 - Gemma-2B Local Assistant',
      ip: '192.168.1.103',
      status: 'warning',
      model: 'Gemma-2B-Instruct-INT4 v1.2.0',
      hw: 'ASUS Tinker Board + Edge TPU (12W)',
      uptime: '04d 01h',
      temp: 59,
      cpu: 88,
      mem: '6.2 GB / 8.0 GB',
      vibration: 1.2,
      networkLatency: 12,
      history: { cpu: [], temp: [], vibration: [] }
    }
  },
  
  // Vertex AI Model Registry metadata
  otaMetadata: {
    'paligemma-3b-pt-f16': {
      name: 'paligemma-3b-defect-v220.tflite',
      size: '5.8 GB',
      precision: 'FP16 (Quantized for Edge TPU DLA)',
      downtime: '< 3.0 seconds',
      targetNode: 'node101',
      newVersionString: 'PaliGemma-3B-Defect v2.2.0'
    },
    'bearing-mediapipe-tflite': {
      name: 'vibration-mediapipe-v1.4.1.tflite',
      size: '4.2 MB',
      precision: 'INT8 (Fully Quantized TFLite)',
      downtime: '< 1.0 second',
      targetNode: 'node102',
      newVersionString: 'MobileNetV2-SSD-MediaPipe v2.2.0'
    },
    'gemma-2b-it-int4': {
      name: 'gemma-2b-it-cpu-int4.bin',
      size: '1.4 GB',
      precision: 'INT4 (Quantized via MediaPipe LLM)',
      downtime: '< 2.0 seconds',
      targetNode: 'node103',
      newVersionString: 'Gemma-2B-Instruct-INT4 v1.3.0'
    },
    'coral-firmware-patch': {
      name: 'coral-tpu-platform-v3.1.2.bin',
      size: '250 KB',
      precision: 'N/A (Firmware Patch)',
      downtime: '~ 15 seconds',
      targetNode: 'all',
      newVersionString: 'Coral Firmware Upgraded'
    }
  }
};

// Fill node history buffers with initial dummy data
for (let id in state.nodes) {
  const node = state.nodes[id];
  for (let i = 0; i < 40; i++) {
    node.history.cpu.push(node.cpu + (Math.random() * 6 - 3));
    node.history.temp.push(node.temp + (Math.random() * 4 - 2));
    node.history.vibration.push(node.vibration + (Math.random() * 0.4 - 0.2));
  }
}

// 2. DOM ELEMENTS INTERFACE
const elements = {
  systemTime: document.getElementById('system-time'),
  tabs: document.querySelectorAll('.nav-item'),
  tabContents: document.querySelectorAll('.tab-content'),
  emergencyHaltBtn: document.getElementById('emergency-halt-btn'),
  
  // Dashboard elements
  metricThroughput: document.getElementById('metric-throughput'),
  metricDefectRate: document.getElementById('metric-defect-rate'),
  metricFPS: document.getElementById('metric-inference-fps'),
  metricActiveNodes: document.getElementById('metric-active-nodes'),
  globalOEE: document.getElementById('global-oee'),
  globalOEEBar: document.querySelector('.gauge-bar-inner'),
  telemetryNodeSelector: document.getElementById('telemetry-node-selector'),
  telemetryCanvas: document.getElementById('telemetry-canvas'),
  alertsLogContainer: document.getElementById('alerts-log-container'),
  alertCountBadge: document.getElementById('alert-count'),

  // Vision Tab elements
  visionCanvas: document.getElementById('vision-canvas'),
  selectedVisionPipeline: document.getElementById('selected-vision-pipeline'),
  inferenceLatency: document.getElementById('inference-latency'),
  conveyorSpeedVal: document.getElementById('conveyor-speed-val'),
  avgConfidence: document.getElementById('avg-confidence'),
  visionNodeSelect: document.getElementById('vision-node-select'),
  confidenceThreshold: document.getElementById('confidence-threshold'),
  confidenceThresholdVal: document.getElementById('confidence-threshold-val'),
  conveyorSpeed: document.getElementById('conveyor-speed'),
  toggleBBoxes: document.getElementById('toggle-bboxes'),
  toggleScanlines: document.getElementById('toggle-scanlines'),
  toggleDefectsOnly: document.getElementById('toggle-defects-only'),
  triggerSimulatedDefect: document.getElementById('trigger-simulated-defect'),
  paligemmaDescription: document.getElementById('paligemma-description'),

  // Gemma Chat elements
  gemmaChatHistory: document.getElementById('gemma-chat-history'),
  gemmaChatForm: document.getElementById('gemma-chat-form'),
  gemmaChatInput: document.getElementById('gemma-chat-input'),
  gemmaSendBtn: document.getElementById('gemma-send-btn'),
  clearChatBtn: document.getElementById('clear-chat-btn'),
  quickPromptBtns: document.querySelectorAll('.quick-prompt-btn'),

  // Nodes Tab elements
  nodesGridContainer: document.getElementById('nodes-grid-container'),
  refreshNodesBtn: document.getElementById('refresh-nodes-btn'),
  nodeDetailsDrawer: document.getElementById('node-details-drawer'),
  closeDrawerBtn: document.getElementById('close-drawer-btn'),
  drawerNodeName: document.getElementById('drawer-node-name'),
  drawerModel: document.getElementById('drawer-model'),
  drawerHW: document.getElementById('drawer-hw'),
  drawerIP: document.getElementById('drawer-ip'),
  drawerUptime: document.getElementById('drawer-uptime'),
  drawerMem: document.getElementById('drawer-mem'),

  // OTA Tab elements
  otaModelSelect: document.getElementById('ota-model-select'),
  otaMetaName: document.getElementById('ota-meta-name'),
  otaMetaSize: document.getElementById('ota-meta-size'),
  otaMetaPrecision: document.getElementById('ota-meta-precision'),
  otaMetaDowntime: document.getElementById('ota-meta-downtime'),
  startOtaBtn: document.getElementById('start-ota-btn'),
  otaTerminalScreen: document.getElementById('ota-terminal-screen'),
  clearTerminalBtn: document.getElementById('clear-terminal-btn'),
  otaOverallStatus: document.getElementById('ota-overall-status'),
  otaProgressBarContainer: document.getElementById('ota-progress-bar-container'),
  otaProgressBarFill: document.getElementById('ota-progress-bar-fill')
};

// 3. EVENT HANDLERS & NAVIGATION
function initApp() {
  // Setup tabs navigation
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elements.tabs.forEach(t => t.classList.remove('active'));
      elements.tabContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      state.activeTab = tabId;
      
      // Force trigger resize/draw handles for canvas when active
      if (tabId === 'dashboard') {
        drawTelemetryChart();
      }
    });
  });

  // Emergency halt toggle
  elements.emergencyHaltBtn.addEventListener('click', toggleEmergencyHalt);

  // Selector changes
  elements.telemetryNodeSelector.addEventListener('change', (e) => {
    state.selectedTelemetryNode = e.target.value;
    drawTelemetryChart();
  });

  elements.visionNodeSelect.addEventListener('change', (e) => {
    state.selectedVisionNode = e.target.value;
    updateVisionPipelineLabel();
  });

  // Vision filters & controllers
  elements.confidenceThreshold.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.confidenceCutoff = val / 100;
    elements.confidenceThresholdVal.innerText = `${val}%`;
  });

  elements.conveyorSpeed.addEventListener('input', (e) => {
    state.conveyorSpeed = parseFloat(e.target.value);
    elements.conveyorSpeedVal.innerText = `${state.conveyorSpeed.toFixed(1)} m/s`;
  });

  elements.toggleBBoxes.addEventListener('change', (e) => {
    state.renderBBoxes = e.target.checked;
  });

  elements.toggleScanlines.addEventListener('change', (e) => {
    state.renderScanline = e.target.checked;
  });

  elements.toggleDefectsOnly.addEventListener('change', (e) => {
    state.filterDefectsOnly = e.target.checked;
  });

  elements.triggerSimulatedDefect.addEventListener('click', triggerAnomalyInjection);

  // Gemma Chat controllers
  elements.gemmaChatForm.addEventListener('submit', handleGemmaFormSubmit);
  elements.clearChatBtn.addEventListener('click', resetChatConversation);
  elements.quickPromptBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.innerText.replace(/"/g, '');
      elements.gemmaChatInput.value = prompt;
      handleGemmaChatQuery(prompt);
    });
  });

  // Node drawer closing
  elements.closeDrawerBtn.addEventListener('click', () => {
    elements.nodeDetailsDrawer.style.display = 'none';
  });

  // Node scan refresh trigger
  elements.refreshNodesBtn.addEventListener('click', performEdgeNetworkScan);

  // OTA Artifact metadata updater
  elements.otaModelSelect.addEventListener('change', (e) => {
    const selected = e.target.value;
    const meta = state.otaMetadata[selected];
    if (meta) {
      elements.otaMetaName.innerText = meta.name;
      elements.otaMetaSize.innerText = meta.size;
      elements.otaMetaPrecision.innerText = meta.precision;
      elements.otaMetaDowntime.innerText = meta.downtime;
    }
  });

  elements.startOtaBtn.addEventListener('click', runOTAPipeline);
  elements.clearTerminalBtn.addEventListener('click', () => {
    elements.otaTerminalScreen.innerHTML = '';
  });

  // Clock ticks
  setInterval(updateClock, 1000);
  updateClock();

  // Draw initial nodes
  renderNodeCards();

  // Trigger telemetry simulation thread
  setInterval(simulateTelemetryData, 1000);

  // Kick off visual frame simulation loop
  requestAnimationFrame(visionLoop);
  
  // Set initial alerts
  addAlert('info', 'node101', 'Google AI Edge Gateway initialization sequence finalized.');
  addAlert('info', 'node102', 'MediaPipe Object Detection task loaded on Coral TPU.');
  addAlert('warning', 'node103', 'Elevated board temperature (59°C) on ASUS Tinker CPU board during Gemma LLM inference.');
  
  // Prep chatbot greeting
  injectChatMessage('gemma', "Hello! I am your local Gemma-2B Copilot running entirely offline on the Edge Gateway DLA accelerator. Ask me anything about current telemetry warnings, weld defects, OEE calibration, or safety protocols.");
}

function updateClock() {
  const now = new Date();
  const utcString = now.toISOString().slice(11, 19);
  elements.systemTime.innerText = utcString;
  state.systemTime = utcString;
}

// 4. TELEMETRY ENGINE & CUSTOM CANVAS GRAPHING
function simulateTelemetryData() {
  if (state.isEmergencyHalted) return;

  // Slowly increment throughput and fluctuate KPIs
  state.throughput += Math.floor(Math.random() * 2) + (state.conveyorSpeed > 0 ? 1 : 0);
  elements.metricThroughput.innerText = state.throughput.toLocaleString();

  // Subtle drift in defect rate
  state.defectRate = Math.max(0.2, Math.min(5.0, state.defectRate + (Math.random() * 0.1 - 0.05)));
  elements.metricDefectRate.innerText = `${state.defectRate.toFixed(2)}%`;

  // Vary active nodes in metric card
  let activeCount = 0;
  for (let id in state.nodes) {
    if (state.nodes[id].status !== 'offline') activeCount++;
  }
  elements.metricActiveNodes.innerText = `${activeCount} / 3`;

  // Fluctuate OEE slightly based on current speed and defect rate
  let targetOEE = 92.5 - (state.defectRate * 2.0) - (Math.abs(1.5 - state.conveyorSpeed) * 3);
  state.globalOEE = Math.max(10.0, Math.min(99.0, state.globalOEE * 0.95 + targetOEE * 0.05));
  elements.globalOEE.innerText = `${state.globalOEE.toFixed(1)}%`;
  elements.globalOEEBar.style.width = `${state.globalOEE}%`;

  // Vary node values and append to history
  for (let id in state.nodes) {
    const node = state.nodes[id];
    if (node.status === 'offline') {
      node.cpu = 0;
      node.vibration = 0;
      node.networkLatency = 0;
    } else {
      let tempDelta = (Math.random() * 2 - 1);
      let cpuDelta = (Math.random() * 10 - 5);
      
      // Node 103 thermal load simulation when Gemma active
      if (id === 'node103' && node.status === 'warning') {
        node.temp = Math.max(50, Math.min(80, node.temp + (Math.random() * 1.5 - 0.5)));
        node.cpu = Math.max(70, Math.min(99, node.cpu + cpuDelta));
      } else {
        node.temp = Math.max(30, Math.min(75, node.temp + tempDelta));
        node.cpu = Math.max(10, Math.min(95, node.cpu + cpuDelta));
      }
      
      // Vibration correlation with conveyor speed
      node.vibration = Math.max(0.1, (state.conveyorSpeed * 1.8) + (Math.random() * 0.6 - 0.3));
    }

    // Shift arrays
    node.history.cpu.push(node.cpu);
    node.history.cpu.shift();
    node.history.temp.push(node.temp);
    node.history.temp.shift();
    node.history.vibration.push(node.vibration);
    node.history.vibration.shift();
  }

  // Update DOM details if node card open
  const detailsOpen = elements.nodeDetailsDrawer.style.display !== 'none';
  if (detailsOpen) {
    const activeNodeId = elements.nodeDetailsDrawer.getAttribute('data-node-id');
    const node = state.nodes[activeNodeId];
    if (node) {
      elements.drawerModel.innerText = node.model;
      elements.drawerHW.innerText = node.hw;
      elements.drawerIP.innerText = node.ip;
      elements.drawerUptime.innerText = node.uptime;
      elements.drawerMem.innerText = node.mem;
    }
  }

  // Redraw charts
  if (state.activeTab === 'dashboard') {
    drawTelemetryChart();
  }

  // Auto Refresh Node Grid display
  updateNodeCardsDisplay();
}

function drawTelemetryChart() {
  const canvas = elements.telemetryCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Responsive drawing dimensions
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  
  const width = rect.width;
  const height = rect.height;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Draw chart background box
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, width, height);

  // Draw Grid Lines (Horizontal)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridRows = 5;
  for (let i = 0; i <= gridRows; i++) {
    const y = 30 + (i / gridRows) * (height - 60);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    // Labels on left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px Rajdhani';
    ctx.fillText(`${100 - i * 20}`, 15, y + 4);
  }

  // Fetch target history
  const node = state.nodes[state.selectedTelemetryNode];
  if (!node) return;

  const cpuData = node.history.cpu;
  const tempData = node.history.temp;
  const vibData = node.history.vibration;
  
  const plotWidth = width - 60;
  const step = plotWidth / (cpuData.length - 1);
  const chartHeight = height - 60;
  const startY = 30;
  const startX = 40;

  // Draw lines helper
  function drawLine(data, color, maxScale, scaleGlow) {
    ctx.beginPath();
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = color;
    ctx.shadowColor = scaleGlow;
    ctx.shadowBlur = 4;
    
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const x = startX + i * step;
      const valPercent = Math.min(1.0, val / maxScale);
      const y = startY + chartHeight * (1.0 - valPercent);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Fill Area under the curve
    ctx.shadowBlur = 0; 
    ctx.beginPath();
    ctx.moveTo(startX, startY + chartHeight);
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      const x = startX + i * step;
      const valPercent = Math.min(1.0, val / maxScale);
      const y = startY + chartHeight * (1.0 - valPercent);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(startX + (data.length - 1) * step, startY + chartHeight);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, startY, 0, startY + chartHeight);
    grad.addColorStop(0, color.replace('1)', '0.08)'));
    grad.addColorStop(1, color.replace('1)', '0.0)'));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Draw CPU Line (0-100 scale, Neon Cyan)
  drawLine(cpuData, 'rgba(0, 240, 255, 1)', 100, 'rgba(0, 240, 255, 0.4)');
  // Draw Temp Line (0-100 scale, Neon Yellow)
  drawLine(tempData, 'rgba(255, 174, 0, 1)', 100, 'rgba(255, 174, 0, 0.4)');
  // Draw Vibration Line (0-10 scale x10, Neon Purple)
  const vibrationScaled = vibData.map(v => v * 10);
  drawLine(vibrationScaled, 'rgba(189, 0, 255, 1)', 100, 'rgba(189, 0, 255, 0.4)');
}

// 5. ALERT HUB & LOGS
function addAlert(type, nodeId, message) {
  state.alertCount++;
  elements.alertCountBadge.innerText = `${state.alertCount} Alerts`;

  const item = document.createElement('div');
  item.className = `alert-item ${type}`;
  
  const timestamp = new Date().toISOString().slice(11, 19);
  
  item.innerHTML = `
    <div class="alert-meta">
      <span class="alert-node">${nodeId.toUpperCase()}</span>
      <span class="alert-timestamp">${timestamp}</span>
    </div>
    <div class="alert-message">${message}</div>
  `;

  // Prepend
  elements.alertsLogContainer.insertBefore(item, elements.alertsLogContainer.firstChild);

  // Cull old alerts past 30 to prevent DOM bloating
  if (elements.alertsLogContainer.children.length > 30) {
    elements.alertsLogContainer.removeChild(elements.alertsLogContainer.lastChild);
  }
}

// 6. VISION TAB conveyor belt defect detector simulation
let beltParts = [];
let nextPartId = 1;
let lastPartGeneratedTime = 0;
let flashSensorEffect = 0;
let forceDefectInjection = false;
let inferenceCounter = 0;
let totalConfidenceAccumulator = 0;

// PaliGemma text outputs dictionary matching defects
const paligemmaDiagnosticReports = {
  'Crack': "Observation: Structural linear fracture expanding 12mm across surface weld seam. Recommended action: Safety release conveyor lock, route item to mechanical grinding rework.",
  'Dent': "Observation: Compression indentation detected on component outer face (est area 16mm²). Recommended action: Mechanical stress failure alert. Re-audit stamping alignment.",
  'Scratch': "Observation: Surface abrasion markings on main load-bearing cylinder casing. Recommended action: Superficial defect only. Proceed to normal laser etching stage.",
  'Weld Void': "Observation: Gaseous hollow bubble anomaly in core perimeter weldment joint. Recommended action: Severe structural integrity alarm. Check feed wire gas pressure immediately."
};

function updateVisionPipelineLabel() {
  const nodeId = state.selectedVisionNode;
  const node = state.nodes[nodeId];
  if (node) {
    elements.selectedVisionPipeline.innerText = `PIPELINE: ${node.model.toUpperCase()} // ${node.ip}`;
  }
}

function triggerAnomalyInjection() {
  forceDefectInjection = true;
  addAlert('warning', state.selectedVisionNode, 'Operator injected simulated visual defect into line.');
}

function visionLoop(timestamp) {
  if (state.activeTab === 'vision') {
    simulateBeltPhysics(timestamp);
    drawVisionFeed();
  }
  requestAnimationFrame(visionLoop);
}

function simulateBeltPhysics(timestamp) {
  if (state.isEmergencyHalted) return;

  const spawnInterval = 3000 / (state.conveyorSpeed || 0.1); // Dynamic spawn rate depending on belt speed
  
  // Spawn new parts
  if (state.conveyorSpeed > 0 && timestamp - lastPartGeneratedTime > spawnInterval) {
    generatePart();
    lastPartGeneratedTime = timestamp;
  }

  // Move parts and check intersection with lens audit laser
  const scanLineX = 425; // center of 850px width canvas
  
  beltParts.forEach(part => {
    const oldX = part.x;
    part.x += state.conveyorSpeed * 1.5; // Translate position
    
    // Check if crossing scanner laser line
    if (oldX < scanLineX && part.x >= scanLineX) {
      triggerInferenceScan(part);
    }
  });

  // Remove offscreen parts
  beltParts = beltParts.filter(part => part.x < 900);
}

function generatePart() {
  // Generate random geometry parameters
  const isDefective = forceDefectInjection || (Math.random() < 0.15); // 15% baseline failure rate
  forceDefectInjection = false; // Reset toggle trigger

  let defectType = null;
  let defectColor = null;
  let boundingBox = null;

  if (isDefective) {
    const defects = ['Crack', 'Dent', 'Scratch', 'Weld Void'];
    defectType = defects[Math.floor(Math.random() * defects.length)];
    defectColor = 'rgba(255, 49, 49, 0.85)'; // Red defect border
    
    // Relative bounding box positions on the part
    boundingBox = {
      rx: Math.floor(Math.random() * 30) - 15,
      ry: Math.floor(Math.random() * 20) - 10,
      rw: 18 + Math.random() * 12,
      rh: 18 + Math.random() * 12
    };
  }

  const part = {
    id: nextPartId++,
    x: -100,
    y: 200,
    type: ['Gear', 'Bearing-Casing', 'Shaft-Sleeve'][Math.floor(Math.random() * 3)],
    radius: 35 + Math.random() * 10,
    isDefective: isDefective,
    defectType: defectType,
    defectColor: defectColor,
    boundingBox: boundingBox,
    hasBeenInferred: false,
    confidence: (88 + Math.random() * 11) / 100 // 88% - 99%
  };

  beltParts.push(part);
}

function triggerInferenceScan(part) {
  part.hasBeenInferred = true;
  flashSensorEffect = 15; // flashes flash line in draw
  
  inferenceCounter++;
  totalConfidenceAccumulator += part.confidence;
  
  // Calculate rolling statistics
  const avgConf = (totalConfidenceAccumulator / inferenceCounter) * 100;
  elements.avgConfidence.innerText = `${avgConf.toFixed(1)}%`;
  
  // Dynamic inference latency jitter
  const latency = (5.2 + Math.random() * 4.5).toFixed(1);
  elements.inferenceLatency.innerText = `${latency} ms`;

  // Render PaliGemma text visual audit descriptions
  if (part.isDefective) {
    if (part.confidence >= state.confidenceCutoff) {
      addAlert('danger', state.selectedVisionNode, `DEFECT AUDIT: Detected '${part.defectType}' on part #${part.id} (Conf: ${(part.confidence*100).toFixed(1)}%)`);
      
      // Print PaliGemma diagnostic response
      const report = paligemmaDiagnosticReports[part.defectType];
      elements.paligemmaDescription.innerHTML = `<span style="color:var(--neon-red); font-weight:600;">[ANOMALY TRIGGERED]</span> ${report}`;
    } else {
      addAlert('warning', state.selectedVisionNode, `LOW CONFIDENCE DEFECT: Blocked suspect '${part.defectType}' on part #${part.id} (Conf: ${(part.confidence*100).toFixed(1)}%)`);
      elements.paligemmaDescription.innerHTML = `<span style="color:var(--neon-yellow); font-weight:600;">[LOW CONFIDENCE DEFECT]</span> Observation: Suspected boundary defect detected but filtered out by inference cutoff. Please inspect part physically.`;
    }
  } else {
    elements.paligemmaDescription.innerHTML = `<span style="color:var(--neon-green); font-weight:600;">[NOMINAL]</span> Observation: Component #${part.id} structure uniform. Surface metrics cataloged correctly.`;
  }
}

function drawVisionFeed() {
  const canvas = elements.visionCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear feed
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, width, height);

  // Draw assembly line conveyor belt structure in background
  ctx.strokeStyle = '#222735';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(-50, 200);
  ctx.lineTo(width + 50, 200);
  ctx.stroke();

  // Conveyor rollers lines
  ctx.strokeStyle = '#151924';
  ctx.lineWidth = 2;
  for (let i = 0; i < width; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 190);
    ctx.lineTo(i, 210);
    ctx.stroke();
  }

  // DRAW PARTS ON BELT
  beltParts.forEach(part => {
    // If filter defects only is active, hide healthy parts
    if (state.filterDefectsOnly && !part.isDefective) return;

    ctx.save();
    ctx.translate(part.x, part.y);

    // Draw part outline
    ctx.fillStyle = '#4b556b';
    ctx.strokeStyle = '#6e7e9b';
    ctx.lineWidth = 3;

    if (part.type === 'Gear') {
      // Draw Gear outer shape
      ctx.beginPath();
      const teeth = 8;
      const innerR = part.radius - 8;
      const outerR = part.radius + 6;
      for (let j = 0; j < teeth * 2; j++) {
        const angle = (j / teeth) * Math.PI;
        const r = (j % 2 === 0) ? outerR : innerR;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Gear core hub hole
      ctx.fillStyle = '#05070a';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } 
    else if (part.type === 'Bearing-Casing') {
      // Ball bearing hub
      ctx.beginPath();
      ctx.arc(0, 0, part.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // inner rings
      ctx.beginPath();
      ctx.arc(0, 0, part.radius - 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#7a8ba8';
      // Draw inner spheres
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * (part.radius - 6), Math.sin(ang) * (part.radius - 6), 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } 
    else {
      // Shaft-Sleeve (Cylinder shape)
      ctx.fillRect(-25, -20, 50, 40);
      ctx.strokeRect(-25, -20, 50, 40);
      // Details
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.lineTo(-10, 20);
      ctx.moveTo(10, -20);
      ctx.lineTo(10, 20);
      ctx.stroke();
    }

    // DRAW SIMULATED COMP-VISION DEFECT MARKINGS
    if (part.isDefective && part.hasBeenInferred) {
      // Draw defect mark on component
      ctx.fillStyle = 'rgba(255, 49, 49, 0.4)';
      ctx.beginPath();
      ctx.arc(part.boundingBox.rx, part.boundingBox.ry, part.boundingBox.rw / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw bounding box if toggle checked & confidence passes threshold
      if (state.renderBBoxes && part.confidence >= state.confidenceCutoff) {
        ctx.strokeStyle = part.defectColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          part.boundingBox.rx - part.boundingBox.rw/2,
          part.boundingBox.ry - part.boundingBox.rh/2,
          part.boundingBox.rw,
          part.boundingBox.rh
        );

        // Text label
        ctx.fillStyle = part.defectColor;
        ctx.font = '10px Rajdhani';
        ctx.fillText(
          `${part.defectType.toUpperCase()}: ${(part.confidence * 100).toFixed(0)}%`, 
          part.boundingBox.rx - part.boundingBox.rw/2, 
          part.boundingBox.ry - part.boundingBox.rh/2 - 5
        );
      }
    } else if (!part.isDefective && part.hasBeenInferred && state.renderBBoxes) {
      // draw green "OK" boxes for healthy items
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-part.radius - 2, -part.radius - 2, part.radius*2 + 4, part.radius*2 + 4);
      
      ctx.fillStyle = 'rgba(57, 255, 20, 0.75)';
      ctx.font = '8px Rajdhani';
      ctx.fillText(`OK: ${(part.confidence * 100).toFixed(0)}%`, -part.radius - 2, -part.radius - 6);
    }

    ctx.restore();
  });

  // Draw active scanning sensor laser sweeping beam
  if (state.renderScanline) {
    const scanLineX = 425;
    
    // Draw scanner vertical line
    ctx.lineWidth = 2;
    if (flashSensorEffect > 0) {
      ctx.strokeStyle = 'rgba(255, 49, 49, 0.9)';
      ctx.shadowColor = 'rgba(255, 49, 49, 0.8)';
      ctx.shadowBlur = 12;
      flashSensorEffect--;
    } else {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
      ctx.shadowBlur = 8;
    }
    
    ctx.beginPath();
    ctx.moveTo(scanLineX, 20);
    ctx.lineTo(scanLineX, height - 20);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Laser emitter brackets UI
    ctx.fillStyle = '#151924';
    ctx.fillRect(scanLineX - 12, 0, 24, 20);
    ctx.fillRect(scanLineX - 12, height - 20, 24, 20);
    
    ctx.strokeStyle = varColor('--border-color');
    ctx.strokeRect(scanLineX - 12, 0, 24, 20);
    ctx.strokeRect(scanLineX - 12, height - 20, 24, 20);
    
    // Lens dot
    ctx.fillStyle = varColor('--neon-cyan');
    ctx.beginPath();
    ctx.arc(scanLineX, 10, 3, 0, Math.PI * 2);
    ctx.arc(scanLineX, height - 10, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw HUD dashboard borders on the Canvas
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // HUD text labels
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '10px Rajdhani';
  ctx.fillText('CAMERA FEED // GATEWAY-LINK ACTIVE', 20, 25);
  ctx.fillText('LOCAL MODEL PIPELINE: ' + state.nodes[state.selectedVisionNode].model.toUpperCase(), 20, height - 20);
}

function varColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// 7. LOCAL GEMMA CHAT COPILOT
function handleGemmaFormSubmit(e) {
  e.preventDefault();
  const query = elements.gemmaChatInput.value.trim();
  if (!query) return;

  elements.gemmaChatInput.value = '';
  handleGemmaChatQuery(query);
}

function injectChatMessage(sender, text) {
  const container = elements.gemmaChatHistory;
  const msg = document.createElement('div');
  msg.className = `chat-msg ${sender}`;
  
  msg.innerHTML = `
    <span class="msg-header">${sender === 'operator' ? 'Local Operator' : 'Gemma-2B Edge LLM'}</span>
    <span class="msg-text">${text}</span>
  `;

  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function handleGemmaChatQuery(query) {
  injectChatMessage('operator', query);

  // Show simulated typing bubble
  const container = elements.gemmaChatHistory;
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-msg gemma typing';
  typingBubble.innerHTML = `
    <span class="msg-header">Gemma-2B Edge LLM</span>
    <span class="msg-text" style="color:var(--text-muted)">Generating local offline response...</span>
  `;
  container.appendChild(typingBubble);
  container.scrollTop = container.scrollHeight;

  // Simulate inference time
  setTimeout(() => {
    container.removeChild(typingBubble);

    let answer = "";
    const cleanQuery = query.toLowerCase();

    if (cleanQuery.includes('weld void')) {
      answer = "A 'Weld Void' alert signifies structural gaps inside joint seams. Local edge instructions dictate:\n1. Force safety valve check on Weld Laser Injector.\n2. Confirm shield gas (Argon/CO2 mix) is flowing at exactly 14 L/min.\n3. Increase wire feed heater speed by 5% to normalize deposition.";
    } 
    else if (cleanQuery.includes('oee') || cleanQuery.includes('speed')) {
      answer = "To maximize line OEE (currently 89.2%):\n- Maintain belt speed at 1.2 m/s. Increasing speed beyond 2.2 m/s degrades image sharpness, dropping PaliGemma inference precision below 85%.\n- Schedule preventative maintenance on the Node 102 bearing housing.";
    } 
    else if (cleanQuery.includes('node 103') || cleanQuery.includes('cpu') || cleanQuery.includes('temperature')) {
      answer = "Edge Node 103 CPU load is currently warning at 88% due to localized Gemma-2B INT4 weight inference operations.\nRecommendations:\n1. Verify active heat sink fan is spinning on the board.\n2. In Vertex AI Sync tab, deploy the 'Thermal Mitigation Hotfix' to re-quantize activation weights.";
    } 
    else if (cleanQuery.includes('vibration') || cleanQuery.includes('bearing')) {
      answer = "High board vibration warning (3.5 G-RMS) on Node 102 indicates conveyor subframe stress.\nChecks:\n1. Audit conveyor motor bearing wear.\n2. Inspect frame bolt torque.\n3. Ensure Coral USB accelerator is firmly clamped.";
    } 
    else {
      answer = "I have scanned the local Edge gateway telemetry. All 3 nodes are actively communicating. Coral Edge TPUs are loaded with MediaPipe inference contexts. Let me know if you would like me to detail troubleshooting steps for specific anomalies.";
    }

    injectChatMessage('gemma', answer);
  }, 1200);
}

function resetChatConversation() {
  elements.gemmaChatHistory.innerHTML = '';
  injectChatMessage('gemma', "Conversation history reset. I am ready to process local diagnostic queries.");
}

// 8. EDGE NODES GRID INFRASTRUCTURE
function renderNodeCards() {
  elements.nodesGridContainer.innerHTML = '';
  
  for (let id in state.nodes) {
    const node = state.nodes[id];
    const card = document.createElement('div');
    card.className = 'node-card';
    card.setAttribute('data-id', node.id);
    
    // Setup initial status
    let statusClass = 'badge-online';
    let pulseClass = 'pulsing-green';
    if (node.status === 'warning') {
      statusClass = 'badge-warning';
      pulseClass = 'pulsing-amber';
    } else if (node.status === 'offline') {
      statusClass = 'badge-danger';
      pulseClass = 'pulsing-red';
    }

    card.innerHTML = `
      <div class="node-card-header">
        <h3 class="node-title">${node.name}</h3>
        <span class="node-status-badge ${statusClass}">
          <span class="status-indicator-dot ${pulseClass}"></span>
          ${node.status}
        </span>
      </div>
      <div class="node-card-body">
        <div class="node-info-row">
          <span class="node-info-lbl">Edge Pipeline:</span>
          <span class="node-info-val val-model">${node.model}</span>
        </div>
        <div class="node-info-row">
          <span class="node-info-lbl">TPU/CPU Load:</span>
          <span class="node-info-val val-cpu">${node.cpu}%</span>
        </div>
        <div class="node-info-row">
          <span class="node-info-lbl">Temp Vitals:</span>
          <span class="node-info-val val-temp">${node.temp}°C</span>
        </div>
        <div class="node-info-row">
          <span class="node-info-lbl">Vibration Index:</span>
          <span class="node-info-val val-vibration">${node.vibration.toFixed(2)} G-RMS</span>
        </div>
      </div>
      <div class="node-card-footer">
        <span class="node-hw-chip">${node.hw.split(' (')[0]}</span>
        <span class="node-arrow">&rarr;</span>
      </div>
    `;

    card.addEventListener('click', () => {
      openNodeDrawer(node.id);
    });

    elements.nodesGridContainer.appendChild(card);
  }
}

function updateNodeCardsDisplay() {
  const cards = elements.nodesGridContainer.querySelectorAll('.node-card');
  cards.forEach(card => {
    const id = card.getAttribute('data-id');
    const node = state.nodes[id];
    if (!node) return;

    // Refresh dynamic telemetry values on grid cards
    card.querySelector('.val-cpu').innerText = `${node.cpu}%`;
    card.querySelector('.val-temp').innerText = `${node.temp}°C`;
    card.querySelector('.val-vibration').innerText = `${node.vibration.toFixed(2)} G-RMS`;
    card.querySelector('.val-model').innerText = node.model;
    
    // update status badge
    const badge = card.querySelector('.node-status-badge');
    badge.className = `node-status-badge ${node.status === 'online' ? 'badge-online' : node.status === 'warning' ? 'badge-warning' : 'badge-danger'}`;
    
    const dot = badge.querySelector('.status-indicator-dot');
    dot.className = `status-indicator-dot ${node.status === 'online' ? 'pulsing-green' : node.status === 'warning' ? 'pulsing-amber' : 'pulsing-red'}`;
    badge.innerHTML = `<span class="status-indicator-dot ${dot.className}"></span> ${node.status}`;
  });
}

function openNodeDrawer(nodeId) {
  const node = state.nodes[nodeId];
  if (!node) return;

  elements.drawerNodeName.innerText = node.name.toUpperCase();
  elements.drawerModel.innerText = node.model;
  elements.drawerHW.innerText = node.hw;
  elements.drawerIP.innerText = node.ip;
  elements.drawerUptime.innerText = node.uptime;
  elements.drawerMem.innerText = node.mem;
  
  elements.nodeDetailsDrawer.setAttribute('data-node-id', nodeId);
  elements.nodeDetailsDrawer.style.display = 'block';
}

function performEdgeNetworkScan() {
  addAlert('info', 'gateway', 'Vertex AI edge agent initiating subnet Coral scan...');
  
  const originalBtnContent = elements.refreshNodesBtn.innerHTML;
  elements.refreshNodesBtn.disabled = true;
  elements.refreshNodesBtn.innerText = 'Scanning Coral bus...';

  setTimeout(() => {
    // Normalizing board thermal values on Node 103
    if (state.nodes.node103.status === 'warning') {
      state.nodes.node103.status = 'online';
      state.nodes.node103.temp = 49;
      state.nodes.node103.cpu = 38;
      addAlert('safe', 'node103', 'Edge Coral TPU throttle release: thermals stable at 49°C.');
    }
    
    renderNodeCards();
    elements.refreshNodesBtn.disabled = false;
    elements.refreshNodesBtn.innerHTML = originalBtnContent;
    addAlert('info', 'gateway', 'Scan completed. Found 3 Coral Edge TPU cores operational.');
  }, 2000);
}

// 9. VERTEX AI OTA PIPELINE ORCHESTRATOR
function runOTAPipeline() {
  const selectedPatch = elements.otaModelSelect.value;
  const meta = state.otaMetadata[selectedPatch];
  if (!meta) return;

  const targetNodeId = meta.targetNode;
  const term = elements.otaTerminalScreen;
  term.innerHTML = ''; // Clear prior logs

  function writeLine(cls, text) {
    const line = document.createElement('div');
    line.className = `term-line ${cls}`;
    line.innerText = `[${new Date().toISOString().slice(11, 19)}] ${text}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  }

  // Pre-checks
  writeLine('system-line', `Authenticating with us-central1-docker.pkg.dev Google Artifact Registry...`);
  
  elements.startOtaBtn.disabled = true;
  elements.otaOverallStatus.innerText = 'Status: Fetching...';
  elements.otaProgressBarContainer.style.display = 'block';
  elements.otaProgressBarFill.style.width = '0%';

  const logsSequence = [
    { delay: 1000, cls: 'info-line', text: `gcloud container images pull us-central1-docker.pkg.dev/apex-factory/models/${meta.name}` },
    { delay: 2200, cls: 'info-line', text: `Vertex AI model sync handshake validated successfully (SH256 Hash verified).` },
    { delay: 3500, cls: 'info-line', text: `Broadcasting Model weights to target nodes over local mesh WiFi...` },
    { delay: 5000, cls: 'info-line', text: `Flashing Edge TPU DLA firmware cache...` },
    { delay: 6500, cls: 'warn-line', text: `Halting local MediaPipe tasks and reloading model runtimes...` },
    { delay: 8200, cls: 'info-line', text: `Applying model parameters and restarting service containers...` },
    { delay: 9500, cls: 'success-line', text: `Model weights successfully compiled into Coral format.` },
    { delay: 10500, cls: 'success-line', text: `VERTEX AI MODEL DEPLOYMENT COMPLETED.` }
  ];

  // Animate progress bar incrementally matching delays
  let progress = 0;
  const progressTimer = setInterval(() => {
    progress += 1;
    if (progress >= 100) {
      clearInterval(progressTimer);
    }
    elements.otaProgressBarFill.style.width = `${progress}%`;
  }, 100);

  // Execute sequence steps
  logsSequence.forEach(step => {
    setTimeout(() => {
      writeLine(step.cls, step.text);
      
      // If final success step:
      if (step.text.includes('COMPLETED')) {
        clearInterval(progressTimer);
        elements.otaProgressBarFill.style.width = '100%';
        elements.otaOverallStatus.innerText = 'Status: Complete';
        elements.startOtaBtn.disabled = false;
        
        // Mutate model versions in runtime state
        if (targetNodeId === 'all') {
          for (let nid in state.nodes) {
            state.nodes[nid].model = 'Coral Engine Unified Patch';
          }
          addAlert('info', 'gateway', 'Global system firmware patch broadcast finalized across all nodes.');
        } else {
          const targetNode = state.nodes[targetNodeId];
          if (targetNode) {
            targetNode.model = meta.newVersionString;
            targetNode.status = 'online'; // heal status warning
            addAlert('safe', targetNodeId, `Vertex OTA: upgraded running model to '${meta.newVersionString}'`);
          }
        }
        
        // Refresh cards and label visual layouts
        renderNodeCards();
        updateVisionPipelineLabel();
      }
    }, step.delay);
  });
}

// 10. SAFETY HALT & INTERACTION
function toggleEmergencyHalt() {
  state.isEmergencyHalted = !state.isEmergencyHalted;

  if (state.isEmergencyHalted) {
    // Shutdown lines and show red warnings
    elements.emergencyHaltBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      CANCEL HALT (RESET LINE)
    `;
    elements.emergencyHaltBtn.classList.remove('btn-danger');
    elements.emergencyHaltBtn.classList.add('btn-secondary');

    // Stop physics & metrics
    state.conveyorSpeed = 0;
    elements.conveyorSpeed.value = 0;
    elements.conveyorSpeedVal.innerText = '0.0 m/s';
    
    // Status text header updates to emergency alerts
    document.querySelector('.system-status-pill').className = 'system-status-pill pulsing-red';
    document.querySelector('.status-text').innerText = 'EMERGENCY CRITICAL // HALTED';
    document.querySelector('.status-text').style.color = 'var(--neon-red)';
    
    state.globalOEE = 0.0;
    elements.globalOEE.innerText = '0.0%';
    elements.globalOEEBar.style.width = '0%';
    
    addAlert('danger', 'gateway', 'CRITICAL STOP DETECTED: Factory line forced shutdown by operator.');
  } else {
    // Reset back to running status
    elements.emergencyHaltBtn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      LINE FORCE HALT
    `;
    elements.emergencyHaltBtn.classList.remove('btn-secondary');
    elements.emergencyHaltBtn.classList.add('btn-danger');

    // restore speed defaults
    state.conveyorSpeed = 1.2;
    elements.conveyorSpeed.value = 1.2;
    elements.conveyorSpeedVal.innerText = '1.2 m/s';

    document.querySelector('.system-status-pill').className = 'system-status-pill pulsing-green';
    document.querySelector('.status-text').innerText = 'SYSTEM SECURE // ACTIVE';
    document.querySelector('.status-text').style.color = 'var(--neon-green)';

    addAlert('info', 'gateway', 'Safety latch released. Assembly line operation recovered.');
  }
}

// Kick off initialization sequence when document is ready
window.addEventListener('DOMContentLoaded', initApp);
