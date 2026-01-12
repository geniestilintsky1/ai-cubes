import { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface RGBPosition {
  r: number; // X axis (0-255)
  g: number; // Z axis (0-255)
  b: number; // Y axis (0-255) - height
}

interface HydrangeaPlantProps {
  position: RGBPosition;
  flowerColor?: THREE.Color | null; // null = white (neutral), undefined = computed from position
  scale?: number;
  label?: string;
}

interface OctopusProps {
  position: RGBPosition;
  label: string; // A-F
  colorOverride?: THREE.Color | null; // null = derive from position
}

interface RGBCoordinateLabProps {
  className?: string;
  onPositionChange?: (position: RGBPosition) => void;
  initialPosition?: RGBPosition;
  showOctopuses?: boolean;
  octopusPositions?: { label: string; position: RGBPosition }[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Convert RGB (0-255) to normalized coordinates (0-1 for rendering)
function rgbToNormalized(rgb: RGBPosition): THREE.Vector3 {
  return new THREE.Vector3(
    rgb.r / 255, // X = Red
    rgb.b / 255, // Y = Blue (height)
    rgb.g / 255  // Z = Green
  );
}

// Convert normalized coordinates back to RGB
function normalizedToRgb(pos: THREE.Vector3): RGBPosition {
  return {
    r: Math.round(Math.max(0, Math.min(255, pos.x * 255))),
    g: Math.round(Math.max(0, Math.min(255, pos.z * 255))),
    b: Math.round(Math.max(0, Math.min(255, pos.y * 255))),
  };
}

// Compute RGB color from position
function positionToColor(position: RGBPosition): THREE.Color {
  return new THREE.Color(position.r / 255, position.g / 255, position.b / 255);
}

// ============================================
// CARTESIAN AXES COMPONENT
// ============================================

function CartesianAxes() {
  const axisLength = 1.3;
  const tickSpacing = 0.25;
  const tickSize = 0.02;

  return (
    <group position={[0, 0, 0]}>
      {/* X Axis - RED (R channel) */}
      <Line
        points={[[0, 0, 0], [axisLength, 0, 0]]}
        color="#ef4444"
        lineWidth={3}
      />
      <mesh position={[axisLength + 0.05, 0, 0]}>
        <coneGeometry args={[0.02, 0.06, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <Text
        position={[axisLength + 0.15, 0, 0]}
        fontSize={0.06}
        color="#ef4444"
        anchorX="left"
      >
        R (Red)
      </Text>

      {/* Y Axis - BLUE (B channel - HEIGHT) */}
      <Line
        points={[[0, 0, 0], [0, axisLength, 0]]}
        color="#3b82f6"
        lineWidth={3}
      />
      <mesh position={[0, axisLength + 0.05, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.02, 0.06, 8]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <Text
        position={[0, axisLength + 0.15, 0]}
        fontSize={0.06}
        color="#3b82f6"
        anchorX="center"
      >
        B (Blue/Height)
      </Text>

      {/* Z Axis - GREEN (G channel) */}
      <Line
        points={[[0, 0, 0], [0, 0, axisLength]]}
        color="#22c55e"
        lineWidth={3}
      />
      <mesh position={[0, 0, axisLength + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.02, 0.06, 8]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <Text
        position={[0, 0, axisLength + 0.15]}
        fontSize={0.06}
        color="#22c55e"
        anchorX="center"
      >
        G (Green)
      </Text>

      {/* Tick marks on axes */}
      {[0.25, 0.5, 0.75, 1.0].map((t) => (
        <group key={`ticks-${t}`}>
          {/* X axis ticks */}
          <Line points={[[t, -tickSize, 0], [t, tickSize, 0]]} color="#ef4444" lineWidth={1} />
          <Text position={[t, -0.05, 0]} fontSize={0.03} color="#94a3b8" anchorX="center">
            {Math.round(t * 255)}
          </Text>
          
          {/* Y axis ticks */}
          <Line points={[[-tickSize, t, 0], [tickSize, t, 0]]} color="#3b82f6" lineWidth={1} />
          <Text position={[-0.06, t, 0]} fontSize={0.03} color="#94a3b8" anchorX="right">
            {Math.round(t * 255)}
          </Text>
          
          {/* Z axis ticks */}
          <Line points={[[0, -tickSize, t], [0, tickSize, t]]} color="#22c55e" lineWidth={1} />
          <Text position={[0, -0.05, t]} fontSize={0.03} color="#94a3b8" anchorX="center">
            {Math.round(t * 255)}
          </Text>
        </group>
      ))}

      {/* Origin label */}
      <Text position={[-0.05, -0.05, -0.05]} fontSize={0.04} color="#64748b" anchorX="right">
        (0,0,0)
      </Text>
    </group>
  );
}

// ============================================
// GROUND PLANE (R-G PLANE)
// ============================================

function RGGroundPlane() {
  return (
    <group>
      {/* Main ground plane with subtle grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0, 0.5]}>
        <planeGeometry args={[1, 1, 16, 16]} />
        <meshBasicMaterial 
          color="#1e293b" 
          wireframe={false} 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: 5 }, (_, i) => i * 0.25).map((pos) => (
        <group key={`grid-${pos}`}>
          {/* Lines parallel to X */}
          <Line
            points={[[0, 0.001, pos], [1, 0.001, pos]]}
            color="#334155"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
          {/* Lines parallel to Z */}
          <Line
            points={[[pos, 0.001, 0], [pos, 0.001, 1]]}
            color="#334155"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        </group>
      ))}

      {/* Boundary outline */}
      <Line
        points={[[0, 0.001, 0], [1, 0.001, 0], [1, 0.001, 1], [0, 0.001, 1], [0, 0.001, 0]]}
        color="#64748b"
        lineWidth={2}
      />
    </group>
  );
}

// ============================================
// HYDRANGEA PLANT COMPONENT
// ============================================

function HydrangeaPlant({ position, flowerColor, scale = 1, label }: HydrangeaPlantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const normalized = rgbToNormalized(position);
  
  // Compute flower color from position if not overridden
  const computedFlowerColor = useMemo(() => {
    if (flowerColor === null) {
      return new THREE.Color(1, 1, 1); // White/neutral
    }
    if (flowerColor !== undefined) {
      return flowerColor;
    }
    return positionToColor(position);
  }, [position, flowerColor]);

  // Plant height is determined by B (Blue) channel
  const stemHeight = 0.05 + (position.b / 255) * 0.3;

  return (
    <group ref={groupRef} position={[normalized.x, 0, normalized.z]} scale={scale}>
      {/* Root marker on ground plane */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.01, 0.015, 16]} />
        <meshBasicMaterial color="#8b4513" />
      </mesh>

      {/* Stem - grows upward based on Blue channel */}
      <mesh position={[0, stemHeight / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.008, stemHeight, 8]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* Leaves - ALWAYS GREEN, never change */}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`leaf-${i}`}
          position={[
            Math.cos((i * Math.PI) / 2) * 0.02,
            stemHeight * 0.4,
            Math.sin((i * Math.PI) / 2) * 0.02,
          ]}
          rotation={[0.3, (i * Math.PI) / 2, 0.5]}
        >
          <planeGeometry args={[0.03, 0.015]} />
          <meshStandardMaterial color="#228B22" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* More leaves at different height */}
      {[0.5, 1.5, 2.5, 3.5].map((i) => (
        <mesh
          key={`leaf2-${i}`}
          position={[
            Math.cos((i * Math.PI) / 2) * 0.025,
            stemHeight * 0.6,
            Math.sin((i * Math.PI) / 2) * 0.025,
          ]}
          rotation={[0.2, (i * Math.PI) / 2, 0.4]}
        >
          <planeGeometry args={[0.025, 0.012]} />
          <meshStandardMaterial color="#32CD32" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Flower cluster at top - DATA DRIVEN COLOR */}
      <group position={[0, stemHeight + 0.02, 0]}>
        {/* Central flower */}
        <mesh>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color={computedFlowerColor} />
        </mesh>

        {/* Surrounding petals */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={`petal-${i}`}
            position={[
              Math.cos((i * Math.PI) / 3) * 0.02,
              0,
              Math.sin((i * Math.PI) / 3) * 0.02,
            ]}
          >
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color={computedFlowerColor} />
          </mesh>
        ))}

        {/* Top petals */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={`top-petal-${i}`}
            position={[
              Math.cos((i * Math.PI) / 2 + 0.4) * 0.015,
              0.015,
              Math.sin((i * Math.PI) / 2 + 0.4) * 0.015,
            ]}
          >
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial color={computedFlowerColor} />
          </mesh>
        ))}
      </group>

      {/* Label if provided */}
      {label && (
        <Text
          position={[0, stemHeight + 0.08, 0]}
          fontSize={0.03}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
        >
          {label}
        </Text>
      )}

      {/* Vertical projection line (shows height/B value) */}
      <Line
        points={[[0, 0, 0], [0, stemHeight + 0.02, 0]]}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.3}
        dashed
        dashSize={0.01}
        dashScale={10}
      />
    </group>
  );
}

