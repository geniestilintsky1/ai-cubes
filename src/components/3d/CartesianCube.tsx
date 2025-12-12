import { Grid, Text } from '@react-three/drei';
import * as THREE from 'three';

export function CartesianCube() {
  return (
    <group>
      {/* Cube wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="#64748b" transparent opacity={0.4} />
      </lineSegments>

      {/* Grid on floor */}
      <Grid
        args={[1, 1]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#94a3b8"
        sectionSize={0.25}
        sectionThickness={1}
        sectionColor="#64748b"
        fadeDistance={5}
        fadeStrength={1}
        followCamera={false}
        position={[0, -0.5, 0]}
      />

      {/* Axis labels */}
      <Text position={[0.6, -0.5, 0]} fontSize={0.08} color="#ef4444" anchorX="center">
        X (Red)
      </Text>
      <Text position={[0, 0.6, 0]} fontSize={0.08} color="#22c55e" anchorX="center">
        Y (Green)
      </Text>
      <Text position={[0, -0.5, 0.6]} fontSize={0.08} color="#3b82f6" anchorX="center">
        Z (Blue)
      </Text>

      {/* Axis lines */}
      <group position={[-0.5, -0.5, -0.5]}>
        {/* X axis - Red */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 1.2, 0, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ef4444" linewidth={2} />
        </line>
        
        {/* Y axis - Green */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 1.2, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#22c55e" linewidth={2} />
        </line>
        
        {/* Z axis - Blue */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, 0, 0, 1.2]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3b82f6" linewidth={2} />
        </line>
      </group>
    </group>
  );
}
