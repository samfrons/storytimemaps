/**
 * Performance optimization utilities for handling 10k+ markers
 */

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: any;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Request animation frame throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(context, args);
        rafId = null;
      });
    }
  };
}

/**
 * Viewport culling for markers
 */
export function getVisibleMarkers(
  markers: Array<{ lat: number; lng: number; [key: string]: any }>,
  bounds: { north: number; south: number; east: number; west: number },
  maxMarkers: number = 1000
): typeof markers {
  // Filter markers within bounds
  const visible = markers.filter(marker => {
    return marker.lat >= bounds.south &&
           marker.lat <= bounds.north &&
           marker.lng >= bounds.west &&
           marker.lng <= bounds.east;
  });
  
  // If still too many, sample them
  if (visible.length > maxMarkers) {
    const step = Math.ceil(visible.length / maxMarkers);
    return visible.filter((_, index) => index % step === 0);
  }
  
  return visible;
}

/**
 * Chunk array processing to avoid blocking
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);
    
    // Yield to browser
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
}

/**
 * Memory-efficient LRU cache
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

/**
 * FPS Monitor for development
 */
export class FPSMonitor {
  private lastTime: number = performance.now();
  private frames: number = 0;
  private fps: number = 0;
  
  tick(): number {
    this.frames++;
    const currentTime = performance.now();
    
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
    }
    
    return this.fps;
  }
  
  getFPS(): number {
    return this.fps;
  }
}

/**
 * Spatial index for efficient marker lookup
 */
export class SpatialIndex {
  private grid: Map<string, any[]> = new Map();
  private cellSize: number;
  
  constructor(cellSize: number = 0.01) { // ~1km cells
    this.cellSize = cellSize;
  }
  
  private getKey(lat: number, lng: number): string {
    const x = Math.floor(lng / this.cellSize);
    const y = Math.floor(lat / this.cellSize);
    return `${x},${y}`;
  }
  
  add(item: { lat: number; lng: number; [key: string]: any }): void {
    const key = this.getKey(item.lat, item.lng);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(item);
  }
  
  getInBounds(bounds: { north: number; south: number; east: number; west: number }): any[] {
    const results: any[] = [];
    
    const minX = Math.floor(bounds.west / this.cellSize);
    const maxX = Math.floor(bounds.east / this.cellSize);
    const minY = Math.floor(bounds.south / this.cellSize);
    const maxY = Math.floor(bounds.north / this.cellSize);
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const items = this.grid.get(key);
        if (items) {
          results.push(...items);
        }
      }
    }
    
    return results;
  }
  
  clear(): void {
    this.grid.clear();
  }
}