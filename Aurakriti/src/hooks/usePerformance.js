import { useEffect } from 'react';

export function usePerformance() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      const reportWebVitals = (metricName, metricValue) => {
        console.log(`${metricName}:`, metricValue);

        // Send to Google Analytics if gtag is available
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', metricName, {
            value: Math.round(metricValue),
            event_category: 'Web Vitals',
            non_interaction: true,
          });
        }
      };

      const observers = [];

      // LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            const lcpValue = lastEntry.renderTime || lastEntry.loadTime;
            reportWebVitals('LCP', lcpValue);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observers.push(lcpObserver);
      } catch (error) {
        console.error('Error observing LCP:', error);
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          reportWebVitals('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observers.push(clsObserver);
      } catch (error) {
        console.error('Error observing CLS:', error);
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const firstEntry = entries[0];
            const fidValue = firstEntry.processingDuration;
            reportWebVitals('FID', fidValue);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        observers.push(fidObserver);
      } catch (error) {
        console.error('Error observing FID:', error);
      }

      // Cleanup observers on unmount
      return () => {
        observers.forEach((observer) => {
          try {
            observer.disconnect();
          } catch (error) {
            console.error('Error disconnecting observer:', error);
          }
        });
      };
    } catch (error) {
      console.error('Error setting up performance observers:', error);
    }
  }, []);
}
