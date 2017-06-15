var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`
var mysql = require('mysql');
var http = require('http');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');

//config
var config = new Object();
config.db_user = process.env.DB_USER || 'fishy';
config.db_pass = process.env.DB_PASS || 'fishy';
config.db_host = process.env.DB_HOST || 'localhost';
config.db_db = process.env.DB_DB || 'fishy';

var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({
    defaultLayout: 'single',
    extname: '.hbs'
}));

app.set('view engine', '.hbs');
app.use(express.static('public'));
var compress = require('compression');

app.use(compress());

//Auth
app.set('trust proxy', 1);

app.use(expressSession({
    secret: 'rah9is0pai8bah8iw0Ha',
    name: 'fishy.sess',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/editprofile/:profile', function(req, res) {
    var profile = req.params.profile;
    res.render('light-channels',{profile: profile});
});

app.get('/channelprog/:profile', function(req, res) {
    var profile = req.params.profile;
      var connection = mysql.createConnection({
        host: config.db_host,
        user: config.db_user,
        password: config.db_pass,
        database: config.db_db,
    });

    connection.connect();
    connection.query('select * from channelprog order by channel,time', function(err, rows, fields) {
        if (err) {
            console.log(err);
            return
        }
        //console.log(rows);
        res.send(rows);
    });
    console.log("Mysql channelprog data sent");

    connection.end();
});

app.get('/channels/', function(req, res) {
    var profile = req.params.profile;
      var connection = mysql.createConnection({
        host: config.db_host,
        user: config.db_user,
        password: config.db_pass,
        database: config.db_db,
    });

    connection.connect();
    connection.query('select * from channels', function(err, rows, fields) {
        if (err) {
            console.log(err);
            return
        }
        res.send(rows);
    });
    console.log("Mysql channel data sent");
    connection.end();
});

app.get('/status', function(req, res) {
    var status = {};
});

app.listen(3000, function() {
    console.log('Fishy swimming on port 3000!');
});
