'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense } from 'react';

// Performance monitoring
const PERFORMANCE_TARGETS = {
  FPS: 60,
  MEMORY_MB: 500,
  LOAD_TIME_MS: 2000
};

// Material presets for different metal types
const MATERIAL_PRESETS = {
  gold: {
    metalness: 0.9,
    roughness: 0.2,
    color: '#FFD700',
    emissive: '#FFD700',
    emissiveIntensity: 0.1
  },
  silver: {
    metalness: 0.8,
    roughness: 0.3,
    color: '#C0C0C0',
    emissive: '#C0C0C0',
    emissiveIntensity: 0.05
  },
  platinum: {
    metalness: 0.95,
    roughness: 0.15,
    color: '#E5E4E2',
    emissive: '#E5E4E2',
    emissiveIntensity: 0.08
  },
  rose_gold: {
    metalness: 0.85,
    roughness: 0.25,
    color: '#E0BFB8',
    emissive: '#E0BFB8',
    emissiveIntensity: 0.1
  },
  white_gold: {
    metalness: 0.88,
    roughness: 0.22,
    color: '#F5F5DC',
    emissive: '#F5F5DC',
    emissiveIntensity: 0.08
  }
};

// Jewelry Model Component
function JewelleryModel({ 
  modelUrl, 
  materials, 
  anchorPoints, 
  isVisible, 
  onModelLoad,
  performanceMode = 'high'
}) {
  const meshRef = useRef();
  const { scene } = useThree();
  
  // Load 3D model with error handling
  const gltf = useGLTF(modelUrl, true);
  
  // Create materials based on metal type
  const material = useMemo(() => {
    const preset = MATERIAL_PRESETS[materials?.metalType] || MATERIAL_PRESETS.gold;
    
    // Adjust quality based on performance mode
    const qualityAdjustments = {
      high: { roughness: preset.roughness, metalness: preset.metalness },
      medium: { roughness: preset.roughness * 1.2, metalness: preset.metalness * 0.9 },
      low: { roughness: preset.roughness * 1.5, metalness: preset.metalness * 0.8 }
    };
    
    const adjusted = qualityAdjustments[performanceMode] || qualityAdjustments.high;
    
    return new THREE.MeshStandardMaterial({
      color: preset.color,
      metalness: adjusted.metalness,
      roughness: adjusted.roughness,
      emissive: preset.emissive,
      emissiveIntensity: preset.emissiveIntensity,
      envMapIntensity: materials?.reflectivity || 0.8
    });
  }, [materials, performanceMode]);

  // Apply transformations based on anchor points
  useEffect(() => {
    if (meshRef.current && anchorPoints) {
      const { x, y, z, rotation, scale } = anchorPoints;
      
      // Position
      meshRef.current.position.set(x || 0, y || 0, z || 0);
      
      // Rotation
      if (rotation) {
        meshRef.current.rotation.set(
          rotation.x || 0,
          rotation.y || 0,
          rotation.z || 0
        );
      }
      
      // Scale
      if (scale) {
        meshRef.current.scale.set(
          scale.x || 1,
          scale.y || 1,
          scale.z || 1
        );
      }
    }
  }, [anchorPoints]);

  // Handle model loading
  useEffect(() => {
    if (gltf && meshRef.current) {
      // Apply materials to all meshes
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material = material;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      onModelLoad?.(gltf);
    }
  }, [gltf, material, onModelLoad]);

  // Performance optimization: dispose of unused resources
  useEffect(() => {
    return () => {
      if (material) material.dispose();
    };
  }, [material]);

  if (!gltf) return null;

  return (
    <primitive 
      ref={meshRef}
      object={gltf.scene} 
      visible={isVisible}
      dispose={null}
    />
  );
}

