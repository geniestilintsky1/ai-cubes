import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RobotTrailProps {
  position: [number, number, number];
  maxPoints?: number;
}

export function RobotTrail({ position, maxPoints = 50 }: RobotTrailProps) {
  const trailRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<number[]>([]);
  const opacitiesRef = useRef<number[]>([]);
  const lastPositionRef = useRef<[number, number, number]>([...position]);

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
      },
      vertexShader: `
        attribute float opacity;
        attribute float size;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
          gl_FragColor = vec4(color, alpha);
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
    if (distance > 0.005) {
      // Add new position at the beginning
      positionsRef.current.unshift(x - 0.5, y + 0.2, z - 0.5);
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
      opacitiesRef.current[i] *= 0.98;
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
        sizeAttr.array[i] = 0.015 * (1 - i / maxPoints);
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
