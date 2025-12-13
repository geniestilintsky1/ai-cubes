import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Cloud, Environment as DreiEnvironment } from '@react-three/drei';
import * as THREE from 'three';

export function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate terrain geometry with height variations
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 128, 128);
    const positions = geo.attributes.position.array as Float32Array;
    
    // Create gentle rolling hills
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      
      // Multiple octaves of noise for natural terrain
      const height = 
        Math.sin(x * 0.05) * Math.cos(y * 0.05) * 0.8 +
        Math.sin(x * 0.1 + 1) * Math.cos(y * 0.08) * 0.4 +
        Math.sin(x * 0.2) * Math.cos(y * 0.15) * 0.2;
      
      positions[i + 2] = height;
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color="#4ade80"
        roughness={0.9}
        metalness={0.1}
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

export function AtmosphericLighting() {
  return (
    <>
      {/* Main sun light */}
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Ambient sky light */}
      <ambientLight intensity={0.4} color="#87CEEB" />
      
      {/* Ground bounce light */}
      <hemisphereLight
        args={['#87CEEB', '#4ade80', 0.5]}
      />
      
      {/* Rim light for depth */}
      <directionalLight
        position={[-30, 20, -30]}
        intensity={0.3}
        color="#f0abfc"
      />
    </>
  );
}

export function AtmosphericSky() {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[50, 80, 30]}
        inclination={0.6}
        azimuth={0.25}
        rayleigh={0.5}
        turbidity={8}
      />
      
      {/* Volumetric clouds */}
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
}

export function FogEffect({ near = 20, far = 80, color = '#e0f2fe' }: FogEffectProps) {
  return <fog attach="fog" args={[color, near, far]} />;
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