// ============================================
// OCTOPUS COMPONENT (Variables A-F)
// ============================================

function Octopus({ position, label, colorOverride }: OctopusProps) {
  const groupRef = useRef<THREE.Group>(null);
  const normalized = rgbToNormalized(position);
  
  // Derive color from position unless overridden
  const bodyColor = useMemo(() => {
    if (colorOverride === null) {
      return positionToColor(position);
    }
    if (colorOverride !== undefined) {
      return colorOverride;
    }
    return positionToColor(position);
  }, [position, colorOverride]);

  // Animate tentacles
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child.name.startsWith('tentacle')) {
          child.rotation.z = Math.sin(state.clock.elapsedTime * 2 + i) * 0.2;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[normalized.x, normalized.y, normalized.z]}>
      {/* Head/Body */}
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.015, 0.01, 0.02]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.015, 0.01, 0.02]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.015, 0.01, 0.025]}>
        <sphereGeometry args={[0.004, 6, 6]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.015, 0.01, 0.025]}>
        <sphereGeometry args={[0.004, 6, 6]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Tentacles */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh
          key={`tentacle-${i}`}
          name={`tentacle-${i}`}
          position={[
            Math.cos((i * Math.PI) / 4) * 0.02,
            -0.03,
            Math.sin((i * Math.PI) / 4) * 0.02,
          ]}
          rotation={[0.5, 0, Math.cos((i * Math.PI) / 4) * 0.3]}
        >
          <cylinderGeometry args={[0.004, 0.002, 0.04, 6]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      ))}

      {/* Label */}
      <Text
        position={[0, 0.06, 0]}
        fontSize={0.04}
        color="#ffffff"
        anchorX="center"
        fontWeight="bold"
        outlineWidth={0.003}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Position projection lines to ground */}
      <Line
        points={[[0, 0, 0], [0, -normalized.y, 0]]}
        color="#3b82f6"
        lineWidth={1}
        transparent
        opacity={0.4}
        dashed
        dashSize={0.02}
        dashScale={5}
      />
      
      {/* Ground marker */}
      <mesh position={[0, -normalized.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.015, 0.02, 16]} />
        <meshBasicMaterial color={bodyColor} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ============================================
