import EsbConfig from './esb-config';
import EsbUtil from './esb-util';
import EsbPage from './esb-page';

export class EsbFrame {
	constructor(opts) {
		var self = this;

		self.iframe_src = null;
		self.placeholder_element = null;
		self.viewer_element = null;
		self.iframe_element = null;
		self.iframe_is_loaded = false;
		self.options = null;
		self.scrollable_ancestors = [];
	    self.logger = EsbUtil.logger;
		self.original_element = opts.viewer_element;
		self.original_snippet = opts.original_snippet;
		self.uuid = opts.uuid;
		self.config = EsbConfig.getConfig();
		// self.set_iframe_src();
		self.set_viewer_options();

		self.create_placeholder_element();
	}

	is_iframe_loaded() {
		var self = this;
		return self.iframe_is_loaded;
	}

	set_viewer_options() {
		var self = this,
			options = {
				'frame': false,
				'source': '',
				'load-immediately': false,
				'unload-when-not-visible': false,
				'title': false,
				'caption': false,
				'dimensions': true,
				'href': 'none',
				'scrolling': 'no',
				'overlay': true,
				'scale': false,
				'viewport-width': 1000,
				'viewport-aspect-ratio': 1.5,
				'width': 200,
				'height': false
			},
			option = null,
			value = null,
			el = self.original_element,
			page_level_config_element = false,
			config_json_global_options = self.config.get('frames');

		// Global config
		if (config_json_global_options !== undefined) {
			for (option in options) {
				value = config_json_global_options.get(option);
				if (value !== undefined && value.toString().length > 0) {
					options[option] = EsbUtil.booleanXorValue(value);
				}
			}
		}

		// Page level config
		while (el.parentNode) {
			el = el.parentNode;
			if (el.tagName !== undefined && el.getAttribute('data-esb-frame-config') !== null) {
				page_level_config_element = el;
				break;
			}
		}

		if (page_level_config_element) {
			for (option in options) {
				value = page_level_config_element.getAttribute('data-esb-' + option);
				if (value !== null && value.length > 0) {
					options[option] = EsbUtil.booleanXorValue(value);
				}
			}
		}

		// Instance level config
		for (option in options) {
			value = self.original_element.getAttribute('data-esb-' + option);
			if (value !== null && value.length > 0) {
				options[option] = EsbUtil.booleanXorValue(value);
			}
		}

		//FINAL DEFAULTS

		//SOURCE
		// Append '/' to source if source is given and doesn't end in '/'
		if (options.source.length > 0 && options.source.slice(-1) !== '/') {
			options.source += '/';
		}

		//FRAME
		if (options.frame.indexOf('http') === 0) {
			self.logger('info', 'Fully qualified url found for page viewer: ' + options.frame + ', esb-frame uuid: ' + self.uuid);
		}
		else {
			options.frame = options.source + options.frame;
		}

		// set iframe_src variable
		self.iframe_src = options.frame;

		//HREF
		if (options.href === 'none') {
			// href wasn't set at any level, default to the source + frame
			options.href = options.frame;
		}

		//OVERLAY
		if (options.scrolling === 'yes') {
			//If scrolling is desired, the overlay has to be disabled or you cannot scroll
			options.overlay = false;
		}

		self.options = options;
	}

	create_placeholder_element() {
		var self = this;

		self.placeholder_element = '<div class="esb-frame ';
		if (self.options.overlay) { self.placeholder_element += ' esb-frame-has-overlay '; }
		self.placeholder_element += '" '; 
		self.placeholder_element +='data-esb-uuid="' + self.uuid + '">';
		if (self.options.href) { 
			self.placeholder_element += '<a class="esb-frame-link esb-frame-inner-wrap" href="' + self.options.href + '">'; 
		}
		else {
			self.placeholder_element += '<span class="esb-frame-inner-wrap">'; 
		}
		self.placeholder_element += self.get_title();
		self.placeholder_element += self.get_caption();
		self.placeholder_element += self.get_dimensions_annotation();
		self.placeholder_element += self.get_iframe_wrap();
		if (self.options.href) { 
			self.placeholder_element += '</a>'; 
		}
		else {
			self.placeholder_element += '</span>';
		}
		self.placeholder_element += '</div>';
	}

