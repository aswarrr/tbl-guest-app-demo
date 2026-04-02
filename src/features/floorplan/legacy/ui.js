//ui.js
/**
 * Floorplan Editor – UI Layer
 * Sidebar, inspector, toolbar logic + guest viewer mode
 */

// ============================================
// TOAST
// ============================================
function showToast(msg, duration = 2500) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ============================================
// FULL UI REFRESH
// ============================================
function refreshUI() {
  refreshToolbar();
  refreshSidebar();
  refreshInspector();
  resizeCanvas();
  if (AppState.mode === 'viewer') {
    refreshMobileViewer();
  }
}

// ============================================
// TOOLBAR
// ============================================
function refreshToolbar() {
  const version = getActiveVersion();
  const draft = getDraftVersion();
  const pub = getPublishedVersion();

  const btnCreateDraft = document.getElementById('btn-create-draft');
  const btnPublish = document.getElementById('btn-publish');
  const btnViewMode = document.getElementById('btn-view-mode');
  const btnZoneDraw = document.getElementById('btn-zone-draw');
  const btnCombine = document.getElementById('btn-combine');
  const toolIndicator = document.getElementById('tool-indicator');

  if (AppState.mode === 'viewer') {
    btnCreateDraft.style.display = 'none';
    btnPublish.style.display = 'none';
    btnZoneDraw.style.display = 'none';
    btnCombine.style.display = 'none';
    btnViewMode.textContent = '✏️ Editor';
    toolIndicator.textContent = 'Viewer Mode';
    return;
  }

  btnCreateDraft.style.display = '';
  btnPublish.style.display = '';
  btnZoneDraw.style.display = '';
  btnCombine.style.display = '';
  btnViewMode.textContent = '👁 Guest View';

  btnCreateDraft.disabled = !!draft;
  btnPublish.disabled = !draft || version?.status !== 'DRAFT';

  // Update Versions Dropdown
  const vs = document.getElementById('version-selector');
  if (vs) {
    vs.innerHTML = '';

    const versions = typeof sortVersionsDesc === 'function'
      ? sortVersionsDesc(AppState.versions)
      : [...AppState.versions];

    if (versions.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No versions';
      vs.appendChild(opt);
      vs.disabled = true;
    } else {
      vs.disabled = false;
      versions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;

        const versionNo = Number(v.versionNo ?? v.version_no ?? 0);
        const createdAt = v.createdAt || v.created_at;
        const dateLabel = createdAt ? ` · ${new Date(createdAt).toLocaleDateString()}` : '';

        if (v.status === 'PUBLISHED') {
          opt.textContent = `v${versionNo} (Published)${dateLabel}`;
        } else if (v.status === 'DRAFT') {
          opt.textContent = `v${versionNo} (Draft)${dateLabel}`;
        } else {
          opt.textContent = `v${versionNo} (Archived)${dateLabel}`;
        }
        vs.appendChild(opt);
      });

      if (AppState.activeVersionId) {
        vs.value = AppState.activeVersionId;
      }
    }
  }

  // Tool state
  btnZoneDraw.classList.toggle('active', AppState.editorTool === 'zone_draw');
  btnCombine.classList.toggle('active', AppState.editorTool === 'combine');

  if (AppState.editorTool === 'zone_draw') {
    toolIndicator.textContent = '🟢 Drawing zone — click to add points, double-click to finish';
  } else if (AppState.editorTool === 'combine') {
    toolIndicator.textContent = AppState.combineFirstId
      ? '🟡 Click second table to combine'
      : '🟡 Click first table to start combining';
  } else {
    toolIndicator.textContent = '';
  }
}

