// test-conn.js
const mysql = require('mysql2/promise');

(async () => {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'test',// <-- make sure this matches your real password!
      database: 'DogWalkService'
    });
    console.log('Connection success!');
    await db.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
})();
