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
		self.scrollable_ancestors = [];
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
		else {
			self.set_scrollable_ancestors();
		}
	}

	set_scrollable_ancestors() {
		var self = this,
		ancestors = [],
		el = self.viewer_element;

		while (el.parentNode) {
			el = el.parentNode;
			if (el.scrollHeight > el.offsetHeight) {
				if (el.nodeName === 'BODY') {
					el = window;
				}
			  ancestors.push(el);
			}
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
					setTimeout(function() { allow_scroll = true; }, 1000);
				}
			});

			el.addEventListener('resize', function(){
				if (allow_resize) {
					allow_resize = false;
					self.load_iframe_if_visible();
					setTimeout(function() { allow_resize = true; }, 1000);
				}
			});
		});
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
			visible_threshold = self.viewer_element.getBoundingClientRect().top,
			ancestor_height;
		
		if (self.viewer_element.offsetParent === null) {
			visible = false;
		}
		else {
			Array.prototype.forEach.call(ancestors, function(el, i){
				if (ancestors[i+1] !== undefined) {
					ancestor_height = ancestors[i].getBoundingClientRect().height;
				}
				else {
					ancestor_height = window.innerHeight;
				}

				if (shortest_ancestor_height === null || shortest_ancestor_height > ancestor_height) {
					shortest_ancestor_height = ancestor_height;
				}
			});

			if (shortest_ancestor_height !== null && visible_threshold >= shortest_ancestor_height) {
				visible = false;
			}
		}

		return visible;
	}
}