// ============================================
// LEFT SIDEBAR
// ============================================
function refreshSidebar() {
  const version = getActiveVersion();
  const isEditor = AppState.mode === 'editor';
  const isDraft = version?.status === 'DRAFT';

  // Templates palette
  const templatesEl = document.getElementById('templates-list');
  templatesEl.innerHTML = '';

  // Group templates by type for visual separation
  let lastType = '';
  AppState.tableTemplates.forEach(tmpl => {
    // Add section divider when type changes
    if (tmpl.type !== lastType) {
      lastType = tmpl.type;
      const divider = document.createElement('div');
      divider.className = 'template-divider';
      divider.textContent = tmpl.type.charAt(0).toUpperCase() + tmpl.type.slice(1);
      templatesEl.appendChild(divider);
    }

    const item = document.createElement('div');
    item.className = 'template-item';
    item.draggable = isEditor && isDraft;

    const iconMap = {
      dining: '🍽', booth: '🛋', bar: '🍸', lounge: '🛏', communal: '👥',
    };
    const fixtureIconMap = {
      wall: '🧱', wall_corner: '🧱', window: '🪟', door: '🚪',
      sliding_door: '🚪', pillar: '🏛', plant: '🌿', planter: '🌿',
      hostess: '🎙', restroom: '🚻', kitchen: '🍳', stairs: '🪜', fireplace: '🔥',
    };

    let icon, detail;
    if (tmpl.type === 'fixture') {
      icon = fixtureIconMap[tmpl.fixtureKind] || '🔧';
      const dims = tmpl.shape === 'circle' ? `r${tmpl.radius}` : `${tmpl.width}×${tmpl.height}`;
      detail = `fixture · ${dims}`;
    } else {
      icon = iconMap[tmpl.type] || (tmpl.shape === 'circle' ? '⬤' : '▬');
      detail = `${tmpl.type} · ${tmpl.minPartySize}-${tmpl.maxPartySize} seats`;
    }

    item.innerHTML = `
      <div class="template-icon">${icon}</div>
      <div class="template-info">
        <span class="template-name">${tmpl.name}</span>
        <span class="template-detail">${detail}</span>
      </div>
    `;
    item.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', tmpl.id);
      e.dataTransfer.effectAllowed = 'copy';
    });
    templatesEl.appendChild(item);
  });

  // Floors
  const floorsEl = document.getElementById('floors-list');
  floorsEl.innerHTML = '';
  if (!version) return;

  const floors = getFloorsForVersion(version.id);
  floors.forEach(floor => {
    const item = document.createElement('div');
    item.className = `floor-item${floor.id === AppState.activeFloorId ? ' active' : ''}`;
    item.innerHTML = `
      <span class="floor-name">${floor.isMain ? '⭐ ' : ''}${floor.name}</span>
      <span class="floor-count">${getTablesForFloor(floor.id).length} tables</span>
    `;
    item.addEventListener('click', () => {
      AppState.activeFloorId = floor.id;
      AppState.selectedTableId = null;
      AppState.selectedZoneId = null;
      resizeCanvas();
      refreshUI();
    });
    floorsEl.appendChild(item);
  });

  // Add floor button
  const addFloorBtn = document.getElementById('btn-add-floor');
  addFloorBtn.style.display = isEditor && isDraft ? '' : 'none';

  // Zones list
  const zonesEl = document.getElementById('zones-list');
  zonesEl.innerHTML = '';
  if (AppState.activeFloorId) {
    const zones = getZonesForFloor(AppState.activeFloorId);
    zones.forEach(zone => {
      const item = document.createElement('div');
      item.className = `zone-item${zone.id === AppState.selectedZoneId ? ' active' : ''}`;
      item.innerHTML = `<span>${zone.name}</span>`;
      item.addEventListener('click', () => {
        if (AppState.mode === 'viewer') {
          // Toggle zone filter in viewer
          AppState.selectedZoneId = AppState.selectedZoneId === zone.id ? null : zone.id;
          highlightZoneTables(zone.id);
        } else {
          AppState.selectedTableId = null;
          AppState.selectedZoneId = zone.id;
        }
        refreshInspector();
        refreshSidebar();
      });
      zonesEl.appendChild(item);
    });
  }

  // Edges list
  const edgesEl = document.getElementById('edges-list');
  edgesEl.innerHTML = '';
  if (AppState.activeFloorId) {
    const edges = getEdgesForFloor(AppState.activeFloorId);
    edges.forEach(edge => {
      const a = getFloorTable(edge.aId);
      const b = getFloorTable(edge.bId);
      const item = document.createElement('div');
      item.className = 'edge-item';
      item.innerHTML = `
        <span>${a?.label || '?'} ↔ ${b?.label || '?'} (max ${edge.combinedMaxPartySize})</span>
        ${isEditor && isDraft ? '<button class="btn-sm btn-danger" title="Remove">✕</button>' : ''}
      `;
      const delBtn = item.querySelector('.btn-danger');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeCombineEdge(edge.id);
          refreshUI();
        });
      }
      edgesEl.appendChild(item);
    });
  }
}

// ============================================
// VIEWER ZONE FILTER
// ============================================
function highlightZoneTables(zoneId) {
  // In viewer mode, filtering zones just selects the zone visually
  // The render loop already handles highlighting
}

// ============================================
// MOBILE VIEWER
// ============================================
let mobileCanvas = null;
let mobileCtx = null;
let mobileRafId = null;

// Zoom & pan state
let mobileZoom = 1;
let mobilePanX = 0;
let mobilePanY = 0;
const MOBILE_ZOOM_MIN = 1;
const MOBILE_ZOOM_MAX = 5;

