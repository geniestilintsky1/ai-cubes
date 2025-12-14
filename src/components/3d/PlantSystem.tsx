import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { type SoilType, SOIL_ZONES } from './SoilZones';
import { getSunPositionFromHour, calculateSunlightExposure } from './SunlightSystem';

// ============================================
// PLANT HEALTH SYSTEM
// ============================================

export type PlantHealthState = 'thriving' | 'healthy' | 'moderate' | 'poor' | 'dying' | 'dead';

export interface PlantHealthConfig {
  state: PlantHealthState;
  minHealth: number;
  maxHealth: number;
  // RGB values (0-1)
  baseColor: { r: number; g: number; b: number };
  // Visual properties
  saturation: number;
  growthMultiplier: number;
  description: string;
}

// Health state definitions with RGB color logic
export const PLANT_HEALTH_STATES: Record<PlantHealthState, PlantHealthConfig> = {
  thriving: {
    state: 'thriving',
    minHealth: 0.85,
    maxHealth: 1.0,
    baseColor: { r: 0.13, g: 0.77, b: 0.37 }, // Vibrant green #22c55e
    saturation: 1.0,
    growthMultiplier: 1.3,
    description: 'Vibrant and flourishing',
  },
  healthy: {
    state: 'healthy',
    minHealth: 0.65,
    maxHealth: 0.85,
    baseColor: { r: 0.29, g: 0.69, b: 0.31 }, // Green #4ade80
    saturation: 0.9,
    growthMultiplier: 1.0,
    description: 'Growing well',
  },
  moderate: {
    state: 'moderate',
    minHealth: 0.45,
    maxHealth: 0.65,
    baseColor: { r: 0.65, g: 0.73, b: 0.22 }, // Yellow-green #a5b836
    saturation: 0.75,
    growthMultiplier: 0.7,
    description: 'Showing stress signs',
  },
  poor: {
    state: 'poor',
    minHealth: 0.25,
    maxHealth: 0.45,
    baseColor: { r: 0.80, g: 0.55, b: 0.20 }, // Brown-orange #cc8c33
    saturation: 0.6,
    growthMultiplier: 0.4,
    description: 'Struggling to survive',
  },
  dying: {
    state: 'dying',
    minHealth: 0.1,
    maxHealth: 0.25,
    baseColor: { r: 0.55, g: 0.35, b: 0.25 }, // Brown #8c5940
    saturation: 0.4,
    growthMultiplier: 0.2,
    description: 'Critical condition',
  },
  dead: {
    state: 'dead',
    minHealth: 0,
    maxHealth: 0.1,
    baseColor: { r: 0.45, g: 0.42, b: 0.40 }, // Gray #736b66
    saturation: 0.15,
    growthMultiplier: 0,
    description: 'No longer viable',
  },
};

// ============================================
// ENVIRONMENTAL FACTORS
// ============================================

export interface EnvironmentalFactors {
  soilType: SoilType;
  elevation: number; // 0-1
  hour: number; // 0-24
  waterLevel?: number; // 0-1 (optional override)
}

// Soil quality factors for plant health
const SOIL_QUALITY: Record<SoilType, { nutrientLevel: number; waterRetention: number; drainageQuality: number }> = {
  wet: { nutrientLevel: 0.6, waterRetention: 1.0, drainageQuality: 0.3 },
  dry: { nutrientLevel: 0.4, waterRetention: 0.1, drainageQuality: 0.9 },
  good: { nutrientLevel: 1.0, waterRetention: 0.7, drainageQuality: 0.8 },
  bad: { nutrientLevel: 0.2, waterRetention: 0.4, drainageQuality: 0.5 },
};

// Calculate water availability based on soil and time
export function calculateWaterAvailability(soilType: SoilType, hour: number): number {
  const soilQuality = SOIL_QUALITY[soilType];
  
  // Morning dew increases water (6-9am)
  const dewBonus = (hour >= 6 && hour <= 9) ? 0.15 : 0;
  
  // Midday evaporation reduces water (11am-3pm)
  const evaporationPenalty = (hour >= 11 && hour <= 15) ? 0.2 : 0;
  
  const baseWater = soilQuality.waterRetention;
  return Math.max(0, Math.min(1, baseWater + dewBonus - evaporationPenalty));
}

