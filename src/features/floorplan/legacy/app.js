//app.js
/**
 * Floorplan Editor – Data Layer & State Management
 * All data lives in localStorage under the key 'floorplan_data'
 */

const STORAGE_KEY = 'floorplan_dynamic_v1';
const AUTO_SYNC_DELAY_MS = 1200;

// ============================================
// UUID HELPER
// ============================================
function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ============================================
// APP STATE
// ============================================
const AppState = {
  branchId: 'branch-001',
  chairTemplates: [],
  tableTemplates: [],
  tableTemplateChairs: [],
  versions: [],
  floors: [],
  zones: [],
  floorTables: [],
  combineEdges: [],

  // UI state (not persisted)
  activeVersionId: null,
  activeFloorId: null,
  selectedTableId: null,
  selectedZoneId: null,
  mode: 'editor',        // 'editor' | 'viewer'
  editorTool: 'select',  // 'select' | 'zone_draw' | 'combine'
  zoneDrawPoints: [],
  combineFirstId: null,
  nextTableNum: 1,
};
window.AppState = AppState;

// ============================================
// PERSISTENCE
// ============================================
function saveState() {
  const data = {
    branchId: AppState.branchId,
    chairTemplates: AppState.chairTemplates,
    tableTemplates: AppState.tableTemplates,
    tableTemplateChairs: AppState.tableTemplateChairs,
    versions: AppState.versions,
    floors: AppState.floors,
    zones: AppState.zones,
    floorTables: AppState.floorTables,
    combineEdges: AppState.combineEdges,
    nextTableNum: AppState.nextTableNum,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  // Debounce API Sync
  if (typeof syncDynamicDraft === 'function') {
    clearTimeout(window._syncTimer);
    window._syncTimer = setTimeout(() => {
      syncDynamicDraft({ silent: true });
    }, AUTO_SYNC_DELAY_MS);
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      Object.assign(AppState, data);
      return true;
    } catch (e) {
      console.warn('Failed to parse saved state, seeding defaults');
    }
  }
  return false;
}