// Touch tracking
let _touchStartDist = 0;
let _touchStartZoom = 1;
let _touchStartPanX = 0;
let _touchStartPanY = 0;
let _touchStartMidX = 0;
let _touchStartMidY = 0;
let _isPinching = false;
let _isPanning = false;
let _panLastX = 0;
let _panLastY = 0;
let _lastTapTime = 0;

function openMobileViewer() {
  const overlay = document.getElementById('mobile-viewer');
  overlay.style.display = '';

  mobileCanvas = document.getElementById('mobile-canvas');
  mobileCtx = mobileCanvas.getContext('2d');

  // Reset zoom/pan
  mobileZoom = 1;
  mobilePanX = 0;
  mobilePanY = 0;

  // Size the canvas after layout settles
  requestAnimationFrame(() => {
    sizeMobileCanvas();
  });

  renderMobileFloorTabs();
  renderMobileZoneChips();
  clearMobileTableInfo();

  // Touch events for pinch-to-zoom and pan
  mobileCanvas.addEventListener('touchstart', onMobileTouchStart, { passive: false });
  mobileCanvas.addEventListener('touchmove', onMobileTouchMove, { passive: false });
  mobileCanvas.addEventListener('touchend', onMobileTouchEnd, { passive: false });

  // Click/tap to inspect (for desktop mouse)
  mobileCanvas.onclick = onMobileCanvasTap;

  // Mouse wheel zoom for desktop testing
  mobileCanvas.addEventListener('wheel', onMobileWheel, { passive: false });

  // Close button
  document.getElementById('mobile-close').onclick = closeMobileViewer;

  // Resize handler
  window._mobileResizeHandler = () => {
    if (AppState.mode === 'viewer') sizeMobileCanvas();
  };
  window.addEventListener('resize', window._mobileResizeHandler);

  // Start render loop
  if (mobileRafId) cancelAnimationFrame(mobileRafId);
  mobileRenderLoop();
}

function sizeMobileCanvas() {
  if (!mobileCanvas) return;
  const wrap = mobileCanvas.parentElement;
  const availW = wrap.clientWidth || 360;
  const availH = wrap.clientHeight || 560;

  const floor = getFloor(AppState.activeFloorId);
  const floorW = floor?.backgroundWidth || 900;
  const floorH = floor?.backgroundHeight || 600;

  const fitScale = Math.min(availW / floorW, availH / floorH);
  const cssW = Math.round(floorW * fitScale);
  const cssH = Math.round(floorH * fitScale);

  // Hi-DPI: multiply backing store by devicePixelRatio
  const dpr = window.devicePixelRatio || 1;
  mobileCanvas.width = Math.round(cssW * dpr);
  mobileCanvas.height = Math.round(cssH * dpr);
  mobileCanvas.style.width = cssW + 'px';
  mobileCanvas.style.height = cssH + 'px';
}

function closeMobileViewer() {
  const overlay = document.getElementById('mobile-viewer');
  overlay.style.display = 'none';

  if (mobileRafId) { cancelAnimationFrame(mobileRafId); mobileRafId = null; }
  if (window._mobileResizeHandler) {
    window.removeEventListener('resize', window._mobileResizeHandler);
    window._mobileResizeHandler = null;
  }
  // Clean up touch listeners
  if (mobileCanvas) {
    mobileCanvas.removeEventListener('touchstart', onMobileTouchStart);
    mobileCanvas.removeEventListener('touchmove', onMobileTouchMove);
    mobileCanvas.removeEventListener('touchend', onMobileTouchEnd);
    mobileCanvas.removeEventListener('wheel', onMobileWheel);
  }

  // Switch back to editor mode without changing the selected version
  AppState.mode = 'editor';
  const floors = getFloorsForVersion(AppState.activeVersionId);
  AppState.activeFloorId = floors.find(f => f.id === AppState.activeFloorId)?.id
    || floors.find(f => f.isMain)?.id
    || floors[0]?.id
    || null;
  AppState.selectedTableId = null;
  AppState.selectedZoneId = null;
  resizeCanvas();
  refreshUI();
}

function mobileRenderLoop() {
  renderMobileCanvas();
  mobileRafId = requestAnimationFrame(mobileRenderLoop);
}

/** Get the scale from floor coords to CSS pixels (before DPR) */
function getMobileFitScale() {
  const wrap = mobileCanvas?.parentElement;
  const availW = wrap?.clientWidth || 360;
  const availH = wrap?.clientHeight || 560;
  const floor = getFloor(AppState.activeFloorId);
  const floorW = floor?.backgroundWidth || 900;
  const floorH = floor?.backgroundHeight || 600;
  return Math.min(availW / floorW, availH / floorH);
}

