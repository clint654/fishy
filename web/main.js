var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`
var mysql = require('mysql');
var http = require('http');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');

//config
var config = new Object();
config.db_user = process.env.DB_USER || 'username';
config.db_pass = process.env.DB_PASS || 'password';
config.db_host = process.env.DB_HOST || 'db';
config.db_db = process.env.DB_DB || 'db';

var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs({
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
    name: 'zoiper-api.sess',
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

app.get('/', function(req, res) {
    res.render('light-channels',{});
});

app.get('/status', function(req, res) {
    var status = {};

});

app.listen(3000, function() {
    console.log('Fishy swimming on port 3000!');
});
