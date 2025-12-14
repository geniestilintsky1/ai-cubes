import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

export interface SunlightConfig {
  time: TimeOfDay;
  hour: number; // 0-24
  sunPosition: [number, number, number];
  sunIntensity: number;
  ambientIntensity: number;
  skyColor: string;
  groundColor: string;
  fogColor: string;
  shadowOpacity: number;
}

// Time of day presets
export const TIME_PRESETS: Record<TimeOfDay, SunlightConfig> = {
  dawn: {
    time: 'dawn',
    hour: 6,
    sunPosition: [80, 10, 30],
    sunIntensity: 0.6,
    ambientIntensity: 0.25,
    skyColor: '#fcd5ce',
    groundColor: '#89c2d9',
    fogColor: '#fec89a',
    shadowOpacity: 0.3,
  },
  morning: {
    time: 'morning',
    hour: 9,
    sunPosition: [60, 40, 30],
    sunIntensity: 1.2,
    ambientIntensity: 0.35,
    skyColor: '#a2d2ff',
    groundColor: '#90be6d',
    fogColor: '#caf0f8',
    shadowOpacity: 0.5,
  },
  noon: {
    time: 'noon',
    hour: 12,
    sunPosition: [0, 100, 0],
    sunIntensity: 1.8,
    ambientIntensity: 0.5,
    skyColor: '#87ceeb',
    groundColor: '#4ade80',
    fogColor: '#e0f2fe',
    shadowOpacity: 0.7,
  },
  afternoon: {
    time: 'afternoon',
    hour: 15,
    sunPosition: [-50, 60, 20],
    sunIntensity: 1.4,
    ambientIntensity: 0.4,
    skyColor: '#89c2d9',
    groundColor: '#6ede8a',
    fogColor: '#bde0fe',
    shadowOpacity: 0.6,
  },
  dusk: {
    time: 'dusk',
    hour: 18,
    sunPosition: [-80, 15, 30],
    sunIntensity: 0.7,
    ambientIntensity: 0.2,
    skyColor: '#f4a261',
    groundColor: '#457b9d',
    fogColor: '#e9c46a',
    shadowOpacity: 0.35,
  },
  night: {
    time: 'night',
    hour: 22,
    sunPosition: [-50, -20, 30],
    sunIntensity: 0.1,
    ambientIntensity: 0.08,
    skyColor: '#1d3557',
    groundColor: '#14213d',
    fogColor: '#264653',
    shadowOpacity: 0.1,
  },
};

// Calculate sun position from hour (0-24)
export function getSunPositionFromHour(hour: number): [number, number, number] {
  // Sun rises at 6, peaks at 12, sets at 18
  const normalizedHour = ((hour - 6) / 12) * Math.PI; // 0 to PI from 6am to 6pm
  const y = Math.sin(normalizedHour) * 100;
  const x = Math.cos(normalizedHour) * 80;
  return [x, Math.max(-20, y), 30];
}

// Get sunlight intensity based on sun height
export function getSunIntensityFromHeight(sunY: number): number {
  if (sunY < 0) return 0.1; // Night
  return 0.3 + (sunY / 100) * 1.5; // 0.3 to 1.8
}

// Calculate sunlight exposure for a given elevation (0-1)
export function calculateSunlightExposure(
  elevation: number,
  sunY: number,
  baseIntensity: number = 1
): number {
  // Higher elevation = more sun exposure
  const heightBonus = elevation * 0.4; // Up to 40% more light at max height
  
  // Sun angle factor - more direct sun at noon
  const sunFactor = Math.max(0, sunY / 100);
  
  // Combine factors
  const exposure = baseIntensity * (1 + heightBonus) * (0.5 + sunFactor * 0.5);
  
  return Math.min(2, Math.max(0.1, exposure));
}

interface DynamicSunProps {
  hour: number; // 0-24
  animate?: boolean;
  animationSpeed?: number;
  onHourChange?: (hour: number) => void;
}

