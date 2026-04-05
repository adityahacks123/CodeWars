// Simple API response cache with TTL (Time To Live)
const cache = new Map();

/**
 * Get cached data if available and not expired
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {any|null} Cached data or null if expired/not found
 */
export const getCached = (key, ttl = 300000) => {
    const item = cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > ttl) {
        cache.delete(key);
        return null;
    }

    return item.data;
};

/**
 * Set data in cache with current timestamp
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCache = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

/**
 * Invalidate specific cache key
 * @param {string} key - Cache key to invalidate
 */
export const invalidateCache = (key) => {
    cache.delete(key);
};

/**
 * Invalidate all cache keys matching a pattern
 * @param {RegExp} pattern - Pattern to match keys
 */
export const invalidateCachePattern = (pattern) => {
    for (const key of cache.keys()) {
        if (pattern.test(key)) {
            cache.delete(key);
        }
    }
};

/**
 * Clear all cache
 */
export const clearCache = () => {
    cache.clear();
};

// Export cache instance for debugging
export const getCacheStats = () => ({
    size: cache.size,
    keys: Array.from(cache.keys())
});
