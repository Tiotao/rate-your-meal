var express = require('express');
var router = express.Router();
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Singapore");
var pg = require('pg');
var _ = require('underscore');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/rate-my-meal';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// update a vote
router.post('/api/v1/vote', function(req, res) {
	/*
		{
			rate:
			meal_date:
			meal_type:
		}
	*/

	mealData = req.body;

	console.log(mealData)

	if (isValidMealData(mealData)){
		getMeal(mealData, function(meal){
			if (meal.length > 0) {
				console.log("meal found")
				updateMealVote(meal[0], mealData.rate, function(){
					getRate(mealData, function(result){
						res.json(result)
					})
				});
			} else {
				console.log("no meal found")
				createNewMealVote(mealData, function(meal){
					getRate(mealData, function(result){
						res.json(result)
					})
				});
			}
		});
	} else {
		res.json('invalid data')
	}

		
	

	// if vote exist, update vote
	// if vote not exist, create new vote


})

// get current vote result
router.post('/api/v1/rate', function(req, res) {
	/* 
		{
			meal_date:
			meal_type
		}
	*/

	mealData = req.body;

	getRate(mealData, function(rate){
		console.log(rate)
		res.json(rate)
	})
})

// get current vote result
router.post('/api/v1/rates', function(req, res) {
	/* 
		{
			meal_date: 
		}
	*/

	mealData = req.body;

	getRates(mealData, function(rate){
		console.log(rate)
		res.json(rate)
	})
})

router.get('/api/v1/rates/seven/', function(req, res){
	var today = moment().format('YYYY-MM-DD');
	var end = moment().add(-7, 'days').format('YYYY-MM-DD');
	getRatesInRange(today, end, function(rate){
		console.log(rate)
		res.json(rate)
	})
})


function getRate(mealData, callback){
	var cb = callback;
	getMeal(mealData, function(meal){
		if(meal.length == 0) {
			cb('no data');
		} else {
			var count = meal[0].vote_count;
			var score = meal[0].total_score;
			console.log(score/count);
			var result = {
				meal_date: mealData.meal_date,
				vote_count: count,
				meal_type: mealData.meal_type,
				rate: score/count,
			}
			cb(result);
		}
		
	})
}

function getRates(mealData, callback){
	var cb = callback;
	getMeals(mealData, function(meals){
		if(meals.length == 0) {
			cb('no data');
		} else {
			result = [];
			for (var i = meals.length - 1; i >= 0; i--) {
				var meal = meals[i]
				var count = meal.vote_count;
				var score = meal.total_score;
				var rate = score/count;
				result.push({
					meal_date: meal.meal_date,
					vote_count: count,
					meal_type: meal.meal_type,
					rate: rate,
				})
			};
			cb(result);
		}
		
	})
}

function getRatesInRange(start, end, callback){
	var cb = callback;
	getMealsInRange(start, end, function(meals){
		if(meals.length == 0) {
			cb('no data');
		} else {
			result = [];
			for (var i = meals.length - 1; i >= 0; i--) {
				var meal = meals[i]
				var count = meal.vote_count;
				var score = meal.total_score;
				var rate = score/count;
				result.push({
					meal_date: meal.meal_date,
					vote_count: count,
					meal_type: meal.meal_type,
					rate: rate,
				})
			};
			cb(result);
		}
		
	})
}



function isValidMealData(mealData){
	var date = mealData.meal_date;
	var rate = mealData.rate;
	console.log(moment(date).diff(moment(), 'days'))
	if (rate > 5 || rate < 0) {
		return false;
	} else if (moment(date).diff(moment()) > 0){
		return false;
	} else {
		return true;
	}
}

function updateMealVote(meal, rate, callback) {
	var callback = callback;
	pg.connect(connectionString, function(err, client, done){
		if (err || _.isUndefined(meal) || _.isUndefined(rate)) {
			done();
			console.log(err);
			callback();
		}

		var count = meal.vote_count + 1;
		var score = meal.total_score + rate;
		var modified = moment().format();
		var id = meal.id;

		var query = client.query("UPDATE votes SET vote_count = '" + count + "', total_score = '" + score + "', last_modified = '" + modified + "' WHERE id = '" + id + "'");

		query.on('end', function(){
			done();
			callback();
		})
	})
}

function createNewMealVote(mealData, callback) {
	console.log(callback)
	pg.connect(connectionString, function(err, client, done){
		if (err || _.isUndefined(mealData)) {
			done();
			console.log(err);
			callback();
		}
		console.log(callback)
		var date = mealData.meal_date;
		var modified = moment().format();
		var score = mealData.rate;
		var type = mealData.meal_type;
		console.log([date, type, score, 1, modified, 0])
		var results = [];

		var query = client.query("INSERT INTO votes(meal_date, meal_type, total_score, vote_count, last_modified, archive) values($1, $2, $3, $4, $5, $6) RETURNING *",
			[date, type, score, 1, modified, 0]
			);

		query.on('row', function(row) {
			results.push(row)
		})
		query.on('end', function(){
			done();
			callback(results);
		})

	}) 
}

function getMeal(mealData, callback) {

	var date = mealData.meal_date;
	var type = mealData.meal_type;
	var callback = callback;

	pg.connect(connectionString, function(err, client, done){
		if (err) {
			done();
			console.log(err);
			callback();
		}

		var query = client.query("SELECT * FROM votes WHERE meal_date = '" + date + "' AND meal_type = '" + type + "'" );
		var results = [];
		query.on('row', function(row) {
			results.push(row)
		})
		query.on('end', function(){
			done();
			console.log(results)
			callback(results);
		})

	})
}

function getMeals(mealData, callback) {

	var date = mealData.meal_date;
	var callback = callback;

	pg.connect(connectionString, function(err, client, done){
		if (err) {
			done();
			console.log(err);
			callback();
		}

		var query = client.query("SELECT * FROM votes WHERE meal_date = '" + date + "'");
		var results = [];
		query.on('row', function(row) {
			results.push(row)
		})
		query.on('end', function(){
			done();
			console.log(results)
			callback(results);
		})

	})
}

function getMealsInRange(start, end, callback) {

	var callback = callback;

	pg.connect(connectionString, function(err, client, done){
		if (err) {
			done();
			console.log(err);
			callback();
		}

		var query = client.query("SELECT * FROM votes WHERE meal_date <= '" + start + "' AND meal_date >= '" + end + "'" );
		var results = [];
		query.on('row', function(row) {
			results.push(row)
		})
		query.on('end', function(){
			done();
			console.log(results)
			callback(results);
		})

	})
}


module.exports = router;
