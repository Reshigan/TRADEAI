import { useEffect, useRef } from 'react';

/**
 * Debounce function to limit the rate at which a function is called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to ensure a function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Custom hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for tracking component render count
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Lazy load images with intersection observer
 */
export function useLazyImage(src: string): [string | undefined, boolean] {
  const [imageSrc, setImageSrc] = React.useState<string>();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    if (imgRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.01 }
      );
      observer.observe(imgRef.current);
    }
    return () => observer && observer.disconnect();
  }, [src]);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => setIsLoaded(true);
    }
  }, [imageSrc]);

  return [imageSrc, isLoaded];
}

/**
 * Virtual scrolling helper for large lists
 */
export interface VirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: VirtualScrollOptions) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(i);
  }

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  static start(name: string) {
    this.marks.set(name, performance.now());
  }

  static end(name: string): number | null {
    const start = this.marks.get(name);
    if (start) {
      const duration = performance.now() - start;
      this.marks.delete(name);
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
    return null;
  }

  static measure(name: string, fn: () => any) {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }

  static async measureAsync(name: string, fn: () => Promise<any>) {
    this.start(name);
    const result = await fn();
    this.end(name);
    return result;
  }
}

/**
 * Cache manager for API responses
 */
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static ttl = 5 * 60 * 1000; // 5 minutes default

  static set(key: string, data: any, ttl: number = this.ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.timestamp > Date.now()) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  static clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  static clearExpired() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// Auto-clear expired cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => CacheManager.clearExpired(), 5 * 60 * 1000);
}

/**
 * Bundle size optimization - dynamic imports helper
 */
export async function loadComponent<T>(
  factory: () => Promise<{ default: T }>
): Promise<T> {
  try {
    const module = await factory();
    return module.default;
  } catch (error) {
    console.error('Failed to load component:', error);
    throw error;
  }
}