export function DynamicSun({ 
  hour, 
  animate = false, 
  animationSpeed = 0.1,
  onHourChange 
}: DynamicSunProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const currentHour = useRef(hour);

  // Animate time of day
  useFrame((_, delta) => {
    if (animate && onHourChange) {
      currentHour.current = (currentHour.current + delta * animationSpeed) % 24;
      onHourChange(currentHour.current);
    }
  });

  const sunPosition = useMemo(() => getSunPositionFromHour(hour), [hour]);
  const sunIntensity = useMemo(() => getSunIntensityFromHeight(sunPosition[1]), [sunPosition]);
  
  // Dynamic colors based on sun position
  const colors = useMemo(() => {
    const sunY = sunPosition[1];
    
    if (sunY < 0) {
      // Night
      return {
        sun: '#6366f1',
        ambient: '#1e1b4b',
        hemisphere: ['#1e3a8a', '#0f172a'] as [string, string],
      };
    } else if (sunY < 30) {
      // Dawn/Dusk
      return {
        sun: '#fb923c',
        ambient: '#fef3c7',
        hemisphere: ['#fcd34d', '#4ade80'] as [string, string],
      };
    } else {
      // Day
      return {
        sun: '#fef08a',
        ambient: '#e0f2fe',
        hemisphere: ['#87ceeb', '#4ade80'] as [string, string],
      };
    }
  }, [sunPosition]);

  return (
    <>
      {/* Main sun light with shadows */}
      <directionalLight
        ref={sunRef}
        position={sunPosition}
        intensity={sunIntensity}
        color={colors.sun}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
      />
      
      {/* Ambient light */}
      <ambientLight 
        intensity={sunIntensity * 0.25} 
        color={colors.ambient} 
      />
      
      {/* Hemisphere light for sky/ground color bounce */}
      <hemisphereLight
        args={[colors.hemisphere[0], colors.hemisphere[1], sunIntensity * 0.35]}
      />
      
      {/* Rim light for depth */}
      <directionalLight
        position={[-sunPosition[0], sunPosition[1] * 0.3, -sunPosition[2]]}
        intensity={sunIntensity * 0.15}
        color="#a78bfa"
      />
    </>
  );
}

interface DynamicSkyProps {
  hour: number;
}

export function DynamicSky({ hour }: DynamicSkyProps) {
  const sunPosition = useMemo(() => getSunPositionFromHour(hour), [hour]);
  
  // Sky parameters based on time of day
  const skyParams = useMemo(() => {
    const sunY = sunPosition[1];
    
    if (sunY < 0) {
      return { turbidity: 1, rayleigh: 0.2, mieCoefficient: 0.001 };
    } else if (sunY < 30) {
      return { turbidity: 10, rayleigh: 3, mieCoefficient: 0.05 };
    } else {
      return { turbidity: 8, rayleigh: 0.5, mieCoefficient: 0.005 };
    }
  }, [sunPosition]);

  return (
    <Sky
      distance={450000}
      sunPosition={sunPosition}
      turbidity={skyParams.turbidity}
      rayleigh={skyParams.rayleigh}
      mieCoefficient={skyParams.mieCoefficient}
      mieDirectionalG={0.8}
    />
  );
}

interface DynamicFogProps {
  hour: number;
  near?: number;
  far?: number;
}

export function DynamicFog({ hour, near = 20, far = 80 }: DynamicFogProps) {
  const sunPosition = useMemo(() => getSunPositionFromHour(hour), [hour]);
  
  const fogColor = useMemo(() => {
    const sunY = sunPosition[1];
    
    if (sunY < 0) return '#1e293b'; // Night - dark blue
    if (sunY < 30) return '#fde68a'; // Dawn/dusk - warm
    return '#e0f2fe'; // Day - light blue
  }, [sunPosition]);

  return <fog attach="fog" args={[fogColor, near, far]} />;
}

// Elevation terrain with height-based coloring
interface ElevationTerrainProps {
  hour: number;
  onElevationSample?: (x: number, z: number, elevation: number) => void;
}

