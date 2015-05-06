import EsbConfig from './esb-config';

class EsbUtil {
  constructor() {
  }

  logger(level, message) {
    var levels = ['debug', 'info', 'warn', 'error', 'none'],
      logging_level = EsbConfig.getConfig().get('logging_level'),
      level_text;

    if (logging_level === undefined) {
      logging_level = 'info';
    }

    if (levels.indexOf(level) >= levels.indexOf(logging_level)) {
      if (typeof message !== 'string') {
        message = JSON.stringify(message);
      }

      if (level === 'error') {
        level_text = 'ERROR';
      } else if (level === 'warn') {
        level_text = 'WARN';
      } else {
        level_text = level[0].toUpperCase() + level.slice(1);
      }

      window.console[level](level_text + ': '+ message);
    }
  }

  /**
   * @method: generateUUID
   *
   * Generates a reasonable enough UUID. We only need it to be unique for 1 load of a page.
   * Copied from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16|0,
        v = c === 'x' ? r : (r&0x3|0x8);

      return v.toString(16);
    });
  }

  timer() {
    var perf = window.performance || {},
      fn = perf.now || perf.mozNow || perf.webkitNow || perf.msNow || perf.oNow;

    return fn ? fn.bind(perf) : function() { return new Date().getTime(); };
  }
}

export default new EsbUtil();
