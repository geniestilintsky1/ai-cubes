import { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { RobotCoordinates } from '@/lib/api';
import { RobotModel } from './3d/RobotModel';
import { CartesianCube } from './3d/CartesianCube';
import { RobotTrail } from './3d/RobotTrail';
import { Button } from './ui/button';
import { Hand, Footprints, Sparkles } from 'lucide-react';

interface SceneProps {
  robotPosition: [number, number, number];
  onRobotMove: (pos: [number, number, number]) => void;
  isWaving: boolean;
  isWalking: boolean;
  showTrail: boolean;
}

function Scene({ robotPosition, onRobotMove, isWaving, isWalking, showTrail }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-3, 3, -3]} intensity={0.3} />
      
      <CartesianCube />
      {showTrail && <RobotTrail position={robotPosition} />}
      <RobotModel 
        position={robotPosition} 
        onPositionChange={onRobotMove}
        isWaving={isWaving}
        isWalking={isWalking}
      />
      
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
  const [isWaving, setIsWaving] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [showTrail, setShowTrail] = useState(true);

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
      <div className="relative h-full">
        <Canvas
          camera={{ position: [1.5, 1.5, 1.5], fov: 50 }}
          style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)' }}
        >
          <Suspense fallback={null}>
            <Scene 
              robotPosition={robotPosition} 
              onRobotMove={handleRobotMove}
              isWaving={isWaving}
              isWalking={isWalking}
              showTrail={showTrail}
            />
          </Suspense>
        </Canvas>
        
        {/* Animation Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            variant={isWaving ? "default" : "outline"}
            size="sm"
            onClick={() => setIsWaving(!isWaving)}
            className="gap-2"
          >
            <Hand className="h-4 w-4" />
            {isWaving ? 'Stop Waving' : 'Wave'}
          </Button>
          <Button
            variant={isWalking ? "default" : "outline"}
            size="sm"
            onClick={() => setIsWalking(!isWalking)}
            className="gap-2"
          >
            <Footprints className="h-4 w-4" />
            {isWalking ? 'Stop Walking' : 'Walk'}
          </Button>
          <Button
            variant={showTrail ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTrail(!showTrail)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {showTrail ? 'Hide Trail' : 'Show Trail'}
          </Button>
        </div>

        {/* Keyboard hint */}
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground space-y-1">
          <div><span className="font-medium">←/A</span> · <span className="font-medium">→/D</span> X-axis</div>
          <div><span className="font-medium">↑/W</span> · <span className="font-medium">↓/S</span> Y-axis</div>
          <div><span className="font-medium">Q</span> · <span className="font-medium">E</span> Z-axis</div>
        </div>
      </div>
    </div>
  );
}
