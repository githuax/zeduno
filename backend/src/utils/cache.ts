interface CacheItem {
  data: any;
  expiry: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem> = new Map();

  /**
   * Set a cache item with TTL in seconds
   */
  set(key: string, data: any, ttlSeconds: number = 60): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Get a cache item if not expired
   */
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Clear specific cache keys by pattern
   */
  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired items periodically
   */
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; keys: string[] } {
    this.cleanup(); // Clean before reporting
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const inventoryCache = new SimpleCache();

// Run cleanup every minute
setInterval(() => {
  inventoryCache.cleanup();
}, 60000);

export default SimpleCache;