const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'b8uvwvvmeseb7usm7wec-mysql.services.clever-cloud.com',
  port: 3306,
  user: 'uhvqs5dod3eurx2s',
  password: '0oah27btnHKtYioqh8Q9',
  database: 'b8uvwvvmeseb7usm7wec',
  multipleStatements: true
};

async function init() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected to Clever Cloud MySQL database.');

    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    console.log('Schema imported successfully!');
    
    await connection.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Error importing schema:', err);
  }
}

init();