export function ElevationTerrain({ hour, onElevationSample }: ElevationTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sunY = useMemo(() => getSunPositionFromHour(hour)[1], [hour]);

  // Generate terrain with varied elevation
  const { geometry, elevationData } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 128, 128);
    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    const elevations: number[][] = [];
    
    for (let i = 0; i < 129; i++) {
      elevations.push([]);
    }
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const idx = Math.floor(i / 3);
      const row = Math.floor(idx / 129);
      const col = idx % 129;
      
      // Create varied terrain with hills and valleys
      const height = 
        Math.sin(x * 0.05) * Math.cos(y * 0.05) * 1.5 +
        Math.sin(x * 0.1 + 1) * Math.cos(y * 0.08) * 0.8 +
        Math.sin(x * 0.2) * Math.cos(y * 0.15) * 0.4 +
        Math.sin(x * 0.03 + y * 0.02) * 2; // Large hills
      
      positions[i + 2] = height;
      elevations[row][col] = height;
      
      // Color based on elevation (normalized 0-1)
      const normalizedElevation = (height + 3) / 8; // Normalize from ~-3 to ~5
      
      // Sunlight exposure affects color brightness
      const exposure = calculateSunlightExposure(normalizedElevation, sunY);
      
      // Green to brown based on elevation, with sun exposure affecting brightness
      const baseGreen = 0.6 - normalizedElevation * 0.3;
      const r = (0.2 + normalizedElevation * 0.3) * exposure;
      const g = baseGreen * exposure;
      const b = 0.15 * exposure;
      
      colors[i] = r;
      colors[i + 1] = g;
      colors[i + 2] = b;
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    
    return { geometry: geo, elevationData: elevations };
  }, [sunY]);

  // Expose elevation sampling function
  const getElevationAt = useCallback((x: number, z: number): number => {
    // Convert world coords to grid coords
    const gridX = Math.floor((x + 50) / 100 * 128);
    const gridZ = Math.floor((z + 50) / 100 * 128);
    
    if (gridX >= 0 && gridX < 129 && gridZ >= 0 && gridZ < 129) {
      return elevationData[gridZ]?.[gridX] ?? 0;
    }
    return 0;
  }, [elevationData]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
}

// Sunlight exposure indicator for educational purposes
interface SunlightIndicatorProps {
  elevation: number; // 0-1
  hour: number;
}

export function SunlightIndicator3D({ elevation, hour }: SunlightIndicatorProps) {
  const sunY = getSunPositionFromHour(hour)[1];
  const exposure = calculateSunlightExposure(elevation, sunY);
  
  // Visual representation of sunlight exposure
  const color = useMemo(() => {
    if (exposure < 0.5) return '#94a3b8'; // Low - gray
    if (exposure < 1.0) return '#fcd34d'; // Medium - yellow
    if (exposure < 1.5) return '#fb923c'; // High - orange
    return '#f97316'; // Very high - bright orange
  }, [exposure]);

  return (
    <mesh position={[0, 3, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// Plant growth indicator based on sunlight
interface PlantGrowthZoneProps {
  position: [number, number, number];
  elevation: number;
  hour: number;
  size?: number;
}

export function PlantGrowthZone({ position, elevation, hour, size = 0.3 }: PlantGrowthZoneProps) {
  const sunY = getSunPositionFromHour(hour)[1];
  const exposure = calculateSunlightExposure(elevation, sunY);
  
  // Plant health based on sunlight
  const plantColor = useMemo(() => {
    if (exposure < 0.4) return '#78716c'; // Dead/dormant
    if (exposure < 0.8) return '#84cc16'; // Struggling
    if (exposure < 1.2) return '#22c55e'; // Healthy
    return '#16a34a'; // Thriving
  }, [exposure]);

  const plantHeight = useMemo(() => {
    return size * (0.5 + exposure * 0.5);
  }, [exposure, size]);

  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, plantHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, plantHeight, 6]} />
        <meshStandardMaterial color="#365314" roughness={0.8} />
      </mesh>
      
      {/* Leaves/top */}
      <mesh position={[0, plantHeight, 0]} castShadow>
        <sphereGeometry args={[size * 0.4 * (0.5 + exposure * 0.3), 8, 8]} />
        <meshStandardMaterial 
          color={plantColor} 
          roughness={0.7}
          emissive={plantColor}
          emissiveIntensity={sunY > 50 ? 0.1 : 0}
        />
      </mesh>
    </group>
  );
}