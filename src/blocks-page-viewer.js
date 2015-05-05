import BlocksConfig from './blocks-config';

BlocksConfig.load();

class BlocksPageViewer {
	constructor() {
		this.config = BlocksConfig.getConfig();
	}

	do_stuff() {
		return 3 + 2;
	}

	new_method() {

	}
}

export default new BlocksPageViewer();