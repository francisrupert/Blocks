import BlocksConfig from './blocks-config'
import BlocksPage from './blocks-page'

// It would probably be better to listen for a Signal here?
$(document).on('blocks-config_loaded', function () {
  window.console.debug('Config loaded');
  BlocksPage.display();
});

BlocksConfig.load();

export default {}
