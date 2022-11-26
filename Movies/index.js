// Import libraries
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const mustacheExpress = require('mustache-express');

// Initialise objects and declare constants
const app = express();
const webPort = 8088;

const db = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "Movies"
});

db.connect((err) => {
	if(err) {
		throw err;
	}
	console.log("Connected to database");
});

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', './templates');
app.use(bodyParser.urlencoded({ extended: true }));

function addIndex(queryResults){
	// Number the results (there are many alternative ways to do this)
	queryResults.forEach((el, index) => el.i = index);
	return queryResults;
}
function templateRenderer(response){
	// Return a renderer function with the res object built in
	return function(error, results, fields){
		if(error){
			throw error;
		}
		response.render('actorForm', { data: addIndex(results)} );
	}
}
function insertCallback(response){
	// Return a function with res in it, then make the input form
	return function(error, results, fields){
		if(error){
			throw error;
		}
		makeForm(response);
	}
}
function makeForm(response){
	// Run a query to get unmatched actors
	var query = `SELECT DISTINCT Actor1
                 FROM Locations LEFT JOIN Actors ON Actor1=ENName 
                 WHERE ENName IS NULL
                 LIMIT 10;`;
	db.query(query, templateRenderer(response));
}
function updateDBthenRequery(updates, response){
	// If we've received any data, add it to the database, then
	// redisplay the table
	if(updates.length){
		var query = "INSERT INTO Actors VALUES "+updates.toString();
		db.query(query, (error, insertCallback(response)));
	} else makeForm(response);
}
function testDate(dateString){
	// Check if the data is valid *and* real
	return Date.parse(dateString);
}
app.get('/', function(req, res){
	makeForm(res);
});
app.post('/', function(req, res) {
	// We've received a POST from the sever (form data) 
	var data = req.body;
	var updates = [];
	for(var i=0; i<10; i++){
		if(data["dob"+i] && testDate(data["dob"+i])){
			updates.push(`(${mysql.escape(data["name"+i])}, '${data["dob"+i]}',	NULL, ${mysql.escape(data["gender"+i])})`);
		}
	}
	updateDBthenRequery(updates, res);
});
app.listen(
  webPort,
  () => console.log('EMO app listening on port '+webPort) // success callback
);
