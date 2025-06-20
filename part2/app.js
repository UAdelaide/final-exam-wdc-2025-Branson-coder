const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const db = require('./models/db');

app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Middleware
app.use(session({
  secret: 'shumsecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax' }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.get('/api/dogs', async function(req, res) {
  try {
    var [rows] = await db.execute(`
      SELECT d.name AS dog_name,
             d.size,
             u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// Export the app instead of listening here
module.exports = app;