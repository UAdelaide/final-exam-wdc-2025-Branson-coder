var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
const { hostname } = require('os');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
    try{
        db = await mysql.createConnection ({
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