function clampPan() {
  const floor = getFloor(AppState.activeFloorId);
  const floorW = floor?.backgroundWidth || 900;
  const floorH = floor?.backgroundHeight || 600;
  const fitScale = getMobileFitScale();
  const viewW = (mobileCanvas?.clientWidth || 360);
  const viewH = (mobileCanvas?.clientHeight || 560);

  // How much of the floor is visible in CSS px at current zoom
  const visibleW = viewW / (fitScale * mobileZoom);
  const visibleH = viewH / (fitScale * mobileZoom);

  // Pan limits in floor coords
  const maxPanX = Math.max(0, floorW - visibleW);
  const maxPanY = Math.max(0, floorH - visibleH);
  mobilePanX = Math.max(0, Math.min(mobilePanX, maxPanX));
  mobilePanY = Math.max(0, Math.min(mobilePanY, maxPanY));
}

function renderMobileCanvas() {
  if (!mobileCtx || !mobileCanvas) return;

  const floor = getFloor(AppState.activeFloorId);
  const floorW = floor?.backgroundWidth || 900;
  const floorH = floor?.backgroundHeight || 600;

  // Recalculate canvas size if needed
  const wrap = mobileCanvas.parentElement;
  const availW = wrap.clientWidth || 360;
  const availH = wrap.clientHeight || 560;
  const fitScale = Math.min(availW / floorW, availH / floorH);
  const cssW = Math.round(floorW * fitScale);
  const cssH = Math.round(floorH * fitScale);
  const dpr = window.devicePixelRatio || 1;
  const targetW = Math.round(cssW * dpr);
  const targetH = Math.round(cssH * dpr);

  if (mobileCanvas.width !== targetW || mobileCanvas.height !== targetH) {
    mobileCanvas.width = targetW;
    mobileCanvas.height = targetH;
    mobileCanvas.style.width = cssW + 'px';
    mobileCanvas.style.height = cssH + 'px';
  }

  clampPan();

  // Total scale: fitScale * zoom * dpr
  const totalScale = fitScale * mobileZoom * dpr;

  mobileCtx.save();

  // Apply DPR + fit + zoom + pan
  mobileCtx.scale(totalScale, totalScale);
  mobileCtx.translate(-mobilePanX, -mobilePanY);

  // Clear in floor coords
  mobileCtx.clearRect(mobilePanX, mobilePanY, floorW, floorH);
  mobileCtx.fillStyle = '#12121f';
  mobileCtx.fillRect(mobilePanX, mobilePanY, floorW, floorH);

  const floorId = AppState.activeFloorId;
  if (!floorId) { mobileCtx.restore(); return; }

  // Zones
  const zones = getZonesForFloor(floorId);
  zones.forEach((zone, i) => {
    drawZone(zone, i, zone.id === AppState.selectedZoneId, mobileCtx);
  });

  // Combine edges
  const edges = getEdgesForFloor(floorId);
  edges.forEach(edge => drawCombineEdge(edge, mobileCtx));

  // Tables
  const tables = getTablesForFloor(floorId);
  tables.forEach(table => {
    const isSelected = table.id === AppState.selectedTableId;
    drawFloorTable(table, isSelected, mobileCtx);
  });

  mobileCtx.restore();

  // Draw zoom indicator if zoomed
  if (mobileZoom > 1.05) {
    const indCtx = mobileCtx;
    indCtx.save();
    indCtx.scale(dpr, dpr);  // just DPR for the overlay
    indCtx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(indCtx, cssW - 62, 8, 54, 24, 12);
    indCtx.fill();
    indCtx.fillStyle = 'rgba(255,255,255,0.85)';
    indCtx.font = '11px Inter, sans-serif';
    indCtx.textAlign = 'center';
    indCtx.textBaseline = 'middle';
    indCtx.fillText(`${mobileZoom.toFixed(1)}×`, cssW - 35, 20);
    indCtx.textAlign = 'left';
    indCtx.textBaseline = 'alphabetic';
    indCtx.restore();
  }
}

// --- Touch handlers ---

