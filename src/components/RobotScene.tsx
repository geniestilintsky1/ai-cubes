import { useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RobotCoordinates } from '@/lib/api';

interface RobotModelProps {
  position: [number, number, number];
  onPositionChange: (pos: [number, number, number]) => void;
}

function RobotModel({ position, onPositionChange }: RobotModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster, pointer, gl } = useThree();

  useFrame(() => {
    if (groupRef.current) {
      // Add subtle floating animation
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.02;
    }
  });

  const handlePointerDown = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsDragging(true);
    gl.domElement.style.cursor = 'grabbing';
  }, [gl]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    gl.domElement.style.cursor = 'grab';
  }, [gl]);

  const handlePointerMove = useCallback((e: { stopPropagation: () => void }) => {
    if (!isDragging) return;
    e.stopPropagation();
    
    raycaster.setFromCamera(pointer, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection) {
      const x = Math.max(0, Math.min(1, intersection.x + 0.5));
      const z = Math.max(0, Math.min(1, intersection.z + 0.5));
      onPositionChange([x, position[1], z]);
    }
  }, [isDragging, camera, raycaster, pointer, position, onPositionChange]);

  // Simple humanoid robot shape
  return (
    <group
      ref={groupRef}
      position={[position[0] - 0.5, position[1], position[2] - 0.5]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerUp}
    >
      {/* Head */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.12, 0.15, 0.08]} />
        <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Left Arm */}
      <mesh position={[-0.09, 0.2, 0]} castShadow>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Right Arm */}
      <mesh position={[0.09, 0.2, 0]} castShadow>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Left Leg */}
      <mesh position={[-0.03, 0.05, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#0369a1" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Right Leg */}
      <mesh position={[0.03, 0.05, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#0369a1" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Eyes (decorative) */}
      <mesh position={[-0.02, 0.36, 0.041]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.02, 0.36, 0.041]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function CartesianCube() {
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

function Scene({ 
  robotPosition, 
  onRobotMove 
}: { 
  robotPosition: [number, number, number]; 
  onRobotMove: (pos: [number, number, number]) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-3, 3, -3]} intensity={0.3} />
      
      <CartesianCube />
      <RobotModel position={robotPosition} onPositionChange={onRobotMove} />
      
      <OrbitControls 
        enablePan={false}
        minDistance={1}
        maxDistance={4}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

interface RobotSceneProps {
  coordinates: RobotCoordinates;
  onCoordinatesChange: (coords: RobotCoordinates) => void;
  className?: string;
}

export function RobotScene({ coordinates, onCoordinatesChange, className }: RobotSceneProps) {
  // Convert 0-255 coordinates to 0-1 for Three.js
  const robotPosition: [number, number, number] = [
    coordinates.x / 255,
    coordinates.y / 255,
    coordinates.z / 255,
  ];

  const handleRobotMove = useCallback((pos: [number, number, number]) => {
    onCoordinatesChange({
      x: Math.round(pos[0] * 255),
      y: Math.round(pos[1] * 255),
      z: Math.round(pos[2] * 255),
    });
  }, [onCoordinatesChange]);

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [1.5, 1.5, 1.5], fov: 50 }}
        style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)' }}
      >
        <Suspense fallback={null}>
          <Scene robotPosition={robotPosition} onRobotMove={handleRobotMove} />
        </Suspense>
      </Canvas>
    </div>
  );
}
