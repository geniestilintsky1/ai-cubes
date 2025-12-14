import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { getSunPositionFromHour, calculateSunlightExposure } from './SunlightSystem';

interface TerrainProps {
  hour?: number;
}

export function Terrain({ hour = 12 }: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sunY = useMemo(() => getSunPositionFromHour(hour)[1], [hour]);

  // Generate terrain geometry with height variations and elevation-based coloring
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 128, 128);
    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    
    // Create varied terrain with distinct elevation zones
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      
      // Multiple octaves of noise for natural terrain with larger hills
      const height = 
        Math.sin(x * 0.04) * Math.cos(y * 0.04) * 2.0 +
        Math.sin(x * 0.08 + 1) * Math.cos(y * 0.06) * 1.0 +
        Math.sin(x * 0.15) * Math.cos(y * 0.12) * 0.5 +
        Math.sin(x * 0.02 + y * 0.015) * 3.0; // Large rolling hills
      
      positions[i + 2] = height;
      
      // Calculate normalized elevation (approx -4 to +6 range)
      const normalizedElevation = (height + 4) / 10;
      
      // Sunlight exposure based on elevation
      const exposure = calculateSunlightExposure(normalizedElevation, sunY);
      
      // Color gradient: low = darker green, high = lighter/yellower
      const r = (0.15 + normalizedElevation * 0.25) * exposure;
      const g = (0.55 - normalizedElevation * 0.15) * exposure;
      const b = 0.12 * exposure;
      
      colors[i] = Math.min(1, r);
      colors[i + 1] = Math.min(1, g);
      colors[i + 2] = Math.min(1, b);
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [sunY]);

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

export function DistantMountains() {
  const mountains = useMemo(() => {
    const positions: { x: number; z: number; scale: number; height: number }[] = [];
    
    // Create ring of mountains in the distance
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const distance = 35 + Math.random() * 15;
      positions.push({
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance,
        scale: 8 + Math.random() * 12,
        height: 10 + Math.random() * 15,
      });
    }
    
    return positions;
  }, []);

  return (
    <group>
      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, m.height / 2 - 2, m.z]} castShadow>
          <coneGeometry args={[m.scale, m.height, 6]} />
          <meshStandardMaterial
            color="#64748b"
            roughness={0.8}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

// Legacy lighting - now using DynamicSun from SunlightSystem
export function AtmosphericLighting({ hour = 12 }: { hour?: number }) {
  const sunPosition = useMemo(() => getSunPositionFromHour(hour), [hour]);
  const sunY = sunPosition[1];
  
  // Dynamic intensity based on sun position
  const intensity = useMemo(() => {
    if (sunY < 0) return 0.2;
    return 0.4 + (sunY / 100) * 1.2;
  }, [sunY]);

  // Dynamic colors based on time
  const colors = useMemo(() => {
    if (sunY < 0) {
      return { sun: '#6366f1', ambient: '#1e1b4b', ground: '#0f172a' };
    } else if (sunY < 30) {
      return { sun: '#fb923c', ambient: '#fef3c7', ground: '#4ade80' };
    }
    return { sun: '#fef08a', ambient: '#87CEEB', ground: '#4ade80' };
  }, [sunY]);

  return (
    <>
      {/* Main sun light */}
      <directionalLight
        position={sunPosition}
        intensity={intensity}
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
      
      {/* Ambient sky light */}
      <ambientLight intensity={intensity * 0.3} color={colors.ambient} />
      
      {/* Ground bounce light */}
      <hemisphereLight
        args={[colors.ambient, colors.ground, intensity * 0.4]}
      />
      
      {/* Rim light for depth */}
      <directionalLight
        position={[-sunPosition[0], sunPosition[1] * 0.3, -sunPosition[2]]}
        intensity={intensity * 0.2}
        color="#a78bfa"
      />
    </>
  );
}

