import EsbConfig from './esb-config';
import EsbUtil from './esb-util';
import EsbPage from './esb-page';

export class EsbPageViewer {
	constructor(opts) {
		var self = this;

		self.iframe_src = null;
		self.placeholder_element = null;
		self.viewer_element = null;
		self.viewer_iframe = null;
		self.options = null;
		self.scrollable_ancestors = [];
	    self.logger = EsbUtil.logger;
		self.original_element = opts.viewer_element;
		self.original_snippet = opts.original_snippet;
		self.uuid = opts.uuid;
		self.config = EsbConfig.getConfig();
		self.set_iframe_src();
		self.set_viewer_options();

		self.create_placeholder_element();
	}

	set_viewer_options() {
		var self = this,
			options = {
				'load-immediately': false,
				'title': false,
				'caption': false,
				'href': self.iframe_src,
				'scrolling': 'no',
				'overlay': true,
				'viewport-width': 1000,
				'viewport-aspect-ratio': 1.5,
				'width': 200
			},
			option = null,
			el = self.original_element,
			page_level_config_element = false,
			config_json_global_options = self.config.get('page-viewers');

		// Global config
		if (config_json_global_options !== undefined) {
			for (option in options) {
				if (config_json_global_options.get(option) !== undefined) {
					options[option] = EsbUtil.booleanXorValue(config_json_global_options.get(option));
				}
			}
		}

		// Page level config
		while (el.parentNode) {
			el = el.parentNode;
			if (el.tagName !== undefined && el.getAttribute('data-esb-page-viewer-config') !== null) {
				page_level_config_element = el;
				break;
			}
		}

		if (page_level_config_element) {
			for (option in options) {
				if (page_level_config_element.getAttribute('data-' + option) !== null) {
					options[option] = EsbUtil.booleanXorValue(page_level_config_element.getAttribute('data-' + option));
				}
			}
		}


		// Viewer level config
		for (option in options) {
			if (self.original_element.getAttribute('data-' + option) !== null) {
				options[option] = EsbUtil.booleanXorValue(self.original_element.getAttribute('data-' + option));
			}
		}

		self.options = options;
	}

	create_placeholder_element() {
		var self = this;
		self.placeholder_element = '<div class="esb-page-viewer ';
		if (self.options.overlay) { self.placeholder_element += ' esb-page-viewer-has-overlay '; }
		self.placeholder_element += '" '; 
		if (self.options.width) { self.placeholder_element += ' style="width:' + self.options.width + 'px;" '; }
		self.placeholder_element +='data-esb-uuid="' + self.uuid + '">';
		if (self.options.href) { self.placeholder_element += '<a class="esb-page-viewer-link" href="' + self.options.href + '">'; }
		self.placeholder_element += self.get_title();
		self.placeholder_element += self.get_caption();
		self.placeholder_element += self.get_iframe_wrap();
		if (self.options.href) { self.placeholder_element += '</a>'; }
		self.placeholder_element += '</div>';
	}

	get_title() {
		var self = this,
			title = '';
		if (self.options.title) {
			title = '<h3 class="esb-page-viewer-title">' + self.options.title + '</h3>';
		}

		return title;
	}

	get_caption() {
		var self = this,
			caption = '';
		if (self.options.caption) {
			caption = '<p class="esb-page-viewer-caption">' + self.options.caption + '</p>';
		}

		return caption;
	}

	get_iframe_wrap_styles() {
		var self = this,
			styles = '',
			height,
			width;

		if (self.options['viewport-aspect-ratio'] && self.options.width) {
			width = self.options.width;
			height = width * self.options['viewport-aspect-ratio'];
			styles = 'width:' + width + 'px; height:' + height + 'px;';
		}

		return styles;
	}

	get_iframe_wrap() {
		var self = this,
			iframe_wrap,
			styles = self.get_iframe_wrap_styles();

		iframe_wrap = '<div class="esb-page-viewer-iframe-wrap"';
		if (styles.length > 0) { iframe_wrap += ' style="' + styles + '" '; }
		iframe_wrap += '>';
		iframe_wrap += self.get_loading_animation();
		iframe_wrap += self.get_iframe();
		iframe_wrap += '</div>';

		return iframe_wrap;
	}

	get_loading_animation() {
		return '<div class="esb-loading-animation"></div>';
	}

	get_iframe_styles() {
		var self = this,
			styles = '',
			scale,
			height,
			width;
		

		if (self.options['viewport-width'] && self.options['viewport-aspect-ratio'] && self.options.width) {
			scale = self.options.width / self.options['viewport-width'];
			width = self.options['viewport-width'];
			height = (self.options['viewport-aspect-ratio'] * self.options.width) / scale;
			styles = 'width:' + width + 'px; height:' + height + 'px; transform: scale(' + scale + '); -webkit-transform: scale(' + scale + '); ';
		}

		return styles;
	}

