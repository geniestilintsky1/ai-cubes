import { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { RobotCoordinates } from '@/lib/api';
import { ScaledRobotModel } from './3d/ScaledRobotModel';
import { ScaledRobotTrail } from './3d/ScaledRobotTrail';
import { LearningPlatform, ScaledCartesianCube } from './3d/LearningPlatform';
import { SOIL_ZONES, type SoilType } from './3d/SoilZones';
import {
  Terrain,
  DistantMountains,
  AtmosphericLighting,
  AtmosphericSky,
  GroundDetails,
  FogEffect,
  Trees,
  AtmosphericParticles,
} from './3d/Environment';
import { Button } from './ui/button';
import { Hand, Footprints, Sparkles, Camera, Layers } from 'lucide-react';

interface SceneProps {
  robotPosition: [number, number, number];
  onRobotMove: (pos: [number, number, number]) => void;
  isWaving: boolean;
  isWalking: boolean;
  showTrail: boolean;
  showSoilZones: boolean;
  onSoilTypeChange: (soilType: SoilType, speedMultiplier: number) => void;
}

function Scene({ 
  robotPosition, 
  onRobotMove, 
  isWaving, 
  isWalking, 
  showTrail,
  showSoilZones,
  onSoilTypeChange
}: SceneProps) {
  return (
    <>
      {/* Atmospheric effects */}
      <FogEffect near={25} far={90} color="#bae6fd" />
      <AtmosphericSky />
      <AtmosphericLighting />
      <AtmosphericParticles />
      
      {/* Environment - background layer */}
      <DistantMountains />
      
      {/* Midground */}
      <Terrain />
      <Trees />
      <GroundDetails />
      
      {/* Foreground - Learning area */}
      <LearningPlatform size={3} showSoilZones={showSoilZones} />
      <ScaledCartesianCube />
      
      {/* Robot and trail */}
      {showTrail && <ScaledRobotTrail position={robotPosition} cubeSize={2} />}
      <ScaledRobotModel 
        position={robotPosition} 
        onPositionChange={onRobotMove}
        isWaving={isWaving}
        isWalking={isWalking}
        cubeSize={2}
        onSoilTypeChange={onSoilTypeChange}
      />
      
      <OrbitControls 
        enablePan={true}
        minDistance={3}
        maxDistance={25}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, -0.5, 0]}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

interface EducationalRobotSceneProps {
  coordinates: RobotCoordinates;
  onCoordinatesChange: (coords: RobotCoordinates) => void;
  className?: string;
}

export function EducationalRobotScene({ 
  coordinates, 
  onCoordinatesChange, 
  className 
}: EducationalRobotSceneProps) {
  const [isWaving, setIsWaving] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [showTrail, setShowTrail] = useState(true);
  const [showSoilZones, setShowSoilZones] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'default' | 'top' | 'front'>('default');
  const [currentSoilType, setCurrentSoilType] = useState<SoilType>('good');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

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

  const handleSoilTypeChange = useCallback((soilType: SoilType, speed: number) => {
    setCurrentSoilType(soilType);
    setSpeedMultiplier(speed);
  }, []);

  const getCameraPosition = (): [number, number, number] => {
    switch (cameraPreset) {
      case 'top':
        return [0, 12, 0.1];
      case 'front':
        return [0, 0, 8];
      default:
        return [6, 4, 6];
    }
  };

  const soilConfig = SOIL_ZONES[currentSoilType];

  return (
    <div className={className}>
      <div className="relative h-full">
        <Canvas
          shadows
          gl={{ 
            antialias: true,
            toneMapping: 3, // ACESFilmicToneMapping
            toneMappingExposure: 1.2,
          }}
        >
          <PerspectiveCamera 
            makeDefault 
            position={getCameraPosition()} 
            fov={45}
            near={0.1}
            far={500}
          />
          <Suspense fallback={null}>
            <Scene 
              robotPosition={robotPosition} 
              onRobotMove={handleRobotMove}
              isWaving={isWaving}
              isWalking={isWalking}
              showTrail={showTrail}
              showSoilZones={showSoilZones}
              onSoilTypeChange={handleSoilTypeChange}
            />
          </Suspense>
        </Canvas>
        
        {/* Animation Controls */}
        <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
          <Button
            variant={isWaving ? "default" : "outline"}
            size="sm"
            onClick={() => setIsWaving(!isWaving)}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <Hand className="h-4 w-4" />
            {isWaving ? 'Stop Waving' : 'Wave'}
          </Button>
          <Button
            variant={isWalking ? "default" : "outline"}
            size="sm"
            onClick={() => setIsWalking(!isWalking)}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <Footprints className="h-4 w-4" />
            {isWalking ? 'Stop Walking' : 'Walk'}
          </Button>
          <Button
            variant={showTrail ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTrail(!showTrail)}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" />
            Trail
          </Button>
          <Button
            variant={showSoilZones ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSoilZones(!showSoilZones)}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <Layers className="h-4 w-4" />
            Soil
          </Button>
        </div>

        {/* Camera Controls */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCameraPreset('default')}
            className={`gap-2 bg-background/80 backdrop-blur-sm ${cameraPreset === 'default' ? 'ring-2 ring-primary' : ''}`}
          >
            <Camera className="h-4 w-4" />
            Orbit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCameraPreset('top')}
            className={`gap-2 bg-background/80 backdrop-blur-sm ${cameraPreset === 'top' ? 'ring-2 ring-primary' : ''}`}
          >
            Top
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCameraPreset('front')}
            className={`gap-2 bg-background/80 backdrop-blur-sm ${cameraPreset === 'front' ? 'ring-2 ring-primary' : ''}`}
          >
            Front
          </Button>
        </div>

        {/* Keyboard hint */}
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground space-y-1">
          <div className="font-medium text-foreground mb-1">Robot Controls</div>
          <div><span className="font-medium">←/A</span> · <span className="font-medium">→/D</span> X-axis</div>
          <div><span className="font-medium">↑/W</span> · <span className="font-medium">↓/S</span> Y-axis</div>
          <div><span className="font-medium">Q</span> · <span className="font-medium">E</span> Z-axis</div>
          <div className="pt-1 border-t border-border mt-1">
            <span className="font-medium">Drag</span> to orbit camera
          </div>
        </div>

        {/* Position & Soil indicator */}
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-2">
          <div>
            <div className="text-muted-foreground">Position</div>
            <div className="font-mono text-foreground">
              X: {coordinates.x} | Y: {coordinates.y} | Z: {coordinates.z}
            </div>
          </div>
          
          {showSoilZones && (
            <div className="pt-2 border-t border-border">
              <div className="text-muted-foreground">Current Zone</div>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: soilConfig.color }}
                />
                <span className="font-medium text-foreground">{soilConfig.name}</span>
              </div>
              <div className="text-muted-foreground mt-1">
                Speed: {Math.round(speedMultiplier * 100)}% • {soilConfig.description}
              </div>
            </div>
          )}
        </div>

        {/* Soil Zone Legend */}
        {showSoilZones && (
          <div className="absolute top-20 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
            <div className="font-medium text-foreground mb-2">Soil Zones</div>
            <div className="space-y-1">
              {Object.values(SOIL_ZONES).map((zone) => (
                <div key={zone.type} className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-sm" 
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className={currentSoilType === zone.type ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                    {zone.name}
                  </span>
                  <span className="text-muted-foreground/60">
                    {Math.round(zone.speedMultiplier * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
