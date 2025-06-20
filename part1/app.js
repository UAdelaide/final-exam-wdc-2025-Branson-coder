(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'HoangPoochie',
      database: 'DogWalkService'
    });

    // Sample data insertion (ignores duplicates)
    await db.execute(`INSERT IGNORE INTO Users (username, email, password_hash, role) VALUES
      ('alice123',    'alice@example.com',     'hashed123', 'owner'),
      ('bobwalker',   'bob@example.com',       'hashed456', 'walker'),
      ('carol123',    'carol@example.com',     'hashed789', 'owner'),
      ('davidowner',  'david@walkservice.com', 'hashed321', 'owner'),
      ('emilywalker', 'emily@walkservice.com', 'hashed654', 'walker')
    `);

    await db.execute(`INSERT IGNORE INTO Dogs (owner_id, name, size) VALUES
      ((SELECT user_id FROM Users WHERE username='alice123'), 'Max',    'medium'),
      ((SELECT user_id FROM Users WHERE username='carol123'), 'Bella',  'small'),
      ((SELECT user_id FROM Users WHERE username='davidowner'), 'Charlie','large'),
      ((SELECT user_id FROM Users WHERE username='alice123'), 'Rocky',  'small'),
      ((SELECT user_id FROM Users WHERE username='carol123'), 'Luna',   'medium')
    `);

    await db.execute(`INSERT IGNORE INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
      ((SELECT dog_id FROM Dogs WHERE name='Max'),    '2025-06-10 08:00:00', 30, 'Parklands',       'open'),
      ((SELECT dog_id FROM Dogs WHERE name='Bella'),  '2025-06-10 09:30:00', 45, 'Beachside Ave',   'accepted'),
      ((SELECT dog_id FROM Dogs WHERE name='Charlie'),'2025-06-11 07:00:00', 60, 'Riverbank',       'open'),
      ((SELECT dog_id FROM Dogs WHERE name='Luna'),   '2025-06-12 18:30:00', 30, 'Botanic Gardens', 'cancelled'),
      ((SELECT dog_id FROM Dogs WHERE name='Rocky'),  '2025-06-13 14:15:00', 45, 'Downtown Square', 'completed')
    `);

    console.log('Sample data inserted');
  } catch (err) {
    console.error('Error setting up sample data:', err);
  }
})();

// Route: GET /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.name AS dog_name,
             d.size,
             u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route: GET /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT wr.request_id,
             d.name AS dog_name,
             wr.requested_time,
             wr.duration_minutes,
             wr.location,
             u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route: GET /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT u.username AS walker_username,
             COUNT(wr.rating_id)    AS total_ratings,
             AVG(wr.rating)         AS average_rating,
             COUNT(wr.rating_id)    AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings wr ON u.user_id = wr.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.username
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
