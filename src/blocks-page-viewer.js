import BlocksConfig from './blocks-config';

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

export default BlocksPageViewer;