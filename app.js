require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');

var path = require('path');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
var patientRouter = require('./routes/patient');
var recordsRouter = require('./routes/records');

var app = express();

// view engine setup
app.engine('hbs',hbs.engine({extname: 'hbs', defaultLayout: 'layout', layoutsDir:__dirname + '/views/layouts/'}));
app.set('view engine', 'hbs');
// app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/patient', patientRouter);
app.use('/records', recordsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