// Lighting System Component
function ARSceneLighting({ settings = {} }) {
  const lightRef = useRef();
  
  // Animate lighting for realistic effects
  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Subtle animation for realism
      lightRef.current.intensity = settings.pointIntensity || 0.6 + 
        Math.sin(time * 0.5) * 0.1;
    }
  });

  return (
    <>
      {/* Ambient lighting for overall scene */}
      <ambientLight 
        intensity={settings.ambientIntensity || 0.4} 
        color="#ffffff" 
      />
      
      {/* Main directional light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={settings.directionalIntensity || 0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Point light for highlights */}
      <pointLight
        ref={lightRef}
        position={[0, 5, 0]}
        intensity={settings.pointIntensity || 0.6}
        color="#ffffff"
        castShadow
      />
      
      {/* Additional fill lights */}
      <pointLight
        position={[-5, 3, 5]}
        intensity={0.3}
        color="#FFE4B5"
      />
      <pointLight
        position={[5, 3, 5]}
        intensity={0.3}
        color="#E6E6FA"
      />
    </>
  );
}

// Performance Monitor Component
function PerformanceMonitor({ onPerformanceUpdate }) {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  
  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    
    // Update every second
    if (currentTime - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
      const memory = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0;
      
      onPerformanceUpdate?.({
        fps,
        memoryMB: memory,
        targetFPS: PERFORMANCE_TARGETS.FPS,
        targetMemory: PERFORMANCE_TARGETS.MEMORY_MB,
        isOptimal: fps >= PERFORMANCE_TARGETS.FPS * 0.9 && memory <= PERFORMANCE_TARGETS.MEMORY_MB
      });
      
      frameCount.current = 0;
      lastTime.current = currentTime;
    }
  });

  return null;
}

// Main AR 3D Renderer Component
export default function AR3DRenderer({
  modelUrl,
  materials,
  anchorPoints,
  isVisible = true,
  onModelLoad,
  onPerformanceUpdate,
  performanceMode = 'high',
  autoRotate = false,
  rotationSpeed = { x: 0, y: 0.01, z: 0 },
  lightingSettings = {},
  cameraSettings = {},
  className = ''
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performance, setPerformance] = useState({
    fps: 0,
    memoryMB: 0,
    isOptimal: true
  });

  // Handle model load events
  const handleModelLoad = useCallback((gltf) => {
    setIsLoading(false);
    setError(null);
    
    // Calculate model statistics
    let vertexCount = 0;
    let polygonCount = 0;
    
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        if (child.geometry.attributes.position) {
          vertexCount += child.geometry.attributes.position.count;
        }
        if (child.geometry.index) {
          polygonCount += child.geometry.index.count / 3;
        }
      }
    });
    
    onModelLoad?.({
      gltf,
      stats: {
        vertexCount,
        polygonCount,
        loadTime: performance.now()
      }
    });
  }, [onModelLoad]);

  // Handle performance updates
  const handlePerformanceUpdate = useCallback((perfData) => {
    setPerformance(perfData);
    onPerformanceUpdate?.(perfData);
  }, [onPerformanceUpdate]);

  // Handle loading errors
  const handleError = useCallback((error) => {
    setError(error.message);
    setIsLoading(false);
    console.error('3D Model Loading Error:', error);
  }, []);

  // Memoize camera settings
  const cameraProps = useMemo(() => ({
    makeDefault: true,
    position: [0, 0, 5],
    fov: cameraSettings.fov || 75,
    near: cameraSettings.near || 0.1,
    far: cameraSettings.far || 1000,
    ...cameraSettings
  }), [cameraSettings]);

  // Error boundary fallback
  if (error) {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-gray-900 text-white ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-400 text-xl mb-4">3D Model Error</div>
          <p className="text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading 3D Model...</p>
          </div>
        </div>
      )}
      
      {/* Performance indicator */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs z-10">
        <div>FPS: {performance.fps}</div>
        <div>Memory: {performance.memoryMB}MB</div>
        <div className={performance.isOptimal ? 'text-green-400' : 'text-yellow-400'}>
          {performance.isOptimal ? 'Optimal' : 'Sub-optimal'}
        </div>
      </div>

      {/* 3D Canvas - Removed for browser compatibility */}
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
          pointerEvents: 'none',
          zIndex: 10
        }}
      >
        <div className="text-white text-xs bg-black bg-opacity-75 p-2 rounded">
          Canvas removed for browser compatibility
        </div>
      </div>
    </div>
  );
}

// Export utilities for external use
export { MATERIAL_PRESETS, PERFORMANCE_TARGETS };
