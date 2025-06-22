const db = require('../database/db');
const bcrypt = require('bcrypt');

/**
 * Model for user-related database operations
 */
class UserModel {
  /**
   * Create a new user with credentials and profile info
   */
  async createUser(userData) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate salt and hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);
      
      // Insert credentials
      const credResult = await client.query(
        `INSERT INTO users_credentials(username, email, password_hash, salt) 
         VALUES($1, $2, $3, $4) RETURNING id`,
        [userData.username, userData.email, passwordHash, salt]
      );
      
      const userId = credResult.rows[0].id;
      
      // Insert profile
      await client.query(
        `INSERT INTO users_profile(
          user_id, academic_id, first_name, last_name, role, 
          institution_id, department
        ) VALUES($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId, 
          userData.academic_id, 
          userData.first_name, 
          userData.last_name, 
          userData.role || 'student',
          userData.institution_id,
          userData.department
        ]
      );
      
      await client.query('COMMIT');
      
      return { success: true, userId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get user by username
   */
  async getUserByUsername(username) {
    const result = await db.query(
      `SELECT c.id, c.username, c.email, c.password_hash, c.salt,
              p.academic_id, p.first_name, p.last_name, p.role, 
              p.institution_id, p.department
       FROM users_credentials c
       JOIN users_profile p ON c.id = p.user_id
       WHERE c.username = $1`,
      [username]
    );
    
    return result.rows[0];
  }
  
  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const result = await db.query(
      `SELECT c.id, c.username, c.email, c.password_hash, c.salt,
              p.academic_id, p.first_name, p.last_name, p.role, 
              p.institution_id, p.department
       FROM users_credentials c
       JOIN users_profile p ON c.id = p.user_id
       WHERE c.email = $1`,
      [email]
    );
    
    return result.rows[0];
  }
  
  /**
   * Get user profile by id (without sensitive info)
   */
  async getUserProfileById(userId) {
    const result = await db.query(
      `SELECT c.id, c.username, c.email,
              p.academic_id, p.first_name, p.last_name, p.role, 
              p.institution_id, p.department
       FROM users_credentials c
       JOIN users_profile p ON c.id = p.user_id
       WHERE c.id = $1`,
      [userId]
    );
    
    return result.rows[0];
  }
  
  /**
   * Authenticate user by username/email and password
   */
  async authenticateUser(usernameOrEmail, password) {
    // Determine if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    const query = isEmail ? 
      'SELECT * FROM users_credentials WHERE email = $1' : 
      'SELECT * FROM users_credentials WHERE username = $1';
    
    const result = await db.query(query, [usernameOrEmail]);
    
    if (result.rowCount === 0) {
      return null;
    }
    
    const user = result.rows[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return null;
    }
    
    // Get user profile
    const profile = await this.getUserProfileById(user.id);
    
    return profile;
  }
}

module.exports = new UserModel();