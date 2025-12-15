import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { type SoilType, SOIL_ZONES, getSoilTypeAtPosition } from './SoilZones';
import { getSunPositionFromHour, calculateSunlightExposure } from './SunlightSystem';
import { calculatePlantHealth, calculatePlantColor, getHealthState, type PlantHealthState } from './PlantSystem';

// ============================================
// SCAN DATA TYPES
// ============================================

export interface TerrainScanData {
  soilType: SoilType;
  soilQuality: number;
  elevation: number;
  sunlightExposure: number;
  waterLevel: number;
  temperature: number; // Derived from sunlight
}

export interface PlantScanData {
  health: number;
  healthState: PlantHealthState;
  color: { r: number; g: number; b: number; hex: string };
  growthPotential: number;
  stressFactors: string[];
}

export interface RobotScanResult {
  timestamp: number;
  position: [number, number, number];
  terrain: TerrainScanData;
  plant: PlantScanData;
  recommendations: string[];
}

// ============================================
// SCAN LOGIC
// ============================================

export function performTerrainScan(
  position: [number, number, number],
  hour: number
): TerrainScanData {
  const [x, y, z] = position;
  const soilType = getSoilTypeAtPosition(x, z);
  const soilConfig = SOIL_ZONES[soilType];
  
  // Calculate soil quality based on type
  const soilQualityMap: Record<SoilType, number> = {
    good: 0.95,
    wet: 0.65,
    dry: 0.45,
    bad: 0.25,
  };
  
  const elevation = y; // Already normalized 0-1
  const sunPosition = getSunPositionFromHour(hour);
  const sunlightExposure = calculateSunlightExposure(elevation, sunPosition[1]);
  
  // Water level based on soil type and time
  const waterLevelMap: Record<SoilType, number> = {
    wet: 0.9,
    good: 0.65,
    dry: 0.2,
    bad: 0.4,
  };
  let waterLevel = waterLevelMap[soilType];
  // Morning dew bonus
  if (hour >= 6 && hour <= 9) waterLevel = Math.min(1, waterLevel + 0.1);
  // Midday evaporation
  if (hour >= 11 && hour <= 15) waterLevel = Math.max(0, waterLevel - 0.15);
  
  // Temperature derived from sunlight and elevation
  const baseTemp = 15 + sunlightExposure * 20; // 15-35°C range
  const elevationCooling = elevation * 5; // Higher = cooler
  const temperature = baseTemp - elevationCooling;
  
  return {
    soilType,
    soilQuality: soilQualityMap[soilType],
    elevation,
    sunlightExposure,
    waterLevel,
    temperature,
  };
}

export function performPlantScan(
  position: [number, number, number],
  hour: number,
  terrain: TerrainScanData
): PlantScanData {
  const health = calculatePlantHealth({
    soilType: terrain.soilType,
    elevation: terrain.elevation,
    hour,
    waterLevel: terrain.waterLevel,
  });
  
  const healthState = getHealthState(health);
  const color = calculatePlantColor(health);
  
  // Growth potential (ideal conditions = 1.0)
  const growthPotential = Math.min(1, 
    (terrain.soilQuality * 0.3) +
    (Math.min(1, terrain.sunlightExposure) * 0.3) +
    (terrain.waterLevel * 0.25) +
    ((terrain.elevation > 0.2 && terrain.elevation < 0.8 ? 1 : 0.5) * 0.15)
  );
  
  // Identify stress factors
  const stressFactors: string[] = [];
  if (terrain.sunlightExposure < 0.4) stressFactors.push('Low sunlight');
  if (terrain.sunlightExposure > 1.5) stressFactors.push('Excessive sun');
  if (terrain.waterLevel < 0.3) stressFactors.push('Drought stress');
  if (terrain.waterLevel > 0.85) stressFactors.push('Waterlogging');
  if (terrain.soilQuality < 0.4) stressFactors.push('Poor soil');
  if (terrain.temperature > 32) stressFactors.push('Heat stress');
  if (terrain.temperature < 10) stressFactors.push('Cold stress');
  
  return {
    health,
    healthState,
    color,
    growthPotential,
    stressFactors,
  };
}

