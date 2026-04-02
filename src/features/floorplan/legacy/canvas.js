//canvas.js
/**
 * Floorplan Editor – Canvas Rendering & Interactions
 * Handles drawing + mouse events on the HTML5 canvas
 */

let canvas, ctx;
let bgImage = null;
let bgImageStatus = 'none'; // 'none' | 'loading' | 'loaded' | 'failed'
let bgImageUrl = '';
let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;

// Zone colors (cycle through)
const ZONE_COLORS = [
  'rgba(99, 102, 241, 0.18)',   // indigo
  'rgba(16, 185, 129, 0.18)',   // emerald
  'rgba(245, 158, 11, 0.18)',   // amber
  'rgba(239, 68, 68, 0.18)',    // red
  'rgba(139, 92, 246, 0.18)',   // violet
  'rgba(6, 182, 212, 0.18)',    // cyan
];
const ZONE_BORDER_COLORS = [
  'rgba(99, 102, 241, 0.6)',
  'rgba(16, 185, 129, 0.6)',
  'rgba(245, 158, 11, 0.6)',
  'rgba(239, 68, 68, 0.6)',
  'rgba(139, 92, 246, 0.6)',
  'rgba(6, 182, 212, 0.6)',
];

function initCanvas() {
  canvas = document.getElementById('floorplan-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('dragover', onDragOver);
  canvas.addEventListener('drop', onDrop);
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('keydown', onKeyDown);
  requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
  const container = canvas.parentElement;
  const floor = getFloor(AppState.activeFloorId);
  canvas.width = floor?.backgroundWidth || container.clientWidth;
  canvas.height = floor?.backgroundHeight || container.clientHeight;
}

// ============================================
// BACKGROUND IMAGE
// ============================================
function loadBackgroundImage(url) {
  if (!url || url === bgImageUrl) {
    if (!url) { bgImage = null; bgImageStatus = 'none'; bgImageUrl = ''; }
    return;
  }
  bgImageUrl = url;
  bgImageStatus = 'loading';

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    bgImage = img;
    bgImageStatus = 'loaded';
  };
  img.onerror = () => {
    bgImage = null;
    bgImageStatus = 'failed';
  };
  img.src = url;
}

function drawCheckerboard(c, cx) {
  c = c || canvas; cx = cx || ctx;
  const size = 20;
  for (let y = 0; y < c.height; y += size) {
    for (let x = 0; x < c.width; x += size) {
      cx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#2a2a3e' : '#1e1e30';
      cx.fillRect(x, y, size, size);
    }
  }
}

// ============================================
// RENDER LOOP
// ============================================
function renderLoop() {
  render();
  requestAnimationFrame(renderLoop);
}

