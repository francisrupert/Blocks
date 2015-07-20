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

  getUrlQueryString() {
    return window.location.search;
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
      if (el.classList && classes[i].length > 0) {
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

  get_svg_icon(icon_name) {
    var self = this,
        svg_icon = document.createElement('span');
    self.addClass(svg_icon, 'esb-' + icon_name + '-icon');

    switch(icon_name) {
      case 'dimensions':
        svg_icon.innerHTML = '<svg viewBox="0 0 14 13.993" xmlns="http://www.w3.org/2000/svg"><path d="M13.996,3.487c0-0.034-0.002-0.067-0.006-0.096c-0.006-0.021-0.01-0.039-0.017-0.054 c-0.007-0.02-0.009-0.041-0.019-0.056c-0.006-0.021-0.018-0.04-0.029-0.056c-0.007-0.015-0.014-0.032-0.025-0.047 c-0.016-0.028-0.041-0.055-0.062-0.077c-0.004-0.005-0.006-0.01-0.008-0.011l0,0l0,0l-2.91-2.922 c-0.226-0.226-0.594-0.226-0.824-0.003c-0.228,0.229-0.228,0.6-0.002,0.826l1.919,1.926L3.499,2.914l0,0 c-0.153,0-0.302,0.062-0.412,0.172C2.978,3.194,2.917,3.342,2.917,3.5l0.006,8.491l-1.928-1.928c-0.226-0.232-0.595-0.232-0.824,0 c-0.228,0.224-0.229,0.592-0.001,0.82l2.931,2.939c0.109,0.109,0.259,0.17,0.416,0.17c0.162,0,0.301-0.061,0.411-0.17l2.899-2.926 c0.228-0.232,0.225-0.602-0.001-0.828c-0.231-0.225-0.601-0.225-0.828,0.008l-1.911,1.928L4.084,4.08l7.924,0.008l-1.921,1.914 c-0.231,0.224-0.232,0.594-0.004,0.821c0.113,0.115,0.263,0.174,0.413,0.174c0.149,0,0.297-0.058,0.41-0.174l2.924-2.908l0,0 c0.027-0.027,0.051-0.058,0.07-0.086c0.012-0.014,0.018-0.031,0.025-0.047c0.012-0.021,0.021-0.035,0.028-0.056 c0.011-0.02,0.013-0.036,0.02-0.06c0.007-0.015,0.011-0.03,0.017-0.05C13.994,3.582,14,3.542,14,3.501l0,0 C14,3.499,13.996,3.489,13.996,3.487z"/></svg>';
        break;
      case 'scale':
        svg_icon.innerHTML = '<svg viewBox="0 0 14 13.973" xmlns="http://www.w3.org/2000/svg"><g><path d="M8.361,7.749c-0.043,0-0.077,0.005-0.113,0.012c-0.02,0.002-0.039,0.014-0.051,0.014 C8.177,7.783,8.154,7.788,8.14,7.794C8.116,7.802,8.1,7.815,8.084,7.825C8.068,7.831,8.051,7.841,8.036,7.848 c-0.061,0.044-0.115,0.099-0.16,0.16C7.869,8.022,7.858,8.039,7.854,8.056c-0.012,0.02-0.027,0.033-0.03,0.055 C7.814,8.13,7.812,8.148,7.802,8.171C7.799,8.185,7.792,8.2,7.787,8.219C7.783,8.256,7.775,8.294,7.776,8.335v3.296 c0,0.327,0.262,0.587,0.585,0.587c0.322,0,0.585-0.26,0.585-0.587V9.743l4.059,4.058c0.226,0.229,0.595,0.229,0.822,0 c0.23-0.229,0.23-0.599,0-0.824l-4.06-4.06h1.893c0.158,0.001,0.308-0.062,0.414-0.172c0.103-0.106,0.167-0.249,0.167-0.41 c0-0.326-0.26-0.586-0.581-0.586H8.361z"/><path d="M6.42,0H0.584C0.262,0,0,0.261,0,0.583v5.835c0,0.319,0.262,0.581,0.584,0.581H6.42 C6.738,6.999,7,6.737,7,6.418V0.583C7,0.261,6.738,0,6.42,0z M1.17,1.168h4.662v4.665H1.17V1.168z"/></g></svg>';
        break;
    }

    return svg_icon;
  }
}

export default new EsbUtil();
