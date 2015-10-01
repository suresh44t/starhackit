var config = require('config');
var Promise = require('bluebird');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var assert = require('assert');

module.exports = function(app) {
  'use strict';
  var log = require('logfilename')(__filename);

  var expressApp = express();
  var httpHandle;

  setupMiddleware();
  setupPlugins();

  function setupMiddleware() {
    setupLogMiddleware();
    setupCors();
    setupLiveReload();
    setupFrontend();
    setupBodyParser();
    setupSession();
  }
  function setupLogMiddleware() {
      expressApp.use(function(req, res, next) {
        log.debug("url: " + req.url);
        next();
      });
  }

  function setupCors() {
    var Cors = require('cors');
    var corsOptions = {};

    if (config.has("frontend.url")) {
      var whitelist = [config.get("frontend.url")];
      log.debug('cors white list: ', config.frontend.url);

      corsOptions = {
        credentials: true,
        origin: function (origin, callback) {
          log.debug("origin: ", origin);
          var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
          callback(null, originIsWhitelisted);
        }
      };
    }
    // Enable CORS
    expressApp.use(Cors(corsOptions));
    // Enable CORS Pre-Flight
    expressApp.options('*', Cors(corsOptions));
  }

  function prepend(w, s) {
    return s + w;
  }

  function setupLiveReload() {
    if (config.has('liveReload')) {
      expressApp.use(require('connect-livereload')({
      rules: [{
        match: /<\/body>(?![\s\S]*<\/body>)/i,
        fn: prepend
      }, {
        match: /<\/html>(?![\s\S]*<\/html>)/i,
        fn: prepend
      }],
      port: 35729}));
    }
  }

  function setupFrontend() {
    if (config.has('frontend.path')) {
      var frontendPath = config.get('frontend.path');
      log.info("frontend path: ", frontendPath);
      expressApp.use('/', express.static(frontendPath));
    } else {
      log.debug('frontend not served');
    }
  }

  function setupBodyParser() {
    expressApp.use(bodyParser.json());
    expressApp.use(bodyParser.urlencoded({extended: true}));
    expressApp.use(cookieParser());
  }

  function setupSession() {
    expressApp.use(require('express-session')({
      secret: 'I love shrimp with mayonnaise',
      resave: false,
      saveUninitialized: false
    }));
  }

  function setupPlugins() {

    //TODO clean
    var auth = app.auth;
    assert(auth);
    expressApp.use(auth.passport.initialize());
    expressApp.use(auth.passport.session());

    assert(app.plugins);
    assert(app.plugins.users);
    app.plugins.users.registerMiddleware(expressApp);

  }

  /**
   * Start the express server
   */
  expressApp.start = function() {
    let configHttp = config.get('http');
    let port = process.env.PORT || configHttp.port;

    log.info('start express server on port %s', port);

    return new Promise(function(resolve) {
      httpHandle = expressApp.listen(port, function() {
        log.info('express server started');
        resolve();
      });
    });
  };

  /**
   * Stop the express server
   */
  expressApp.stop = function() {
    log.info('stopping web server');

    return new Promise(function(resolve) {
      httpHandle.close(function() {
        log.info('web server is stopped');
        resolve();
      });
    });
  };
  return expressApp;
};