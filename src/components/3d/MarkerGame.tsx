import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky } from '@react-three/drei';
import * as THREE from 'three';

// ==================== TYPES ====================
interface TreeData {
  x: number;
  z: number;
  radius: number;
  scale: number;
}

interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  space: boolean;
  shift: boolean;
}

// ==================== CONSTANTS ====================
const MOVE_SPEED = 0.2;
const FOG_DISTANCE = 35.0;
const FOG_COLOR = new THREE.Color(0x87ceeb);
const MAP_BOUND = 98;
const MARKER_RADIUS = 0.8;

// ==================== CUSTOM MATERIALS WITH RADIAL FOG ====================
function useRadialFogMaterial(baseColor: THREE.ColorRepresentation, markerPosition: THREE.Vector3) {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 1,
      metalness: 0,
    });
    
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMarkerPos = { value: markerPosition };
      shader.uniforms.uFogColor = { value: FOG_COLOR };
      shader.uniforms.uFogDist = { value: FOG_DISTANCE };

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldPosition;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform vec3 uMarkerPos;
        uniform vec3 uFogColor;
        uniform float uFogDist;
        varying vec3 vWorldPosition;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <fog_fragment>',
        `
        float dist = distance(vWorldPosition, uMarkerPos);
        float fogFactor = smoothstep(uFogDist * 0.4, uFogDist, dist);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, fogFactor);
        `
      );
    };
    
    return mat;
  }, [baseColor]);

  return material;
}

// ==================== TREE COMPONENT ====================
interface TreeProps {
  position: [number, number, number];
  scale: number;
  markerPosition: THREE.Vector3;
}

function Tree({ position, scale, markerPosition }: TreeProps) {
  const trunkMaterial = useRadialFogMaterial(0x8b4513, markerPosition);
  const leavesMaterial = useRadialFogMaterial(0x228b22, markerPosition);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow material={trunkMaterial}>
        <cylinderGeometry args={[0.3, 0.5, 2, 8]} />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 3, 0]} castShadow material={leavesMaterial}>
        <coneGeometry args={[2, 4, 8]} />
      </mesh>
    </group>
  );
}

// ==================== GROUND COMPONENT ====================
interface GroundProps {
  markerPosition: THREE.Vector3;
}

function Ground({ markerPosition }: GroundProps) {
  const groundMaterial = useRadialFogMaterial(0x558833, markerPosition);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={groundMaterial}>
      <planeGeometry args={[200, 200]} />
    </mesh>
  );
}

// ==================== MARKER COMPONENT ====================
interface MarkerProps {
  position: [number, number, number];
}

