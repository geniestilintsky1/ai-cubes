import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ScaledRobotTrailProps {
  position: [number, number, number];
  cubeSize?: number;
  maxPoints?: number;
}

export function ScaledRobotTrail({ 
  position, 
  cubeSize = 2, 
  maxPoints = 80 
}: ScaledRobotTrailProps) {
  const trailRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<number[]>([]);
  const opacitiesRef = useRef<number[]>([]);
  const lastPositionRef = useRef<[number, number, number]>([...position]);

  // Convert normalized position to world position
  const getWorldPosition = (pos: [number, number, number]): [number, number, number] => {
    return [
      (pos[0] * cubeSize) - cubeSize / 2,
      (pos[1] * cubeSize) - cubeSize / 2 + 0.15 - 1.5,
      (pos[2] * cubeSize) - cubeSize / 2,
    ];
  };

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    const opacities = new Float32Array(maxPoints);
    const sizes = new Float32Array(maxPoints);
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color('#0ea5e9') },
        glowColor: { value: new THREE.Color('#38bdf8') },
      },
      vertexShader: `
        attribute float opacity;
        attribute float size;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 glowColor;
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Create glow effect
          float glow = smoothstep(0.5, 0.0, dist);
          float core = smoothstep(0.3, 0.0, dist);
          
          vec3 finalColor = mix(glowColor, color, core);
          float alpha = glow * vOpacity;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, [maxPoints]);

  useFrame(() => {
    const [x, y, z] = position;
    const [lx, ly, lz] = lastPositionRef.current;
    const distance = Math.sqrt((x - lx) ** 2 + (y - ly) ** 2 + (z - lz) ** 2);

    // Only add points if robot moved enough
    if (distance > 0.003) {
      const worldPos = getWorldPosition(position);
      
      // Add new position at the beginning
      positionsRef.current.unshift(worldPos[0], worldPos[1], worldPos[2]);
      opacitiesRef.current.unshift(1);
      
      // Keep only maxPoints
      if (positionsRef.current.length > maxPoints * 3) {
        positionsRef.current.length = maxPoints * 3;
      }
      if (opacitiesRef.current.length > maxPoints) {
        opacitiesRef.current.length = maxPoints;
      }
      
      lastPositionRef.current = [x, y, z];
    }

    // Fade out existing points
    for (let i = 0; i < opacitiesRef.current.length; i++) {
      opacitiesRef.current[i] *= 0.97;
    }

    // Update geometry
    const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const opacityAttr = geometry.getAttribute('opacity') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

    for (let i = 0; i < maxPoints; i++) {
      const idx = i * 3;
      if (idx < positionsRef.current.length) {
        positionAttr.array[idx] = positionsRef.current[idx];
        positionAttr.array[idx + 1] = positionsRef.current[idx + 1];
        positionAttr.array[idx + 2] = positionsRef.current[idx + 2];
        opacityAttr.array[i] = opacitiesRef.current[i];
        sizeAttr.array[i] = 0.04 * (1 - i / maxPoints);
      } else {
        opacityAttr.array[i] = 0;
      }
    }

    positionAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return <points ref={trailRef} geometry={geometry} material={material} />;
}
