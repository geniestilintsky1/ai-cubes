import { useState, useCallback, Suspense, useMemo } from 'react';
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
import { 
  getSunPositionFromHour, 
  calculateSunlightExposure,
  type TimeOfDay 
} from './3d/SunlightSystem';
import {
  Plant,
  PlantGarden,
  calculatePlantHealth,
  calculatePlantColor,
  getHealthState,
  getHealthSummary,
  PLANT_HEALTH_STATES,
  type PlantHealthState,
} from './3d/PlantSystem';
import { Button } from './ui/button';
import { Hand, Footprints, Sparkles, Camera, Layers, Sun, Moon, Sunrise, Sunset, Leaf } from 'lucide-react';
import { Slider } from './ui/slider';

interface SceneProps {
  robotPosition: [number, number, number];
  onRobotMove: (pos: [number, number, number]) => void;
  isWaving: boolean;
  isWalking: boolean;
  showTrail: boolean;
  showSoilZones: boolean;
  showPlants: boolean;
  hour: number;
  onSoilTypeChange: (soilType: SoilType, speedMultiplier: number) => void;
}

function Scene({ 
  robotPosition, 
  onRobotMove, 
  isWaving, 
  isWalking, 
  showTrail,
  showSoilZones,
  showPlants,
  hour,
  onSoilTypeChange
}: SceneProps) {
  // Sample plants on the learning platform - one in each soil zone
  const platformPlants = useMemo(() => {
    return [
      // Wet zone (front-left) - different plant types
      { pos: [-0.6, -1.48, -0.6] as [number, number, number], soil: 'wet' as SoilType, type: 'flower' as const, elevation: 0.3 },
      { pos: [-0.3, -1.48, -0.4] as [number, number, number], soil: 'wet' as SoilType, type: 'basic' as const, elevation: 0.35 },
      // Dry zone (front-right)
      { pos: [0.6, -1.48, -0.6] as [number, number, number], soil: 'dry' as SoilType, type: 'crop' as const, elevation: 0.5 },
      { pos: [0.3, -1.48, -0.4] as [number, number, number], soil: 'dry' as SoilType, type: 'basic' as const, elevation: 0.45 },
      // Good soil zone (back-left)
      { pos: [-0.6, -1.48, 0.6] as [number, number, number], soil: 'good' as SoilType, type: 'crop' as const, elevation: 0.6 },
      { pos: [-0.3, -1.48, 0.4] as [number, number, number], soil: 'good' as SoilType, type: 'flower' as const, elevation: 0.55 },
      { pos: [-0.5, -1.48, 0.3] as [number, number, number], soil: 'good' as SoilType, type: 'tree' as const, elevation: 0.65 },
      // Bad soil zone (back-right)
      { pos: [0.6, -1.48, 0.6] as [number, number, number], soil: 'bad' as SoilType, type: 'basic' as const, elevation: 0.4 },
      { pos: [0.3, -1.48, 0.4] as [number, number, number], soil: 'bad' as SoilType, type: 'crop' as const, elevation: 0.35 },
    ];
  }, []);

  return (
    <>
      {/* Atmospheric effects - time-aware */}
      <FogEffect near={25} far={90} hour={hour} />
      <AtmosphericSky hour={hour} />
      <AtmosphericLighting hour={hour} />
      <AtmosphericParticles />
      
      {/* Environment - background layer */}
      <DistantMountains />
      
      {/* Midground - time-aware terrain */}
      <Terrain hour={hour} />
      <Trees />
      <GroundDetails />
      
      {/* Plants on the learning platform showing health based on soil/sun/elevation */}
      {showPlants && platformPlants.map((plant, i) => (
        <Plant
          key={i}
          position={plant.pos}
          soilType={plant.soil}
          elevation={plant.elevation}
          hour={hour}
          plantType={plant.type}
          baseSize={0.15}
          showLabel={false}
        />
      ))}
      
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
  const [showPlants, setShowPlants] = useState(true);
  
  // Time of day system
  const [hour, setHour] = useState(12); // 0-24

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

  // Time of day helpers
  const getTimeLabel = (h: number): string => {
    const hourNum = Math.floor(h);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:00 ${period}`;
  };

  const getTimeOfDayLabel = (h: number): TimeOfDay => {
    if (h >= 5 && h < 8) return 'dawn';
    if (h >= 8 && h < 12) return 'morning';
    if (h >= 12 && h < 15) return 'noon';
    if (h >= 15 && h < 18) return 'afternoon';
    if (h >= 18 && h < 21) return 'dusk';
    return 'night';
  };

  const sunPosition = useMemo(() => getSunPositionFromHour(hour), [hour]);
  const sunExposure = useMemo(() => {
    // Calculate exposure for robot's current elevation (Y position normalized)
    const robotElevation = coordinates.y / 255;
    return calculateSunlightExposure(robotElevation, sunPosition[1]);
  }, [coordinates.y, sunPosition]);

  // Plant health summary based on current conditions
  const plantHealthSummary = useMemo(() => {
    const elevation = coordinates.y / 255;
    return getHealthSummary({ soilType: currentSoilType, elevation, hour });
  }, [currentSoilType, coordinates.y, hour]);

  const plantColor = useMemo(() => calculatePlantColor(plantHealthSummary.averageHealth), [plantHealthSummary.averageHealth]);
  const healthConfig = PLANT_HEALTH_STATES[plantHealthSummary.healthState];

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
          style={{ background: 'linear-gradient(to bottom, #87ceeb, #e0f2fe)' }}
        >
          <color attach="background" args={['#87ceeb']} />
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
              hour={hour}
              showTrail={showTrail}
              showSoilZones={showSoilZones}
              showPlants={showPlants}
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
          <Button
            variant={showPlants ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPlants(!showPlants)}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <Leaf className="h-4 w-4" />
            Plants
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

        {/* Time of Day Controls */}
        <div className="absolute bottom-20 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 w-64">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs">
              {hour >= 6 && hour < 18 ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-400" />
              )}
              <span className="font-medium text-foreground">{getTimeLabel(hour)}</span>
              <span className="text-muted-foreground capitalize">({getTimeOfDayLabel(hour)})</span>
            </div>
          </div>
          <Slider
            value={[hour]}
            onValueChange={([h]) => setHour(h)}
            min={0}
            max={24}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Midnight</span>
            <span>Noon</span>
            <span>Midnight</span>
          </div>
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHour(6)}
              className="flex-1 h-6 text-xs gap-1"
            >
              <Sunrise className="h-3 w-3" />
              Dawn
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHour(12)}
              className="flex-1 h-6 text-xs gap-1"
            >
              <Sun className="h-3 w-3" />
              Noon
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHour(18)}
              className="flex-1 h-6 text-xs gap-1"
            >
              <Sunset className="h-3 w-3" />
              Dusk
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHour(22)}
              className="flex-1 h-6 text-xs gap-1"
            >
              <Moon className="h-3 w-3" />
              Night
            </Button>
          </div>
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

        {/* Position, Soil & Sunlight indicator */}
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
          
          {/* Sunlight exposure indicator */}
          <div className="pt-2 border-t border-border">
            <div className="text-muted-foreground">Sunlight Exposure</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, sunExposure * 60)}%`,
                    backgroundColor: sunExposure < 0.5 ? '#64748b' : sunExposure < 1 ? '#fcd34d' : '#f97316'
                  }}
                />
              </div>
              <span className="font-mono text-foreground text-[10px]">
                {Math.round(sunExposure * 100)}%
              </span>
            </div>
          </div>
          
          {/* Plant Health indicator */}
          {showPlants && (
            <div className="pt-2 border-t border-border">
              <div className="text-muted-foreground">Plant Health (at position)</div>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: plantColor.hex }}
                />
                <span className="font-medium text-foreground capitalize">{plantHealthSummary.healthState}</span>
                <span className="font-mono text-muted-foreground text-[10px]">
                  {Math.round(plantHealthSummary.averageHealth * 100)}%
                </span>
              </div>
              <div className="text-muted-foreground mt-1 text-[10px]">
                {healthConfig.description}
              </div>
              
              {/* RGB breakdown */}
              <div className="mt-2 grid grid-cols-3 gap-1 text-[9px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="font-mono">{Math.round(plantColor.r * 255)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-mono">{Math.round(plantColor.g * 255)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-mono">{Math.round(plantColor.b * 255)}</span>
                </div>
              </div>
              
              {/* Environmental factors breakdown */}
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span>☀️ Sun</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, plantHealthSummary.sunlightLevel * 60)}%` }} />
                    </div>
                    <span className="font-mono w-6 text-right">{Math.round(plantHealthSummary.sunlightLevel * 100)}%</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>💧 Water</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${plantHealthSummary.waterLevel * 100}%` }} />
                    </div>
                    <span className="font-mono w-6 text-right">{Math.round(plantHealthSummary.waterLevel * 100)}%</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>🌱 Soil</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${plantHealthSummary.soilQuality * 100}%` }} />
                    </div>
                    <span className="font-mono w-6 text-right">{Math.round(plantHealthSummary.soilQuality * 100)}%</span>
                  </div>
                </div>
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