export function generateRecommendations(
  terrain: TerrainScanData,
  plant: PlantScanData
): string[] {
  const recommendations: string[] = [];
  
  if (terrain.waterLevel < 0.3) {
    recommendations.push('Increase irrigation');
  }
  if (terrain.waterLevel > 0.85) {
    recommendations.push('Improve drainage');
  }
  if (terrain.sunlightExposure < 0.4) {
    recommendations.push('Move to higher elevation or wait for better sun angle');
  }
  if (terrain.soilQuality < 0.4) {
    recommendations.push('Consider soil amendment or relocating to better soil');
  }
  if (plant.health < 0.5 && terrain.soilType === 'bad') {
    recommendations.push('This location is unsuitable for healthy plant growth');
  }
  if (plant.growthPotential > 0.8) {
    recommendations.push('Excellent growing conditions!');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Conditions are adequate for plant growth');
  }
  
  return recommendations;
}

export function performFullScan(
  position: [number, number, number],
  hour: number
): RobotScanResult {
  const terrain = performTerrainScan(position, hour);
  const plant = performPlantScan(position, hour, terrain);
  const recommendations = generateRecommendations(terrain, plant);
  
  return {
    timestamp: Date.now(),
    position,
    terrain,
    plant,
    recommendations,
  };
}

// ============================================
// 3D SCANNER VISUALIZATION
// ============================================

interface ScannerBeamProps {
  position: [number, number, number];
  isScanning: boolean;
  scanProgress: number;
}

export function ScannerBeam({ position, isScanning, scanProgress }: ScannerBeamProps) {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (beamRef.current && isScanning) {
      beamRef.current.rotation.y = time * 3;
      const scale = 0.5 + Math.sin(time * 5) * 0.1;
      beamRef.current.scale.set(scale, 1, scale);
    }
    
    if (ringRef.current && isScanning) {
      const ringScale = 0.3 + scanProgress * 0.7;
      ringRef.current.scale.set(ringScale, ringScale, 1);
      ringRef.current.rotation.z = time * 2;
    }
  });
  
  if (!isScanning) return null;
  
  return (
    <group position={position}>
      {/* Scanning cone beam */}
      <mesh ref={beamRef} position={[0, -0.15, 0]}>
        <coneGeometry args={[0.3, 0.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Scan ring expanding outward */}
      <mesh ref={ringRef} position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.6 * (1 - scanProgress)}
        />
      </mesh>
      
      {/* Ground scan circle */}
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4 * scanProgress, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

// ============================================
// SCAN RESULT OVERLAY (3D)
// ============================================

interface ScanResultOverlay3DProps {
  scanResult: RobotScanResult | null;
  show: boolean;
}

export function ScanResultOverlay3D({ scanResult, show }: ScanResultOverlay3DProps) {
  if (!scanResult || !show) return null;
  
  const { terrain, plant } = scanResult;
  const [x, y, z] = scanResult.position;
  
  // Position the overlay above the scanned location
  const overlayPosition: [number, number, number] = [
    (x * 2) - 1,
    (y * 2) - 1.5 + 0.8,
    (z * 2) - 1,
  ];
  
  return (
    <group position={overlayPosition}>
      {/* Data points around the scan location */}
      <DataPoint 
        position={[-0.3, 0.2, 0]} 
        label="Soil" 
        value={`${Math.round(terrain.soilQuality * 100)}%`}
        color={SOIL_ZONES[terrain.soilType].color}
      />
      <DataPoint 
        position={[0.3, 0.2, 0]} 
        label="Sun" 
        value={`${Math.round(terrain.sunlightExposure * 100)}%`}
        color="#fbbf24"
      />
      <DataPoint 
        position={[-0.3, -0.1, 0]} 
        label="Water" 
        value={`${Math.round(terrain.waterLevel * 100)}%`}
        color="#3b82f6"
      />
      <DataPoint 
        position={[0.3, -0.1, 0]} 
        label="Health" 
        value={`${Math.round(plant.health * 100)}%`}
        color={plant.color.hex}
      />
    </group>
  );
}

interface DataPointProps {
  position: [number, number, number];
  label: string;
  value: string;
  color: string;
}

function DataPoint({ position, label, value, color }: DataPointProps) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.06}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label}
      </Text>
      <Text
        position={[0, -0.05, 0]}
        fontSize={0.05}
        color={color}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.008}
        outlineColor="#000000"
      >
        {value}
      </Text>
    </group>
  );
}

