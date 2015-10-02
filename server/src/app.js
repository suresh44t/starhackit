import Promise from 'bluebird';
import Log from 'logfilename';
import config from 'config';
import Plugins from './plugins';
import data from './models';
import Server from './server';
import * as HttpUtils from './utils/HttpUtils';

var app = {};
app.rootDir = __dirname;

var log = new Log(__filename, config.log);

log.info("NODE_ENV: %s, rootDir: %s", process.env.NODE_ENV, app.rootDir);

app.utils = {
  http: HttpUtils
};

app.data = data;
app.server = new Server(app);
app.plugins = new Plugins(app);

var parts = [
  app.data,
  app.server,
  app.plugins
];

app.start = function() {
  log.info("start");
  return Promise.each(parts, function(plugin) {
    return plugin.start(app);
  })
  .then(function(){
    log.info("started");
  });
};

app.stop = function() {
  log.info("stop");
  return Promise.each(parts, function(plugin) {
    return plugin.stop(app);
  })
  .then(function(){
    log.info("stopped");
  });
};

module.exports = app;