function render(targetCanvas, targetCtx) {
  const c = targetCanvas || canvas;
  const cx = targetCtx || ctx;
  if (!cx) return;
  const floorId = AppState.activeFloorId;
  const floor = getFloor(floorId);

  // Clear
  cx.clearRect(0, 0, c.width, c.height);
  cx.fillStyle = '#12121f';
  cx.fillRect(0, 0, c.width, c.height);

  // Background
  if (floor?.backgroundImageUrl) {
    loadBackgroundImage(floor.backgroundImageUrl);
  } else {
    bgImage = null; bgImageStatus = 'none'; bgImageUrl = '';
  }

  if (bgImageStatus === 'loaded' && bgImage) {
    try {
      cx.drawImage(bgImage, 0, 0, c.width, c.height);
    } catch (e) {
      bgImageStatus = 'failed';
      drawCheckerboard(c, cx);
    }
  } else if (bgImageStatus === 'failed') {
    drawCheckerboard(c, cx);
    cx.fillStyle = 'rgba(245, 158, 11, 0.9)';
    cx.font = '13px Inter, sans-serif';
    cx.textAlign = 'center';
    cx.fillText('⚠ Background image failed to load', c.width / 2, 24);
    cx.textAlign = 'left';
  }

  if (!floorId) return;

  // Grid dots (subtle)
  drawGrid(c, cx);

  // Zones
  const zones = getZonesForFloor(floorId);
  zones.forEach((zone, i) => {
    drawZone(zone, i, zone.id === AppState.selectedZoneId, cx);
  });

  // Combine edges
  const edges = getEdgesForFloor(floorId);
  edges.forEach(edge => drawCombineEdge(edge, cx));

  // Tables
  const tables = getTablesForFloor(floorId);
  tables.forEach(table => {
    const isSelected = table.id === AppState.selectedTableId;
    drawFloorTable(table, isSelected, cx);
  });

  // Zone drawing in progress (editor only)
  if (!targetCanvas && AppState.editorTool === 'zone_draw' && AppState.zoneDrawPoints.length > 0) {
    drawInProgressZone();
  }

  // Combine mode indicator (editor only)
  if (!targetCanvas && AppState.editorTool === 'combine' && AppState.combineFirstId) {
    const first = getFloorTable(AppState.combineFirstId);
    if (first) {
      cx.strokeStyle = '#f59e0b';
      cx.lineWidth = 3;
      cx.setLineDash([6, 4]);
      cx.beginPath();
      cx.arc(first.x, first.y, 30, 0, Math.PI * 2);
      cx.stroke();
      cx.setLineDash([]);
    }
  }
}

function drawGrid(c, cx) {
  c = c || canvas; cx = cx || ctx;
  cx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  const gap = 40;
  for (let x = 0; x < c.width; x += gap) {
    for (let y = 0; y < c.height; y += gap) {
      cx.beginPath();
      cx.arc(x, y, 1, 0, Math.PI * 2);
      cx.fill();
    }
  }
}

// ============================================
// DRAW ZONE
// ============================================
function drawZone(zone, colorIdx, isSelected, drawCtx) {
  const dc = drawCtx || ctx;
  if (!zone.polygonPoints || zone.polygonPoints.length < 3) return;
  const ci = colorIdx % ZONE_COLORS.length;

  dc.beginPath();
  dc.moveTo(zone.polygonPoints[0].x, zone.polygonPoints[0].y);
  for (let i = 1; i < zone.polygonPoints.length; i++) {
    dc.lineTo(zone.polygonPoints[i].x, zone.polygonPoints[i].y);
  }
  dc.closePath();

  dc.fillStyle = ZONE_COLORS[ci];
  dc.fill();

  dc.strokeStyle = isSelected ? '#ffffff' : ZONE_BORDER_COLORS[ci];
  dc.lineWidth = isSelected ? 2.5 : 1.5;
  dc.setLineDash(isSelected ? [] : [6, 3]);
  dc.stroke();
  dc.setLineDash([]);

  // Label
  const cx = zone.polygonPoints.reduce((s, p) => s + p.x, 0) / zone.polygonPoints.length;
  const cy = zone.polygonPoints.reduce((s, p) => s + p.y, 0) / zone.polygonPoints.length;
  dc.fillStyle = 'rgba(255, 255, 255, 0.7)';
  dc.font = '12px Inter, sans-serif';
  dc.textAlign = 'center';
  dc.textBaseline = 'middle';
  dc.fillText(zone.name, cx, cy);
  dc.textAlign = 'left';
  dc.textBaseline = 'alphabetic';
}

// ============================================
// DRAW COMBINE EDGE
// ============================================
function drawCombineEdge(edge, drawCtx) {
  const dc = drawCtx || ctx;
  const a = getFloorTable(edge.aId);
  const b = getFloorTable(edge.bId);
  if (!a || !b) return;

  dc.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  dc.lineWidth = 2;
  dc.setLineDash([5, 5]);
  dc.beginPath();
  dc.moveTo(a.x, a.y);
  dc.lineTo(b.x, b.y);
  dc.stroke();
  dc.setLineDash([]);

  // Label at midpoint
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  dc.fillStyle = 'rgba(245, 158, 11, 0.8)';
  dc.font = '10px Inter, sans-serif';
  dc.textAlign = 'center';
  dc.fillText(`max ${edge.combinedMaxPartySize}`, mx, my - 6);
  dc.textAlign = 'left';
}