	get_title() {
		var self = this,
			title = '';
		if (self.options.title) {
			title = '<h3 class="esb-frame-title">' + self.options.title + '</h3>';
		}

		return title;
	}

	get_caption() {
		var self = this,
			caption = '';
		if (self.options.caption) {
			caption = '<p class="esb-frame-caption">' + self.options.caption + '</p>';
		}

		return caption;
	}

	get_scale_icon() {
		var scale_icon = '<span class="esb-frame-scale-icon">';

		scale_icon += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 13.973" height="15px">';
		scale_icon += '<g><path d="M8.361,7.749c-0.043,0-0.077,0.005-0.113,0.012c-0.02,0.002-0.039,0.014-0.051,0.014 C8.177,7.783,8.154,7.788,8.14,7.794C8.116,7.802,8.1,7.815,8.084,7.825C8.068,7.831,8.051,7.841,8.036,7.848 c-0.061,0.044-0.115,0.099-0.16,0.16C7.869,8.022,7.858,8.039,7.854,8.056c-0.012,0.02-0.027,0.033-0.03,0.055 C7.814,8.13,7.812,8.148,7.802,8.171C7.799,8.185,7.792,8.2,7.787,8.219C7.783,8.256,7.775,8.294,7.776,8.335v3.296 c0,0.327,0.262,0.587,0.585,0.587c0.322,0,0.585-0.26,0.585-0.587V9.743l4.059,4.058c0.226,0.229,0.595,0.229,0.822,0 c0.23-0.229,0.23-0.599,0-0.824l-4.06-4.06h1.893c0.158,0.001,0.308-0.062,0.414-0.172c0.103-0.106,0.167-0.249,0.167-0.41 c0-0.326-0.26-0.586-0.581-0.586H8.361z"/><path d="M6.42,0H0.584C0.262,0,0,0.261,0,0.583v5.835c0,0.319,0.262,0.581,0.584,0.581H6.42 C6.738,6.999,7,6.737,7,6.418V0.583C7,0.261,6.738,0,6.42,0z M1.17,1.168h4.662v4.665H1.17V1.168z"/></g></svg>';
		scale_icon += '</span>';

		return scale_icon;
	}

	get_dimensions_icon() {
		var dimensions_icon = '<span class="esb-frame-dimensions-icon">';

		dimensions_icon += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 13.993" height="15px">';
		dimensions_icon += '<path d="M13.996,3.487c0-0.034-0.002-0.067-0.006-0.096c-0.006-0.021-0.01-0.039-0.017-0.054 c-0.007-0.02-0.009-0.041-0.019-0.056c-0.006-0.021-0.018-0.04-0.029-0.056c-0.007-0.015-0.014-0.032-0.025-0.047 c-0.016-0.028-0.041-0.055-0.062-0.077c-0.004-0.005-0.006-0.01-0.008-0.011l0,0l0,0l-2.91-2.922 c-0.226-0.226-0.594-0.226-0.824-0.003c-0.228,0.229-0.228,0.6-0.002,0.826l1.919,1.926L3.499,2.914l0,0 c-0.153,0-0.302,0.062-0.412,0.172C2.978,3.194,2.917,3.342,2.917,3.5l0.006,8.491l-1.928-1.928c-0.226-0.232-0.595-0.232-0.824,0 c-0.228,0.224-0.229,0.592-0.001,0.82l2.931,2.939c0.109,0.109,0.259,0.17,0.416,0.17c0.162,0,0.301-0.061,0.411-0.17l2.899-2.926 c0.228-0.232,0.225-0.602-0.001-0.828c-0.231-0.225-0.601-0.225-0.828,0.008l-1.911,1.928L4.084,4.08l7.924,0.008l-1.921,1.914 c-0.231,0.224-0.232,0.594-0.004,0.821c0.113,0.115,0.263,0.174,0.413,0.174c0.149,0,0.297-0.058,0.41-0.174l2.924-2.908l0,0 c0.027-0.027,0.051-0.058,0.07-0.086c0.012-0.014,0.018-0.031,0.025-0.047c0.012-0.021,0.021-0.035,0.028-0.056 c0.011-0.02,0.013-0.036,0.02-0.06c0.007-0.015,0.011-0.03,0.017-0.05C13.994,3.582,14,3.542,14,3.501l0,0 C14,3.499,13.996,3.489,13.996,3.487z"/></svg>';
		dimensions_icon += '</span>';

		return dimensions_icon;
	}