export function AtmosphericSky({ hour = 12 }: { hour?: number }) {
  const sunPosition = useMemo(() => getSunPositionFromHour(hour), [hour]);
  const sunY = sunPosition[1];
  
  // Sky parameters based on sun position
  const skyParams = useMemo(() => {
    if (sunY < 0) {
      return { turbidity: 1, rayleigh: 0.2, mieCoefficient: 0.001 };
    } else if (sunY < 30) {
      return { turbidity: 10, rayleigh: 3, mieCoefficient: 0.05 };
    }
    return { turbidity: 8, rayleigh: 0.5, mieCoefficient: 0.005 };
  }, [sunY]);

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        turbidity={skyParams.turbidity}
        rayleigh={skyParams.rayleigh}
        mieCoefficient={skyParams.mieCoefficient}
        mieDirectionalG={0.8}
      />
      
      {/* Volumetric clouds - fade at night */}
      {sunY > 0 && (
        <>
          <Cloud
            position={[-20, 25, -30]}
            opacity={0.5}
            speed={0.2}
            segments={40}
          />
          <Cloud
            position={[25, 30, -25]}
            opacity={0.4}
            speed={0.15}
            segments={30}
          />
          <Cloud
            position={[0, 35, 20]}
            opacity={0.3}
            speed={0.1}
            segments={25}
          />
        </>
      )}
    </>
  );
}

export function GroundDetails() {
  // Scattered rocks and details for foreground interest
  const rocks = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; rotation: number }[] = [];
    
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 5 + Math.random() * 20;
      items.push({
        pos: [
          Math.cos(angle) * distance,
          -1.8 + Math.random() * 0.3,
          Math.sin(angle) * distance,
        ],
        scale: 0.2 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI,
      });
    }
    
    return items;
  }, []);

  return (
    <group>
      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={rock.pos}
          rotation={[0, rock.rotation, 0]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[rock.scale, 0]} />
          <meshStandardMaterial
            color="#78716c"
            roughness={0.9}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

interface FogEffectProps {
  near?: number;
  far?: number;
  color?: string;
  hour?: number;
}

export function FogEffect({ near = 20, far = 80, color, hour = 12 }: FogEffectProps) {
  const sunY = useMemo(() => getSunPositionFromHour(hour)[1], [hour]);
  
  // Dynamic fog color based on time if not specified
  const fogColor = useMemo(() => {
    if (color) return color;
    if (sunY < 0) return '#1e293b'; // Night
    if (sunY < 30) return '#fde68a'; // Dawn/dusk
    return '#e0f2fe'; // Day
  }, [color, sunY]);

  return <fog attach="fog" args={[fogColor, near, far]} />;
}

// Trees for midground
export function Trees() {
  const trees = useMemo(() => {
    const items: { pos: [number, number, number]; scale: number; trunkHeight: number }[] = [];
    
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 25;
      items.push({
        pos: [
          Math.cos(angle) * distance,
          -2,
          Math.sin(angle) * distance,
        ],
        scale: 0.8 + Math.random() * 1.2,
        trunkHeight: 1.5 + Math.random() * 1,
      });
    }
    
    return items;
  }, []);

  return (
    <group>
      {trees.map((tree, i) => (
        <group key={i} position={tree.pos}>
          {/* Trunk */}
          <mesh position={[0, tree.trunkHeight / 2, 0]} castShadow>
            <cylinderGeometry args={[0.1 * tree.scale, 0.15 * tree.scale, tree.trunkHeight, 8]} />
            <meshStandardMaterial color="#92400e" roughness={0.9} />
          </mesh>
          
          {/* Foliage layers */}
          <mesh position={[0, tree.trunkHeight + 0.5 * tree.scale, 0]} castShadow>
            <coneGeometry args={[1 * tree.scale, 2 * tree.scale, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.8} flatShading />
          </mesh>
          <mesh position={[0, tree.trunkHeight + 1.2 * tree.scale, 0]} castShadow>
            <coneGeometry args={[0.7 * tree.scale, 1.5 * tree.scale, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Floating particles for atmosphere
export function AtmosphericParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const { geometry, material } = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const mat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    
    return { geometry: geo, material: mat };
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.01;
    }
  });

  return <points ref={particlesRef} geometry={geometry} material={material} />;
}
