import $ from 'jquery'
import BlocksConfig from './blocks-config'

class BlocksPage {
  constructor() {
    this.config = BlocksConfig.getConfig();
  }

  parse () {
    window.console.log('I am the BlocksPage library!');

    if (this.config.get('logging')) {
      window.console.log('and I have a config!');
    }
  }
}

export default new BlocksPage()