	get_iframe() {
		var self = this,
			iframe = null,
			styles = self.get_iframe_styles();

		if (self.iframe_src !== null) {
			iframe = '<iframe class="esb-page-viewer-iframe" data-src="' + self.iframe_src + '" scrolling="' + self.options.scrolling + '";';
			if (styles.length > 0) { iframe += ' style="' + styles + '" '; }
			iframe +='></iframe>';
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
		self.set_scrollable_ancestors();

		self.iframe_element.onload = function(){
			self.set_state('loaded');
		};

		if (self.options['load-immediately'] === true) {
			self.load_iframe();
		}
		else {
			EsbPage.blocksDone().then(
				function(){
					self.load_iframe_if_visible();
				},
				function() {
					self.logger('error', 'EsbPageViewer ' + self.uuid + ' could not be loaded because Blocks Done did not fire within the Blocks Done Timeout Threshold of: ' + EsbPage.getBlocksDoneTimeout() + 'ms');
				}
			);
		}
	}

	set_state(state) {
		var self = this;
		self.viewer_element.classList.add('esb-page-viewer--is-' + state);
	}

	set_scrollable_ancestors() {
		var self = this,
		ancestors = [],
		el = self.viewer_element;

		while (el.parentNode) {
			el = el.parentNode;
			if (el.scrollHeight > el.offsetHeight) {
				if (el.nodeName === 'BODY' || el.nodeName === 'HTML') {
					el = window;
				}
			  ancestors.push(el);
			}
		}

		if (ancestors.length === 0) {
			ancestors.push(document);
		}

		self.scrollable_ancestors = ancestors;
		self.monitor_scrollable_ancestors();
	}

	monitor_scrollable_ancestors() {
		var self = this,
			allow_scroll = true,
			allow_resize = true;

		Array.prototype.forEach.call(self.scrollable_ancestors, function(el){
			el.addEventListener('scroll', function(){
				if (allow_scroll) {
					allow_scroll = false;
					self.load_iframe_if_visible();
					setTimeout(function() { allow_scroll = true; self.load_iframe_if_visible(); }, 1000);
				}
			});

			el.addEventListener('resize', function(){
				if (allow_resize) {
					self.logger('info', 'listenting for resize');
					allow_resize = false;
					self.load_iframe_if_visible();
					setTimeout(function() { allow_resize = true; self.load_iframe_if_visible(); }, 1000);
				}
			});
		});
	}

	load_iframe() {
		var self = this;

		if (self.iframe_element.getAttribute('src') === null) {
		self.logger('info', 'BLOCKS VIEWER: ' + self.uuid + ', load_iframe called');
			self.set_state('loading');
			self.iframe_element.setAttribute('src', self.iframe_element.getAttribute('data-src'));
		}
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
			if (self.config.get('page-viewers') !== undefined && self.config.get('page-viewers').get('source') !== undefined) {
				path = self.config.get('page-viewers').get('source');
			}
			else {
				path = '';
			}
		}

		if (path.length > 0 && path.slice(-1) !== '/') {
			path += '/';
		}

		return path;
	}

	load_iframe_if_visible() {
		var self = this;

		if (self.is_visible()) {
			self.load_iframe();
		}
	}

	is_visible() {
		var self = this,
			visible = true,
			ancestors = self.scrollable_ancestors.slice(0),
			shortest_ancestor_height = null,
			shortest_ancestor_top = null,
			visible_threshold = self.viewer_element.getBoundingClientRect().top,
			ancestor_height,
			ancestor_top;
		
		if (self.viewer_element.offsetParent === null) {
			visible = false;
		}
		else {
			Array.prototype.forEach.call(ancestors, function(el, i){
				if (ancestors[i+1] !== undefined) {
					ancestor_height = ancestors[i].getBoundingClientRect().height;
					ancestor_top = ancestors[i].getBoundingClientRect().top;
				}
				else {
					ancestor_height = window.innerHeight;
					ancestor_top = 0;
				}

				if (shortest_ancestor_height === null || shortest_ancestor_height > ancestor_height) {
					shortest_ancestor_height = ancestor_height;
					shortest_ancestor_top = ancestor_top;
				}
			});

			if (shortest_ancestor_height !== null && visible_threshold >= (shortest_ancestor_height + shortest_ancestor_top)) {
				visible = false;
			}
		}

		return visible;
	}
}