// Calculate overall plant health score (0-1)
export function calculatePlantHealth(factors: EnvironmentalFactors): number {
  const { soilType, elevation, hour, waterLevel } = factors;
  
  const sunPosition = getSunPositionFromHour(hour);
  const sunY = sunPosition[1];
  
  // 1. Sunlight factor (25% weight)
  const sunlightExposure = calculateSunlightExposure(elevation, sunY);
  // Optimal sunlight is around 1.0-1.3, too much or too little is bad
  const sunlightScore = sunlightExposure < 0.5 
    ? sunlightExposure * 1.5 // Too dark
    : sunlightExposure > 1.5 
      ? Math.max(0, 1.5 - (sunlightExposure - 1.5) * 0.5) // Too bright
      : 0.75 + (sunlightExposure - 0.5) * 0.25; // Optimal range
  
  // 2. Water factor (25% weight)
  const water = waterLevel ?? calculateWaterAvailability(soilType, hour);
  // Optimal water is 0.5-0.8
  const waterScore = water < 0.3 
    ? water * 2 // Too dry
    : water > 0.9 
      ? Math.max(0.3, 1 - (water - 0.9) * 3) // Too wet (drowning)
      : 0.6 + (water - 0.3) * 0.67; // Optimal range
  
  // 3. Soil quality factor (30% weight)
  const soilQuality = SOIL_QUALITY[soilType];
  const soilScore = (soilQuality.nutrientLevel * 0.5 + soilQuality.drainageQuality * 0.3 + soilQuality.waterRetention * 0.2);
  
  // 4. Elevation factor (20% weight)
  // Moderate elevation is best (0.3-0.7)
  const elevationScore = elevation < 0.2 
    ? 0.5 + elevation * 2.5 // Low elevation - prone to flooding
    : elevation > 0.8 
      ? Math.max(0.4, 1 - (elevation - 0.8) * 3) // High elevation - harsh conditions
      : 0.8 + Math.abs(0.5 - elevation) * 0.4; // Optimal mid-elevation
  
  // Combine all factors
  const health = 
    sunlightScore * 0.25 +
    waterScore * 0.25 +
    soilScore * 0.30 +
    elevationScore * 0.20;
  
  return Math.max(0, Math.min(1, health));
}

// Get health state from health score
export function getHealthState(health: number): PlantHealthState {
  if (health >= 0.85) return 'thriving';
  if (health >= 0.65) return 'healthy';
  if (health >= 0.45) return 'moderate';
  if (health >= 0.25) return 'poor';
  if (health >= 0.1) return 'dying';
  return 'dead';
}

// ============================================
// RGB COLOR CALCULATION
// ============================================

export interface PlantRGB {
  r: number;
  g: number;
  b: number;
  hex: string;
}

// Calculate plant color based on health with smooth interpolation
export function calculatePlantColor(health: number): PlantRGB {
  // Clamp health to valid range
  health = Math.max(0, Math.min(1, health));
  
  let r: number, g: number, b: number;
  
  if (health >= 0.65) {
    // Healthy to Thriving: Deep green to vibrant green
    const t = (health - 0.65) / 0.35;
    r = THREE.MathUtils.lerp(0.29, 0.13, t);
    g = THREE.MathUtils.lerp(0.69, 0.77, t);
    b = THREE.MathUtils.lerp(0.31, 0.37, t);
  } else if (health >= 0.45) {
    // Moderate: Yellow-green blend
    const t = (health - 0.45) / 0.2;
    r = THREE.MathUtils.lerp(0.65, 0.29, t);
    g = THREE.MathUtils.lerp(0.73, 0.69, t);
    b = THREE.MathUtils.lerp(0.22, 0.31, t);
  } else if (health >= 0.25) {
    // Poor: Brown-orange to yellow-green
    const t = (health - 0.25) / 0.2;
    r = THREE.MathUtils.lerp(0.80, 0.65, t);
    g = THREE.MathUtils.lerp(0.55, 0.73, t);
    b = THREE.MathUtils.lerp(0.20, 0.22, t);
  } else if (health >= 0.1) {
    // Dying: Brown to brown-orange
    const t = (health - 0.1) / 0.15;
    r = THREE.MathUtils.lerp(0.55, 0.80, t);
    g = THREE.MathUtils.lerp(0.35, 0.55, t);
    b = THREE.MathUtils.lerp(0.25, 0.20, t);
  } else {
    // Dead: Gray desaturated
    const t = health / 0.1;
    r = THREE.MathUtils.lerp(0.45, 0.55, t);
    g = THREE.MathUtils.lerp(0.42, 0.35, t);
    b = THREE.MathUtils.lerp(0.40, 0.25, t);
  }
  
  // Convert to hex
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  
  return { r, g, b, hex };
}

