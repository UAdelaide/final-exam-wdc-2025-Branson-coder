const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

router.post('/login', async(req, res) => {
  const { username, password } = req.body;

  try{
    const [users] = await db.execute(
      `SELECT * FROM Users WHERE username = ? AND password_hash = ?`,
      [username, password]
    );
    console.log('Query result:', users);
    if(users.length === 1){
      const user = users[0];
      req.session.user = {
        id: user.user_id,
        username: user.username,
        role: user.role
      };


      res.json({ role: user.role });

    }else{
      res.status(401).json({ error: 'wrong login info' });

    }
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'DB error' } );
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if(err){
      console.error(err);
      return res.status(500).json({ error: 'failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: "successfully logged out" });
  });
});

router.get('/dogs', async(req, res) =>{
   console.log('Session object:', req.session);
  console.log('Session user:', req.session?.user);

  // make sure its a user
  if(!req.session.user || req.session.user.role !== 'owner'){
    return res.status(403).json({ error: 'not owner' });
  }

  try{
    const[dogs] = await db.execute(
      'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
      [req.session.user.id]
    );
    res.json(dogs);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
