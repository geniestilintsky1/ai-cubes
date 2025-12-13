import { Grid, Text } from '@react-three/drei';
import * as THREE from 'three';

interface LearningPlatformProps {
  size?: number;
}

// A raised platform where the Cartesian learning happens
export function LearningPlatform({ size = 3 }: LearningPlatformProps) {
  return (
    <group position={[0, -1.5, 0]}>
      {/* Main platform base */}
      <mesh receiveShadow castShadow position={[0, -0.15, 0]}>
        <cylinderGeometry args={[size, size * 1.1, 0.3, 32]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Platform top surface */}
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <cylinderGeometry args={[size * 0.95, size * 0.95, 0.02, 32]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>

      {/* Cartesian grid on platform */}
      <Grid
        args={[size * 1.8, size * 1.8]}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#94a3b8"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#64748b"
        fadeDistance={10}
        fadeStrength={1}
        followCamera={false}
        position={[0, 0.02, 0]}
      />

      {/* Glowing rim */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[size, 0.02, 8, 64]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0ea5e9"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Platform pillars for depth */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(angle) * (size * 0.8),
            -0.5,
            Math.sin(angle) * (size * 0.8),
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.08, 0.1, 0.7, 8]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// The scaled Cartesian cube that sits on the platform
export function ScaledCartesianCube() {
  const cubeSize = 2;
  
  return (
    <group position={[0, -1.5 + cubeSize / 2, 0]}>
      {/* Cube wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)]} />
        <lineBasicMaterial color="#64748b" transparent opacity={0.6} />
      </lineSegments>

      {/* Semi-transparent cube faces for better visibility */}
      <mesh>
        <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Axis labels */}
      <Text 
        position={[cubeSize / 2 + 0.3, -cubeSize / 2, 0]} 
        fontSize={0.2} 
        color="#ef4444" 
        anchorX="center"
        font="/fonts/inter.woff"
      >
        X
      </Text>
      <Text 
        position={[0, cubeSize / 2 + 0.3, 0]} 
        fontSize={0.2} 
        color="#22c55e" 
        anchorX="center"
      >
        Y
      </Text>
      <Text 
        position={[0, -cubeSize / 2, cubeSize / 2 + 0.3]} 
        fontSize={0.2} 
        color="#3b82f6" 
        anchorX="center"
      >
        Z
      </Text>

      {/* Axis lines extending from origin */}
      <group position={[-cubeSize / 2, -cubeSize / 2, -cubeSize / 2]}>
        {/* X axis - Red */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, cubeSize + 0.5, 0, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ef4444" linewidth={3} />
        </line>
        
        {/* Y axis - Green */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, cubeSize + 0.5, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#22c55e" linewidth={3} />
        </line>
        
        {/* Z axis - Blue */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, cubeSize + 0.5]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3b82f6" linewidth={3} />
        </line>
      </group>

      {/* Coordinate markers along axes */}
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <group key={i}>
          {/* X axis markers */}
          <mesh position={[t * cubeSize - cubeSize / 2, -cubeSize / 2, -cubeSize / 2]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          {/* Y axis markers */}
          <mesh position={[-cubeSize / 2, t * cubeSize - cubeSize / 2, -cubeSize / 2]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          {/* Z axis markers */}
          <mesh position={[-cubeSize / 2, -cubeSize / 2, t * cubeSize - cubeSize / 2]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
