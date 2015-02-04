import $ from 'jquery';

class BlocksConfig {
  constructor() {
    this.url = 'config.json';
    this.bus = {};

    this.setDefaults();
  }

  getConfig() {
    // We're not picky about how can have our data
    return this.config;
  }

  load(url) {
    var self = this,
      uri = url || self.url,
      fetch_config = {
        type: 'GET',
        dataType: 'json',
        cache: false,
        url: uri,
        timeout: 30000,
        success: function (data) {
          self.merge(data);
          $(document).trigger('blocks-config_loaded');
        },
        error: function (err) {
          // NOTE: Logging isn't setup until we fetch the config thus window.debug doesn't yet exist
          window.console.error('FAILED TO FETCH CONFIG: ' + uri + ' returned ' + JSON.stringify(err));
          $(document).trigger('blocks-config_loaded'); // We continue on with default options
        }
      };

    $.ajax(fetch_config);
  }

  merge(data) {
    var self = this;

    for (let key in data) {
      if (typeof data[key] === "object" && key !== 'template_data') {
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
}

export default new BlocksConfig();
