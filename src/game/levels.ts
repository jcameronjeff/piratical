import { LevelData, EnemyType } from '../types';

export const CAMPAIGN_LEVELS: LevelData[] = [
  {
    id: 1,
    name: "Shipwreck Shore",
    width: 6000,
    height: 600,
    background: 0x1a3a52,
    spawnPoint: { x: 50, y: 400 },
    goalPosition: { x: 5900, y: 420 },
    platforms: [
      // ===== SECTION 1: Safe Beach Start =====
      // Main ground - broken into sections with small gaps
      { x: 0, y: 500, w: 400, h: 100 },
      // Intro stepping stones (easy jumps)
      { x: 180, y: 420, w: 80, h: 20 },
      { x: 300, y: 360, w: 100, h: 20 },
      
      // ===== SECTION 2: First Gap & Platforms =====
      { x: 450, y: 500, w: 250, h: 100 },
      { x: 500, y: 400, w: 100, h: 20 },
      { x: 550, y: 300, w: 80, h: 20 },  // High platform with doubloon
      
      // ===== SECTION 3: Crab Introduction Area =====
      { x: 750, y: 500, w: 350, h: 100 },
      { x: 800, y: 380, w: 120, h: 20 },
      { x: 950, y: 320, w: 100, h: 20 },
      
      // ===== SECTION 4: Shipwreck Debris (varied heights) =====
      // Gap before shipwreck
      { x: 1150, y: 500, w: 300, h: 100 },
      // Tilted debris platforms
      { x: 1180, y: 420, w: 60, h: 20 },
      { x: 1280, y: 350, w: 80, h: 20 },
      { x: 1350, y: 280, w: 100, h: 20 },  // High treasure
      { x: 1380, y: 420, w: 70, h: 20 },
      
      // ===== SECTION 5: Spike Introduction =====
      { x: 1500, y: 500, w: 400, h: 100 },
      // Platforms to go OVER spikes
      { x: 1550, y: 400, w: 100, h: 20 },
      { x: 1700, y: 350, w: 120, h: 20 },
      { x: 1850, y: 400, w: 100, h: 20 },
      
      // ===== SECTION 6: Enemy Gauntlet =====
      { x: 1950, y: 500, w: 350, h: 100 },
      { x: 2000, y: 380, w: 100, h: 20 },
      { x: 2150, y: 320, w: 120, h: 20 },
      
      // ===== SECTION 7: Rocky Outcrops =====
      { x: 2350, y: 500, w: 200, h: 100 },
      { x: 2400, y: 400, w: 80, h: 20 },
      { x: 2480, y: 320, w: 70, h: 20 },
      
      // ===== SECTION 8: Tidal Pools =====
      { x: 2600, y: 500, w: 300, h: 100 },
      { x: 2650, y: 400, w: 100, h: 20 },
      { x: 2750, y: 320, w: 120, h: 20 },
      { x: 2850, y: 400, w: 100, h: 20 },
      
      // ===== SECTION 9: Coral Reef Crossing =====
      { x: 2950, y: 500, w: 250, h: 100 },
      { x: 3000, y: 380, w: 90, h: 20 },
      { x: 3120, y: 300, w: 100, h: 20 },
      
      // ===== SECTION 10: Sunken Ship Hull =====
      { x: 3250, y: 500, w: 400, h: 100 },
      { x: 3300, y: 420, w: 80, h: 20 },
      { x: 3420, y: 350, w: 100, h: 20 },
      { x: 3520, y: 280, w: 80, h: 20 },
      { x: 3580, y: 400, w: 70, h: 20 },
      
      // ===== SECTION 11: Spike Gauntlet =====
      { x: 3700, y: 500, w: 450, h: 100 },
      { x: 3750, y: 400, w: 100, h: 20 },
      { x: 3900, y: 340, w: 120, h: 20 },
      { x: 4050, y: 400, w: 100, h: 20 },
      
      // ===== SECTION 12: Crab Colony =====
      { x: 4200, y: 500, w: 400, h: 100 },
      { x: 4250, y: 380, w: 110, h: 20 },
      { x: 4400, y: 320, w: 100, h: 20 },
      { x: 4530, y: 400, w: 80, h: 20 },
      
      // ===== SECTION 13: Lighthouse Approach =====
      { x: 4650, y: 500, w: 300, h: 100 },
      { x: 4700, y: 400, w: 90, h: 20 },
      { x: 4820, y: 320, w: 100, h: 20 },
      { x: 4900, y: 250, w: 80, h: 20 },
      
      // ===== SECTION 14: Treacherous Cliffs =====
      { x: 5000, y: 500, w: 250, h: 100 },
      { x: 5050, y: 400, w: 80, h: 20 },
      { x: 5150, y: 320, w: 100, h: 20 },
      { x: 5200, y: 420, w: 70, h: 20 },
      
      // ===== SECTION 15: Final Spike Run =====
      { x: 5300, y: 500, w: 350, h: 100 },
      { x: 5350, y: 390, w: 100, h: 20 },
      { x: 5500, y: 330, w: 120, h: 20 },
      
      // ===== SECTION 16: Treasure Island =====
      { x: 5700, y: 500, w: 300, h: 100 },
      { x: 5750, y: 400, w: 100, h: 20 },
      { x: 5850, y: 320, w: 120, h: 20 },
      { x: 5900, y: 420, w: 100, h: 20 },  // Goal platform
    ],
    doubloons: [
      // Section 1 - Easy pickups
      { x: 210, y: 380 },
      { x: 340, y: 320 },
      
      // Section 2 - Reward for climbing
      { x: 540, y: 360 },
      { x: 575, y: 260 },  // High reward
      
      // Section 3 - Near first crab (risk/reward)
      { x: 850, y: 340 },
      { x: 985, y: 280 },
      
      // Section 4 - Shipwreck treasures
      { x: 1310, y: 310 },
      { x: 1385, y: 240 },  // Top of debris
      
      // Section 5 - Above spikes (teaches safe route)
      { x: 1590, y: 360 },
      { x: 1750, y: 310 },
      { x: 1885, y: 360 },
      
      // Section 6 - Enemy area
      { x: 2040, y: 340 },
      { x: 2195, y: 280 },
      
      // Section 7 - Rocky Outcrops
      { x: 2435, y: 360 },
      { x: 2510, y: 280 },
      
      // Section 8 - Tidal Pools
      { x: 2700, y: 360 },
      { x: 2795, y: 280 },
      
      // Section 9 - Coral Reef
      { x: 3035, y: 340 },
      { x: 3155, y: 260 },
      
      // Section 10 - Sunken Ship Hull
      { x: 3340, y: 380 },
      { x: 3455, y: 310 },
      { x: 3555, y: 240 },
      
      // Section 11 - Spike Gauntlet
      { x: 3790, y: 360 },
      { x: 3945, y: 300 },
      { x: 4085, y: 360 },
      
      // Section 12 - Crab Colony
      { x: 4295, y: 340 },
      { x: 4435, y: 280 },
      { x: 4560, y: 360 },
      
      // Section 13 - Lighthouse Approach
      { x: 4735, y: 360 },
      { x: 4855, y: 280 },
      { x: 4930, y: 210 },
      
      // Section 14 - Treacherous Cliffs
      { x: 5085, y: 360 },
      { x: 5185, y: 280 },
      
      // Section 15 - Final Spike Run
      { x: 3935, y: 350 },
      { x: 5535, y: 290 },
      
      // Section 16 - Victory doubloons
      { x: 5790, y: 360 },
      { x: 5895, y: 280 },
    ],
    enemies: [
      // === CRABS (Basic enemy - taught from start) ===
      // First crab - simple patrol on flat ground (teaches enemy mechanic)
      { x: 850, y: 468, type: EnemyType.CRAB, patrolWidth: 200 },
      
      // Second crab - on platform (teaches platform enemies)
      { x: 2050, y: 348, type: EnemyType.CRAB, patrolWidth: 80 },
      
      // Third crab - ground patrol in gauntlet
      { x: 2100, y: 468, type: EnemyType.CRAB, patrolWidth: 250 },
      
      // === SEAGULLS (Flying enemy - introduced mid-level) ===
      // First seagull - easy, over safe area to teach flying enemies
      { x: 650, y: 350, type: EnemyType.SEAGULL, patrolWidth: 150, patrolHeight: 60 },
      
      // Second seagull - over spike section (adds challenge)
      { x: 1650, y: 320, type: EnemyType.SEAGULL, patrolWidth: 200, patrolHeight: 80 },
      
      // Tidal pools crab
      { x: 2700, y: 468, type: EnemyType.CRAB, patrolWidth: 150 },
      
      // Sunken ship hull crab
      { x: 3400, y: 468, type: EnemyType.CRAB, patrolWidth: 200 },
      
      // Crab colony - multiple crabs
      { x: 4300, y: 468, type: EnemyType.CRAB, patrolWidth: 180 },
      { x: 4450, y: 468, type: EnemyType.CRAB, patrolWidth: 150 },
      { x: 4290, y: 348, type: EnemyType.CRAB, patrolWidth: 80 },
      
      // Lighthouse approach crab
      { x: 4750, y: 468, type: EnemyType.CRAB, patrolWidth: 200 },
      
      // Treacherous cliffs crab
      { x: 5100, y: 468, type: EnemyType.CRAB, patrolWidth: 150 },
      
      // Final treasure guardian
      { x: 5800, y: 468, type: EnemyType.CRAB, patrolWidth: 180 },
    ],
    spikes: [
      // First spike pit - clearly visible, easy to jump over or use platforms
      { x: 1600, y: 480, w: 90 },
      
      // Second spike section - requires platform use
      { x: 1750, y: 480, w: 90 },
      
      // Rocky outcrops spike
      { x: 2550, y: 480, w: 45 },
      
      // Coral reef spikes
      { x: 3200, y: 480, w: 45 },
      
      // Spike gauntlet - extended section
      { x: 3800, y: 480, w: 90 },
      { x: 3950, y: 480, w: 90 },
      { x: 4100, y: 480, w: 90 },
      
      // Lighthouse approach spike
      { x: 4950, y: 480, w: 45 },
      
      // Final spike run
      { x: 5400, y: 480, w: 90 },
      { x: 5550, y: 480, w: 90 },
      
      // Guard spikes near treasure
      { x: 5650, y: 480, w: 45 },
    ],
    requiredDoubloons: 0,
    // Sword chest - floating above the debris section, jump up from platform at y:420
    swordChest: { x: 1210, y: 340 },
  },
  {
    id: 2,
    name: "Skull Cave",
    width: 1400,
    height: 600,
    background: 0x1a1a2e,
    spawnPoint: { x: 50, y: 400 },
    goalPosition: { x: 1300, y: 420 },
    platforms: [
      // Ground sections with gaps
      { x: 0, y: 500, w: 300, h: 100 },
      { x: 400, y: 500, w: 200, h: 100 },
      { x: 700, y: 500, w: 300, h: 100 },
      { x: 1100, y: 500, w: 300, h: 100 },
      // Upper platforms
      { x: 150, y: 380, w: 100, h: 20 },
      { x: 350, y: 300, w: 150, h: 20 },
      { x: 550, y: 220, w: 100, h: 20 },
      { x: 750, y: 300, w: 150, h: 20 },
      { x: 950, y: 380, w: 120, h: 20 },
      { x: 1150, y: 300, w: 100, h: 20 },
    ],
    doubloons: [
      { x: 180, y: 340 },
      { x: 400, y: 260 },
      { x: 580, y: 180 },
      { x: 800, y: 260 },
      { x: 990, y: 340 },
      { x: 1180, y: 260 },
    ],
    enemies: [
      // === CRABS ===
      { x: 450, y: 468, type: EnemyType.CRAB, patrolWidth: 150 },
      { x: 800, y: 468, type: EnemyType.CRAB, patrolWidth: 200 },
      
      // === SEAGULLS (continued from level 1) ===
      { x: 500, y: 180, type: EnemyType.SEAGULL, patrolWidth: 120, patrolHeight: 50 },
      
      // === SKELETONS (NEW - introduced this level!) ===
      // First skeleton - guards upper platform, teaches lunge attack
      { x: 400, y: 268, type: EnemyType.SKELETON, patrolWidth: 100 },
      
      // Second skeleton - near goal, more aggressive
      { x: 1100, y: 468, type: EnemyType.SKELETON, patrolWidth: 180 },
    ],
    spikes: [
      { x: 300, y: 480, w: 100 },
      { x: 600, y: 480, w: 100 },
      { x: 1000, y: 480, w: 100 },
    ],
    requiredDoubloons: 2,
    // Sword chest - above the middle section, jump from platform at y:300
    swordChest: { x: 580, y: 140 },
  },
  {
    id: 3,
    name: "Treasure Galleon",
    width: 1600,
    height: 700,
    background: 0x2d1b4e,
    spawnPoint: { x: 50, y: 500 },
    goalPosition: { x: 1500, y: 120 },
    platforms: [
      // Ship deck levels
      { x: 0, y: 600, w: 400, h: 100 },
      { x: 500, y: 600, w: 300, h: 100 },
      { x: 900, y: 600, w: 700, h: 100 },
      // Mid level
      { x: 100, y: 480, w: 200, h: 20 },
      { x: 400, y: 400, w: 150, h: 20 },
      { x: 650, y: 480, w: 200, h: 20 },
      { x: 950, y: 400, w: 150, h: 20 },
      { x: 1200, y: 480, w: 200, h: 20 },
      // Upper level
      { x: 200, y: 300, w: 120, h: 20 },
      { x: 450, y: 220, w: 150, h: 20 },
      { x: 700, y: 300, w: 120, h: 20 },
      { x: 900, y: 220, w: 150, h: 20 },
      { x: 1150, y: 300, w: 150, h: 20 },
      // Top level - treasure room
      { x: 550, y: 140, w: 200, h: 20 },
      { x: 850, y: 140, w: 150, h: 20 },
      { x: 1100, y: 140, w: 200, h: 20 },
      { x: 1400, y: 140, w: 200, h: 20 },
    ],
    doubloons: [
      { x: 180, y: 440 },
      { x: 450, y: 360 },
      { x: 720, y: 440 },
      { x: 1000, y: 360 },
      { x: 240, y: 260 },
      { x: 500, y: 180 },
      { x: 750, y: 260 },
      { x: 950, y: 180 },
      { x: 1200, y: 260 },
      { x: 630, y: 100 },
      { x: 900, y: 100 },
      { x: 1180, y: 100 },
    ],
    enemies: [
      // === CRABS (Bottom deck) ===
      { x: 150, y: 568, type: EnemyType.CRAB, patrolWidth: 300 },
      { x: 1100, y: 568, type: EnemyType.CRAB, patrolWidth: 400 },
      
      // === SKELETONS (Mid-level ship crew) ===
      { x: 600, y: 568, type: EnemyType.SKELETON, patrolWidth: 200 },
      { x: 700, y: 268, type: EnemyType.SKELETON, patrolWidth: 80 },
      
      // === SEAGULLS (Flying around the ship) ===
      { x: 300, y: 250, type: EnemyType.SEAGULL, patrolWidth: 200, patrolHeight: 80 },
      { x: 1000, y: 180, type: EnemyType.SEAGULL, patrolWidth: 250, patrolHeight: 100 },
      
      // === CANNONS (NEW - defending the ship!) ===
      // First cannon - fires left, teaches dodging cannonballs
      { x: 450, y: 564, type: EnemyType.CANNON_TURRET, facingLeft: true, fireRate: 120 },
      
      // Second cannon - fires right, higher position
      { x: 950, y: 364, type: EnemyType.CANNON_TURRET, fireRate: 90 },
      
      // === JELLYFISH (NEW - floating hazards!) ===
      // Jellyfish in gaps between platforms
      { x: 480, y: 520, type: EnemyType.JELLYFISH, patrolHeight: 100 },
      { x: 880, y: 480, type: EnemyType.JELLYFISH, patrolHeight: 120 },
    ],
    spikes: [
      { x: 400, y: 580, w: 100 },
      { x: 800, y: 580, w: 100 },
    ],
    requiredDoubloons: 5,
    // Sword chest - mid-level on the ship, jump from platform at y:400
    swordChest: { x: 730, y: 320 },
  },
  {
    id: 4,
    name: "Kraken's Lair",
    width: 1800,
    height: 800,
    background: 0x0d1b2a,
    spawnPoint: { x: 50, y: 650 },
    goalPosition: { x: 1700, y: 70 },
    platforms: [
      // Bottom level - underwater cave feeling
      { x: 0, y: 700, w: 300, h: 100 },
      { x: 400, y: 700, w: 200, h: 100 },
      { x: 700, y: 700, w: 250, h: 100 },
      { x: 1050, y: 700, w: 200, h: 100 },
      { x: 1350, y: 700, w: 450, h: 100 },
      // Floating platforms
      { x: 150, y: 580, w: 100, h: 20 },
      { x: 350, y: 500, w: 120, h: 20 },
      { x: 550, y: 580, w: 100, h: 20 },
      { x: 750, y: 500, w: 120, h: 20 },
      { x: 950, y: 420, w: 100, h: 20 },
      { x: 1150, y: 500, w: 120, h: 20 },
      { x: 1350, y: 580, w: 100, h: 20 },
      { x: 1550, y: 500, w: 120, h: 20 },
      // Mid level
      { x: 100, y: 400, w: 150, h: 20 },
      { x: 350, y: 320, w: 120, h: 20 },
      { x: 600, y: 400, w: 150, h: 20 },
      { x: 850, y: 320, w: 120, h: 20 },
      { x: 1100, y: 400, w: 150, h: 20 },
      { x: 1350, y: 320, w: 120, h: 20 },
      { x: 1600, y: 400, w: 150, h: 20 },
      // Upper level
      { x: 200, y: 220, w: 120, h: 20 },
      { x: 450, y: 150, w: 150, h: 20 },
      { x: 700, y: 220, w: 120, h: 20 },
      { x: 950, y: 150, w: 150, h: 20 },
      { x: 1200, y: 220, w: 120, h: 20 },
      { x: 1450, y: 150, w: 150, h: 20 },
      // Goal platform
      { x: 1650, y: 100, w: 150, h: 20 },
    ],
    doubloons: [
      { x: 180, y: 540 },
      { x: 380, y: 460 },
      { x: 580, y: 540 },
      { x: 780, y: 460 },
      { x: 980, y: 380 },
      { x: 1180, y: 460 },
      { x: 140, y: 360 },
      { x: 380, y: 280 },
      { x: 650, y: 360 },
      { x: 880, y: 280 },
      { x: 1140, y: 360 },
      { x: 1380, y: 280 },
      { x: 240, y: 180 },
      { x: 500, y: 110 },
      { x: 740, y: 180 },
      { x: 1000, y: 110 },
      { x: 1240, y: 180 },
      { x: 1500, y: 110 },
      { x: 1700, y: 60 },
    ],
    enemies: [
      // === CRABS (Bottom level, underwater cave dwellers) ===
      { x: 100, y: 668, type: EnemyType.CRAB, patrolWidth: 200 },
      { x: 800, y: 668, type: EnemyType.CRAB, patrolWidth: 180 },
      { x: 1500, y: 668, type: EnemyType.CRAB, patrolWidth: 300 },
      
      // === SKELETONS (Undead pirates in the lair) ===
      { x: 500, y: 668, type: EnemyType.SKELETON, patrolWidth: 150 },
      { x: 1150, y: 668, type: EnemyType.SKELETON, patrolWidth: 150 },
      { x: 400, y: 288, type: EnemyType.SKELETON, patrolWidth: 80 },
      
      // === SEAGULLS (Somehow in the underwater cave...) ===
      { x: 600, y: 350, type: EnemyType.SEAGULL, patrolWidth: 200, patrolHeight: 100 },
      
      // === JELLYFISH (Many in the deep waters!) ===
      { x: 350, y: 550, type: EnemyType.JELLYFISH, patrolHeight: 150 },
      { x: 650, y: 600, type: EnemyType.JELLYFISH, patrolHeight: 120 },
      { x: 1000, y: 550, type: EnemyType.JELLYFISH, patrolHeight: 180 },
      { x: 1300, y: 580, type: EnemyType.JELLYFISH, patrolHeight: 140 },
      
      // === CANNONS (Ancient defenses) ===
      { x: 700, y: 664, type: EnemyType.CANNON_TURRET, fireRate: 100 },
      { x: 1200, y: 464, type: EnemyType.CANNON_TURRET, facingLeft: true, fireRate: 80 },
      
      // === GHOSTS (NEW - Only appear in Kraken's Lair!) ===
      // Ghosts phase in and out - can only be killed with sword!
      { x: 900, y: 288, type: EnemyType.GHOST, patrolWidth: 120 },
      { x: 1400, y: 288, type: EnemyType.GHOST, patrolWidth: 80 },
      { x: 1550, y: 380, type: EnemyType.GHOST, patrolWidth: 100 },
      
      // === Final ghost guarding the exit ===
      { x: 1650, y: 68, type: EnemyType.GHOST, patrolWidth: 100 },
    ],
    spikes: [
      { x: 300, y: 680, w: 100 },
      { x: 600, y: 680, w: 100 },
      { x: 950, y: 680, w: 100 },
      { x: 1250, y: 680, w: 100 },
    ],
    requiredDoubloons: 10,
    // Sword chest - in the mid section, jump from platform at y:420
    swordChest: { x: 980, y: 340 },
  },
];

export function getLevelById(id: number): LevelData | undefined {
  return CAMPAIGN_LEVELS.find(level => level.id === id);
}

export function getNextLevel(currentId: number): LevelData | undefined {
  const currentIndex = CAMPAIGN_LEVELS.findIndex(level => level.id === currentId);
  if (currentIndex >= 0 && currentIndex < CAMPAIGN_LEVELS.length - 1) {
    return CAMPAIGN_LEVELS[currentIndex + 1];
  }
  return undefined;
}