// ============================================
// PLANT 3D COMPONENTS
// ============================================

interface PlantProps {
  position: [number, number, number];
  soilType: SoilType;
  elevation: number;
  hour: number;
  plantType?: 'basic' | 'flower' | 'crop' | 'tree';
  baseSize?: number;
  showLabel?: boolean;
  onHealthChange?: (health: number, state: PlantHealthState) => void;
}

export function Plant({
  position,
  soilType,
  elevation,
  hour,
  plantType = 'basic',
  baseSize = 0.3,
  showLabel = false,
  onHealthChange,
}: PlantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [animatedHealth, setAnimatedHealth] = useState(0.5);
  const [targetHealth, setTargetHealth] = useState(0.5);
  const [growthPhase, setGrowthPhase] = useState(0);
  
  // Calculate health based on environmental factors
  const health = useMemo(() => {
    return calculatePlantHealth({ soilType, elevation, hour });
  }, [soilType, elevation, hour]);
  
  // Update target health when factors change
  useEffect(() => {
    setTargetHealth(health);
    onHealthChange?.(health, getHealthState(health));
  }, [health, onHealthChange]);
  
  // Smooth animation of health changes
  useFrame((_, delta) => {
    // Animate health transition
    const healthDiff = targetHealth - animatedHealth;
    if (Math.abs(healthDiff) > 0.001) {
      setAnimatedHealth(prev => prev + healthDiff * Math.min(1, delta * 2));
    }
    
    // Growth/decay animation
    if (groupRef.current) {
      const targetPhase = animatedHealth > 0.1 ? 1 : 0;
      const phaseDiff = targetPhase - growthPhase;
      if (Math.abs(phaseDiff) > 0.001) {
        setGrowthPhase(prev => prev + phaseDiff * delta * 0.5);
      }
      
      // Subtle swaying animation
      const time = Date.now() * 0.001;
      groupRef.current.rotation.z = Math.sin(time + position[0]) * 0.05 * animatedHealth;
    }
  });
  
  const healthState = getHealthState(animatedHealth);
  const healthConfig = PLANT_HEALTH_STATES[healthState];
  const color = calculatePlantColor(animatedHealth);
  
  // Size based on health and growth
  const size = baseSize * healthConfig.growthMultiplier * growthPhase;
  const stemHeight = size * 1.5;
  
  // Stem color (darker version of leaf color)
  const stemColor = useMemo(() => {
    return `rgb(${Math.round(color.r * 180)}, ${Math.round(color.g * 150)}, ${Math.round(color.b * 120)})`;
  }, [color]);
  
  if (size < 0.01) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {plantType === 'basic' && (
        <BasicPlant 
          stemHeight={stemHeight} 
          size={size} 
          color={color.hex} 
          stemColor={stemColor}
          health={animatedHealth}
        />
      )}
      {plantType === 'flower' && (
        <FlowerPlant 
          stemHeight={stemHeight} 
          size={size} 
          color={color.hex} 
          stemColor={stemColor}
          health={animatedHealth}
        />
      )}
      {plantType === 'crop' && (
        <CropPlant 
          stemHeight={stemHeight} 
          size={size} 
          color={color.hex} 
          stemColor={stemColor}
          health={animatedHealth}
        />
      )}
      {plantType === 'tree' && (
        <TreePlant 
          stemHeight={stemHeight * 2} 
          size={size * 1.5} 
          color={color.hex} 
          stemColor={stemColor}
          health={animatedHealth}
        />
      )}
      
      {showLabel && (
        <Text
          position={[0, stemHeight + size + 0.2, 0]}
          fontSize={0.08}
          color={color.hex}
          anchorX="center"
          anchorY="bottom"
        >
          {Math.round(animatedHealth * 100)}%
        </Text>
      )}
    </group>
  );
}

