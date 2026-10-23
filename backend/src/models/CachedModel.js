/**
 * CachedModel Base Class
 * 
 * This is a base class for all models that use Redis caching.
 * It provides common caching functionality and methods.
 */

const cache = require('../utils/cache');

class CachedModel {
  constructor() {
    // Base constructor for cached models
  }

  /**
   * Get cache key for this model instance
   * @returns {string} - Cache key
   */
  getCacheKey() {
    if (!this.id) {
      throw new Error('Cannot get cache key for model without ID');
    }
    
    // Get the class name
    const className = this.constructor.name.toLowerCase();
    return `${className}s:${this.id}`;
  }

  /**
   * Cache this model instance
   * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
   * @returns {Promise<boolean>} - True if successful
   */
  async cache(ttl = 3600) {
    const key = this.getCacheKey();
    await cache.set(key, JSON.stringify(this), ttl);
    return true;
  }

  /**
   * Invalidate cache for this model instance
   * @returns {Promise<boolean>} - True if successful
   */
  async invalidateCache() {
    const key = this.getCacheKey();
    await cache.del(key);
    return true;
  }

  /**
   * Static method to get cache key for a model by ID
   * @param {number} id - Model ID
   * @returns {string} - Cache key
   */
  static getCacheKeyById(id) {
    // Get the class name
    const className = this.name.toLowerCase();
    return `${className}s:${id}`;
  }

  /**
   * Static method to get from cache by ID
   * @param {number} id - Model ID
   * @returns {Promise<Object|null>} - Cached object or null if not found
   */
  static async getFromCache(id) {
    const key = this.getCacheKeyById(id);
    const cached = await cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    return JSON.parse(cached);
  }

  /**
   * Static method to invalidate cache by ID
   * @param {number} id - Model ID
   * @returns {Promise<boolean>} - True if successful
   */
  static async invalidateCacheById(id) {
    const key = this.getCacheKeyById(id);
    await cache.del(key);
    return true;
  }

  /**
   * Static method to cache a function result
   * @param {string} cacheKey - Cache key
   * @param {Function} fn - Function to execute and cache result
   * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
   * @returns {Promise<any>} - Function result
   */
  static async cacheResult(cacheKey, fn, ttl = 3600) {
    return cache.wrap(cacheKey, fn, ttl);
  }
}

module.exports = CachedModel;