// ============================================
// DRAW TABLE
// ============================================
function drawFloorTable(table, isSelected, drawCtx) {
  const dc = drawCtx || ctx;
  const tmpl = getTemplate(table.tableTemplateId);
  if (!tmpl) return;

  dc.save();
  dc.translate(table.x, table.y);
  dc.rotate((table.rotationDeg * Math.PI) / 180);
  dc.scale(table.scaleX, table.scaleY);

  // ---- FIXTURE RENDERING (architectural elements) ----
  if (tmpl.type === 'fixture') {
    drawFixture(dc, tmpl, isSelected);
    dc.restore();
    return;
  }

  // ---- STANDARD TABLE RENDERING ----
  if (tmpl.shape === 'circle') {
    const r = tmpl.radius || 22;
    if (isSelected) {
      dc.shadowColor = 'rgba(99, 102, 241, 0.6)';
      dc.shadowBlur = 16;
    }
    dc.beginPath();
    dc.arc(0, 0, r, 0, Math.PI * 2);
    dc.fillStyle = isSelected ? '#3b3b6b' : '#2a2a4a';
    dc.fill();
    dc.strokeStyle = isSelected ? '#818cf8' : '#4a4a7a';
    dc.lineWidth = isSelected ? 2.5 : 1.5;
    dc.stroke();
    dc.shadowBlur = 0;
  } else {
    const w = tmpl.width || 50;
    const h = tmpl.height || 50;
    const rr = 6;
    if (isSelected) {
      dc.shadowColor = 'rgba(99, 102, 241, 0.6)';
      dc.shadowBlur = 16;
    }
    roundRect(dc, -w / 2, -h / 2, w, h, rr);
    dc.fillStyle = isSelected ? '#3b3b6b' : '#2a2a4a';
    dc.fill();
    dc.strokeStyle = isSelected ? '#818cf8' : '#4a4a7a';
    dc.lineWidth = isSelected ? 2.5 : 1.5;
    dc.stroke();
    dc.shadowBlur = 0;
  }

  // Chairs
  const chairs = getChairsForTemplate(tmpl.id);
  chairs.forEach(ch => {
    const ct = getChairTemplate(ch.chairTemplateId);
    const cw = ct?.width || 10;
    const cd = ct?.depth || 10;

    dc.save();
    dc.translate(ch.x, ch.y);
    dc.rotate((ch.rotationDeg * Math.PI) / 180);
    roundRect(dc, -cw / 2, -cd / 2, cw, cd, 3);
    dc.fillStyle = '#3d3d60';
    dc.fill();
    dc.strokeStyle = '#5a5a8a';
    dc.lineWidth = 1;
    dc.stroke();
    dc.restore();
  });

  // Label
  dc.fillStyle = isSelected ? '#c7d2fe' : 'rgba(255, 255, 255, 0.85)';
  dc.font = 'bold 12px Inter, sans-serif';
  dc.textAlign = 'center';
  dc.textBaseline = 'middle';
  dc.fillText(table.label, 0, 0);
  dc.textAlign = 'left';
  dc.textBaseline = 'alphabetic';

  // Inactive overlay
  if (!table.isActive) {
    dc.fillStyle = 'rgba(0,0,0,0.5)';
    if (tmpl.shape === 'circle') {
      dc.beginPath();
      dc.arc(0, 0, tmpl.radius || 22, 0, Math.PI * 2);
      dc.fill();
    } else {
      dc.fillRect(-(tmpl.width || 50) / 2, -(tmpl.height || 50) / 2, tmpl.width || 50, tmpl.height || 50);
    }
  }

  dc.restore();
}

