const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();


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
app.use('/api', userRoutes);

// Export the app instead of listening here
module.exports = app;