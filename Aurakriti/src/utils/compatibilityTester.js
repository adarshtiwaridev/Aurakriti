// Cross-Platform Compatibility Testing Utilities

class CompatibilityTester {
  constructor() {
    this.testResults = {};
    this.isTesting = false;
    this.testCallbacks = [];
  }

  // Run comprehensive compatibility tests
  async runCompatibilityTests() {
    if (this.isTesting) return;
    
    this.isTesting = true;
    console.log('[Compatibility Tester] Starting comprehensive compatibility tests...');
    
    const startTime = performance.now();
    
    try {
      // Test basic browser support
      const browserTests = await this.testBrowserSupport();
      
      // Test WebRTC capabilities
      const webrtcTests = await this.testWebRTCSupport();
      
      // Test WebGL capabilities
      const webglTests = await this.testWebGLSupport();
      
      // Test device capabilities
      const deviceTests = await this.testDeviceCapabilities();
      
      // Test performance capabilities
      const performanceTests = await this.testPerformanceCapabilities();
      
      // Test AR-specific features
      const arTests = await this.testARSupport();
      
      // Test mobile responsiveness
      const responsiveTests = await this.testResponsiveCapabilities();
      
      this.testResults = {
        timestamp: new Date().toISOString(),
        testDuration: performance.now() - startTime,
        browser: browserTests,
        webrtc: webrtcTests,
        webgl: webglTests,
        device: deviceTests,
        performance: performanceTests,
        ar: arTests,
        responsive: responsiveTests,
        overall: this.calculateOverallScore({
          browserTests,
          webrtcTests,
          webglTests,
          deviceTests,
          performanceTests,
          arTests,
          responsiveTests
        })
      };
      
      console.log('[Compatibility Tester] Tests completed:', this.testResults);
      this.notifyTestComplete();
      
    } catch (error) {
      console.error('[Compatibility Tester] Test error:', error);
      this.testResults = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isTesting = false;
    }
    
    return this.testResults;
  }

  // Test browser support
  async testBrowserSupport() {
    const tests = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookies: navigator.cookieEnabled,
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      webWorkers: typeof Worker !== 'undefined',
      serviceWorkers: 'serviceWorker' in navigator,
      webAssembly: typeof WebAssembly !== 'undefined',
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      requestAnimationFrame: 'requestAnimationFrame' in window,
      performanceAPI: 'performance' in window,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      deviceMotion: 'DeviceMotionEvent' in window
    };

