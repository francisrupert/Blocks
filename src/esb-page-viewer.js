import EsbConfig from './esb-config';
import EsbUtil from './esb-util';

export class EsbPageViewer {
	constructor(opts) {
		var self = this;

		self.iframe_src = null;
		self.placeholder_element = null;
		self.viewer_element = null;
		self.viewer_iframe = null;
		self.options = null;
	    self.logger = EsbUtil.logger;
		self.original_element = opts.viewer_element;
		self.original_snippet = opts.original_snippet;
		self.uuid = opts.uuid;
		self.config = EsbConfig.getConfig();
		self.set_viewer_options();
		self.set_iframe_src();
		self.create_placeholder_element();
	}

	set_viewer_options() {
		var self = this,
			options = {
				'load-immediately': false
			},
			option = null;

		for (option in options) {
			if (self.original_element.getAttribute('data-' + option) !== null) {
				options[option] = EsbUtil.booleanXorValue(self.original_element.getAttribute('data-' + option));
			}
		}

		self.options = options;
	}

	create_placeholder_element() {
		var self = this;

		self.placeholder_element = '<div class="esb-page-viewer" data-esb-uuid="' + self.uuid + '">' + self.get_iframe() + '</div>';
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
		self.viewer_element = document.querySelector('*[data-esb-uuid="' + self.uuid + '"]');
		self.iframe_element = self.viewer_element.querySelector('iframe');

		if (self.options['load-immediately']) {
			self.load_iframe();
		}
	}

	load_iframe() {
		var self = this;

		self.iframe_element.setAttribute('src', self.iframe_element.getAttribute('data-src'));
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