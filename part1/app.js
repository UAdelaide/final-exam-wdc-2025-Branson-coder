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
            ('alice123', 'alice@example.com)
        `)
    }
})