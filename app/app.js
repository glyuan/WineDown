var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');

//Enter db credentials here as ('mysql://username:password@host/database'):
var connection = mysql.createConnection('mysql://username:password@localhost/winedown');

//Declare app
var app = express();

//Initialize EJS templating engine
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

//bodyParser to interpret POST data
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//cookieParser to interpret cookie data
app.use(cookieParser());

//Declare database connection
connection.connect(function(err) {
	if (err) throw err
});

//User sign-up
app.post('/signup', function (req, res) {
	var uname = req.body.uname;
	var pwd = req.body.pwd;
	var email = req.body.email;
	bcrypt.hash(pwd, null, null, function(err, hash) {
		connection.query('INSERT INTO usr(uname, pwd, email) VALUES ("'+uname+'", "'+hash+'", "'+email+'")', function(err, rows, fields) {
			if (err) {
				res.send('Username already taken, sorry!')
			} else {
				res.send(true);
			}
		});
	});
});

//User login; returns cookie with user id
app.post('/login', function (req, res) {	
	var uname = req.body.uname;
	var pwd = req.body.pwd;
	connection.query('SELECT uid, pwd FROM usr WHERE uname = "' + uname + '"', function(err, rows, fields) {
		if (Object.keys(rows).length == 0) {
			res.send('Please enter a valid username.');
		} else {
			bcrypt.compare(pwd, rows[0].pwd, function(err, match) {
				if (match == true) {
					uid = rows[0].uid;
					res.cookie('winedown', {user:uid}).send(true);
				} else {
					res.send('Incorrect Password');
				}
			});
		}
	});
});

app.get('/logout', function (req, res) {
	res.clearCookie('winedown').send();
});

app.get('/logcheck', function (req, res) {
	var cookies = JSON.stringify(req.cookies);
	if (cookies.includes('winedown')){
		res.send('<button style="width:auto;" onclick="logout()">Log Out</button>');
	} else {
		var btn = "document.getElementById('id01').style.display='block'";
		res.send('<button onclick="'+btn+'" style="width:auto;">Login</button>');
	}
});

//Get winery data for map pin
app.get('/winerypins', function (req, res) {
	// Query MySQL database, kind of complex to get the varietal data for each winery but it works great
	connection.query('SELECT * FROM winerypins', function(err, rows, fields) {
		res.send(rows);
	});
});

//Route and serve winery data to winery profile template page
app.get('/winery', function (req, res) {
	connection.query('SELECT * FROM winery WHERE wineryid=' + req.query.wineryid, function(err, rows, fields) {
		res.render(__dirname +'/public/winery.html', rows[0]);
	});
});

//Static file server for files in the /public folder
app.use(express.static(__dirname + '/public'));

//Serve to localhost:3000
//app.listen(3000);

//Serve to local network on port 8000:
//app.listen(8000, 'your.local.ip.here');
app.listen(8000, '192.168.0.3');
