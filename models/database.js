var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rate-my-meal';

var client = new pg.Client(connectionString);
client.connect();
var query = client.query('CREATE TABLE votes(id SERIAL PRIMARY KEY, meal_date DATE not null, meal_type INT not null default 0, total_score INT not null default 0,vote_count INT not null default 0, last_modified TIMESTAMPTZ not null, archive BOOL not null default False, remarks JSON)');
query.on('end', function() { client.end(); });