// Basic plant component
interface PlantVisualProps {
  stemHeight: number;
  size: number;
  color: string;
  stemColor: string;
  health: number;
}

function BasicPlant({ stemHeight, size, color, stemColor, health }: PlantVisualProps) {
  return (
    <group>
      {/* Stem */}
      <mesh position={[0, stemHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.015 * (0.5 + health * 0.5), 0.025 * (0.5 + health * 0.5), stemHeight, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.8} />
      </mesh>
      
      {/* Leaf cluster */}
      <mesh position={[0, stemHeight, 0]} castShadow>
        <sphereGeometry args={[size * 0.5, 8, 8]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.7}
          emissive={color}
          emissiveIntensity={health > 0.7 ? 0.1 : 0}
        />
      </mesh>
      
      {/* Additional leaves for healthy plants */}
      {health > 0.5 && (
        <>
          <mesh position={[-size * 0.3, stemHeight * 0.7, 0]} rotation={[0, 0, -0.5]} castShadow>
            <coneGeometry args={[size * 0.2, size * 0.4, 4]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[size * 0.3, stemHeight * 0.6, 0]} rotation={[0, 0, 0.5]} castShadow>
            <coneGeometry args={[size * 0.2, size * 0.4, 4]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </>
      )}
    </group>
  );
}

function FlowerPlant({ stemHeight, size, color, stemColor, health }: PlantVisualProps) {
  // Flower color varies with health - healthy = colorful, unhealthy = muted
  const flowerHue = health > 0.5 ? '#ec4899' : '#9ca3af';
  
  return (
    <group>
      {/* Stem */}
      <mesh position={[0, stemHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.02, stemHeight, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.8} />
      </mesh>
      
      {/* Leaves */}
      <mesh position={[0, stemHeight * 0.4, 0]} castShadow>
        <sphereGeometry args={[size * 0.3, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Flower petals */}
      {health > 0.3 && (
        <group position={[0, stemHeight, 0]}>
          {[...Array(5)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i / 5) * Math.PI * 2) * size * 0.3,
                0,
                Math.sin((i / 5) * Math.PI * 2) * size * 0.3,
              ]}
              rotation={[Math.PI / 4, 0, (i / 5) * Math.PI * 2]}
              castShadow
            >
              <sphereGeometry args={[size * 0.2 * (0.5 + health * 0.5), 6, 6]} />
              <meshStandardMaterial 
                color={flowerHue} 
                roughness={0.5}
                emissive={flowerHue}
                emissiveIntensity={health > 0.7 ? 0.15 : 0}
              />
            </mesh>
          ))}
          {/* Center */}
          <mesh castShadow>
            <sphereGeometry args={[size * 0.15, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function CropPlant({ stemHeight, size, color, stemColor, health }: PlantVisualProps) {
  // Crop/fruit color - unripe to ripe based on health
  const fruitColor = health > 0.7 ? '#ef4444' : health > 0.4 ? '#fbbf24' : '#84cc16';
  
  return (
    <group>
      {/* Main stem */}
      <mesh position={[0, stemHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, stemHeight, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.8} />
      </mesh>
      
      {/* Leaves along stem */}
      {[...Array(3)].map((_, i) => (
        <group key={i} position={[0, stemHeight * (0.3 + i * 0.25), 0]} rotation={[0, i * 2.1, 0]}>
          <mesh position={[size * 0.3, 0, 0]} rotation={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[size * 0.15, size * 0.5, 4]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      ))}
      
      {/* Fruit/crop at top */}
      {health > 0.25 && (
        <mesh position={[0, stemHeight + size * 0.2, 0]} castShadow>
          <sphereGeometry args={[size * 0.35 * (0.5 + health * 0.5), 8, 8]} />
          <meshStandardMaterial 
            color={fruitColor} 
            roughness={0.4}
            emissive={fruitColor}
            emissiveIntensity={health > 0.7 ? 0.1 : 0}
          />
        </mesh>
      )}
    </group>
  );
}

function TreePlant({ stemHeight, size, color, stemColor, health }: PlantVisualProps) {
  return (
    <group>
      {/* Trunk */}
      <mesh position={[0, stemHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, stemHeight, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      
      {/* Foliage layers */}
      <mesh position={[0, stemHeight + size * 0.3, 0]} castShadow>
        <coneGeometry args={[size * 0.8, size * 1.2, 8]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.8} 
          flatShading 
          emissive={color}
          emissiveIntensity={health > 0.7 ? 0.05 : 0}
        />
      </mesh>
      <mesh position={[0, stemHeight + size * 0.8, 0]} castShadow>
        <coneGeometry args={[size * 0.6, size * 0.9, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} flatShading />
      </mesh>
      {health > 0.5 && (
        <mesh position={[0, stemHeight + size * 1.2, 0]} castShadow>
          <coneGeometry args={[size * 0.4, size * 0.6, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} flatShading />
        </mesh>
      )}
    </group>
  );
}

// ============================================
// PLANT GARDEN (Multiple plants)
// ============================================

interface PlantGardenProps {
  soilType: SoilType;
  hour: number;
  position?: [number, number, number];
  gridSize?: number;
  spacing?: number;
}

export function PlantGarden({ 
  soilType, 
  hour, 
  position = [0, 0, 0],
  gridSize = 3,
  spacing = 0.4,
}: PlantGardenProps) {
  const plants = useMemo(() => {
    const items: { pos: [number, number, number]; type: 'basic' | 'flower' | 'crop' | 'tree'; elevation: number }[] = [];
    const types: ('basic' | 'flower' | 'crop' | 'tree')[] = ['basic', 'flower', 'crop', 'tree'];
    
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const offsetX = (x - (gridSize - 1) / 2) * spacing;
        const offsetZ = (z - (gridSize - 1) / 2) * spacing;
        const elevation = 0.3 + Math.random() * 0.4; // Varied elevation
        
        items.push({
          pos: [offsetX, 0, offsetZ],
          type: types[(x + z) % types.length],
          elevation,
        });
      }
    }
    
    return items;
  }, [gridSize, spacing]);

  return (
    <group position={position}>
      {plants.map((plant, i) => (
        <Plant
          key={i}
          position={plant.pos}
          soilType={soilType}
          elevation={plant.elevation}
          hour={hour}
          plantType={plant.type}
          baseSize={0.2}
          showLabel={false}
        />
      ))}
    </group>
  );
}

// ============================================
// HEALTH INDICATOR UI
// ============================================

export interface PlantHealthSummary {
  averageHealth: number;
  healthState: PlantHealthState;
  sunlightLevel: number;
  waterLevel: number;
  soilQuality: number;
}

export function getHealthSummary(factors: EnvironmentalFactors): PlantHealthSummary {
  const health = calculatePlantHealth(factors);
  const sunPosition = getSunPositionFromHour(factors.hour);
  const sunlightLevel = calculateSunlightExposure(factors.elevation, sunPosition[1]);
  const waterLevel = calculateWaterAvailability(factors.soilType, factors.hour);
  const soilQuality = SOIL_QUALITY[factors.soilType].nutrientLevel;
  
  return {
    averageHealth: health,
    healthState: getHealthState(health),
    sunlightLevel,
    waterLevel,
    soilQuality,
  };
}