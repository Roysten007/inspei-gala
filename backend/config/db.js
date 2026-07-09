const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: false,
    });
  }
  return pool;
}

async function connectDB() {
  try {
    const conn = await getPool().getConnection();
    await conn.ping();
    conn.release();
    console.log('[DB] Connecté à MySQL');
  } catch (err) {
    console.error('[DB] Échec de connexion à MySQL :', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB, getPool };
