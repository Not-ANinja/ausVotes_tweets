var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

// run twitter cronjob

// load env variables
require('dotenv').config()

/* Twitter Stuff */
var Twitter = require('twitter');
var client = new Twitter({
   consumer_key: process.env.DB_ConsumerKey,
   consumer_secret: process.env.DB_ConsumerKeySecret,
   access_token_key: process.env.DB_AccessToken,
   access_token_secret: process.env.DB_AccessTokenKey
});

var searchTerm = '#ausvotes -filter:retweet';

/* let's do a regular job */
var CronJob = require('cron').CronJob;
var fs = require('fs');

var job = new CronJob('*/30 */1 * * * *', function() {

   console.log('Checking for tweets\t' + (new Date()).toTimeString());
   client.get('search/tweets', {q: searchTerm, result_type: 'recent'}, function(error, tweets, response) {
      fs.writeFile('tweets.json', JSON.stringify(tweets), (err) => {
         if (err) throw err;
         console.log('Got some tweets\t\t' + (new Date()).toTimeString());
      });
   });

}, null, false, 'Australia/Melbourne');

job.start();
