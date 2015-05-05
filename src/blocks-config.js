import $ from 'jquery';

class BlocksConfig {
  constructor() {
    this.url = 'config.json';
    this.setDefaults();
  }

  getConfig() {
    // We're not picky about who can have our data
    return this.config;
  }

  load(url) {
    var self = this,
        uri, 
        req, 
        data;
    return new Promise(function(resolve, reject) {
      uri = url || self.url;
      req = new XMLHttpRequest();

      uri = uri + '?timestamp=' + new Date().getTime(); //prevent ajax caching of the config

      req.open('GET', uri);

      req.onload = function() {
        if (req.status === 200) {
          data = JSON.parse(req.response);
          self.merge(data);
          self.setLoggingLevel();
          self.makeAvailable(data);
          $(document).trigger('blocks-config_loaded');
          resolve(data);
        }
        else {
          window.console.error('FAILED TO FETCH CONFIG: ' + uri + ' returned ' + JSON.stringify(req.statusText));
          $(document).trigger('blocks-config_loaded'); // We continue on with default options
          reject(Error(req.statusText));
        }
      };

      req.onerror = function() {
        reject(Error('Network Error'));
      };

      req.send();
    });
  }

  makeAvailable(data) {
    $.data(document.body, 'config', data);
  }

  merge(data) {
    var self = this;

    for (let key in data) {
      if (typeof data[key] === 'object' && key !== 'template_data') {
        let key_map = new Map();
        for (let data_key in data[key]) {
          key_map.set(data_key, data[key][data_key]);
        }
        self.config.set(key, key_map);
      } else {
        self.config.set(key, data[key]);
      }
    }
  }

  setDefaults() {
    var self = this;

    let defaults = new Map();
    let components = new Map();

    components.set('source', 'components/');

    // Defaults
    defaults.set('backward_compatible', false);
    defaults.set('path', '');
    defaults.set('components', components);

    self.config = defaults;
  }

  setLoggingLevel() {
    var self = this,
      logging_level,
      config_logging = self.config.get('logging');

    if (config_logging !== undefined) {
      if (config_logging === true) {
        logging_level = 'warn';
      } else if (config_logging === false) {
        logging_level = 'none';
      } else {
        logging_level = config_logging;
      }
    } else {
      logging_level = 'warn';
    }

    self.config.set('logging_level', logging_level);
  }
}

export default new BlocksConfig();
