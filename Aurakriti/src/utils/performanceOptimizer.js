// Performance Optimization Utilities for AR Virtual Try-On System

class PerformanceOptimizer {
  constructor() {
    this.targets = {
      FPS: 60,
      MEMORY_MB: 500,
      LOAD_TIME_MS: 2000,
      FACE_DETECTION_MS: 100
    };
    
    this.metrics = {
      fps: 0,
      memoryUsage: 0,
      loadTime: 0,
      faceDetectionTime: 0,
      renderTime: 0
    };
    
    this.observers = [];
    this.optimizationLevel = 'high';
    this.isMonitoring = false;
  }

  // Initialize performance monitoring
  initializeMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.startFPSMonitoring();
    this.startMemoryMonitoring();
    this.startRenderTimeMonitoring();
    
    console.log('[Performance Optimizer] Monitoring initialized');
  }

  // Start FPS monitoring
  startFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        this.checkPerformanceThresholds();
        this.notifyObservers('fps', this.metrics.fps);
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Start memory monitoring
  startMemoryMonitoring() {
    if (!performance.memory) {
      console.warn('[Performance Optimizer] Memory monitoring not available');
      return;
    }

    const checkMemory = () => {
      if (performance.memory) {
        this.metrics.memoryUsage = Math.round(
          performance.memory.usedJSHeapSize / 1048576
        );
        
        this.checkPerformanceThresholds();
        this.notifyObservers('memory', this.metrics.memoryUsage);
      }
      
      if (this.isMonitoring) {
        setTimeout(checkMemory, 1000);
      }
    };
    
    checkMemory();
  }

  // Start render time monitoring
  startRenderTimeMonitoring() {
    const originalRAF = window.requestAnimationFrame;
    let lastFrameTime = performance.now();
    
    window.requestAnimationFrame = (callback) => {
      const wrappedCallback = (timestamp) => {
        const startTime = performance.now();
        const result = callback(timestamp);
        const endTime = performance.now();
        
        this.metrics.renderTime = endTime - startTime;
        this.notifyObservers('renderTime', this.metrics.renderTime);
        
        return result;
      };
      
      return originalRAF(wrappedCallback);
    };
  }

  // Check performance against thresholds
  checkPerformanceThresholds() {
    const warnings = [];
    
    if (this.metrics.fps < this.targets.FPS * 0.8) {
      warnings.push({
        type: 'fps',
        current: this.metrics.fps,
        target: this.targets.FPS,
        severity: this.metrics.fps < this.targets.FPS * 0.5 ? 'critical' : 'warning'
      });
    }
    
    if (this.metrics.memoryUsage > this.targets.MEMORY_MB) {
      warnings.push({
        type: 'memory',
        current: this.metrics.memoryUsage,
        target: this.targets.MEMORY_MB,
        severity: this.metrics.memoryUsage > this.targets.MEMORY_MB * 1.5 ? 'critical' : 'warning'
      });
    }
    
    if (this.metrics.renderTime > 16.67) { // 60 FPS = 16.67ms per frame
      warnings.push({
        type: 'render',
        current: this.metrics.renderTime,
        target: 16.67,
        severity: this.metrics.renderTime > 33.33 ? 'critical' : 'warning'
      });
    }
    
    if (warnings.length > 0) {
      this.handlePerformanceWarnings(warnings);
    }
  }

  // Handle performance warnings
  handlePerformanceWarnings(warnings) {
    warnings.forEach(warning => {
      console.warn(`[Performance Optimizer] ${warning.type} ${warning.severity}:`, {
        current: warning.current,
        target: warning.target
      });
      
      // Auto-optimize based on warning type
      this.autoOptimize(warning);
    });
  }

  // Auto-optimize based on performance issues
  autoOptimize(warning) {
    switch (warning.type) {
      case 'fps':
        if (warning.severity === 'critical') {
          this.setOptimizationLevel('low');
        } else if (warning.severity === 'warning') {
          this.setOptimizationLevel('medium');
        }
        break;
        
      case 'memory':
        if (warning.severity === 'critical') {
          this.setOptimizationLevel('low');
          this.clearMemory();
        } else if (warning.severity === 'warning') {
          this.setOptimizationLevel('medium');
        }
        break;
        
      case 'render':
        if (warning.severity === 'critical') {
          this.setOptimizationLevel('low');
        } else if (warning.severity === 'warning') {
          this.setOptimizationLevel('medium');
        }
        break;
    }
  }

  // Set optimization level
  setOptimizationLevel(level) {
    if (this.optimizationLevel === level) return;
    
    this.optimizationLevel = level;
    console.log(`[Performance Optimizer] Optimization level changed to: ${level}`);
    
    this.applyOptimizations(level);
    this.notifyObservers('optimizationLevel', level);
  }

  // Apply optimizations based on level
  applyOptimizations(level) {
    const optimizations = {
      high: {
        shadows: true,
        antialiasing: true,
        textureQuality: 'high',
        modelQuality: 'high',
        particleEffects: true,
        postProcessing: true,
        lodLevel: 0
      },
      medium: {
        shadows: true,
        antialiasing: true,
        textureQuality: 'medium',
        modelQuality: 'medium',
        particleEffects: false,
        postProcessing: false,
        lodLevel: 1
      },
      low: {
        shadows: false,
        antialiasing: false,
        textureQuality: 'low',
        modelQuality: 'low',
        particleEffects: false,
        postProcessing: false,
        lodLevel: 2
      }
    };
    
    const settings = optimizations[level];
    this.notifyObservers('optimizationSettings', settings);
  }

  // Clear memory
  clearMemory() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear caches
    if (caches) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    console.log('[Performance Optimizer] Memory cleared');
  }

  // Optimize 3D model loading
  optimizeModelLoading(modelUrl, quality = 'high') {
    const optimizations = {
      high: {
        useDraco: true,
        useKTX2: true,
        generateMipmaps: true,
        anisotropicFiltering: 16
      },
      medium: {
        useDraco: true,
        useKTX2: false,
        generateMipmaps: true,
        anisotropicFiltering: 8
      },
      low: {
        useDraco: false,
        useKTX2: false,
        generateMipmaps: false,
        anisotropicFiltering: 4
      }
    };
    
    return optimizations[quality] || optimizations.medium;
  }

  // Optimize texture loading
  optimizeTextureLoading(textureUrl, quality = 'high') {
    const optimizations = {
      high: {
        format: 'auto',
        generateMipmaps: true,
        anisotropicFiltering: 16,
        wrapS: 'repeat',
        wrapT: 'repeat'
      },
      medium: {
        format: 'rgb',
        generateMipmaps: true,
        anisotropicFiltering: 8,
        wrapS: 'repeat',
        wrapT: 'repeat'
      },
      low: {
        format: 'rgb',
        generateMipmaps: false,
        anisotropicFiltering: 4,
        wrapS: 'clamp',
        wrapT: 'clamp'
      }
    };
    
    return optimizations[quality] || optimizations.medium;
  }

  // Optimize rendering settings
  optimizeRenderingSettings(renderer, quality = 'high') {
    const settings = {
      high: {
        shadowMapEnabled: true,
        shadowMapSize: 2048,
        shadowMapType: 'PCFSoft',
        antialias: true,
        toneMapping: 'ACESFilmic',
        outputColorSpace: 'sRGB',
        physicallyCorrectLights: true
      },
      medium: {
        shadowMapEnabled: true,
        shadowMapSize: 1024,
        shadowMapType: 'PCF',
        antialias: true,
        toneMapping: 'Linear',
        outputColorSpace: 'sRGB',
        physicallyCorrectLights: false
      },
      low: {
        shadowMapEnabled: false,
        shadowMapSize: 512,
        shadowMapType: 'Basic',
        antialias: false,
        toneMapping: 'None',
        outputColorSpace: 'Linear',
        physicallyCorrectLights: false
      }
    };
    
    const config = settings[quality] || settings.medium;
    
    // Apply settings to renderer
    if (renderer.shadowMap) {
      renderer.shadowMap.enabled = config.shadowMapEnabled;
      renderer.shadowMap.setSize(config.shadowMapSize, config.shadowMapSize);
      renderer.shadowMap.type = config.shadowMapType;
    }
    
    renderer.toneMapping = config.toneMapping;
    renderer.outputColorSpace = config.outputColorSpace;
    
    return config;
  }

  // Optimize camera settings
  optimizeCameraSettings(camera, quality = 'high') {
    const settings = {
      high: {
        fov: 75,
        near: 0.1,
        far: 1000,
        aspect: window.innerWidth / window.innerHeight
      },
      medium: {
        fov: 60,
        near: 0.5,
        far: 500,
        aspect: window.innerWidth / window.innerHeight
      },
      low: {
        fov: 45,
        near: 1,
        far: 200,
        aspect: window.innerWidth / window.innerHeight
      }
    };
    
    const config = settings[quality] || settings.medium;
    
    camera.fov = config.fov;
    camera.near = config.near;
    camera.far = config.far;
    camera.aspect = config.aspect;
    camera.updateProjectionMatrix();
    
    return config;
  }

  // Add performance observer
  addObserver(callback) {
    this.observers.push(callback);
  }

  // Remove performance observer
  removeObserver(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  // Notify observers of performance changes
  notifyObservers(type, value) {
    this.observers.forEach(callback => {
      try {
        callback(type, value, this.metrics);
      } catch (error) {
        console.error('[Performance Optimizer] Observer error:', error);
      }
    });
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      optimizationLevel: this.optimizationLevel,
      targets: this.targets,
      isOptimal: this.isOptimal()
    };
  }

  // Check if performance is optimal
  isOptimal() {
    return (
      this.metrics.fps >= this.targets.FPS * 0.9 &&
      this.metrics.memoryUsage <= this.targets.MEMORY_MB &&
      this.metrics.renderTime <= 16.67
    );
  }

  // Get performance report
  getPerformanceReport() {
    const metrics = this.getMetrics();
    
    return {
      summary: {
        status: metrics.isOptimal ? 'optimal' : 'sub-optimal',
        optimizationLevel: metrics.optimizationLevel,
        timestamp: new Date().toISOString()
      },
      metrics: {
        fps: {
          current: metrics.fps,
          target: this.targets.FPS,
          percentage: Math.round((metrics.fps / this.targets.FPS) * 100)
        },
        memory: {
          current: metrics.memoryUsage,
          target: this.targets.MEMORY_MB,
          percentage: Math.round((metrics.memoryUsage / this.targets.MEMORY_MB) * 100)
        },
        render: {
          current: metrics.renderTime,
          target: 16.67,
          percentage: Math.round((16.67 / metrics.renderTime) * 100)
        }
      },
      recommendations: this.generateRecommendations(metrics)
    };
  }

  // Generate performance recommendations
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.fps < this.targets.FPS * 0.8) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider reducing render quality for better frame rate',
        actions: ['Disable shadows', 'Lower texture quality', 'Reduce model detail']
      });
    }
    
    if (metrics.memoryUsage > this.targets.MEMORY_MB) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'Memory usage is high, consider optimization',
        actions: ['Clear unused textures', 'Reduce model complexity', 'Enable garbage collection']
      });
    }
    
    if (metrics.renderTime > 16.67) {
      recommendations.push({
        type: 'rendering',
        priority: 'medium',
        message: 'Render time is above target for 60 FPS',
        actions: ['Optimize shader complexity', 'Reduce draw calls', 'Use LOD levels']
      });
    }
    
    return recommendations;
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('[Performance Optimizer] Monitoring stopped');
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      fps: 0,
      memoryUsage: 0,
      loadTime: 0,
      faceDetectionTime: 0,
      renderTime: 0
    };
    
    console.log('[Performance Optimizer] Metrics reset');
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export utility functions
export const optimizeForDevice = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
  
  if (isMobile) {
    return {
      quality: 'low',
      maxTextureSize: 512,
      shadowMapSize: 512,
      antialiasing: false,
      particleEffects: false,
      maxPolygons: 10000
    };
  } else if (isTablet) {
    return {
      quality: 'medium',
      maxTextureSize: 1024,
      shadowMapSize: 1024,
      antialiasing: true,
      particleEffects: false,
      maxPolygons: 25000
    };
  } else {
    return {
      quality: 'high',
      maxTextureSize: 2048,
      shadowMapSize: 2048,
      antialiasing: true,
      particleEffects: true,
      maxPolygons: 50000
    };
  }
};

export const measureLoadTime = (operation) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      return endTime - startTime;
    },
    getElapsed: () => performance.now() - startTime
  };
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default performanceOptimizer;