	get_dimensions_annotation() {
		var self = this,
			dimensions = self.get_iframe_dimensions(),
			dimensions_annotation = '',
			scale = parseFloat((dimensions.scale*100).toFixed(1));
		
		if (self.options.dimensions && dimensions.width && dimensions.height && dimensions.scale) {
			dimensions_annotation = '<p class="esb-frame-dimensions-annotation">';
			dimensions_annotation += self.get_dimensions_icon() + '<span class="esb-frame-dimensions-value">' + Math.round(dimensions.width) + '&times;' + Math.round(dimensions.height) + '</span> ';
			if (scale !== 100) {
				dimensions_annotation += self.get_scale_icon() + '<span class="esb-frame-scale-value">' + parseFloat((dimensions.scale*100).toFixed(1)) + '%</span>';
			}
			dimensions_annotation += '</p>';
		}

		return dimensions_annotation;
	}

	get_iframe_wrap_styles() {
		var self = this,
			styles = '',
			height,
			width = self.options.width;

		if (self.options.scale) {
			width = self.options['viewport-width'] * self.options.scale;
		}

		if (self.options['viewport-aspect-ratio'] && self.options.width) {
			if (self.options.height) {
				height = self.options.height;
			}
			else {
				height = width * self.options['viewport-aspect-ratio'];
			}
			styles = 'width:' + width + 'px; height:' + height + 'px;';
		}

		return styles;
	}

	get_iframe_wrap() {
		var self = this,
			iframe_wrap,
			styles = self.get_iframe_wrap_styles();

		iframe_wrap = '<div class="esb-frame-iframe-wrap"';
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
			dimensions = self.get_iframe_dimensions();
		

		if (dimensions.width && dimensions.height && dimensions.scale) {
			styles = 'width:' + dimensions.width + 'px; height:' + dimensions.height + 'px; transform: scale(' + dimensions.scale + '); -webkit-transform: scale(' + dimensions.scale + '); ';
		}

		return styles;
	}

	get_iframe_dimensions() {
		var self = this,
		scale = self.options.scale,
		height, 
		width,
		dimensions = {
			'width': null,
			'height': null,
			'scale': null
		};

		if (!scale && self.options.width) {
			scale = self.options.width / self.options['viewport-width'];
		}
		width = self.options['viewport-width'];

		if (self.options.height) {
			height = self.options.height / scale;
		}
		else {
			height = self.options['viewport-aspect-ratio'] * width;
		}

		dimensions.height = height;
		dimensions.width = width;
		dimensions.scale = scale;

		return dimensions;
	}

	get_iframe() {
		var self = this,
			iframe = null,
			styles = self.get_iframe_styles();

		if (self.iframe_src !== null) {
			iframe = '<iframe class="esb-frame-iframe" data-src="' + self.iframe_src + '" scrolling="' + self.options.scrolling + '";';
			if (styles.length > 0) { iframe += ' style="' + styles + '" '; }
			iframe +='></iframe>';
		}
		else {
			self.logger('error', 'EsbFrame cannot create placeholder iframe because no iframe src is set.');
		}

		return iframe;
	}

	set_event_listeners() {
		var self = this;

		document.addEventListener('load-esb-frame-' + self.uuid, self.load_iframe.bind(self));
		document.addEventListener('unload-esb-frame-' + self.uuid, self.unload_iframe.bind(self));

		if (window.$ !== undefined) {
			// jQuery's event system is separate from the browser's, so set these up so $(document).trigger will work
			window.$(document).on('load-esb-frame-' + self.uuid, self.load_iframe.bind(self));
			window.$(document).on('unload-esb-frame-' + self.uuid, self.unload_iframe.bind(self));
		}
	}

	inject_placeholder() {
		var self = this;
		self.original_element.outerHTML = self.placeholder_element;
		self.viewer_element = document.querySelector('*[data-esb-uuid="' + self.uuid + '"]');
		self.iframe_element = self.viewer_element.querySelector('iframe');
		self.set_scrollable_ancestors();
		self.set_event_listeners();
		self.set_iframe_onload_behavior();

		if (self.options['load-immediately'] === true) {
			self.load_iframe();
		}
		else {
			EsbPage.blocksDone().then(
				function(){
					self.load_iframe_if_visible();
				},
				function() {
					self.logger('error', 'EsbFrame ' + self.uuid + ' could not be loaded because Blocks Done did not fire within the Blocks Done Timeout Threshold of: ' + EsbPage.getBlocksDoneTimeout() + 'ms');
				}
			);
		}
	}

