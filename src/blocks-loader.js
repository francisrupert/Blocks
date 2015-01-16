import log from 'browser-log'
import BlocksConfig from './blocks-config'
import BlocksPage from './blocks-page'

let state = "compiled and loaded";
window.console.debug(`I am a ${state} loader.js`);

$(document).on('blocks-config_loaded', function () {
  window.console.debug('Config loaded');
  BlocksPage.parse();
});

BlocksConfig.load();

export default {}