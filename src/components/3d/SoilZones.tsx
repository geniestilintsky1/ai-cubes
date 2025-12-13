import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Soil zone types and their properties
export type SoilType = 'wet' | 'dry' | 'good' | 'bad';

export interface SoilZoneConfig {
  type: SoilType;
  name: string;
  color: string;
  speedMultiplier: number;
  description: string;
}

export const SOIL_ZONES: Record<SoilType, SoilZoneConfig> = {
  wet: {
    type: 'wet',
    name: 'Wet Soil',
    color: '#3b82f6',
    speedMultiplier: 0.5,
    description: 'Muddy and slow',
  },
  dry: {
    type: 'dry',
    name: 'Dry Soil',
    color: '#d97706',
    speedMultiplier: 0.8,
    description: 'Cracked and rough',
  },
  good: {
    type: 'good',
    name: 'Good Soil',
    color: '#22c55e',
    speedMultiplier: 1.0,
    description: 'Fertile and easy',
  },
  bad: {
    type: 'bad',
    name: 'Bad Soil',
    color: '#78716c',
    speedMultiplier: 0.6,
    description: 'Rocky and tough',
  },
};

// Get soil type based on normalized position (0-1)
export function getSoilTypeAtPosition(x: number, z: number): SoilType {
  // Divide the platform into quadrants with slight overlap for blending
  // Top-left: Wet, Top-right: Dry, Bottom-left: Good, Bottom-right: Bad
  const centerX = 0.5;
  const centerZ = 0.5;
  
  if (x < centerX && z < centerZ) return 'wet';
  if (x >= centerX && z < centerZ) return 'dry';
  if (x < centerX && z >= centerZ) return 'good';
  return 'bad';
}

// Calculate blend factor for smooth transitions (0-1, 1 = fully in zone)
export function getZoneBlendFactor(x: number, z: number): number {
  const blendWidth = 0.1;
  const centerX = 0.5;
  const centerZ = 0.5;
  
  const distFromXBorder = Math.abs(x - centerX);
  const distFromZBorder = Math.abs(z - centerZ);
  
  const xBlend = Math.min(1, distFromXBorder / blendWidth);
  const zBlend = Math.min(1, distFromZBorder / blendWidth);
  
  return Math.min(xBlend, zBlend);
}

interface SoilZonePlatformProps {
  size?: number;
}

export function SoilZonePlatform({ size = 2 }: SoilZonePlatformProps) {
  const wetRef = useRef<THREE.Mesh>(null);
  const waterEffectRef = useRef<THREE.Mesh>(null);

  // Create zone geometries
  const zoneSize = size / 2;
  const offset = zoneSize / 2;

  // Animate water effect in wet zone
  useFrame((state) => {
    if (waterEffectRef.current) {
      const time = state.clock.getElapsedTime();
      waterEffectRef.current.position.y = Math.sin(time * 2) * 0.005 + 0.02;
    }
  });

  return (
    <group position={[0, -1.49, 0]}>
      {/* Wet Zone (front-left quadrant) - Blue tones with water effect */}
      <group position={[-offset, 0, -offset]}>
        <mesh ref={wetRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[zoneSize, zoneSize, 8, 8]} />
          <meshStandardMaterial
            color="#1e40af"
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        {/* Water puddles */}
        <mesh ref={waterEffectRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[zoneSize * 0.3, 16]} />
          <meshStandardMaterial
            color="#60a5fa"
            transparent
            opacity={0.6}
            metalness={0.8}
            roughness={0.1}
          />
        </mesh>
        {/* Zone label */}
        <Text
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#93c5fd"
          anchorX="center"
          anchorY="middle"
        >
          WET
        </Text>
      </group>

      {/* Dry Zone (front-right quadrant) - Orange/brown tones with cracks */}
      <group position={[offset, 0, -offset]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[zoneSize, zoneSize]} />
          <meshStandardMaterial
            color="#b45309"
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>
        {/* Crack lines */}
        {[...Array(5)].map((_, i) => (
          <mesh
            key={i}
            position={[(i - 2) * 0.15, 0.01, (i % 2 - 0.5) * 0.3]}
            rotation={[-Math.PI / 2, 0, i * 0.3]}
          >
            <planeGeometry args={[0.4, 0.02]} />
            <meshBasicMaterial color="#78350f" />
          </mesh>
        ))}
        <Text
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          DRY
        </Text>
      </group>

      {/* Good Soil Zone (back-left quadrant) - Lush green with grass */}
      <group position={[-offset, 0, offset]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[zoneSize, zoneSize]} />
          <meshStandardMaterial
            color="#166534"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        {/* Grass tufts */}
        {[...Array(8)].map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * zoneSize * 0.7,
              0.03,
              (Math.random() - 0.5) * zoneSize * 0.7
            ]}
            rotation={[0, Math.random() * Math.PI, 0]}
          >
            <coneGeometry args={[0.02, 0.06, 4]} />
            <meshStandardMaterial color="#4ade80" />
          </mesh>
        ))}
        <Text
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#86efac"
          anchorX="center"
          anchorY="middle"
        >
          GOOD
        </Text>
      </group>

      {/* Bad Soil Zone (back-right quadrant) - Rocky gray with stones */}
      <group position={[offset, 0, offset]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[zoneSize, zoneSize]} />
          <meshStandardMaterial
            color="#57534e"
            roughness={0.95}
            metalness={0.1}
          />
        </mesh>
        {/* Small rocks */}
        {[...Array(6)].map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * zoneSize * 0.6,
              0.03,
              (Math.random() - 0.5) * zoneSize * 0.6
            ]}
            rotation={[Math.random(), Math.random(), Math.random()]}
          >
            <dodecahedronGeometry args={[0.04 + Math.random() * 0.03, 0]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.9} flatShading />
          </mesh>
        ))}
        <Text
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#d6d3d1"
          anchorX="center"
          anchorY="middle"
        >
          BAD
        </Text>
      </group>

      {/* Zone boundaries - subtle gradient lines */}
      <ZoneBoundaries size={size} />
    </group>
  );
}

function ZoneBoundaries({ size }: { size: number }) {
  return (
    <group position={[0, 0.01, 0]}>
      {/* Horizontal center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, 0.08]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Vertical center line */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[size, 0.08]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.15}
        />
      </mesh>

      {/* Gradient overlays at boundaries for smooth transitions */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[0.3, size]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.05}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[size, 0.3]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

// Zone indicator UI component
interface ZoneIndicatorProps {
  currentZone: SoilType;
  speedMultiplier: number;
}

export function ZoneIndicator3D({ currentZone, speedMultiplier }: ZoneIndicatorProps) {
  const config = SOIL_ZONES[currentZone];
  
  return (
    <group position={[0, 2, 0]}>
      <Text
        fontSize={0.12}
        color={config.color}
        anchorX="center"
        anchorY="middle"
      >
        {config.name}
      </Text>
      <Text
        position={[0, -0.15, 0]}
        fontSize={0.08}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        Speed: {Math.round(speedMultiplier * 100)}%
      </Text>
    </group>
  );
}
