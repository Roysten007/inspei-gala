const { getPool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await getPool().query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await getPool().query(
    'SELECT id, name, email, phone, failed_login_attempts, locked_until FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function createUser({ name, email, phone, passwordHash }) {
  const [result] = await getPool().query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    [name, email, phone, passwordHash]
  );
  return findById(result.insertId);
}

async function recordFailedLogin(userId, { locked, failedAttempts }) {
  await getPool().query(
    'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
    [failedAttempts, locked, userId]
  );
}

async function resetLoginAttempts(userId) {
  await getPool().query(
    'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
    [userId]
  );
}

function isLocked(user) {
  return user.locked_until && new Date(user.locked_until) > new Date();
}

module.exports = { findByEmail, findById, createUser, recordFailedLogin, resetLoginAttempts, isLocked };