// FINISH POND (Container for Octopuses)
// ============================================

function FinishPond({ octopuses }: { octopuses: { label: string; position: RGBPosition }[] }) {
  return (
    <group>
      {/* Pond boundary indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.002, 0.5]}>
        <ringGeometry args={[0.4, 0.42, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.3} />
      </mesh>

      {/* Pond label */}
      <Text
        position={[0.5, 0.01, 0.95]}
        fontSize={0.04}
        color="#0ea5e9"
        anchorX="center"
      >
        Finish Pond
      </Text>

      {/* Render octopuses */}
      {octopuses.map((oct) => (
        <Octopus
          key={oct.label}
          label={oct.label}
          position={oct.position}
          colorOverride={null} // Derive from position
        />
      ))}
    </group>
  );
}

// ============================================
// INTERACTIVE MARKER (For user input)
// ============================================

function InteractiveMarker({
  position,
  onPositionChange,
}: {
  position: RGBPosition;
  onPositionChange: (pos: RGBPosition) => void;
}) {
  const markerRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster, gl } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const normalized = rgbToNormalized(position);

  const handlePointerDown = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsDragging(true);
    gl.domElement.style.cursor = 'grabbing';
  }, [gl]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    gl.domElement.style.cursor = 'auto';
  }, [gl]);

  useFrame(() => {
    if (isDragging && markerRef.current) {
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      
      // Clamp to valid range
      const newX = Math.max(0, Math.min(1, intersection.x));
      const newZ = Math.max(0, Math.min(1, intersection.z));
      
      // Keep current height
      const newPos = normalizedToRgb(new THREE.Vector3(newX, normalized.y, newZ));
      onPositionChange(newPos);
    }
  });

  // Color from current position
  const markerColor = positionToColor(position);

  return (
    <group
      ref={markerRef}
      position={[normalized.x, normalized.y, normalized.z]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Main marker body */}
      <mesh>
        <sphereGeometry args={[0.04, 24, 24]} />
        <meshStandardMaterial 
          color={markerColor} 
          emissive={markerColor}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.045, 0.055, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* Height indicator line */}
      <Line
        points={[[0, 0, 0], [0, -normalized.y, 0]]}
        color="#3b82f6"
        lineWidth={2}
        transparent
        opacity={0.6}
      />

      {/* Ground projection */}
      <mesh position={[0, -normalized.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.04, 24]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.4} />
      </mesh>

      {/* Position label */}
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.025}
        color="#ffffff"
        anchorX="center"
        outlineWidth={0.002}
        outlineColor="#000000"
      >
        {`R:${position.r} G:${position.g} B:${position.b}`}
      </Text>
    </group>
  );
}

