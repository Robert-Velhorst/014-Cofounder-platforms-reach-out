/**
 * User Model
 * 
 * This model represents a user in the Co-Founders Automated Reach Out Platform.
 * It includes authentication methods, profile management, and relationships
 * to messages and platform connections.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection_pool');
const CachedModel = require('./CachedModel');
const cache = require('../utils/cache');

class User extends CachedModel {
  constructor(data = {}) {
    super();
    this.id = data.id || null;
    this.email = data.email || '';
    this.password = data.password || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.hourlyRate = data.hourlyRate || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Create a new user
   * @param {Object} userData - User data including email, password, firstName, lastName, hourlyRate
   * @returns {Promise<User>} - Newly created user
   */
  static async create(userData) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const query = `
      INSERT INTO users (email, password, first_name, last_name, hourly_rate, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, email, first_name, last_name, hourly_rate, created_at, updated_at
    `;

    const values = [
      userData.email,
      hashedPassword,
      userData.firstName,
      userData.lastName,
      userData.hourlyRate || 0
    ];

    try {
      const result = await pool.query(query, values);
      const user = new User({
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        hourlyRate: result.rows[0].hourly_rate,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      });

      // Invalidate cache
      await cache.del(`users:${user.id}`);
      await cache.del('users:all');

      return user;
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>} - User if found, null otherwise
   */
  static async findById(id) {
    // Try to get from cache first
    const cachedUser = await cache.get(`users:${id}`);
    if (cachedUser) {
      return new User(JSON.parse(cachedUser));
    }

    const query = `
      SELECT id, email, first_name, last_name, hourly_rate, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = new User({
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      hourlyRate: result.rows[0].hourly_rate,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    });

    // Cache the user
    await cache.set(`users:${id}`, JSON.stringify(user), 3600); // Cache for 1 hour

    return user;
  }

  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} - User if found, null otherwise
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, email, password, first_name, last_name, hourly_rate, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new User({
      id: result.rows[0].id,
      email: result.rows[0].email,
      password: result.rows[0].password,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      hourlyRate: result.rows[0].hourly_rate,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    });
  }

  /**
   * Update user information
   * @param {Object} userData - User data to update
   * @returns {Promise<User>} - Updated user
   */
  async update(userData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (userData.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(userData.firstName);
      this.firstName = userData.firstName;
    }

    if (userData.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(userData.lastName);
      this.lastName = userData.lastName;
    }

    if (userData.hourlyRate !== undefined) {
      fields.push(`hourly_rate = $${paramIndex++}`);
      values.push(userData.hourlyRate);
      this.hourlyRate = userData.hourlyRate;
    }

    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      fields.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    fields.push(`updated_at = NOW()`);
    
    if (fields.length === 1) {
      // Only updated_at was changed, nothing to update
      return this;
    }

    values.push(this.id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, hourly_rate, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    
    const updatedUser = new User({
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      hourlyRate: result.rows[0].hourly_rate,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    });

    // Invalidate cache
    await cache.del(`users:${this.id}`);

    return updatedUser;
  }

  /**
   * Authenticate a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: User, token: string}>} - User and JWT token
   */
  static async authenticate(email, password) {
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove password from user object
    user.password = undefined;

    return { user, token };
  }

  /**
   * Get user's messages
   * @param {Object} options - Query options (limit, offset, status)
   * @returns {Promise<Array>} - Array of messages
   */
  async getMessages(options = {}) {
    const { Message } = require('./Message');
    return Message.findByUserId(this.id, options);
  }

  /**
   * Get user's platform connections
   * @returns {Promise<Array>} - Array of platform connections
   */
  async getPlatformConnections() {
    const query = `
      SELECT pc.id, pc.user_id, pc.platform_id, pc.created_at, pc.updated_at,
             p.name as platform_name, p.api_endpoint
      FROM platform_connections pc
      JOIN platforms p ON pc.platform_id = p.id
      WHERE pc.user_id = $1
    `;

    const result = await pool.query(query, [this.id]);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      platformId: row.platform_id,
      platformName: row.platform_name,
      apiEndpoint: row.api_endpoint,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Calculate time and money saved
   * @returns {Promise<Object>} - Time and money saved
   */
  async calculateTimeSaved() {
    // Each message is estimated to save 10 minutes of manual work
    const query = `
      SELECT COUNT(*) as message_count
      FROM messages
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [this.id]);
    const messageCount = parseInt(result.rows[0].message_count);
    
    // Calculate time saved in hours
    const minutesSaved = messageCount * 10;
    const hoursSaved = minutesSaved / 60;
    
    // Calculate money saved based on hourly rate
    const moneySaved = hoursSaved * this.hourlyRate;

    return {
      hours: hoursSaved,
      moneySaved
    };
  }

  /**
   * Delete a user
   * @returns {Promise<boolean>} - True if successful
   */
  async delete() {
    const query = `
      DELETE FROM users
      WHERE id = $1
    `;

    await pool.query(query, [this.id]);
    
    // Invalidate cache
    await cache.del(`users:${this.id}`);
    await cache.del('users:all');

    return true;
  }
}

module.exports = User;
