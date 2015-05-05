import BlocksConfig from './blocks-config';

BlocksConfig.load();

class BlocksPageViewer {
	constructor() {
		var config = BlocksConfig.getConfig();
		console.log(config);
	}

	do_stuff() {
		return 3 + 2;
	}
}

export default new BlocksPageViewer();