// ============================================
// FIXTURE DRAWING
// ============================================
function drawFixture(dc, tmpl, isSelected) {
  const kind = tmpl.fixtureKind || 'wall';
  const w = tmpl.width || 50;
  const h = tmpl.height || 50;
  const r = tmpl.radius || 10;

  // Selection outline
  const selColor = isSelected ? 'rgba(99, 102, 241, 0.7)' : null;

  switch (kind) {
    case 'wall':
    case 'wall_corner': {
      // Solid structural wall
      roundRect(dc, -w / 2, -h / 2, w, h, 1);
      dc.fillStyle = '#3a3a4c';
      dc.fill();
      dc.strokeStyle = selColor || '#555568';
      dc.lineWidth = isSelected ? 2 : 1;
      dc.stroke();

      // Subtle brick-like texture lines
      dc.strokeStyle = 'rgba(255,255,255,0.04)';
      dc.lineWidth = 0.5;
      for (let i = -w / 2 + 8; i < w / 2; i += 12) {
        dc.beginPath();
        dc.moveTo(i, -h / 2);
        dc.lineTo(i, h / 2);
        dc.stroke();
      }
      break;
    }

    case 'window': {
      // Frame
      roundRect(dc, -w / 2, -h / 2, w, h, 2);
      dc.fillStyle = '#1a2a3a';
      dc.fill();
      dc.strokeStyle = selColor || '#5a6a7a';
      dc.lineWidth = isSelected ? 2 : 1.5;
      dc.stroke();

      // Glass panes with cyan tint
      const paneW = (w - 6) / 2;
      dc.fillStyle = 'rgba(56, 189, 248, 0.2)';
      dc.fillRect(-w / 2 + 2, -h / 2 + 2, paneW, h - 4);
      dc.fillRect(-w / 2 + paneW + 4, -h / 2 + 2, paneW, h - 4);

      // Vertical divider
      dc.strokeStyle = '#5a6a7a';
      dc.lineWidth = 1;
      dc.beginPath();
      dc.moveTo(0, -h / 2);
      dc.lineTo(0, h / 2);
      dc.stroke();

      // Glare
      dc.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      dc.lineWidth = 0.5;
      dc.beginPath();
      dc.moveTo(-w / 4, -h / 2 + 1);
      dc.lineTo(-w / 4 + 5, h / 2 - 1);
      dc.stroke();
      break;
    }

    case 'door': {
      // Door frame
      dc.fillStyle = '#4a3a2a';
      dc.fillRect(-w / 2, -h / 2, w, h);
      dc.strokeStyle = selColor || '#7a6a5a';
      dc.lineWidth = isSelected ? 2 : 1;
      dc.strokeRect(-w / 2, -h / 2, w, h);

      // Door swing arc
      dc.strokeStyle = 'rgba(200, 180, 140, 0.4)';
      dc.lineWidth = 1;
      dc.setLineDash([3, 3]);
      dc.beginPath();
      dc.arc(-w / 2, h / 2, w, -Math.PI / 2, 0);
      dc.stroke();
      dc.setLineDash([]);

      // Handle dot
      dc.beginPath();
      dc.arc(w / 2 - 6, 0, 2, 0, Math.PI * 2);
      dc.fillStyle = '#c8b478';
      dc.fill();
      break;
    }

    case 'sliding_door': {
      // Track
      dc.fillStyle = '#2a2a3e';
      dc.fillRect(-w / 2, -h / 2, w, h);
      dc.strokeStyle = selColor || '#6a6a8a';
      dc.lineWidth = isSelected ? 2 : 1;
      dc.strokeRect(-w / 2, -h / 2, w, h);

      // Two panels
      dc.fillStyle = 'rgba(56, 189, 248, 0.12)';
      dc.fillRect(-w / 2 + 2, -h / 2 + 1, w / 2 - 4, h - 2);
      dc.fillRect(4, -h / 2 + 1, w / 2 - 4, h - 2);

      // Arrows
      dc.strokeStyle = 'rgba(255,255,255,0.2)';
      dc.lineWidth = 1;
      dc.beginPath();
      dc.moveTo(-8, 0); dc.lineTo(-14, 0);
      dc.moveTo(8, 0); dc.lineTo(14, 0);
      dc.stroke();
      break;
    }

    case 'pillar': {
      if (tmpl.shape === 'circle') {
        dc.beginPath();
        dc.arc(0, 0, r, 0, Math.PI * 2);
        dc.fillStyle = '#404055';
        dc.fill();
        dc.strokeStyle = selColor || '#5a5a70';
        dc.lineWidth = isSelected ? 2 : 1.5;
        dc.stroke();

        // Highlight
        dc.beginPath();
        dc.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2);
        dc.fillStyle = 'rgba(255,255,255,0.06)';
        dc.fill();
      } else {
        roundRect(dc, -w / 2, -h / 2, w, h, 2);
        dc.fillStyle = '#404055';
        dc.fill();
        dc.strokeStyle = selColor || '#5a5a70';
        dc.lineWidth = isSelected ? 2 : 1.5;
        dc.stroke();
      }
      break;
    }

    case 'plant':
    case 'planter': {
      if (tmpl.shape === 'circle') {
        // Pot
        dc.beginPath();
        dc.arc(0, 0, r, 0, Math.PI * 2);
        dc.fillStyle = '#3a2f20';
        dc.fill();
        dc.strokeStyle = selColor || '#5a4a30';
        dc.lineWidth = isSelected ? 2 : 1;
        dc.stroke();

        // Foliage
        dc.beginPath();
        dc.arc(0, -2, r - 3, 0, Math.PI * 2);
        dc.fillStyle = 'rgba(34, 197, 94, 0.5)';
        dc.fill();

        // Leaf highlights
        dc.beginPath();
        dc.arc(-3, -4, r * 0.4, 0, Math.PI * 2);
        dc.fillStyle = 'rgba(74, 222, 128, 0.3)';
        dc.fill();
      } else {
        // Planter box
        roundRect(dc, -w / 2, -h / 2, w, h, 4);
        dc.fillStyle = '#3a2f20';
        dc.fill();
        dc.strokeStyle = selColor || '#5a4a30';
        dc.lineWidth = isSelected ? 2 : 1;
        dc.stroke();

        // Foliage row
        dc.fillStyle = 'rgba(34, 197, 94, 0.45)';
        roundRect(dc, -w / 2 + 3, -h / 2 + 2, w - 6, h - 5, 3);
        dc.fill();

        // Individual leaf bumps
        dc.fillStyle = 'rgba(74, 222, 128, 0.25)';
        for (let i = -w / 2 + 10; i < w / 2 - 5; i += 16) {
          dc.beginPath();
          dc.arc(i, -2, 5, 0, Math.PI * 2);
          dc.fill();
        }
      }
      break;
    }

    case 'hostess': {
      // Podium
      roundRect(dc, -w / 2, -h / 2, w, h, 4);
      dc.fillStyle = '#2a2040';
      dc.fill();
      dc.strokeStyle = selColor || '#6366f1';
      dc.lineWidth = isSelected ? 2 : 1.5;
      dc.stroke();

      // Screen/book
      dc.fillStyle = 'rgba(99, 102, 241, 0.2)';
      dc.fillRect(-w / 2 + 4, -h / 2 + 3, w - 8, h - 6);

      // Label
      dc.fillStyle = 'rgba(255,255,255,0.6)';
      dc.font = '8px Inter, sans-serif';
      dc.textAlign = 'center';
      dc.textBaseline = 'middle';
      dc.fillText('HOST', 0, 0);
      dc.textAlign = 'left';
      dc.textBaseline = 'alphabetic';
      break;
    }

    case 'restroom': {
      roundRect(dc, -w / 2, -h / 2, w, h, 4);
      dc.fillStyle = '#1e2a3a';
      dc.fill();
      dc.strokeStyle = selColor || '#4a6a8a';
      dc.lineWidth = isSelected ? 2 : 1;
      dc.stroke();

      dc.fillStyle = 'rgba(255,255,255,0.5)';
      dc.font = 'bold 10px Inter, sans-serif';
      dc.textAlign = 'center';
      dc.textBaseline = 'middle';
      dc.fillText('WC', 0, 0);
      dc.textAlign = 'left';
      dc.textBaseline = 'alphabetic';
      break;
    }

    case 'kitchen': {
      roundRect(dc, -w / 2, -h / 2, w, h, 3);
      dc.fillStyle = '#2a2a3a';
      dc.fill();
      dc.strokeStyle = selColor || '#6a6a8a';
      dc.lineWidth = isSelected ? 2 : 1;
      dc.stroke();

      // Hatch pattern
      dc.strokeStyle = 'rgba(255,255,255,0.06)';
      dc.lineWidth = 0.5;
      for (let i = -w / 2; i < w / 2; i += 8) {
        dc.beginPath();
        dc.moveTo(i, -h / 2);
        dc.lineTo(i + h, h / 2);
        dc.stroke();
      }

      // Pass window
      dc.fillStyle = 'rgba(245, 158, 11, 0.15)';
      dc.fillRect(-w / 2 + 8, -h / 2 + 4, w - 16, h - 8);

      dc.fillStyle = 'rgba(255,255,255,0.4)';
      dc.font = '8px Inter, sans-serif';
      dc.textAlign = 'center';
      dc.textBaseline = 'middle';
      dc.fillText('KITCHEN', 0, 0);
      dc.textAlign = 'left';
      dc.textBaseline = 'alphabetic';
      break;
    }

    case 'stairs': {
      roundRect(dc, -w / 2, -h / 2, w, h, 2);
      dc.fillStyle = '#2a2a3e';
      dc.fill();
      dc.strokeStyle = selColor || '#5a5a70';
      dc.lineWidth = isSelected ? 2 : 1;
      dc.stroke();

      // Step lines
      dc.strokeStyle = 'rgba(255,255,255,0.12)';
      dc.lineWidth = 1;
      const steps = Math.floor(h / 8);
      for (let i = 1; i < steps; i++) {
        const sy = -h / 2 + i * (h / steps);
        dc.beginPath();
        dc.moveTo(-w / 2 + 3, sy);
        dc.lineTo(w / 2 - 3, sy);
        dc.stroke();
      }

      // Arrow
      dc.strokeStyle = 'rgba(255,255,255,0.2)';
      dc.lineWidth = 1.5;
      dc.beginPath();
      dc.moveTo(0, h / 4);
      dc.lineTo(0, -h / 4);
      dc.moveTo(-4, -h / 4 + 6);
      dc.lineTo(0, -h / 4);
      dc.lineTo(4, -h / 4 + 6);
      dc.stroke();
      break;
    }

    case 'fireplace': {
      // Mantel
      roundRect(dc, -w / 2, -h / 2, w, h, 3);
      dc.fillStyle = '#3a2820';
      dc.fill();
      dc.strokeStyle = selColor || '#6a4a30';
      dc.lineWidth = isSelected ? 2 : 1.5;
      dc.stroke();

      // Fire glow
      dc.fillStyle = 'rgba(245, 158, 11, 0.2)';
      dc.beginPath();
      dc.arc(0, 0, Math.min(w, h) * 0.35, 0, Math.PI * 2);
      dc.fill();
      dc.fillStyle = 'rgba(239, 68, 68, 0.15)';
      dc.beginPath();
      dc.arc(0, 2, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      dc.fill();

      dc.fillStyle = 'rgba(255,200,100,0.5)';
      dc.font = '7px Inter, sans-serif';
      dc.textAlign = 'center';
      dc.textBaseline = 'middle';
      dc.fillText('🔥', 0, 0);
      dc.textAlign = 'left';
      dc.textBaseline = 'alphabetic';
      break;
    }

    default: {
      // Generic fixture fallback
      const fw = w; const fh = h;
      roundRect(dc, -fw / 2, -fh / 2, fw, fh, 3);
      dc.fillStyle = '#2a2a3e';
      dc.fill();
      dc.strokeStyle = selColor || '#5a5a7a';
      dc.lineWidth = 1;
      dc.stroke();
    }
  }

  // Selection highlight ring for all fixtures
  if (isSelected) {
    dc.shadowColor = 'rgba(99, 102, 241, 0.5)';
    dc.shadowBlur = 12;
    if (tmpl.shape === 'circle') {
      dc.beginPath();
      dc.arc(0, 0, r + 4, 0, Math.PI * 2);
      dc.strokeStyle = '#818cf8';
      dc.lineWidth = 2;
      dc.stroke();
    } else {
      roundRect(dc, -w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 4);
      dc.strokeStyle = '#818cf8';
      dc.lineWidth = 2;
      dc.stroke();
    }
    dc.shadowBlur = 0;
  }
}