    return {
      ...tests,
      score: this.calculateBrowserScore(tests),
      recommendations: this.getBrowserRecommendations(tests)
    };
  }

  // Test WebRTC support
  async testWebRTCSupport() {
    const tests = {
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      mediaDevices: !!navigator.mediaDevices,
      RTCPeerConnection: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
      RTCDataChannel: !!(window.RTCDataChannel || window.webkitRTCDataChannel),
      getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      enumerateDevices: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
    };

    // Test camera access
    if (tests.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        tests.cameraAccess = true;
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        tests.cameraAccess = false;
        tests.cameraError = error.name;
      }
    } else {
      tests.cameraAccess = false;
    }

    return {
      ...tests,
      score: this.calculateWebRTCScore(tests),
      recommendations: this.getWebRTCRecommendations(tests)
    };
  }

  // Test WebGL support
  async testWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    const tests = {
      webgl2: !!canvas.getContext('webgl2'),
      webgl1: !!canvas.getContext('webgl'),
      maxTextureSize: this.getMaxTextureSize(gl),
      maxVertexAttributes: this.getMaxVertexAttributes(gl),
      extensions: this.getWebGLExtensions(gl),
      maxViewportDims: this.getMaxViewportDims(gl),
      shaderPrecision: this.getShaderPrecision(gl),
      antialiasing: this.getAntialiasingSupport(gl),
      depthTexture: this.getDepthTextureSupport(gl),
      vertexArrayObject: this.getVAOSupport(gl),
      instancedRendering: this.getInstancedRenderingSupport(gl)
    };

    return {
      ...tests,
      score: this.calculateWebGLScore(tests),
      recommendations: this.getWebGLRecommendations(tests)
    };
  }

  // Test device capabilities
  async testDeviceCapabilities() {
    const tests = {
      platform: this.getPlatform(),
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isDesktop: this.isDesktop(),
      touchSupport: 'ontouchstart' in window,
      touchPoints: navigator.maxTouchPoints || 0,
      pixelRatio: window.devicePixelRatio || 1,
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      },
      deviceMemory: navigator.deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      connection: await this.getConnectionInfo(),
      battery: await this.getBatteryInfo(),
      vibration: 'vibrate' in navigator
    };

    return {
      ...tests,
      score: this.calculateDeviceScore(tests),
      recommendations: this.getDeviceRecommendations(tests)
    };
  }

  // Test performance capabilities
  async testPerformanceCapabilities() {
    const tests = {
      performanceAPI: !!window.performance,
      memoryAPI: !!performance.memory,
      timingAPI: !!performance.timing,
      navigationAPI: !!performance.navigation,
      paintTimingAPI: !!performance.getEntriesByType && performance.getEntriesByType('paint').length > 0,
      observerAPI: !!PerformanceObserver,
      markAPI: !!performance.mark,
      measureAPI: !!performance.measure,
      resourceTimingAPI: !!performance.getEntriesByType
    };

    // Test actual performance
    if (tests.performanceAPI) {
      tests.benchmarkScore = await this.runPerformanceBenchmark();
    }

    return {
      ...tests,
      score: this.calculatePerformanceScore(tests),
      recommendations: this.getPerformanceRecommendations(tests)
    };
  }

  // Test AR support
  async testARSupport() {
    const tests = {
      webXR: !!navigator.xr,
      webXRVR: !!(navigator.xr && navigator.xr.isSessionSupported('immersive-vr')),
      webXRAR: !!(navigator.xr && navigator.xr.isSessionSupported('immersive-ar')),
      webXRInline: !!(navigator.xr && navigator.xr.isSessionSupported('inline')),
      deviceOrientation: 'DeviceOrientationEvent' in window,
      deviceMotion: 'DeviceMotionEvent' in window,
      geolocation: 'geolocation' in navigator,
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      canvas: !!document.createElement('canvas'),
      webgl: this.testWebGLSupport()
    };

    // Test WebXR session support
    if (tests.webXR) {
      try {
        tests.immersiveVR = await navigator.xr.isSessionSupported('immersive-vr');
        tests.immersiveAR = await navigator.xr.isSessionSupported('immersive-ar');
        tests.inline = await navigator.xr.isSessionSupported('inline');
      } catch (error) {
        tests.sessionError = error.message;
      }
    }

    return {
      ...tests,
      score: this.calculateARScore(tests),
      recommendations: this.getARRecommendations(tests)
    };
  }

  // Test responsive capabilities
  async testResponsiveCapabilities() {
    const tests = {
      viewportMeta: this.checkViewportMeta(),
      cssGrid: CSS.supports('display', 'grid'),
      flexbox: CSS.supports('display', 'flex'),
      customProperties: CSS.supports('color', 'var(--test)'),
      pictureElement: !!window.HTMLPictureElement,
      srcset: !!document.createElement('img').srcset,
      responsiveImages: this.testResponsiveImages(),
      mediaQueries: window.matchMedia,
      cssVariables: CSS.supports('color', 'var(--test)'),
      resizeObserver: 'ResizeObserver' in window,
      intersectionObserver: 'IntersectionObserver' in window
    };

    // Test actual responsiveness
    tests.breakpoints = this.testBreakpoints();
    tests.orientation = this.testOrientationSupport();

    return {
      ...tests,
      score: this.calculateResponsiveScore(tests),
      recommendations: this.getResponsiveRecommendations(tests)
    };
  }

  // Helper methods for testing
  testLocalStorage() {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  testSessionStorage() {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  getMaxTextureSize(gl) {
    if (!gl) return 0;
    return gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }

  getMaxVertexAttributes(gl) {
    if (!gl) return 0;
    return gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  }

  getWebGLExtensions(gl) {
    if (!gl) return [];
    const extensions = gl.getSupportedExtensions();
    return extensions.slice(0, 10); // Return first 10 for brevity
  }

  getMaxViewportDims(gl) {
    if (!gl) return { width: 0, height: 0 };
    return {
      width: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      height: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
    };
  }

  getShaderPrecision(gl) {
    if (!gl) return null;
    return gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
  }

  getAntialiasingSupport(gl) {
    if (!gl) return false;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl', { antialias: true });
    return context.getContextAttributes().antialias;
  }

  getDepthTextureSupport(gl) {
    if (!gl) return false;
    return gl.getExtension('WEBGL_depth_texture');
  }

  getVAOSupport(gl) {
    if (!gl) return false;
    return gl.getExtension('OES_vertex_array_object');
  }

  getInstancedRenderingSupport(gl) {
    if (!gl) return false;
    return gl.getExtension('ANGLE_instanced_arrays');
  }

  getPlatform() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
    if (/Android/.test(userAgent)) return 'Android';
    if (/Windows/.test(platform)) return 'Windows';
    if (/Mac/.test(platform)) return 'macOS';
    if (/Linux/.test(platform)) return 'Linux';
    
    return 'unknown';
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isTablet() {
    return /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
  }

  isDesktop() {
    return !this.isMobile() && !this.isTablet();
  }

  async getConnectionInfo() {
    if (!navigator.connection) return null;
    
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }

  async getBatteryInfo() {
    if (!navigator.getBattery) return null;
    
    try {
      const battery = await navigator.getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (error) {
      return null;
    }
  }

  async runPerformanceBenchmark() {
    const iterations = 1000000;
    const startTime = performance.now();
    
    // Simple computation benchmark
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i);
    }
    
    const endTime = performance.now();
    return Math.round(1000000 / (endTime - startTime));
  }

  checkViewportMeta() {
    const viewport = document.querySelector('meta[name="viewport"]');
    return !!viewport;
  }

  testResponsiveImages() {
    const img = document.createElement('img');
    return 'srcset' in img;
  }

  testBreakpoints() {
    const breakpoints = [
      { name: 'mobile', width: 320 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1024 },
      { name: 'large', width: 1440 }
    ];
    
    const currentWidth = window.innerWidth;
    return breakpoints.map(bp => ({
      ...bp,
      active: currentWidth >= bp.width
    }));
  }

  testOrientationSupport() {
    return 'orientation' in screen;
  }

  // Scoring methods
  calculateBrowserScore(tests) {
    let score = 0;
    const totalTests = Object.keys(tests).length - 2; // Exclude userAgent and language
    
    Object.keys(tests).forEach(key => {
      if (key !== 'userAgent' && key !== 'language' && tests[key]) {
        score += 100 / totalTests;
      }
    });
    
    return Math.round(score);
  }

  calculateWebRTCScore(tests) {
    let score = 0;
    const totalTests = Object.keys(tests).length - 1; // Exclude cameraError
    
    Object.keys(tests).forEach(key => {
      if (key !== 'cameraError' && tests[key]) {
        score += 100 / totalTests;
      }
    });
    
    return Math.round(score);
  }

  calculateWebGLScore(tests) {
    // Simplified scoring based on key features
    let score = 0;
    
    if (tests.webgl2) score += 30;
    if (tests.webgl1) score += 20;
    if (tests.maxTextureSize >= 2048) score += 15;
    if (tests.extensions.length >= 10) score += 15;
    if (tests.antialiasing) score += 10;
    if (tests.depthTexture) score += 10;
    
    return Math.min(score, 100);
  }

  calculateDeviceScore(tests) {
    let score = 50; // Base score
    
    if (tests.touchSupport) score += 10;
    if (tests.pixelRatio >= 2) score += 10;
    if (tests.hardwareConcurrency >= 4) score += 10;
    if (tests.deviceMemory >= 4) score += 10;
    if (tests.connection && tests.connection.effectiveType !== 'slow-2g') score += 10;
    
    return Math.min(score, 100);
  }

  calculatePerformanceScore(tests) {
    let score = 0;
    const totalTests = Object.keys(tests).length - 1; // Exclude benchmarkScore
    
    Object.keys(tests).forEach(key => {
      if (key !== 'benchmarkScore' && tests[key]) {
        score += 100 / totalTests;
      }
    });
    
    // Add benchmark score bonus
    if (tests.benchmarkScore > 100000) score += 10;
    
    return Math.min(score, 100);
  }

  calculateARScore(tests) {
    let score = 0;
    
    if (tests.webXR) score += 25;
    if (tests.immersiveVR) score += 20;
    if (tests.immersiveAR) score += 20;
    if (tests.deviceOrientation) score += 15;
    if (tests.camera) score += 10;
    if (tests.webgl) score += 10;
    
    return Math.min(score, 100);
  }

  calculateResponsiveScore(tests) {
    let score = 0;
    const totalTests = Object.keys(tests).length - 2; // Exclude breakpoints and orientation
    
    Object.keys(tests).forEach(key => {
      if (key !== 'breakpoints' && key !== 'orientation' && tests[key]) {
        score += 100 / totalTests;
      }
    });
    
    return Math.round(score);
  }

  // Calculate overall compatibility score
  calculateOverallScore(testResults) {
    const weights = {
      browser: 0.15,
      webrtc: 0.20,
      webgl: 0.25,
      device: 0.15,
      performance: 0.10,
      ar: 0.10,
      responsive: 0.05
    };
    
    let overallScore = 0;
    
    Object.keys(weights).forEach(category => {
      const categoryData = testResults[`${category}Tests`];
      if (categoryData && categoryData.score) {
        overallScore += categoryData.score * weights[category];
      }
    });
    
    return {
      score: Math.round(overallScore),
      grade: this.getCompatibilityGrade(overallScore),
      level: this.getCompatibilityLevel(overallScore)
    };
  }

  getCompatibilityGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getCompatibilityLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'incompatible';
  }

  // Recommendation methods
  getBrowserRecommendations(tests) {
    const recommendations = [];
    
    if (!tests.localStorage) {
      recommendations.push('Enable local storage for better user experience');
    }
    
    if (!tests.webWorkers) {
      recommendations.push('Consider browser with Web Workers support for better performance');
    }
    
    if (!tests.requestAnimationFrame) {
      recommendations.push('Update browser for smoother animations');
    }
    
    return recommendations;
  }

  getWebRTCRecommendations(tests) {
    const recommendations = [];
    
    if (!tests.getUserMedia) {
      recommendations.push('Browser does not support camera access - AR features will be limited');
    }
    
    if (!tests.cameraAccess && tests.cameraError) {
      recommendations.push(`Camera access denied: ${tests.cameraError}`);
    }
    
    return recommendations;
  }

  getWebGLRecommendations(tests) {
    const recommendations = [];
    
    if (!tests.webgl2 && !tests.webgl1) {
      recommendations.push('Browser does not support WebGL - 3D rendering unavailable');
    } else if (!tests.webgl2) {
      recommendations.push('Consider browser with WebGL 2.0 support for better graphics');
    }
    
    if (tests.maxTextureSize < 1024) {
      recommendations.push('Limited texture size support - consider lower quality textures');
    }
    
    return recommendations;
  }

  getDeviceRecommendations(tests) {
    const recommendations = [];
    
    if (tests.isMobile && tests.hardwareConcurrency < 4) {
      recommendations.push('Mobile device with limited cores - performance optimizations recommended');
    }
    
    if (tests.deviceMemory < 4) {
      recommendations.push('Limited device memory - monitor usage carefully');
    }
    
    if (tests.connection && tests.connection.effectiveType === 'slow-2g') {
      recommendations.push('Slow connection detected - consider lower quality settings');
    }
    
    return recommendations;
  }

  getPerformanceRecommendations(tests) {
    const recommendations = [];
    
    if (!tests.performanceAPI) {
      recommendations.push('Performance API not available - monitoring limited');
    }
    
    if (!tests.memoryAPI) {
      recommendations.push('Memory monitoring not available');
    }
    
    if (tests.benchmarkScore < 50000) {
      recommendations.push('Low performance detected - consider quality reductions');
    }
    
    return recommendations;
  }

  getARRecommendations(tests) {
    const recommendations = [];
    
    if (!tests.webXR) {
      recommendations.push('WebXR not supported - AR features limited to basic camera');
    }
    
    if (!tests.immersiveAR) {
      recommendations.push('Immersive AR not supported - using fallback mode');
    }
    
    if (!tests.deviceOrientation) {
      recommendations.push('Device orientation not available - AR positioning limited');
    }
    
    return recommendations;
  }

  getResponsiveRecommendations(tests) {
    const recommendations = [];
    
    if (!tests.viewportMeta) {
      recommendations.push('Add viewport meta tag for proper mobile rendering');
    }
    
    if (!tests.cssGrid) {
      recommendations.push('Consider browser with CSS Grid support for better layouts');
    }
    
    if (!tests.resizeObserver) {
      recommendations.push('Resize Observer not available - responsive features limited');
    }
    
    return recommendations;
  }

  // Event handling
  onTestComplete(callback) {
    this.testCallbacks.push(callback);
  }

  notifyTestComplete() {
    this.testCallbacks.forEach(callback => {
      try {
        callback(this.testResults);
      } catch (error) {
        console.error('[Compatibility Tester] Callback error:', error);
      }
    });
  }

  // Get current test results
  getTestResults() {
    return this.testResults;
  }

  // Export results as JSON
  exportResults() {
    const dataStr = JSON.stringify(this.testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `compatibility-test-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const compatibilityTester = new CompatibilityTester();

export default compatibilityTester;