	set_state(state) {
		var self = this;
		self.viewer_element.classList.add('esb-frame--is-' + state);
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

	debounce_scroll_event() {
		var self = this,
		allow_scroll = true;
		if (allow_scroll) {
			allow_scroll = false;
			if (!self.is_iframe_loaded()) {
				self.load_iframe_if_visible();
			}
			else if (self.options['unload-when-not-visible']){
				self.unload_iframe_if_not_visible();
			}
			setTimeout(function() { allow_scroll = true; self.load_iframe_if_visible(); }, 2000);
		}
	}

	debounce_resize_event() {
		var self = this,
		allow_resize = true;
		if (allow_resize) {
			allow_resize = false;
			if (!self.is_iframe_loaded()) {
				self.load_iframe_if_visible();
			}
			else if (self.options['unload-when-not-visible']){
				self.unload_iframe_if_not_visible();
			}
			setTimeout(function() { allow_resize = true; self.load_iframe_if_visible(); }, 2000);
		}
	}

	monitor_scrollable_ancestors() {
		var self = this;

		Array.prototype.forEach.call(self.scrollable_ancestors, function(el){
			el.addEventListener('scroll', self.debounce_scroll_event.bind(self));
			el.addEventListener('resize', self.debounce_resize_event.bind(self));
		});
	}

	set_iframe_onload_behavior() {
		var self = this;

		self.iframe_element.onload = function(){
			self.set_state('loaded');
			self.iframe_is_loaded = true;
			if (!self.options['unload-when-not-visible']) {
				self.stop_monitoring_scrollable_ancestors();
			}
		};
	}

	stop_monitoring_scrollable_ancestors() {
		var self = this;

		Array.prototype.forEach.call(self.scrollable_ancestors, function(el){
			el.removeEventListener('scroll', self.debounce_scroll_event.bind(self));
			el.removeEventListener('resize', self.debounce_resize_event.bind(self));
		});
	}

	load_iframe() {
		var self = this;

		if (self.iframe_element.getAttribute('src') === null) {
			self.set_state('loading');
			self.iframe_element.setAttribute('src', self.iframe_element.getAttribute('data-src'));
		}
	}

	unload_iframe() {
		var self = this;
		self.iframe_element.outerHTML = self.get_iframe();
		self.iframe_element = self.viewer_element.querySelector('iframe');
		self.set_iframe_onload_behavior();
		self.iframe_is_loaded = false;
	}

	unload_iframe_if_not_visible() {
		var self = this;

		if (!self.is_visible()) {
			self.unload_iframe();
		}
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
			shortest_ancestor_bottom = null,
			bounding_rect = self.viewer_element.getBoundingClientRect(),
			top_visible_threshold = bounding_rect.top,
			bottom_visible_threshold = bounding_rect.bottom,
			ancestor_height,
			ancestor_bottom,
			ancestor_top;
		
		if (self.viewer_element.offsetParent === null) {
			visible = false;
		}
		else {
			Array.prototype.forEach.call(ancestors, function(el, i){
				if (ancestors[i+1] !== undefined) {
					ancestor_height = ancestors[i].getBoundingClientRect().height;
					ancestor_bottom = ancestors[i].getBoundingClientRect().bottom;
					ancestor_top = ancestors[i].getBoundingClientRect().top;
				}
				else {
					ancestor_height = window.innerHeight;
					ancestor_top = 0;
					ancestor_bottom = ancestor_height;
				}

				if (shortest_ancestor_height === null || shortest_ancestor_height > ancestor_height) {
					shortest_ancestor_height = ancestor_height;
					shortest_ancestor_top = ancestor_top;
					shortest_ancestor_bottom = ancestor_bottom;
				}
			});

			if (shortest_ancestor_height !== null && (
				top_visible_threshold >= (shortest_ancestor_height + shortest_ancestor_top) ||
				bottom_visible_threshold <= (shortest_ancestor_top)
				)) {
				visible = false;
			}
		}

		return visible;
	}
}