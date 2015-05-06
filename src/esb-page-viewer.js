import EsbConfig from './esb-config';
import EsbUtil from './esb-util';

export class EsbPageViewer {
	constructor(opts) {
		var self = this;

	    self.logger = EsbUtil.logger;
		self.original_element = opts.viewer_element;
		self.original_snippet = opts.original_snippet;
		self.uuid = opts.uuid;
		self.config = EsbConfig.getConfig();
		self.iframe_src = null;
		self.set_iframe_src();
		self.placeholder_element = null;
		self.create_placeholder_element();
	}

	create_placeholder_element() {
		var self = this;

		self.placeholder_element = '<div class="esb-page-viewer">' + self.get_iframe() + '</div>';
	}

	get_iframe() {
		var self = this,
			iframe = null;

		if (self.iframe_src !== null) {
			iframe = '<iframe data-src="' + self.iframe_src + '"></iframe>';
		}
		else {
			self.logger('error', 'EsbPageViewer cannot create placeholder iframe because no iframe src is set.');
		}

		return iframe;
	}

	inject_placeholder() {
		var self = this;

		self.original_element.outerHTML = self.placeholder_element;
	}

	set_iframe_src() {
		var self = this,
			src = null;

		src = self.original_element.getAttribute('data-esb-page-viewer');

		if (src.indexOf('http') === 0) {
			self.logger('info', 'Fully qualified url found for page viewer: ' + src + ', esb-page-viewer uuid: ' + self.uuid);
		}
		else {
			src = self.get_path_to_src() + src;
		}

		self.iframe_src = src;
	}

	get_path_to_src() {
		var self = this,
			path = null;

		path = self.original_element.getAttribute('data-source');

		if (path === null) {
			path = self.config.get('page-viewers').get('source');
		}

		if (path.slice(-1) !== '/') {
			path += '/';
		}

		return path;
	}
}