// ============================================
// BOUNDING BOX (RGB Cube outline)
// ============================================

function RGBBoundingBox() {
  const vertices = [
    // Bottom face
    [0, 0, 0], [1, 0, 0],
    [1, 0, 0], [1, 0, 1],
    [1, 0, 1], [0, 0, 1],
    [0, 0, 1], [0, 0, 0],
    // Top face
    [0, 1, 0], [1, 1, 0],
    [1, 1, 0], [1, 1, 1],
    [1, 1, 1], [0, 1, 1],
    [0, 1, 1], [0, 1, 0],
    // Vertical edges
    [0, 0, 0], [0, 1, 0],
    [1, 0, 0], [1, 1, 0],
    [1, 0, 1], [1, 1, 1],
    [0, 0, 1], [0, 1, 1],
  ];

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(vertices.flat()), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#475569" transparent opacity={0.4} />
    </lineSegments>
  );
}

// ============================================
// HEIGHT CONTROLS
// ============================================

function HeightControls({ 
  position, 
  onPositionChange 
}: { 
  position: RGBPosition; 
  onPositionChange: (pos: RGBPosition) => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
      <label className="text-sm font-medium text-foreground block mb-2">
        Height (Blue): {position.b}
      </label>
      <input
        type="range"
        min="0"
        max="255"
        value={position.b}
        onChange={(e) => onPositionChange({ ...position, b: parseInt(e.target.value) })}
        className="w-40 accent-blue-500"
      />
    </div>
  );
}

// ============================================
// MAIN SCENE COMPONENT
// ============================================

