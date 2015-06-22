// import EsbConfig from './esb-config';
// import EsbUtil from './esb-util';
// import EsbPage from './esb-page';

export class EsbMark {
	constructor(opts) {
		var self = this,
			uuid = opts.uuid;

			self.uuid = uuid;
			self.mark_element = opts.mark_element;
	}

	render() {
		var self = this;

		if (self.mark_element.classList) {
			self.mark_element.classList.add('esb-mark');
		} 
		else {
			self.mark_element.className += ' esb-mark';
		}
	}
}