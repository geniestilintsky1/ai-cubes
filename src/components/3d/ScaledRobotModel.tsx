import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getSoilTypeAtPosition, SOIL_ZONES, type SoilType } from './SoilZones';

interface ScaledRobotModelProps {
  position: [number, number, number];
  onPositionChange: (pos: [number, number, number]) => void;
  isWaving: boolean;
  isWalking: boolean;
  cubeSize?: number;
  onSoilTypeChange?: (soilType: SoilType, speedMultiplier: number) => void;
}

export const ScaledRobotModel = forwardRef<THREE.Group, ScaledRobotModelProps>(function ScaledRobotModel(
  { 
    position, 
    onPositionChange, 
    isWaving, 
    isWalking,
    cubeSize = 2,
    onSoilTypeChange
  }: ScaledRobotModelProps,
  ref
) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  useImperativeHandle(ref, () => groupRef.current as THREE.Group);
  
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster, pointer, gl } = useThree();

  // Scale factor for the robot (relative to cube)
  const robotScale = 0.4;
  const robotHeight = 0.4 * robotScale;

  // Animation frame
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      // Subtle floating animation
      const worldY = (position[1] * cubeSize) - cubeSize / 2 + robotHeight / 2 - 1.5;
      groupRef.current.position.y = worldY + Math.sin(time * 2) * 0.02;
    }

    // Waving animation
    if (rightArmRef.current) {
      if (isWaving) {
        rightArmRef.current.rotation.z = Math.sin(time * 8) * 0.5 - 0.3;
        rightArmRef.current.rotation.x = -0.5;
      } else {
        rightArmRef.current.rotation.z = 0;
        rightArmRef.current.rotation.x = 0;
      }
    }

    // Walking animation
    if (leftLegRef.current && rightLegRef.current && leftArmRef.current) {
      if (isWalking) {
        const walkSpeed = 6;
        leftLegRef.current.rotation.x = Math.sin(time * walkSpeed) * 0.4;
        rightLegRef.current.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.4;
        leftArmRef.current.rotation.x = Math.sin(time * walkSpeed + Math.PI) * 0.3;
        if (!isWaving && rightArmRef.current) {
          rightArmRef.current.rotation.x = Math.sin(time * walkSpeed) * 0.3;
        }
      } else {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
        if (!isWaving) {
          leftArmRef.current.rotation.x = 0;
        }
      }
    }
  });

  // Track current soil type and notify parent
  useEffect(() => {
    const soilType = getSoilTypeAtPosition(position[0], position[2]);
    const config = SOIL_ZONES[soilType];
    onSoilTypeChange?.(soilType, config.speedMultiplier);
  }, [position[0], position[2], onSoilTypeChange]);

  // Get current speed multiplier based on soil
  const getCurrentSpeedMultiplier = useCallback(() => {
    const soilType = getSoilTypeAtPosition(position[0], position[2]);
    return SOIL_ZONES[soilType].speedMultiplier;
  }, [position]);

  // Keyboard controls for all axes with soil-based speed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const baseStep = 0.02;
      const speedMultiplier = getCurrentSpeedMultiplier();
      const step = baseStep * speedMultiplier;
      
      let [x, y, z] = position;
      
      // Y-axis: W/S or Up/Down arrows
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        y = Math.min(1, y + step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        y = Math.max(0, y - step);
      }
      // X-axis: A/D or Left/Right arrows
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        x = Math.max(0, x - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        x = Math.min(1, x + step);
      }
      // Z-axis: Q/E
      else if (e.key === 'q' || e.key === 'Q') {
        z = Math.max(0, z - step);
      } else if (e.key === 'e' || e.key === 'E') {
        z = Math.min(1, z + step);
      }
      
      if (x !== position[0] || y !== position[1] || z !== position[2]) {
        onPositionChange([x, y, z]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, onPositionChange, getCurrentSpeedMultiplier]);

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
    
    // Convert to world position within the scaled cube
    const worldY = (position[1] * cubeSize) - cubeSize / 2 - 1.5;
    raycaster.setFromCamera(pointer, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -worldY);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection) {
      const x = Math.max(0, Math.min(1, (intersection.x + cubeSize / 2) / cubeSize));
      const z = Math.max(0, Math.min(1, (intersection.z + cubeSize / 2) / cubeSize));
      onPositionChange([x, position[1], z]);
    }
  }, [isDragging, camera, raycaster, pointer, position, onPositionChange, cubeSize]);

  // World position calculation
  const worldX = (position[0] * cubeSize) - cubeSize / 2;
  const worldY = (position[1] * cubeSize) - cubeSize / 2 + robotHeight / 2 - 1.5;
  const worldZ = (position[2] * cubeSize) - cubeSize / 2;

  return (
    <group
      ref={groupRef}
      position={[worldX, worldY, worldZ]}
      scale={robotScale}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerUp}
    >
      {/* Head */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial 
          color="#22c55e" 
          emissive="#22c55e" 
          emissiveIntensity={0.5} 
        />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.28, 0.3, 0.18]} />
        <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Chest light */}
      <mesh position={[0, 0.18, 0.1]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial 
          color="#f0abfc" 
          emissive="#f0abfc" 
          emissiveIntensity={0.8} 
        />
      </mesh>
      
      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.2, 0.15, 0]} castShadow>
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.2, 0.15, 0]} castShadow>
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.07, -0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#0369a1" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.07, -0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.2, 0.1]} />
        <meshStandardMaterial color="#0369a1" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.05, 0.38, 0.101]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.05, 0.38, 0.101]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Eye pupils */}
      <mesh position={[-0.05, 0.38, 0.12]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.05, 0.38, 0.12]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Robot shadow indicator on ground */}
      <mesh position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
});