function RGBScene({
  position,
  onPositionChange,
  showOctopuses,
  octopusPositions,
}: {
  position: RGBPosition;
  onPositionChange: (pos: RGBPosition) => void;
  showOctopuses?: boolean;
  octopusPositions?: { label: string; position: RGBPosition }[];
}) {
  // Default octopus positions if not provided
  const defaultOctopuses = useMemo(() => [
    { label: 'A', position: { r: 50, g: 50, b: 50 } },
    { label: 'B', position: { r: 200, g: 50, b: 100 } },
    { label: 'C', position: { r: 50, g: 200, b: 150 } },
    { label: 'D', position: { r: 200, g: 200, b: 50 } },
    { label: 'E', position: { r: 125, g: 125, b: 200 } },
    { label: 'F', position: { r: 175, g: 75, b: 175 } },
  ], []);

  const octopuses = octopusPositions || defaultOctopuses;

  // Sample hydrangea positions
  const samplePlants = useMemo(() => [
    { position: { r: 64, g: 64, b: 64 }, label: 'Plant 1' },
    { position: { r: 192, g: 64, b: 128 }, label: 'Plant 2' },
    { position: { r: 64, g: 192, b: 192 }, label: 'Plant 3' },
  ], []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[0.5, 1, 0.5]} intensity={0.3} color="#ffffff" />

      {/* Core visualization elements */}
      <CartesianAxes />
      <RGGroundPlane />
      <RGBBoundingBox />

      {/* Sample hydrangea plants */}
      {samplePlants.map((plant, i) => (
        <HydrangeaPlant
          key={i}
          position={plant.position}
          label={plant.label}
          flowerColor={null} // White/neutral for now
        />
      ))}

      {/* Interactive marker for user input */}
      <InteractiveMarker position={position} onPositionChange={onPositionChange} />

      {/* Octopus finish pond */}
      {showOctopuses && <FinishPond octopuses={octopuses} />}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={3}
        target={[0.5, 0.3, 0.5]}
      />
    </>
  );
}

// ============================================
// EXPORTED COMPONENT
// ============================================

export function RGBCoordinateLab({
  className = '',
  onPositionChange,
  initialPosition = { r: 128, g: 128, b: 128 },
  showOctopuses = true,
  octopusPositions,
}: RGBCoordinateLabProps) {
  const [position, setPosition] = useState<RGBPosition>(initialPosition);

  const handlePositionChange = useCallback((newPos: RGBPosition) => {
    setPosition(newPos);
    onPositionChange?.(newPos);
  }, [onPositionChange]);

  const rgbColor = `rgb(${position.r}, ${position.g}, ${position.b})`;

  return (
    <div className={`relative ${className}`}>
      <Canvas
        camera={{ position: [1.5, 1.2, 1.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <RGBScene
          position={position}
          onPositionChange={handlePositionChange}
          showOctopuses={showOctopuses}
          octopusPositions={octopusPositions}
        />
      </Canvas>

      {/* Height control slider */}
      <HeightControls position={position} onPositionChange={handlePositionChange} />

      {/* RGB readout panel */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-4 border border-border min-w-[200px]">
        <h3 className="text-sm font-semibold text-foreground mb-3">RGB Position</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-red-500 font-medium">R (X):</span>
            <span className="text-foreground font-mono">{position.r}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-500 font-medium">G (Z):</span>
            <span className="text-foreground font-mono">{position.g}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-500 font-medium">B (Y):</span>
            <span className="text-foreground font-mono">{position.b}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border border-border shadow-inner"
              style={{ backgroundColor: rgbColor }}
            />
            <div className="text-xs font-mono text-muted-foreground">
              {rgbColor}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <h4 className="text-xs font-semibold text-foreground mb-2">Axis Mapping</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <span className="text-muted-foreground">X → Red (R)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span className="text-muted-foreground">Z → Green (G)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
            <span className="text-muted-foreground">Y → Blue (B)</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border max-w-[180px]">
        <h4 className="text-xs font-semibold text-foreground mb-1">Controls</h4>
        <p className="text-xs text-muted-foreground">
          Drag marker to move on R-G plane. Use slider to adjust height (B).
        </p>
      </div>
    </div>
  );
}