// ============================================
// SEED DATA
// ============================================
function seedDefaults() {
  // Chair templates
  const chairStd    = { id: uuid(), name: 'Standard Chair',   capacity: 1, width: 12, depth: 12 };
  const chairBench  = { id: uuid(), name: 'Bench Side',       capacity: 3, width: 40, depth: 10 };
  const chairStool  = { id: uuid(), name: 'Bar Stool',        capacity: 1, width: 10, depth: 10 };
  const chairLounge = { id: uuid(), name: 'Lounge Cushion',   capacity: 1, width: 18, depth: 16 };
  const chairWide   = { id: uuid(), name: 'Wide Bench',       capacity: 4, width: 56, depth: 12 };
  const chairArm    = { id: uuid(), name: 'Armchair',         capacity: 1, width: 16, depth: 14 };
  AppState.chairTemplates = [chairStd, chairBench, chairStool, chairLounge, chairWide, chairArm];

  // ---- DINING ----
  const t2top = {
    id: uuid(), name: '2-Top Round', type: 'dining', shape: 'circle',
    width: null, height: null, radius: 22,
    minPartySize: 1, maxPartySize: 2, isCombinable: true,
  };
  const t4top = {
    id: uuid(), name: '4-Top Square', type: 'dining', shape: 'rect',
    width: 56, height: 56, radius: null,
    minPartySize: 1, maxPartySize: 4, isCombinable: true,
  };
  const t6rect = {
    id: uuid(), name: '6-Top Rectangular', type: 'dining', shape: 'rect',
    width: 100, height: 50, radius: null,
    minPartySize: 2, maxPartySize: 6, isCombinable: true,
  };
  const t8oval = {
    id: uuid(), name: '8-Top Oval', type: 'dining', shape: 'circle',
    width: null, height: null, radius: 38,
    minPartySize: 4, maxPartySize: 8, isCombinable: false,
  };

  // ---- BOOTHS ----
  const tBooth = {
    id: uuid(), name: 'Booth', type: 'booth', shape: 'rect',
    width: 80, height: 44, radius: null,
    minPartySize: 2, maxPartySize: 6, isCombinable: false,
  };
  const tCornerBooth = {
    id: uuid(), name: 'Corner Booth', type: 'booth', shape: 'rect',
    width: 90, height: 90, radius: null,
    minPartySize: 4, maxPartySize: 8, isCombinable: false,
  };

  // ---- BAR ----
  const tCocktail = {
    id: uuid(), name: 'Cocktail Round', type: 'bar', shape: 'circle',
    width: null, height: null, radius: 16,
    minPartySize: 1, maxPartySize: 2, isCombinable: false,
  };
  const tHighTop = {
    id: uuid(), name: 'High-Top Round', type: 'bar', shape: 'circle',
    width: null, height: null, radius: 24,
    minPartySize: 1, maxPartySize: 4, isCombinable: true,
  };
  const tBarCounter = {
    id: uuid(), name: 'Bar Counter', type: 'bar', shape: 'rect',
    width: 140, height: 30, radius: null,
    minPartySize: 1, maxPartySize: 5, isCombinable: false,
  };
  const tLBar = {
    id: uuid(), name: 'L-Shaped Bar', type: 'bar', shape: 'rect',
    width: 120, height: 50, radius: null,
    minPartySize: 2, maxPartySize: 8, isCombinable: false,
  };

  // ---- LOUNGE / SOFA ----
  const tSofa = {
    id: uuid(), name: 'Sofa', type: 'lounge', shape: 'rect',
    width: 100, height: 40, radius: null,
    minPartySize: 2, maxPartySize: 4, isCombinable: true,
  };
  const tLoveseat = {
    id: uuid(), name: 'Loveseat', type: 'lounge', shape: 'rect',
    width: 60, height: 36, radius: null,
    minPartySize: 1, maxPartySize: 2, isCombinable: true,
  };
  const tLoungeSet = {
    id: uuid(), name: 'Lounge Set', type: 'lounge', shape: 'rect',
    width: 110, height: 80, radius: null,
    minPartySize: 4, maxPartySize: 8, isCombinable: false,
  };

  // ---- COMMUNAL ----
  const tCommunal = {
    id: uuid(), name: 'Communal Table', type: 'communal', shape: 'rect',
    width: 180, height: 60, radius: null,
    minPartySize: 4, maxPartySize: 12, isCombinable: false,
  };

  // ---- FIXTURES / ARCHITECTURAL ----
  const tWall = {
    id: uuid(), name: 'Wall Segment', type: 'fixture', fixtureKind: 'wall', shape: 'rect',
    width: 120, height: 8, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tWallCorner = {
    id: uuid(), name: 'Wall Corner', type: 'fixture', fixtureKind: 'wall_corner', shape: 'rect',
    width: 8, height: 8, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tWindow = {
    id: uuid(), name: 'Single Window', type: 'fixture', fixtureKind: 'window', shape: 'rect',
    width: 60, height: 8, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tDblWindow = {
    id: uuid(), name: 'Double Window', type: 'fixture', fixtureKind: 'window', shape: 'rect',
    width: 120, height: 8, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tDoor = {
    id: uuid(), name: 'Entry Door', type: 'fixture', fixtureKind: 'door', shape: 'rect',
    width: 40, height: 6, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tSlidingDoor = {
    id: uuid(), name: 'Sliding Door', type: 'fixture', fixtureKind: 'sliding_door', shape: 'rect',
    width: 80, height: 6, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tPillar = {
    id: uuid(), name: 'Pillar', type: 'fixture', fixtureKind: 'pillar', shape: 'circle',
    width: null, height: null, radius: 10,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tPillarSquare = {
    id: uuid(), name: 'Square Pillar', type: 'fixture', fixtureKind: 'pillar', shape: 'rect',
    width: 16, height: 16, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tPlant = {
    id: uuid(), name: 'Potted Plant', type: 'fixture', fixtureKind: 'plant', shape: 'circle',
    width: null, height: null, radius: 14,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tPlantRow = {
    id: uuid(), name: 'Planter Box', type: 'fixture', fixtureKind: 'planter', shape: 'rect',
    width: 80, height: 16, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tHostess = {
    id: uuid(), name: 'Hostess Stand', type: 'fixture', fixtureKind: 'hostess', shape: 'rect',
    width: 36, height: 24, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tRestroom = {
    id: uuid(), name: 'Restroom Sign', type: 'fixture', fixtureKind: 'restroom', shape: 'rect',
    width: 30, height: 30, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tKitchenPass = {
    id: uuid(), name: 'Kitchen Pass', type: 'fixture', fixtureKind: 'kitchen', shape: 'rect',
    width: 100, height: 24, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tStaircase = {
    id: uuid(), name: 'Staircase', type: 'fixture', fixtureKind: 'stairs', shape: 'rect',
    width: 50, height: 80, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };
  const tFireplace = {
    id: uuid(), name: 'Fireplace', type: 'fixture', fixtureKind: 'fireplace', shape: 'rect',
    width: 60, height: 20, radius: null,
    minPartySize: 0, maxPartySize: 0, isCombinable: false,
  };

  AppState.tableTemplates = [
    t2top, t4top, t6rect, t8oval,
    tBooth, tCornerBooth,
    tCocktail, tHighTop, tBarCounter, tLBar,
    tSofa, tLoveseat, tLoungeSet,
    tCommunal,
    tWall, tWallCorner, tWindow, tDblWindow,
    tDoor, tSlidingDoor,
    tPillar, tPillarSquare,
    tPlant, tPlantRow,
    tHostess, tRestroom, tKitchenPass,
    tStaircase, tFireplace,
  ];

  // Chair placements on templates (relative coords)
  AppState.tableTemplateChairs = [
    // 2-Top Round: 2 chairs opposite
    { tableTemplateId: t2top.id, idx: 0, chairTemplateId: chairStd.id, x: 0, y: -34, rotationDeg: 0, isRequired: true },
    { tableTemplateId: t2top.id, idx: 1, chairTemplateId: chairStd.id, x: 0, y: 34, rotationDeg: 180, isRequired: true },

    // 4-Top Square: 4 chairs, one per side
    { tableTemplateId: t4top.id, idx: 0, chairTemplateId: chairStd.id, x: 0, y: -40, rotationDeg: 0, isRequired: true },
    { tableTemplateId: t4top.id, idx: 1, chairTemplateId: chairStd.id, x: 40, y: 0, rotationDeg: 90, isRequired: true },
    { tableTemplateId: t4top.id, idx: 2, chairTemplateId: chairStd.id, x: 0, y: 40, rotationDeg: 180, isRequired: true },
    { tableTemplateId: t4top.id, idx: 3, chairTemplateId: chairStd.id, x: -40, y: 0, rotationDeg: 270, isRequired: true },

    // 6-Top Rectangular: 3 per long side
    { tableTemplateId: t6rect.id, idx: 0, chairTemplateId: chairStd.id, x: -30, y: -38, rotationDeg: 0, isRequired: true },
    { tableTemplateId: t6rect.id, idx: 1, chairTemplateId: chairStd.id, x: 0,   y: -38, rotationDeg: 0, isRequired: true },
    { tableTemplateId: t6rect.id, idx: 2, chairTemplateId: chairStd.id, x: 30,  y: -38, rotationDeg: 0, isRequired: true },
    { tableTemplateId: t6rect.id, idx: 3, chairTemplateId: chairStd.id, x: -30, y: 38,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: t6rect.id, idx: 4, chairTemplateId: chairStd.id, x: 0,   y: 38,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: t6rect.id, idx: 5, chairTemplateId: chairStd.id, x: 30,  y: 38,  rotationDeg: 180, isRequired: true },

    // 8-Top Oval: 8 chairs around the circle
    { tableTemplateId: t8oval.id, idx: 0, chairTemplateId: chairStd.id, x: 0,   y: -52, rotationDeg: 0, isRequired: true },
    { tableTemplateId: t8oval.id, idx: 1, chairTemplateId: chairStd.id, x: 37,  y: -37, rotationDeg: 45, isRequired: true },
    { tableTemplateId: t8oval.id, idx: 2, chairTemplateId: chairStd.id, x: 52,  y: 0,   rotationDeg: 90, isRequired: true },
    { tableTemplateId: t8oval.id, idx: 3, chairTemplateId: chairStd.id, x: 37,  y: 37,  rotationDeg: 135, isRequired: true },
    { tableTemplateId: t8oval.id, idx: 4, chairTemplateId: chairStd.id, x: 0,   y: 52,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: t8oval.id, idx: 5, chairTemplateId: chairStd.id, x: -37, y: 37,  rotationDeg: 225, isRequired: true },
    { tableTemplateId: t8oval.id, idx: 6, chairTemplateId: chairStd.id, x: -52, y: 0,   rotationDeg: 270, isRequired: true },
    { tableTemplateId: t8oval.id, idx: 7, chairTemplateId: chairStd.id, x: -37, y: -37, rotationDeg: 315, isRequired: true },

    // Booth: 2 bench sides
    { tableTemplateId: tBooth.id, idx: 0, chairTemplateId: chairBench.id, x: 0, y: -32, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tBooth.id, idx: 1, chairTemplateId: chairBench.id, x: 0, y: 32,  rotationDeg: 180, isRequired: true },

    // Corner Booth: benches on 2 sides + chairs on the open sides
    { tableTemplateId: tCornerBooth.id, idx: 0, chairTemplateId: chairWide.id, x: 0,   y: -56, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tCornerBooth.id, idx: 1, chairTemplateId: chairWide.id, x: -56, y: 0,   rotationDeg: 270, isRequired: true },
    { tableTemplateId: tCornerBooth.id, idx: 2, chairTemplateId: chairStd.id,  x: 30,  y: 56,  rotationDeg: 180, isRequired: false },
    { tableTemplateId: tCornerBooth.id, idx: 3, chairTemplateId: chairStd.id,  x: -20, y: 56,  rotationDeg: 180, isRequired: false },
    { tableTemplateId: tCornerBooth.id, idx: 4, chairTemplateId: chairStd.id,  x: 56,  y: 30,  rotationDeg: 90, isRequired: false },
    { tableTemplateId: tCornerBooth.id, idx: 5, chairTemplateId: chairStd.id,  x: 56,  y: -20, rotationDeg: 90, isRequired: false },

    // Cocktail Round: 2 stools
    { tableTemplateId: tCocktail.id, idx: 0, chairTemplateId: chairStool.id, x: 0, y: -28, rotationDeg: 0, isRequired: false },
    { tableTemplateId: tCocktail.id, idx: 1, chairTemplateId: chairStool.id, x: 0, y: 28,  rotationDeg: 180, isRequired: false },

    // High-Top Round: 4 stools
    { tableTemplateId: tHighTop.id, idx: 0, chairTemplateId: chairStool.id, x: 0,   y: -36, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tHighTop.id, idx: 1, chairTemplateId: chairStool.id, x: 36,  y: 0,   rotationDeg: 90, isRequired: true },
    { tableTemplateId: tHighTop.id, idx: 2, chairTemplateId: chairStool.id, x: 0,   y: 36,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tHighTop.id, idx: 3, chairTemplateId: chairStool.id, x: -36, y: 0,   rotationDeg: 270, isRequired: true },

    // Bar Counter: 5 stools on one side
    { tableTemplateId: tBarCounter.id, idx: 0, chairTemplateId: chairStool.id, x: -52, y: -24, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tBarCounter.id, idx: 1, chairTemplateId: chairStool.id, x: -26, y: -24, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tBarCounter.id, idx: 2, chairTemplateId: chairStool.id, x: 0,   y: -24, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tBarCounter.id, idx: 3, chairTemplateId: chairStool.id, x: 26,  y: -24, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tBarCounter.id, idx: 4, chairTemplateId: chairStool.id, x: 52,  y: -24, rotationDeg: 0, isRequired: true },

    // L-Shaped Bar: stools along outer edge
    { tableTemplateId: tLBar.id, idx: 0, chairTemplateId: chairStool.id, x: -48, y: -36, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLBar.id, idx: 1, chairTemplateId: chairStool.id, x: -24, y: -36, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLBar.id, idx: 2, chairTemplateId: chairStool.id, x: 0,   y: -36, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLBar.id, idx: 3, chairTemplateId: chairStool.id, x: 24,  y: -36, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLBar.id, idx: 4, chairTemplateId: chairStool.id, x: 48,  y: -36, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLBar.id, idx: 5, chairTemplateId: chairStool.id, x: 70,  y: -10, rotationDeg: 90, isRequired: true },
    { tableTemplateId: tLBar.id, idx: 6, chairTemplateId: chairStool.id, x: 70,  y: 16,  rotationDeg: 90, isRequired: true },
    { tableTemplateId: tLBar.id, idx: 7, chairTemplateId: chairStool.id, x: 48,  y: 36,  rotationDeg: 180, isRequired: false },

    // Sofa: 2 lounge cushions + coffee table side
    { tableTemplateId: tSofa.id, idx: 0, chairTemplateId: chairLounge.id, x: -22, y: -32, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tSofa.id, idx: 1, chairTemplateId: chairLounge.id, x: 22,  y: -32, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tSofa.id, idx: 2, chairTemplateId: chairArm.id,    x: -22, y: 34,  rotationDeg: 180, isRequired: false },
    { tableTemplateId: tSofa.id, idx: 3, chairTemplateId: chairArm.id,    x: 22,  y: 34,  rotationDeg: 180, isRequired: false },

    // Loveseat: 2 cushions side by side
    { tableTemplateId: tLoveseat.id, idx: 0, chairTemplateId: chairLounge.id, x: 0, y: -30, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLoveseat.id, idx: 1, chairTemplateId: chairArm.id,    x: 0, y: 30,  rotationDeg: 180, isRequired: false },

    // Lounge Set: armchairs around a low table
    { tableTemplateId: tLoungeSet.id, idx: 0, chairTemplateId: chairLounge.id, x: -26, y: -52, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLoungeSet.id, idx: 1, chairTemplateId: chairLounge.id, x: 26,  y: -52, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tLoungeSet.id, idx: 2, chairTemplateId: chairArm.id,    x: 64,  y: -16, rotationDeg: 90, isRequired: true },
    { tableTemplateId: tLoungeSet.id, idx: 3, chairTemplateId: chairArm.id,    x: 64,  y: 16,  rotationDeg: 90, isRequired: true },
    { tableTemplateId: tLoungeSet.id, idx: 4, chairTemplateId: chairLounge.id, x: 26,  y: 52,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tLoungeSet.id, idx: 5, chairTemplateId: chairLounge.id, x: -26, y: 52,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tLoungeSet.id, idx: 6, chairTemplateId: chairArm.id,    x: -64, y: 16,  rotationDeg: 270, isRequired: true },
    { tableTemplateId: tLoungeSet.id, idx: 7, chairTemplateId: chairArm.id,    x: -64, y: -16, rotationDeg: 270, isRequired: true },

    // Communal Table: 6 per long side
    { tableTemplateId: tCommunal.id, idx: 0,  chairTemplateId: chairStd.id, x: -66, y: -42, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 1,  chairTemplateId: chairStd.id, x: -33, y: -42, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 2,  chairTemplateId: chairStd.id, x: 0,   y: -42, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 3,  chairTemplateId: chairStd.id, x: 33,  y: -42, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 4,  chairTemplateId: chairStd.id, x: 66,  y: -42, rotationDeg: 0, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 5,  chairTemplateId: chairStd.id, x: -66, y: 42,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 6,  chairTemplateId: chairStd.id, x: -33, y: 42,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 7,  chairTemplateId: chairStd.id, x: 0,   y: 42,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 8,  chairTemplateId: chairStd.id, x: 33,  y: 42,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 9,  chairTemplateId: chairStd.id, x: 66,  y: 42,  rotationDeg: 180, isRequired: true },
    { tableTemplateId: tCommunal.id, idx: 10, chairTemplateId: chairStd.id, x: -82, y: 0,   rotationDeg: 270, isRequired: false },
    { tableTemplateId: tCommunal.id, idx: 11, chairTemplateId: chairStd.id, x: 82,  y: 0,   rotationDeg: 90, isRequired: false },
  ];

  // Published version with 2 floors
  const pubVersion = {
    id: uuid(), branchId: AppState.branchId, versionNo: 1,
    status: 'PUBLISHED', createdAt: new Date().toISOString(), publishedAt: new Date().toISOString(),
  };
  AppState.versions = [pubVersion];

  const mainFloor = {
    id: uuid(), floorplanVersionId: pubVersion.id, branchId: AppState.branchId,
    name: 'Main Floor', sortOrder: 0, isMain: true,
    backgroundImageUrl: '', backgroundWidth: 900, backgroundHeight: 600,
  };
  const patioFloor = {
    id: uuid(), floorplanVersionId: pubVersion.id, branchId: AppState.branchId,
    name: 'Patio', sortOrder: 1, isMain: false,
    backgroundImageUrl: '', backgroundWidth: 900, backgroundHeight: 600,
  };
  AppState.floors = [mainFloor, patioFloor];

  // Zones
  const mainZone = {
    id: uuid(), floorId: mainFloor.id, name: 'Window',
    polygonPoints: [{ x: 40, y: 40 }, { x: 300, y: 40 }, { x: 300, y: 250 }, { x: 40, y: 250 }],
  };
  const patioZone = {
    id: uuid(), floorId: patioFloor.id, name: 'Outdoor',
    polygonPoints: [{ x: 60, y: 60 }, { x: 400, y: 60 }, { x: 400, y: 300 }, { x: 60, y: 300 }],
  };
  AppState.zones = [mainZone, patioZone];

  // Placed tables on main floor
  const ft1 = {
    id: uuid(), floorId: mainFloor.id, tableTemplateId: t2top.id,
    zoneId: mainZone.id, label: 'T1', x: 120, y: 140,
    rotationDeg: 0, scaleX: 1, scaleY: 1, isActive: true, metadata: {},
  };
  const ft2 = {
    id: uuid(), floorId: mainFloor.id, tableTemplateId: t4top.id,
    zoneId: mainZone.id, label: 'T2', x: 220, y: 160,
    rotationDeg: 0, scaleX: 1, scaleY: 1, isActive: true, metadata: {},
  };
  const ft3 = {
    id: uuid(), floorId: mainFloor.id, tableTemplateId: tBooth.id,
    zoneId: null, label: 'T3', x: 500, y: 200,
    rotationDeg: 0, scaleX: 1, scaleY: 1, isActive: true, metadata: {},
  };
  // Patio tables
  const ft4 = {
    id: uuid(), floorId: patioFloor.id, tableTemplateId: t2top.id,
    zoneId: patioZone.id, label: 'T4', x: 160, y: 180,
    rotationDeg: 45, scaleX: 1, scaleY: 1, isActive: true, metadata: {},
  };
  const ft5 = {
    id: uuid(), floorId: patioFloor.id, tableTemplateId: t4top.id,
    zoneId: patioZone.id, label: 'T5', x: 300, y: 180,
    rotationDeg: 0, scaleX: 1, scaleY: 1, isActive: true, metadata: {},
  };
  AppState.floorTables = [ft1, ft2, ft3, ft4, ft5];

  // One combine edge example (T1 + T2)
  AppState.combineEdges = [{
    id: uuid(), floorId: mainFloor.id, aId: ft1.id, bId: ft2.id,
    combinedMaxPartySize: 6,
  }];

  AppState.nextTableNum = 6;
  AppState.activeVersionId = pubVersion.id;
  AppState.activeFloorId = mainFloor.id;

  saveState();
}

// ============================================
// QUERY HELPERS
// ============================================
function getVersion(id) { return AppState.versions.find(v => v.id === id); }

function getVersionNumber(version) {
  return Number(version?.versionNo ?? version?.version_no ?? 0);
}

function sortVersionsDesc(versions = AppState.versions) {
  return [...versions].sort((a, b) => {
    const versionDelta = getVersionNumber(b) - getVersionNumber(a);
    if (versionDelta !== 0) return versionDelta;

    const aTime = new Date(a.createdAt || a.created_at || 0).getTime();
    const bTime = new Date(b.createdAt || b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

function getLatestVersionByStatus(status) {
  return sortVersionsDesc().find(v => v.status === status) || null;
}

function getPublishedVersion() { return getLatestVersionByStatus('PUBLISHED'); }
function getDraftVersion() { return getLatestVersionByStatus('DRAFT'); }
function getActiveVersion() { return getVersion(AppState.activeVersionId); }
function getFloor(id) { return AppState.floors.find(f => f.id === id); }
function getFloorsForVersion(versionId) {
  return AppState.floors.filter(f => f.floorplanVersionId === versionId).sort((a, b) => a.sortOrder - b.sortOrder);
}
function getZonesForFloor(floorId) { return AppState.zones.filter(z => z.floorId === floorId); }
function getTablesForFloor(floorId) { return AppState.floorTables.filter(t => t.floorId === floorId); }
function getEdgesForFloor(floorId) { return AppState.combineEdges.filter(e => e.floorId === floorId); }
function getTemplate(id) { return AppState.tableTemplates.find(t => t.id === id); }
function getChairsForTemplate(templateId) {
  return AppState.tableTemplateChairs.filter(c => c.tableTemplateId === templateId).sort((a, b) => a.idx - b.idx);
}
function getChairTemplate(id) { return AppState.chairTemplates.find(c => c.id === id); }
function getFloorTable(id) { return AppState.floorTables.find(t => t.id === id); }

// ============================================
// VERSIONING OPERATIONS
// ============================================
async function createDraftFromPublished() {
  const existingDraft = getDraftVersion();
  if (existingDraft) {
    await switchActiveVersion(existingDraft.id);
    return { version: getActiveVersion(), alreadyExists: true };
  }

  let sourceVersion = getActiveVersion()?.status === 'PUBLISHED'
    ? getActiveVersion()
    : getPublishedVersion();

  if (!sourceVersion) return null;

  if (AppState.activeVersionId !== sourceVersion.id || getFloorsForVersion(sourceVersion.id).length === 0) {
    const loaded = await switchActiveVersion(sourceVersion.id);
    if (!loaded) return null;
    sourceVersion = getActiveVersion();
  }

  const sourceFloors = getFloorsForVersion(sourceVersion.id);
  const nextVersionNo = Math.max(0, ...AppState.versions.map(v => getVersionNumber(v))) + 1;
  const newVersion = {
    id: uuid(),
    branchId: AppState.branchId,
    versionNo: nextVersionNo,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    publishedAt: null,
  };
  AppState.versions.push(newVersion);

  const floorIdMap = {};
  const zoneIdMap = {};
  const tableIdMap = {};

  for (const floor of sourceFloors) {
    const newFloor = {
      ...floor,
      id: uuid(),
      floorplanVersionId: newVersion.id,
    };
    floorIdMap[floor.id] = newFloor.id;
    AppState.floors.push(newFloor);

    for (const zone of getZonesForFloor(floor.id)) {
      const newZone = {
        ...zone,
        id: uuid(),
        floorId: newFloor.id,
        polygonPoints: (zone.polygonPoints || []).map(point => ({ ...point })),
      };
      zoneIdMap[zone.id] = newZone.id;
      AppState.zones.push(newZone);
    }

    for (const table of getTablesForFloor(floor.id)) {
      const newTable = {
        ...table,
        id: uuid(),
        floorId: newFloor.id,
        zoneId: table.zoneId ? zoneIdMap[table.zoneId] || null : null,
        metadata: { ...(table.metadata || {}) },
      };
      tableIdMap[table.id] = newTable.id;
      AppState.floorTables.push(newTable);
    }

    for (const edge of getEdgesForFloor(floor.id)) {
      const newEdge = {
        ...edge,
        id: uuid(),
        floorId: newFloor.id,
        aId: tableIdMap[edge.aId],
        bId: tableIdMap[edge.bId],
      };
      if (newEdge.aId && newEdge.bId) {
        AppState.combineEdges.push(newEdge);
      }
    }
  }

  AppState.activeVersionId = newVersion.id;
  const newFloors = getFloorsForVersion(newVersion.id);
  AppState.activeFloorId = newFloors.find(f => f.isMain)?.id || newFloors[0]?.id || null;
  AppState.selectedTableId = null;
  AppState.selectedZoneId = null;
  saveState();
  return { version: newVersion, alreadyExists: false };
}

async function forceSync() {
  if (typeof syncDynamicDraft === 'function') {
    clearTimeout(window._syncTimer);
    await syncDynamicDraft({ silent: true });
  }
}

async function publishDraft() {
  const draft = getDraftVersion();
  if (!draft) return false;

  // 1. Flush any pending unsaved drag/drop or newly created floors directly to the backend
  await forceSync();

  try {
    const header = { 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}` };
    
    // The draft in memory might hold a transient UI-generated UUID (if newly initialized).
    // Let's resolve the true latest draft ID directly from the API first before publishing it!
    const checkRes = await fetch(`${API_BASE_URL}/branches/${AppState.branchId}/floorplan/versions/draft/latest/full`, { 
        headers: header
    });
    const checkData = await checkRes.json();
    
    let realDraftId = draft.id;
    if (checkData.ok && checkData.data && checkData.data.id) {
        realDraftId = checkData.data.id;
        console.log("Resolved real draft id from DB:", realDraftId);
    } else {
        console.warn("Could not retrieve real draft id from DB fallback, using mapped id:", realDraftId);
    }

    const res = await fetch(`${API_BASE_URL}/branches/${AppState.branchId}/floorplan/versions/${realDraftId}/publish`, {
      method: 'POST',
      headers: header
    });
    
    if (res.ok) {
      if (typeof showToast === 'function') showToast('Floorplan Published successfully!');
      
      // Fully refresh the local app state memory by re-loading the now-published layout from DB
      if (typeof loadDynamicFloorplan === 'function') {
        await loadDynamicFloorplan(AppState.branchId);
      }
      if (typeof refreshUI === 'function') refreshUI();
    } else {
      const err = await res.json();
      console.error("Publishing returned non-OK status:", err);
      if (typeof showToast === 'function') showToast('Error publishing: ' + (err.error?.message || err.message || 'Unknown error'));
      alert('Error publishing: ' + (err.error?.message || err.message || 'Unknown error'));
    }
  } catch (err) {
    console.error("Error publishing API call failed:", err);
    alert("Publish failed to connect or crashed! Check console.");
  }
}

// ============================================
// FLOOR OPERATIONS
// ============================================
function addFloor(name) {
  const version = getActiveVersion();
  if (!version || version.status !== 'DRAFT') return null;
  const existing = getFloorsForVersion(version.id);
  const floor = {
    id: uuid(), floorplanVersionId: version.id, branchId: AppState.branchId,
    name, sortOrder: existing.length, isMain: existing.length === 0,
    backgroundImageUrl: '', backgroundWidth: 900, backgroundHeight: 600,
  };
  AppState.floors.push(floor);
  saveState();
  return floor;
}

function updateFloor(floorId, updates) {
  const floor = getFloor(floorId);
  if (!floor) return null;
  Object.assign(floor, updates);
  saveState();
  return floor;
}

function deleteFloor(floorId) {
  const version = getActiveVersion();
  const floors = getFloorsForVersion(version?.id);
  if (floors.length <= 1) return false;

  AppState.zones = AppState.zones.filter(z => z.floorId !== floorId);
  AppState.floorTables = AppState.floorTables.filter(t => t.floorId !== floorId);
  AppState.combineEdges = AppState.combineEdges.filter(e => e.floorId !== floorId);
  AppState.floors = AppState.floors.filter(f => f.id !== floorId);

  const remaining = getFloorsForVersion(version?.id);
  if (!remaining.some(f => f.isMain) && remaining[0]) {
    remaining[0].isMain = true;
  }
  if (AppState.activeFloorId === floorId) {
    AppState.activeFloorId = remaining.find(f => f.isMain)?.id || remaining[0]?.id || null;
  }

  saveState();
  return true;
}

// ============================================
// TABLE OPERATIONS
// ============================================
function placeTable(floorId, templateId, x, y) {
  const tmpl = getTemplate(templateId);
  let label;
  if (tmpl && tmpl.type === 'fixture') {
    // Use the fixture name as-is (no counter increment)
    label = tmpl.name;
  } else {
    label = 'T' + AppState.nextTableNum++;
  }
  const table = {
    id: uuid(), floorId, tableTemplateId: templateId,
    zoneId: null, label, x, y,
    rotationDeg: 0, scaleX: 1, scaleY: 1, isActive: true, metadata: {},
  };
  AppState.floorTables.push(table);
  saveState();
  return table;
}

function moveTable(tableId, x, y) {
  const table = getFloorTable(tableId);
  if (table) { table.x = x; table.y = y; saveState(); }
}

function updateTable(tableId, updates) {
  const table = getFloorTable(tableId);
  if (table) { Object.assign(table, updates); saveState(); }
}

function removeTable(tableId) {
  AppState.floorTables = AppState.floorTables.filter(t => t.id !== tableId);
  AppState.combineEdges = AppState.combineEdges.filter(e => e.aId !== tableId && e.bId !== tableId);
  if (AppState.selectedTableId === tableId) AppState.selectedTableId = null;
  saveState();
}

// ============================================
// ZONE OPERATIONS
// ============================================
function addZone(floorId, name, polygonPoints) {
  const zone = { id: uuid(), floorId, name, polygonPoints };
  AppState.zones.push(zone);
  saveState();
  return zone;
}

function updateZone(zoneId, updates) {
  const zone = AppState.zones.find(z => z.id === zoneId);
  if (zone) { Object.assign(zone, updates); saveState(); }
}

function deleteZone(zoneId) {
  // Unassign tables from this zone
  AppState.floorTables.forEach(t => { if (t.zoneId === zoneId) t.zoneId = null; });
  AppState.zones = AppState.zones.filter(z => z.id !== zoneId);
  if (AppState.selectedZoneId === zoneId) AppState.selectedZoneId = null;
  saveState();
}

// ============================================
// COMBINE EDGE OPERATIONS
// ============================================
function addCombineEdge(floorId, aId, bId, combinedMaxPartySize) {
  // Check duplicate
  const exists = AppState.combineEdges.some(e =>
    e.floorId === floorId &&
    ((e.aId === aId && e.bId === bId) || (e.aId === bId && e.bId === aId))
  );
  if (exists) return null;

  const edge = { id: uuid(), floorId, aId, bId, combinedMaxPartySize };
  AppState.combineEdges.push(edge);
  saveState();
  return edge;
}

function removeCombineEdge(edgeId) {
  AppState.combineEdges = AppState.combineEdges.filter(e => e.id !== edgeId);
  saveState();
}

// ============================================
// INIT
// ============================================
function initApp() {
  const loaded = loadState();
  if (!loaded) {
    seedDefaults();
  }
  // Set UI defaults
  const pub = getPublishedVersion();
  const draft = getDraftVersion();
  AppState.activeVersionId = draft?.id || pub?.id || null;
  const floors = getFloorsForVersion(AppState.activeVersionId);
  AppState.activeFloorId = AppState.activeFloorId || floors[0]?.id || null;
  AppState.mode = 'editor';
  AppState.editorTool = 'select';
  AppState.selectedTableId = null;
  AppState.selectedZoneId = null;
  AppState.zoneDrawPoints = [];
  AppState.combineFirstId = null;
}

// ============================================
// DYNAMIC API INTEGRATION
// ============================================

async function syncDynamicDraft(options = {}) {
  const { silent = false } = options;
  if (AppState.mode === 'viewer') return;
  const version = getDraftVersion();
  if (!version) return; // Only sync drafts

  const floorsPayload = getFloorsForVersion(version.id).map(f => {
    return {
      id: f.id.length === 36 ? f.id : undefined,
      name: f.name,
      sortOrder: f.sortOrder,
      isMain: f.isMain,
      bgUrl: f.backgroundImageUrl || null,
      bgWidth: f.backgroundWidth,
      bgHeight: f.backgroundHeight,
      zones: getZonesForFloor(f.id).map(z => ({
        id: z.id.length === 36 ? z.id : undefined,
        name: z.name,
        polygonPoints: z.polygonPoints
      })),
      tables: getTablesForFloor(f.id).map(t => ({
        id: t.id.length === 36 ? t.id : undefined,
        tableTemplateId: t.tableTemplateId,
        label: t.label,
        x: Math.round(t.x),
        y: Math.round(t.y),
        rotation: Number(t.rotationDeg) || 0,
        zoneId: t.zoneId && t.zoneId.length === 36 ? t.zoneId : null
      })),
      combineEdges: getEdgesForFloor(f.id).map(e => ({
        id: e.id,
        tableAId: e.aId,
        tableBId: e.bId,
        maxPartySize: e.combinedMaxPartySize || 0
      }))
    };
  });

  try {
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
    };
    const res = await fetch(`${API_BASE_URL}/branches/${AppState.branchId}/floorplan/versions/draft/sync`, {
      method: 'PUT',
      headers: header,
      body: JSON.stringify({ floors: floorsPayload })
    });
    
    if (!res.ok) {
      console.error("Sync failed", await res.text());
      if (!silent && typeof showToast === 'function') showToast('Auto-save failed.');
    } else {
      console.log('Draft auto-synced successfully');
      if (!silent && typeof showToast === 'function') showToast('Draft synchronized');
    }
  } catch (err) {
    console.error("Sync error", err);
  }
}

async function loadDynamicFloorplan(branchId) {
  AppState.branchId = branchId;
  const header = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
  };

  try {
    // A. Fetch Templates
    const [templatesRes, chairsRes, versionsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/branches/${branchId}/floorplan/table-templates`, { headers: header }),
      fetch(`${API_BASE_URL}/branches/${branchId}/floorplan/chair-templates`, { headers: header }),
      fetch(`${API_BASE_URL}/branches/${branchId}/floorplan/versions`, { headers: header })
    ]);

    const templatesData = await templatesRes.json();
    const chairsData = await chairsRes.json();
    const versionsData = await versionsRes.json();

    if (chairsData.ok && chairsData.data.length > 0) {
      AppState.chairTemplates = chairsData.data.map(c => ({
        id: c.id, name: c.name, capacity: c.capacity,
        width: Number(c.width), depth: Number(c.depth)
      }));
    }

    if (templatesData.ok && templatesData.data.length > 0) {
        AppState.tableTemplates = templatesData.data.map(t => ({
            id: t.id, name: t.name, type: t.type, shape: t.shape,
            width: t.width ? Number(t.width) : null, 
            height: t.height ? Number(t.height) : null, 
            radius: t.radius ? Number(t.radius) : null,
            minPartySize: t.min_party_size, maxPartySize: t.max_party_size,
            isCombinable: t.is_combinable, fixtureKind: t.fixture_kind
        }));
        
        AppState.tableTemplateChairs = [];
        templatesData.data.forEach(t => {
          if (t.chairs && Array.isArray(t.chairs)) {
            t.chairs.forEach(c => {
               AppState.tableTemplateChairs.push({
                  id: c.id, tableTemplateId: t.id, chairTemplateId: c.chair_template_id,
                  x: Number(c.x), y: Number(c.y), rotationDeg: Number(c.rotation_deg), isRequired: c.is_required
               });
            });
          }
        });
    }

    // B. Fetch Versions List metadata
    if (versionsData.ok && versionsData.data) {
        AppState.versions = sortVersionsDesc(versionsData.data.map(v => ({
           id: v.id,
           branchId: v.branch_id,
           versionNo: Number(v.version_no || v.versionNo || 0),
           status: v.status,
           createdAt: v.created_at || v.createdAt || null,
           publishedAt: v.published_at || v.publishedAt || null
        })));
    } else {
        AppState.versions = [];
    }

    // C. Determine which version to load (Latest DRAFT, or latest PUBLISHED)
    let targetVersionId = null;
    let fallbackToEmpty = false;

    if (AppState.versions.length > 0) {
       const draft = getDraftVersion();
       if (draft) {
           targetVersionId = draft.id;
       } else {
           const pub = getPublishedVersion();
           if (pub) targetVersionId = pub.id;
           else fallbackToEmpty = true;
       }
    } else {
       fallbackToEmpty = true;
    }

    if (targetVersionId) {
        await switchActiveVersion(targetVersionId);
    } else if (fallbackToEmpty) {
        seedDynamicEmptyDraft();
    }

  } catch (err) { 
    console.error("Failed to load dynamic floorplan:", err); 
    seedDynamicEmptyDraft();
  }
}

// Function to cleanly swap the active version map with full api fetch
async function switchActiveVersion(versionId) {
    const header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`
    };

    try {
        const fullRes = await fetch(`${API_BASE_URL}/branches/${AppState.branchId}/floorplan/versions/${versionId}/full`, { headers: header });
        if (!fullRes.ok) {
          throw new Error(`Failed to load version ${versionId}`);
        }

        const fullData = await fullRes.json();

        if (fullData.ok && fullData.data) {
            const v = fullData.data;
            AppState.activeVersionId = v.id;

            // Clear current floor layout maps
            AppState.floors = [];
            AppState.zones = [];
            AppState.floorTables = [];
            AppState.combineEdges = [];

            let maxTableNum = 0;

            if (v.floors && Array.isArray(v.floors)) {
                v.floors.forEach(f => {
                    AppState.floors.push({
                        id: f.id,
                        floorplanVersionId: v.id,
                        branchId: AppState.branchId,
                        name: f.name,
                        sortOrder: Number(f.sort_order ?? f.sortOrder ?? 0),
                        isMain: Boolean(f.is_main ?? f.isMain),
                        backgroundImageUrl: f.background_image_url || f.bgUrl || '',
                        backgroundWidth: Number(f.background_width || f.bgWidth || 900),
                        backgroundHeight: Number(f.background_height || f.bgHeight || 600)
                    });

                    if (Array.isArray(f.zones)) {
                        f.zones.forEach(z => {
                            AppState.zones.push({
                                id: z.id,
                                floorId: f.id,
                                name: z.name,
                                polygonPoints: typeof z.polygon_points === 'string' ? JSON.parse(z.polygon_points) : (z.polygon_points || z.polygonPoints || [])
                            });
                        });
                    }

                    if (Array.isArray(f.tables)) {
                        f.tables.forEach(t => {
                            AppState.floorTables.push({
                                id: t.id,
                                floorId: f.id,
                                tableTemplateId: t.table_template_id || t.tableTemplateId,
                                zoneId: t.zone_id || t.zoneId,
                                label: t.label,
                                x: Number(t.x),
                                y: Number(t.y),
                                rotationDeg: Number(t.rotation_deg || t.rotation || 0),
                                scaleX: Number(t.scale_x || 1),
                                scaleY: Number(t.scale_y || 1),
                                isActive: t.is_active !== false,
                                metadata: t.metadata || {}
                            });

                            if (t.label && t.label.startsWith('T')) {
                                const num = parseInt(t.label.replace('T', ''), 10);
                                if (!isNaN(num) && num > maxTableNum) maxTableNum = num;
                            }
                        });
                    }

                    const incomingEdges = Array.isArray(f.combineEdges)
                      ? f.combineEdges
                      : (Array.isArray(f.combine_edges) ? f.combine_edges : []);

                    incomingEdges.forEach(e => {
                        AppState.combineEdges.push({
                            id: e.id,
                            floorId: f.id,
                            aId: e.table_a_id || e.aId || e.tableAId,
                            bId: e.table_b_id || e.bId || e.tableBId,
                            combinedMaxPartySize: Number(e.combined_max_party_size || e.combinedMaxPartySize || e.maxPartySize || 0)
                        });
                    });
                });
            }

            AppState.nextTableNum = maxTableNum + 1;
            const activeFloors = getFloorsForVersion(v.id);
            AppState.activeFloorId = activeFloors.find(f => f.isMain)?.id || activeFloors[0]?.id || null;
            AppState.selectedTableId = null;
            AppState.selectedZoneId = null;
            if (typeof refreshUI === 'function') refreshUI();
            return true;
        }
    } catch (e) {
        console.error("Failed to switch active version:", e);
    }
    return false;
}

// Function to generate a blank draft when branch has absolutely nothing
function seedDynamicEmptyDraft() {
  AppState.versions = [];
  AppState.floors = [];
  AppState.zones = [];
  AppState.floorTables = [];
  AppState.combineEdges = [];
  AppState.nextTableNum = 1;

  const newVersion = { id: uuid(), branchId: AppState.branchId, versionNo: 1, status: 'DRAFT', createdAt: new Date().toISOString(), publishedAt: null };
  AppState.versions.push(newVersion);
  AppState.activeVersionId = newVersion.id;

  const mainFloor = {
    id: uuid(), floorplanVersionId: newVersion.id, branchId: AppState.branchId,
    name: 'Main Floor', sortOrder: 0, isMain: true,
    backgroundImageUrl: '', backgroundWidth: 900, backgroundHeight: 600
  };
  AppState.floors.push(mainFloor);
  AppState.activeFloorId = mainFloor.id;
  if (typeof refreshUI === 'function') refreshUI();
  saveState();
}
