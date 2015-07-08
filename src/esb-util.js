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

  booleanXorValue(value) {
    var val,
        boolean_strings = ['true', 'True', 'TRUE', 'false', 'False', 'FALSE'];

    if (boolean_strings.indexOf(value) !== -1) {
      if (value.match(/true/i) === null) {
        val = false;
      }
      else {
        val = true;
      }
    }
    else {
      val = value;
    }


    return val;
  }

  outerHeight(el) {
    var height = el.offsetHeight;
    var style = getComputedStyle(el);

    height += parseInt(style.marginTop) + parseInt(style.marginBottom);
    return height;
  }

  outerWidth(el) {
    var width = el.offsetWidth;
    var style = getComputedStyle(el);

    width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    return width;
  }



  convertQueryStringToJson(query_string) {
    var pairs,
        json = {};

    if (query_string.length > 0) {
      pairs = query_string.slice(1).split('&');

      pairs.forEach(function(pair) {
        pair = pair.split('=');
        json[pair[0]] = decodeURIComponent(pair[1] || '');
      });
    }


    return JSON.parse(JSON.stringify(json));
  }

  isVoidElement(el) {
    var tags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
                 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'],
        name;

    name = el.nodeName.toLowerCase();

    if (tags.indexOf(name) !== -1) {
      return true;
    }

    return false;
  }

  addClass(el, class_name) {
    var classes = [],
        i = 0;

    classes = class_name.split(' ');

    for (i=0; i < classes.length; i++) {
      if (el.classList) {
        el.classList.add(classes[i]);
      } 
      else {
        el.className += ' ' + classes[i];
      }
    }
  }

  removeClass(el, class_name) {
    var classes = [],
        i = 0;

    classes = class_name.split(' ');

    for (i=0; i < classes.length; i++) {
      if (el.classList){
        el.classList.remove(classes[i]);
      }
      else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + classes[i].split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    }
  }

  throttle(delay, callback) {
    var previousCall = new Date().getTime();
    return function() {
        var time = new Date().getTime();

        //
        // if "delay" milliseconds have expired since
        // the previous call then propagate this call to
        // "callback"
        //
        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
  }

  formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
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