function roundRect(dc, x, y, w, h, r) {
  dc.beginPath();
  dc.moveTo(x + r, y);
  dc.lineTo(x + w - r, y);
  dc.quadraticCurveTo(x + w, y, x + w, y + r);
  dc.lineTo(x + w, y + h - r);
  dc.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  dc.lineTo(x + r, y + h);
  dc.quadraticCurveTo(x, y + h, x, y + h - r);
  dc.lineTo(x, y + r);
  dc.quadraticCurveTo(x, y, x + r, y);
  dc.closePath();
}

// ============================================
// IN-PROGRESS ZONE DRAWING
// ============================================
function drawInProgressZone() {
  const pts = AppState.zoneDrawPoints;
  if (pts.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw dots
  pts.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
  });
}

// ============================================
// HIT TESTING
// ============================================
function hitTestTable(mx, my) {
  const tables = getTablesForFloor(AppState.activeFloorId);
  // Reverse to pick top-most
  for (let i = tables.length - 1; i >= 0; i--) {
    const t = tables[i];
    const tmpl = getTemplate(t.tableTemplateId);
    if (!tmpl) continue;

    // Simple bounding check (ignore rotation for simplicity)
    const halfW = tmpl.shape === 'circle' ? (tmpl.radius || 22) : (tmpl.width || 50) / 2;
    const halfH = tmpl.shape === 'circle' ? (tmpl.radius || 22) : (tmpl.height || 50) / 2;
    const pad = 8;
    if (mx >= t.x - halfW - pad && mx <= t.x + halfW + pad &&
        my >= t.y - halfH - pad && my <= t.y + halfH + pad) {
      return t;
    }
  }
  return null;
}