function _touchDist(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function onMobileTouchStart(e) {
  if (e.touches.length === 2) {
    e.preventDefault();
    _isPinching = true;
    _isPanning = false;
    _touchStartDist = _touchDist(e.touches[0], e.touches[1]);
    _touchStartZoom = mobileZoom;
    _touchStartPanX = mobilePanX;
    _touchStartPanY = mobilePanY;

    const rect = mobileCanvas.getBoundingClientRect();
    _touchStartMidX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
    _touchStartMidY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
  } else if (e.touches.length === 1 && mobileZoom > 1.05) {
    // Single finger pan when zoomed
    _isPanning = true;
    _isPinching = false;
    _panLastX = e.touches[0].clientX;
    _panLastY = e.touches[0].clientY;
  }
}

function onMobileTouchMove(e) {
  if (_isPinching && e.touches.length === 2) {
    e.preventDefault();
    const dist = _touchDist(e.touches[0], e.touches[1]);
    const ratio = dist / _touchStartDist;
    const newZoom = Math.max(MOBILE_ZOOM_MIN, Math.min(MOBILE_ZOOM_MAX, _touchStartZoom * ratio));

    // Zoom toward the pinch midpoint
    const fitScale = getMobileFitScale();
    const midFloorX = _touchStartPanX + _touchStartMidX / (fitScale * _touchStartZoom);
    const midFloorY = _touchStartPanY + _touchStartMidY / (fitScale * _touchStartZoom);

    mobilePanX = midFloorX - _touchStartMidX / (fitScale * newZoom);
    mobilePanY = midFloorY - _touchStartMidY / (fitScale * newZoom);
    mobileZoom = newZoom;
    clampPan();
  } else if (_isPanning && e.touches.length === 1) {
    e.preventDefault();
    const dx = e.touches[0].clientX - _panLastX;
    const dy = e.touches[0].clientY - _panLastY;
    _panLastX = e.touches[0].clientX;
    _panLastY = e.touches[0].clientY;

    const fitScale = getMobileFitScale();
    mobilePanX -= dx / (fitScale * mobileZoom);
    mobilePanY -= dy / (fitScale * mobileZoom);
    clampPan();
  }
}

function onMobileTouchEnd(e) {
  if (e.touches.length < 2) _isPinching = false;
  if (e.touches.length === 0) {
    if (_isPanning) {
      _isPanning = false;
      return; // don't trigger tap after panning
    }

    // Double-tap to reset zoom
    const now = Date.now();
    if (now - _lastTapTime < 300) {
      mobileZoom = 1;
      mobilePanX = 0;
      mobilePanY = 0;
      _lastTapTime = 0;
    } else {
      _lastTapTime = now;
    }
  }
}

function onMobileWheel(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const oldZoom = mobileZoom;
  mobileZoom = Math.max(MOBILE_ZOOM_MIN, Math.min(MOBILE_ZOOM_MAX, mobileZoom * delta));

  // Zoom toward cursor
  const rect = mobileCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const fitScale = getMobileFitScale();

  const floorX = mobilePanX + mx / (fitScale * oldZoom);
  const floorY = mobilePanY + my / (fitScale * oldZoom);
  mobilePanX = floorX - mx / (fitScale * mobileZoom);
  mobilePanY = floorY - my / (fitScale * mobileZoom);
  clampPan();
}

// --- UI pieces ---

function renderMobileFloorTabs() {
  const tabsEl = document.getElementById('mobile-floor-tabs');
  tabsEl.innerHTML = '';
  const version = getActiveVersion();
  if (!version) return;

  const floors = getFloorsForVersion(version.id);
  floors.forEach(floor => {
    const tab = document.createElement('div');
    tab.className = `mobile-floor-tab${floor.id === AppState.activeFloorId ? ' active' : ''}`;
    tab.textContent = floor.name;
    tab.addEventListener('click', () => {
      AppState.activeFloorId = floor.id;
      AppState.selectedTableId = null;
      AppState.selectedZoneId = null;
      mobileZoom = 1; mobilePanX = 0; mobilePanY = 0; // reset zoom on floor switch
      sizeMobileCanvas();
      renderMobileFloorTabs();
      renderMobileZoneChips();
      clearMobileTableInfo();
    });
    tabsEl.appendChild(tab);
  });
}

function renderMobileZoneChips() {
  const chipsEl = document.getElementById('mobile-zone-chips');
  chipsEl.innerHTML = '';
  if (!AppState.activeFloorId) return;

  const zones = getZonesForFloor(AppState.activeFloorId);
  // "All" chip
  const allChip = document.createElement('div');
  allChip.className = `mobile-zone-chip${!AppState.selectedZoneId ? ' active' : ''}`;
  allChip.textContent = 'All';
  allChip.addEventListener('click', () => {
    AppState.selectedZoneId = null;
    renderMobileZoneChips();
  });
  chipsEl.appendChild(allChip);

  zones.forEach(zone => {
    const chip = document.createElement('div');
    chip.className = `mobile-zone-chip${zone.id === AppState.selectedZoneId ? ' active' : ''}`;
    chip.textContent = zone.name;
    chip.addEventListener('click', () => {
      AppState.selectedZoneId = AppState.selectedZoneId === zone.id ? null : zone.id;
      renderMobileZoneChips();
    });
    chipsEl.appendChild(chip);
  });
}

function onMobileCanvasTap(e) {
  const rect = mobileCanvas.getBoundingClientRect();
  const fitScale = getMobileFitScale();

  // Convert screen coords → floor coords, accounting for zoom & pan
  const mx = mobilePanX + (e.clientX - rect.left) / (fitScale * mobileZoom);
  const my = mobilePanY + (e.clientY - rect.top) / (fitScale * mobileZoom);

  const table = hitTestTable(mx, my);
  if (table) {
    AppState.selectedTableId = table.id;
    showMobileTableInfo(table);
  } else {
    AppState.selectedTableId = null;
    clearMobileTableInfo();
  }
}

function showMobileTableInfo(table) {
  const infoEl = document.getElementById('mobile-table-info');
  const tmpl = getTemplate(table.tableTemplateId);
  const zone = table.zoneId ? AppState.zones.find(z => z.id === table.zoneId) : null;

  const iconMap = { dining: '🍽', booth: '🛋', bar: '🍸', lounge: '🛏', communal: '👥' };
  const fixtureIconMap = {
    wall: '🧱', wall_corner: '🧱', window: '🪟', door: '🚪',
    sliding_door: '🚪', pillar: '🏛', plant: '🌿', planter: '🌿',
    hostess: '🎙', restroom: '🚻', kitchen: '🍳', stairs: '🪜', fireplace: '🔥',
  };

  let icon, metaHtml;
  if (tmpl?.type === 'fixture') {
    icon = fixtureIconMap[tmpl.fixtureKind] || '🔧';
    const dims = tmpl.shape === 'circle' ? `r=${tmpl.radius}` : `${tmpl.width}×${tmpl.height}`;
    metaHtml = `
      <span>📐 ${tmpl.name}</span>
      <span>📏 ${dims}</span>
      ${zone ? `<span>📍 ${zone.name}</span>` : ''}
    `;
  } else {
    icon = iconMap[tmpl?.type] || '🪑';
    metaHtml = `
      <span>📐 ${tmpl?.name || 'Unknown'}</span>
      <span>👤 ${tmpl?.minPartySize || '?'}–${tmpl?.maxPartySize || '?'} seats</span>
      ${zone ? `<span>📍 ${zone.name}</span>` : ''}
      ${!table.isActive ? '<span>🚫 Inactive</span>' : ''}
    `;
  }

  infoEl.innerHTML = `
    <div class="mobile-table-card">
      <h4>${icon} ${table.label}</h4>
      <div class="meta">${metaHtml}</div>
    </div>
  `;
}

function clearMobileTableInfo() {
  document.getElementById('mobile-table-info').innerHTML = '';
}

function refreshMobileViewer() {
  renderMobileFloorTabs();
  renderMobileZoneChips();
}

// ============================================
// RIGHT INSPECTOR
// ============================================
function refreshInspector() {
  const version = getActiveVersion();
  const isEditor = AppState.mode === 'editor';
  const isDraft = version?.status === 'DRAFT';
  const editable = isEditor && isDraft;
  const panel = document.getElementById('inspector-content');

  if (AppState.selectedTableId) {
    const table = getFloorTable(AppState.selectedTableId);
    const tmpl = getTemplate(table?.tableTemplateId);
    if (!table) { panel.innerHTML = ''; return; }

    const zones = getZonesForFloor(AppState.activeFloorId);
    const zoneOptions = zones.map(z =>
      `<option value="${z.id}" ${table.zoneId === z.id ? 'selected' : ''}>${z.name}</option>`
    ).join('');

    panel.innerHTML = `
      <h3>Table: ${table.label}</h3>
      <div class="inspector-row">
        <label>Template</label>
        <span class="value">${tmpl?.name || 'Unknown'}</span>
      </div>
      <div class="inspector-row">
        <label>Capacity</label>
        <span class="value">${tmpl?.minPartySize || '?'} – ${tmpl?.maxPartySize || '?'}</span>
      </div>
      <div class="inspector-row">
        <label>Label</label>
        <input type="text" id="inp-label" value="${table.label}" ${editable ? '' : 'disabled'} />
      </div>
      <div class="inspector-row">
        <label>X / Y</label>
        <span class="value">${Math.round(table.x)}, ${Math.round(table.y)}</span>
      </div>
      <div class="inspector-row">
        <label>Rotation (°)</label>
        <input type="number" id="inp-rotation" value="${table.rotationDeg}" step="15" ${editable ? '' : 'disabled'} />
      </div>
      <div class="inspector-row">
        <label>Zone</label>
        <select id="sel-zone" ${editable ? '' : 'disabled'}>
          <option value="">None</option>
          ${zoneOptions}
        </select>
      </div>
      <div class="inspector-row">
        <label>Active</label>
        <input type="checkbox" id="chk-active" ${table.isActive ? 'checked' : ''} ${editable ? '' : 'disabled'} />
      </div>
      ${editable ? '<button id="btn-delete-table" class="btn btn-danger full-width">Delete Table</button>' : ''}
    `;

    if (editable) {
      document.getElementById('inp-label').addEventListener('change', e => {
        updateTable(table.id, { label: e.target.value });
      });
      document.getElementById('inp-rotation').addEventListener('change', e => {
        updateTable(table.id, { rotationDeg: parseFloat(e.target.value) || 0 });
      });
      document.getElementById('sel-zone').addEventListener('change', e => {
        updateTable(table.id, { zoneId: e.target.value || null });
      });
      document.getElementById('chk-active').addEventListener('change', e => {
        updateTable(table.id, { isActive: e.target.checked });
      });
      document.getElementById('btn-delete-table').addEventListener('click', () => {
        removeTable(table.id);
        refreshUI();
      });
    }

  } else if (AppState.selectedZoneId) {
    const zone = AppState.zones.find(z => z.id === AppState.selectedZoneId);
    if (!zone) { panel.innerHTML = ''; return; }

    panel.innerHTML = `
      <h3>Zone: ${zone.name}</h3>
      <div class="inspector-row">
        <label>Name</label>
        <input type="text" id="inp-zone-name" value="${zone.name}" ${editable ? '' : 'disabled'} />
      </div>
      <div class="inspector-row">
        <label>Points</label>
        <span class="value">${zone.polygonPoints?.length || 0} vertices</span>
      </div>
      ${editable ? '<button id="btn-delete-zone" class="btn btn-danger full-width">Delete Zone</button>' : ''}
    `;

    if (editable) {
      document.getElementById('inp-zone-name').addEventListener('change', e => {
        updateZone(zone.id, { name: e.target.value });
        refreshSidebar();
      });
      document.getElementById('btn-delete-zone').addEventListener('click', () => {
        deleteZone(zone.id);
        refreshUI();
      });
    }

  } else {
    // Floor info
    const floor = getFloor(AppState.activeFloorId);
    if (!floor) { panel.innerHTML = '<p class="empty-text">Select a floor</p>'; return; }

    panel.innerHTML = `
      <h3>Floor: ${floor.name}</h3>
      <div class="inspector-row">
        <label>Name</label>
        <input type="text" id="inp-floor-name" value="${floor.name}" ${editable ? '' : 'disabled'} />
      </div>
      <div class="inspector-row">
        <label>Background URL</label>
        <input type="text" id="inp-bg-url" value="${floor.backgroundImageUrl || ''}" placeholder="Paste image URL..." ${editable ? '' : 'disabled'} />
      </div>
      <div class="inspector-row">
        <label>Width</label>
        <input type="number" id="inp-bg-w" value="${floor.backgroundWidth}" ${editable ? '' : 'disabled'} />
      </div>
      <div class="inspector-row">
        <label>Height</label>
        <input type="number" id="inp-bg-h" value="${floor.backgroundHeight}" ${editable ? '' : 'disabled'} />
      </div>
      <div class="inspector-row">
        <label>Main Floor</label>
        <input type="checkbox" id="chk-main" ${floor.isMain ? 'checked' : ''} ${editable ? '' : 'disabled'} />
      </div>
      ${editable ? '<button id="btn-delete-floor" class="btn btn-danger full-width">Delete Floor</button>' : ''}
    `;

    if (editable) {
      document.getElementById('inp-floor-name').addEventListener('change', e => {
        updateFloor(floor.id, { name: e.target.value });
        refreshSidebar();
      });
      document.getElementById('inp-bg-url').addEventListener('change', e => {
        updateFloor(floor.id, { backgroundImageUrl: e.target.value });
        bgImageUrl = ''; // Force reload
      });
      document.getElementById('inp-bg-w').addEventListener('change', e => {
        updateFloor(floor.id, { backgroundWidth: parseInt(e.target.value) || 900 });
        resizeCanvas();
      });
      document.getElementById('inp-bg-h').addEventListener('change', e => {
        updateFloor(floor.id, { backgroundHeight: parseInt(e.target.value) || 600 });
        resizeCanvas();
      });
      document.getElementById('chk-main').addEventListener('change', e => {
        // Unset other mains
        const floors = getFloorsForVersion(getActiveVersion().id);
        floors.forEach(f => f.isMain = false);
        floor.isMain = e.target.checked;
        saveState();
        refreshSidebar();
      });
      document.getElementById('btn-delete-floor').addEventListener('click', () => {
        if (!confirm(`Delete floor "${floor.name}"?`)) return;
        const deleted = deleteFloor(floor.id);
        if (!deleted) {
          showToast('A version must keep at least one floor.');
          return;
        }
        const remaining = getFloorsForVersion(getActiveVersion().id);
        AppState.activeFloorId = remaining.find(f => f.isMain)?.id || remaining[0]?.id || null;
        refreshUI();
      });
    }
  }
}

// ============================================
// TOOLBAR EVENT HANDLERS
// ============================================
function setupToolbar() {
  const versionSelector = document.getElementById('version-selector');
  if (versionSelector) {
    versionSelector.addEventListener('change', async (e) => {
      const newVersionId = e.target.value;
      if (!newVersionId || typeof switchActiveVersion !== 'function') return;

      await switchActiveVersion(newVersionId);
      AppState.selectedTableId = null;
      AppState.selectedZoneId = null;
      refreshUI();
    });
  }

  document.getElementById('btn-create-draft').addEventListener('click', async () => {
    const result = await createDraftFromPublished();
    if (result?.version) {
      if (result.alreadyExists) {
        showToast(`Switched to existing draft v${result.version.versionNo}`);
      } else {
        showToast(`Draft v${result.version.versionNo} created!`);
      }
      refreshUI();
    } else {
      showToast('Cannot create a draft without a published version.');
    }
  });

  document.getElementById('btn-publish').addEventListener('click', async () => {
    const draftTest = getDraftVersion();
    if (!draftTest) {
      alert("Cannot publish: No draft found in AppState.versions!");
      return;
    }
    
    // Safety check - restrict publishing unless DRAFT is explicitly selected
    const activeTest = getActiveVersion();
    if (!activeTest || activeTest.status !== 'DRAFT') {
      alert("You must select the Draft version from the dropdown before publishing!");
      return;
    }

    if (!confirm('Publish this draft? The current published version will be archived.')) return;
    
    console.log("Publishing draft:", draftTest);
    await publishDraft();
  });

  document.getElementById('btn-view-mode').addEventListener('click', () => {
    if (AppState.mode === 'editor') {
      // Switch to viewer
      if (!AppState.activeVersionId) { showToast('No version loaded to view'); return; }
      AppState.mode = 'viewer';
      const floors = getFloorsForVersion(AppState.activeVersionId);
      AppState.activeFloorId = AppState.activeFloorId || floors.find(f => f.isMain)?.id || floors[0]?.id || null;
      AppState.selectedTableId = null;
      AppState.selectedZoneId = null;
      AppState.editorTool = 'select';
      if (typeof openMobileViewer === 'function') openMobileViewer();
    } else {
      AppState.mode = 'editor';
      if (typeof closeMobileViewer === 'function') closeMobileViewer();
    }
    refreshUI();
  });

  document.getElementById('btn-zone-draw').addEventListener('click', () => {
    if (AppState.editorTool === 'zone_draw') {
      AppState.editorTool = 'select';
      AppState.zoneDrawPoints = [];
    } else {
      AppState.editorTool = 'zone_draw';
      AppState.zoneDrawPoints = [];
      AppState.combineFirstId = null;
    }
    refreshToolbar();
  });

  document.getElementById('btn-combine').addEventListener('click', () => {
    if (AppState.editorTool === 'combine') {
      AppState.editorTool = 'select';
      AppState.combineFirstId = null;
    } else {
      AppState.editorTool = 'combine';
      AppState.combineFirstId = null;
      AppState.zoneDrawPoints = [];
    }
    refreshToolbar();
  });

  document.getElementById('btn-add-floor').addEventListener('click', () => {
    const name = prompt('Floor name:');
    if (name) {
      const floor = addFloor(name);
      if (floor) {
        AppState.activeFloorId = floor.id;
        refreshUI();
      } else {
        showToast('Cannot add floor (need a draft version)');
      }
    }
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Reset all data? This will clear everything and restore defaults.')) return;
    localStorage.removeItem(STORAGE_KEY);
    seedDefaults();
    bgImageUrl = '';
    bgImage = null;
    bgImageStatus = 'none';
    refreshUI();
    showToast('Data reset to defaults');
  });
}

// ============================================
// BOOT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initCanvas();
  setupToolbar();
  refreshUI();
});