function Marker({ position }: MarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame(() => {
    timeRef.current += 0.05;
    if (markerRef.current) {
      markerRef.current.rotation.y += 0.02;
      markerRef.current.rotation.z = Math.sin(timeRef.current) * 0.1;
    }
    if (coreRef.current) {
      const scale = 0.8 + Math.sin(timeRef.current * 2) * 0.1;
      coreRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main octahedron */}
      <mesh ref={markerRef} castShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={0x00ddee}
          emissive={0x0044aa}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      {/* Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      {/* Point light */}
      <pointLight color={0x00ddee} intensity={3} distance={15} />
    </group>
  );
}

// ==================== SCENE COMPONENT ====================
interface SceneProps {
  markerPosition: [number, number, number];
  onMarkerMove: (pos: [number, number, number]) => void;
  trees: TreeData[];
}

function Scene({ markerPosition, onMarkerMove, trees }: SceneProps) {
  const controlsRef = useRef<any>(null);
  const keysRef = useRef<KeyState>({
    w: false, a: false, s: false, d: false, space: false, shift: false
  });
  const { camera } = useThree();
  const markerPositionVec = useMemo(() => new THREE.Vector3(...markerPosition), [markerPosition]);

  // Collision check
  const canMoveTo = useCallback((x: number, z: number): boolean => {
    for (const tree of trees) {
      const dx = x - tree.x;
      const dz = z - tree.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < (tree.radius + MARKER_RADIUS)) {
        return false;
      }
    }
    return true;
  }, [trees]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keysRef.current.w = true;
      if (key === 's' || key === 'arrowdown') keysRef.current.s = true;
      if (key === 'a' || key === 'arrowleft') keysRef.current.a = true;
      if (key === 'd' || key === 'arrowright') keysRef.current.d = true;
      if (key === ' ') keysRef.current.space = true;
      if (key === 'shift' || key === 'c') keysRef.current.shift = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keysRef.current.w = false;
      if (key === 's' || key === 'arrowdown') keysRef.current.s = false;
      if (key === 'a' || key === 'arrowleft') keysRef.current.a = false;
      if (key === 'd' || key === 'arrowright') keysRef.current.d = false;
      if (key === ' ') keysRef.current.space = false;
      if (key === 'shift' || key === 'c') keysRef.current.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Movement loop
  useFrame(() => {
    const keys = keysRef.current;

    // Get camera direction (horizontal only)
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    const camRight = new THREE.Vector3();
    camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0));

    // Calculate movement vector
    const moveVec = new THREE.Vector3();
    if (keys.w) moveVec.add(camDir);
    if (keys.s) moveVec.sub(camDir);
    if (keys.d) moveVec.add(camRight);
    if (keys.a) moveVec.sub(camRight);

    if (moveVec.length() > 0) {
      moveVec.setLength(MOVE_SPEED);
    }

    let [x, y, z] = markerPosition;

    // Try X movement
    const nextX = x + moveVec.x;
    if (nextX >= -MAP_BOUND && nextX <= MAP_BOUND && canMoveTo(nextX, z)) {
      x = nextX;
    }

    // Try Z movement
    const nextZ = z + moveVec.z;
    if (nextZ >= -MAP_BOUND && nextZ <= MAP_BOUND && canMoveTo(x, nextZ)) {
      z = nextZ;
    }

    // Vertical movement
    if (keys.space) y += MOVE_SPEED;
    if (keys.shift) y -= MOVE_SPEED;
    if (y < 1) y = 1;

    // Update position if changed
    if (x !== markerPosition[0] || y !== markerPosition[1] || z !== markerPosition[2]) {
      onMarkerMove([x, y, z]);
    }

    // Smooth camera follow
    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(x, y, z), 0.1);
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <hemisphereLight color={0xffffff} groundColor={0x444444} intensity={0.6} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Ground */}
      <Ground markerPosition={markerPositionVec} />

      {/* Trees */}
      {trees.map((tree, i) => (
        <Tree
          key={i}
          position={[tree.x, 0, tree.z]}
          scale={tree.scale}
          markerPosition={markerPositionVec}
        />
      ))}

      {/* Marker */}
      <Marker position={markerPosition} />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={markerPosition}
      />
    </>
  );
}

// ==================== MAIN COMPONENT ====================
interface MarkerGameProps {
  className?: string;
}

export function MarkerGame({ className }: MarkerGameProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number, number]>([0, 2, 0]);

  // Generate trees once
  const trees = useMemo<TreeData[]>(() => {
    const generated: TreeData[] = [];
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * 140;
      const z = (Math.random() - 0.5) * 140;

      // Keep center clear
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

      const scale = 0.8 + Math.random() * 0.6;
      generated.push({
        x,
        z,
        radius: 1.0 * scale,
        scale,
      });
    }
    return generated;
  }, []);

  const handleMarkerMove = useCallback((pos: [number, number, number]) => {
    setMarkerPosition(pos);
  }, []);

  return (
    <div className={className}>
      <div className="relative h-full w-full">
        <Canvas
          shadows
          gl={{
            antialias: true,
          }}
          style={{ background: '#87CEEB' }}
        >
          <color attach="background" args={['#87CEEB']} />
          <PerspectiveCamera
            makeDefault
            position={[0, 10, 15]}
            fov={60}
            near={0.1}
            far={200}
          />
          <Scene
            markerPosition={markerPosition}
            onMarkerMove={handleMarkerMove}
            trees={trees}
          />
        </Canvas>

        {/* HUD Panel */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="inline-block bg-[rgba(20,20,30,0.8)] px-6 py-4 rounded-[30px] border border-[rgba(100,200,255,0.3)] text-white backdrop-blur-sm shadow-lg">
            <h1 className="m-0 mb-2 text-lg text-[#00ddee] uppercase tracking-widest font-semibold">
              Marker Game
            </h1>
            <div className="text-sm">
              <span className="text-[#ffaa00] font-bold">WASD / Arrows</span> Move
            </div>
            <div className="text-sm">
              <span className="text-[#ffaa00] font-bold">Space</span> Up &nbsp;|&nbsp;{' '}
              <span className="text-[#ffaa00] font-bold">Shift</span> Down
            </div>
            <div className="text-xs text-[#aaa] mt-1">
              Left Click Drag: Rotate • Scroll: Zoom
            </div>
          </div>
        </div>

        {/* Position Display */}
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
          <div className="text-muted-foreground">Position</div>
          <div className="font-mono text-foreground">
            X: {markerPosition[0].toFixed(1)} | Y: {markerPosition[1].toFixed(1)} | Z: {markerPosition[2].toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarkerGame;