function hitTestZone(mx, my) {
  const zones = getZonesForFloor(AppState.activeFloorId);
  for (const zone of zones) {
    if (pointInPolygon(mx, my, zone.polygonPoints)) return zone;
  }
  return null;
}

function pointInPolygon(x, y, pts) {
  if (!pts || pts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    if (((pts[i].y > y) !== (pts[j].y > y)) &&
        (x < (pts[j].x - pts[i].x) * (y - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x)) {
      inside = !inside;
    }
  }
  return inside;
}

// ============================================
// MOUSE EVENTS
// ============================================
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onMouseDown(e) {
  if (AppState.mode === 'viewer') return;
  const { x, y } = getCanvasCoords(e);
  const version = getActiveVersion();
  const isEditable = version?.status === 'DRAFT';

  if (AppState.editorTool === 'zone_draw') {
    if (!isEditable) {
      showToast('Switch to a draft version to edit.');
      return;
    }
    AppState.zoneDrawPoints.push({ x, y });
    return;
  }

  if (AppState.editorTool === 'combine') {
    if (!isEditable) {
      showToast('Switch to a draft version to edit.');
      return;
    }
    const hit = hitTestTable(x, y);
    if (hit) {
      if (!AppState.combineFirstId) {
        AppState.combineFirstId = hit.id;
        AppState.selectedTableId = hit.id;
        AppState.selectedZoneId = null;
        refreshInspector();
      } else if (hit.id !== AppState.combineFirstId) {
        // Create edge
        const a = getFloorTable(AppState.combineFirstId);
        const b = hit;
        const tmplA = getTemplate(a.tableTemplateId);
        const tmplB = getTemplate(b.tableTemplateId);
        const maxSize = (tmplA?.maxPartySize || 2) + (tmplB?.maxPartySize || 2);
        addCombineEdge(AppState.activeFloorId, AppState.combineFirstId, hit.id, maxSize);
        AppState.combineFirstId = null;
        AppState.editorTool = 'select';
        refreshToolbar();
      }
    }
    return;
  }

  // Normal select mode
  const table = hitTestTable(x, y);
  if (table) {
    AppState.selectedTableId = table.id;
    AppState.selectedZoneId = null;
    refreshInspector();
    if (isEditable) {
      isDragging = true;
      dragOffsetX = x - table.x;
      dragOffsetY = y - table.y;
    }
    return;
  }

  // Check zone hit
  const zone = hitTestZone(x, y);
  if (zone) {
    AppState.selectedTableId = null;
    AppState.selectedZoneId = zone.id;
    refreshInspector();
    return;
  }

  // Deselect
  AppState.selectedTableId = null;
  AppState.selectedZoneId = null;
  refreshInspector();
}

function onMouseMove(e) {
  if (!isDragging || !AppState.selectedTableId) return;
  const { x, y } = getCanvasCoords(e);
  const table = getFloorTable(AppState.selectedTableId);
  if (table) {
    table.x = Math.round(x - dragOffsetX);
    table.y = Math.round(y - dragOffsetY);
  }
}

function onMouseUp(e) {
  if (isDragging && AppState.selectedTableId) {
    const table = getFloorTable(AppState.selectedTableId);
    if (table) saveState();
    refreshInspector();
  }
  isDragging = false;
}

function onDblClick(e) {
  const version = getActiveVersion();
  if (version?.status !== 'DRAFT') return;

  if (AppState.editorTool === 'zone_draw' && AppState.zoneDrawPoints.length >= 3) {
    const name = prompt('Zone name:');
    if (name) {
      addZone(AppState.activeFloorId, name, [...AppState.zoneDrawPoints]);
      refreshUI();
    }
    AppState.zoneDrawPoints = [];
    AppState.editorTool = 'select';
    refreshToolbar();
  }
}

function onKeyDown(e) {
  const tagName = e.target?.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || e.target?.isContentEditable) {
    return;
  }

  if (e.key === 'Escape') {
    if (AppState.editorTool === 'zone_draw') {
      AppState.zoneDrawPoints = [];
      AppState.editorTool = 'select';
      refreshToolbar();
    }
    if (AppState.editorTool === 'combine') {
      AppState.combineFirstId = null;
      AppState.editorTool = 'select';
      refreshToolbar();
    }
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const version = getActiveVersion();
    if (version?.status !== 'DRAFT') return;
    if (AppState.selectedTableId) {
      removeTable(AppState.selectedTableId);
      refreshUI();
    } else if (AppState.selectedZoneId) {
      deleteZone(AppState.selectedZoneId);
      refreshUI();
    }
  }
}

// ============================================
// DRAG & DROP (FROM TEMPLATE SIDEBAR)
// ============================================
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

function onDrop(e) {
  e.preventDefault();
  const version = getActiveVersion();
  if (version?.status !== 'DRAFT') {
    showToast('Select a draft version first.');
    return;
  }
  if (!AppState.activeFloorId) {
    showToast('Select a floor first.');
    return;
  }
  const templateId = e.dataTransfer.getData('text/plain');
  if (!templateId || !getTemplate(templateId)) return;
  const { x, y } = getCanvasCoords(e);
  const table = placeTable(AppState.activeFloorId, templateId, Math.round(x), Math.round(y));
  AppState.selectedTableId = table.id;
  AppState.selectedZoneId = null;
  refreshUI();
}
