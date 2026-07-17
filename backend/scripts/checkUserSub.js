const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/Users/Roysten/Documents/innovationticket/inspei-gala/backend/.env' });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const email = 'roystenkossou@gmail.com';

  try {
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      console.log(`User ${email} not found.`);
      process.exit(0);
    }
    const user = users[0];
    console.log('User found:', user);

    const [subs] = await connection.query('SELECT * FROM submissions WHERE user_id = ?', [user.id]);
    if (subs.length === 0) {
      console.log('No submission found for this user.');
    } else {
      console.log('Submission found:', subs[0]);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

check();
