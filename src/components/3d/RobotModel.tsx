import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface RobotModelProps {
  position: [number, number, number];
  onPositionChange: (pos: [number, number, number]) => void;
  isWaving: boolean;
  isWalking: boolean;
}

export function RobotModel({ position, onPositionChange, isWaving, isWalking }: RobotModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster, pointer, gl } = useThree();

  // Animation frame
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
      // Subtle floating animation
      groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.01;
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

  // Keyboard controls for Y-axis
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 0.02;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        const newY = Math.min(1, position[1] + step);
        onPositionChange([position[0], newY, position[2]]);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        const newY = Math.max(0, position[1] - step);
        onPositionChange([position[0], newY, position[2]]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [position, onPositionChange]);

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
      <mesh ref={leftArmRef} position={[-0.09, 0.2, 0]} castShadow>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.09, 0.2, 0]} castShadow>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.03, 0.05, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#0369a1" metalness={0.5} roughness={0.4} />
      </mesh>
      
      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.03, 0.05, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#0369a1" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Eyes */}
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
