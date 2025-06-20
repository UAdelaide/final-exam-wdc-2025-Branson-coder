var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
    try{
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'test',
            database: 'DogWalkService'
        });

        await db.execute(`
      INSERT IGNORE INTO Users (username, email, password_hash, role) VALUES
        ('alice123',    'alice@example.com',     'hashed123', 'owner'),
        ('bobwalker',   'bob@example.com',       'hashed456', 'walker'),
        ('carol123',    'carol@example.com',     'hashed789', 'owner'),
        ('davidowner',  'david@walkservice.com', 'hashed321', 'owner'),
        ('emilywalker', 'emily@walkservice.com', 'hashed654', 'walker');
    `);

    await db.execute(`
      INSERT IGNORE INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username='alice123'), 'Max',    'medium'),
        ((SELECT user_id FROM Users WHERE username='carol123'), 'Bella',  'small'),
        ((SELECT user_id FROM Users WHERE username='davidowner'), 'Charlie','large'),
        ((SELECT user_id FROM Users WHERE username='alice123'), 'Rocky',  'small'),
        ((SELECT user_id FROM Users WHERE username='carol123'), 'Luna',   'medium');
    `);

    await db.execute(`
      INSERT IGNORE INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name='Max'),    '2025-06-10 08:00:00', 30, 'Parklands',       'open'),
        ((SELECT dog_id FROM Dogs WHERE name='Bella'),  '2025-06-10 09:30:00', 45, 'Beachside Ave',   'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name='Charlie'),'2025-06-11 07:00:00', 60, 'Riverbank',       'open'),
        ((SELECT dog_id FROM Dogs WHERE name='Luna'),   '2025-06-12 18:30:00', 30, 'Botanic Gardens', 'cancelled'),
        ((SELECT dog_id FROM Dogs WHERE name='Rocky'),  '2025-06-13 14:15:00', 45, 'Downtown Square', 'completed');
    `);
       await db.execute(`
      INSERT IGNORE INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
        (1, (SELECT user_id FROM Users WHERE username='bobwalker'), (SELECT user_id FROM Users WHERE username='alice123'), 5, 'Great walker!'),
        (2, (SELECT user_id FROM Users WHERE username='emilywalker'), (SELECT user_id FROM Users WHERE username='carol123'), 4, 'Good job.');
    `);

    await db.execute(`
      INSERT IGNORE INTO WalkApplications (request_id, walker_id, status) VALUES
        (1, (SELECT user_id FROM Users WHERE username='bobwalker'), 'accepted'),
        (2, (SELECT user_id FROM Users WHERE username='emilywalker'), 'accepted');
    `);

    }catch(err){
        console.error('ERror with setting up test db', err);
    }
})();

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

app.get('/api/walkrequests/open', async function(req, res) {
  try {
    var [rows] = await db.execute(`
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
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

app.get('/api/walkers/summary', async function(req, res) {
  try {
    var [walkers] = await db.execute(`
      SELECT user_id, username FROM Users WHERE role = 'walker'
    `);

    var results = await Promise.all(walkers.map(async function(walker) {
      var [[totalRatings]] = await db.execute(`
        SELECT COUNT(*) AS count FROM WalkRatings WHERE walker_id = ?
      `, [walker.user_id]);

      var [[avgRating]] = await db.execute(`
        SELECT AVG(rating) AS avg FROM WalkRatings WHERE walker_id = ?
      `, [walker.user_id]);

      var [[completedWalks]] = await db.execute(`
        SELECT COUNT(*) AS count FROM WalkApplications wa
        JOIN WalkRequests wr ON wa.request_id = wr.request_id
        WHERE wa.walker_id = ? AND wa.status = 'accepted' AND wr.status = 'completed'
      `, [walker.user_id]);

      return {
        walker_username: walker.username,
        total_ratings: totalRatings.count,
        average_rating: avgRating.avg !== null ? parseFloat(avgRating.avg.toFixed(2)) : null,
        completed_walks: completedWalks.count
      };
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

