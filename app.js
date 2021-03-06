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
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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

var searchTerm = '#ausvotes AND filter:safe AND -filter:retweets';

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


var regex = /^#\w+\s(Poll Federal Primary Votes: )((\S+ \d+(.\d+)? \(\S+)\s?)+/g;
var regex2 = /(\S+ \d+(.\d+)?)/g;
var regex3 = /\w+/g;
var regex4 = /\S+/g;

var jsonCreated = [];

var job2 = new CronJob('0 */1 * * * *', function() {
 
   console.log('checking polls');

   client.get('statuses/user_timeline', {screen_name: "ghostwhovotes", exclude_replies: true, count: 40}, function(error, tweets, response) {
      for (var i=0; i<tweets.length; i++) {
         if ((String(tweets[i].text)).match(regex)) {
            // Name of Poll
            var pollname = (String(tweets[i].text).match(regex3))[0];
            // Each Party
            var parties = String(tweets[i].text).match(regex2);
            var partyResults = {};
            var otherResult = 100.0;
            for(var j=0; j<parties.length; j++) {
               partyResults[parties[j].match(regex4)[0]] = parties[j].match(regex4)[1];
            }
            for (var key in partyResults) {
               otherResult -= partyResults[key];
            }
            partyResults['Other'] = otherResult;
            var result = {poll:pollname, info:partyResults};
            jsonCreated.push(result);
         }
      }
      fs.writeFile('polls.json', JSON.stringify(jsonCreated), (err) => {
         if (err) throw err;
         console.log('Polls retrieved\t\t' + (new Date()).toTimeString());
      });
      jsonCreated = [];
   });

}, null, false, 'Australia/Melbourne');

job2.start();