// ============================================
// ROBOT SCANNER COMPONENT
// ============================================

interface RobotScannerProps {
  robotPosition: [number, number, number];
  hour: number;
  autoScan?: boolean;
  scanInterval?: number; // ms
  onScanComplete?: (result: RobotScanResult) => void;
}

export function RobotScanner({
  robotPosition,
  hour,
  autoScan = true,
  scanInterval = 500,
  onScanComplete,
}: RobotScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScan, setLastScan] = useState<RobotScanResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const lastPositionRef = useRef<[number, number, number]>(robotPosition);
  
  // Check if robot moved
  const hasMoved = useCallback(() => {
    const [x, y, z] = robotPosition;
    const [lx, ly, lz] = lastPositionRef.current;
    return Math.abs(x - lx) > 0.01 || Math.abs(y - ly) > 0.01 || Math.abs(z - lz) > 0.01;
  }, [robotPosition]);
  
  // Trigger scan when robot moves (with debounce)
  useEffect(() => {
    if (!autoScan) return;
    
    if (hasMoved()) {
      lastPositionRef.current = robotPosition;
      setIsScanning(true);
      setScanProgress(0);
      
      // Animate scan progress
      const duration = 300;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        setScanProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Complete scan
          const result = performFullScan(robotPosition, hour);
          setLastScan(result);
          onScanComplete?.(result);
          setIsScanning(false);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [robotPosition, hour, autoScan, hasMoved, onScanComplete]);
  
  // Convert robot position to world position
  const worldPosition: [number, number, number] = [
    (robotPosition[0] * 2) - 1,
    (robotPosition[1] * 2) - 1.5 + 0.08,
    (robotPosition[2] * 2) - 1,
  ];
  
  return (
    <>
      <ScannerBeam
        position={worldPosition}
        isScanning={isScanning}
        scanProgress={scanProgress}
      />
      <ScanResultOverlay3D
        scanResult={lastScan}
        show={showOverlay && !isScanning && !!lastScan}
      />
    </>
  );
}

// ============================================
// NAVIGATION PATH VISUALIZATION
// ============================================

interface NavigationPathProps {
  waypoints: [number, number, number][];
  currentIndex: number;
  color?: string;
}

export function NavigationPath({ waypoints, currentIndex, color = '#22d3ee' }: NavigationPathProps) {
  const lineObject = useMemo(() => {
    if (waypoints.length < 2) return null;
    
    const points = waypoints.map(([x, y, z]) => 
      new THREE.Vector3((x * 2) - 1, (y * 2) - 1.5 + 0.05, (z * 2) - 1)
    );
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.6 
    });
    
    return new THREE.Line(geometry, material);
  }, [waypoints, color]);
  
  if (!lineObject || waypoints.length < 2) return null;
  
  return (
    <group>
      {/* Path line */}
      <primitive object={lineObject} />
      
      {/* Waypoint markers */}
      {waypoints.map((wp, i) => (
        <mesh
          key={i}
          position={[(wp[0] * 2) - 1, (wp[1] * 2) - 1.5 + 0.05, (wp[2] * 2) - 1]}
        >
          <sphereGeometry args={[i === currentIndex ? 0.06 : 0.03, 8, 8]} />
          <meshBasicMaterial
            color={i < currentIndex ? '#22c55e' : i === currentIndex ? '#fbbf24' : color}
          />
        </mesh>
      ))}
    </group>
  );
}
