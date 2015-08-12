import EsbConfig from './esb-config';
import EsbUtil from './esb-util';
import EsbPage from './esb-page';

export class EsbFrame {
// SETUP / CONFIG
	// BOTH - CORE
	constructor(opts) {
		var self = this;
		self.placeholder_created_timeout = 5000;
		self.placeholder_created = false;
		self.original_element = opts.viewer_element;
		self.original_snippet = opts.original_snippet;
		self.uuid = opts.uuid;

	    self.logger = EsbUtil.logger;
		self.config = EsbConfig.getConfig();
		self.config_json_global_options = self.config.get('frames');
		self.page_level_config_element = self.get_page_level_config_element();
		
		self.is_component_frame = self.get_component_frame_status();
		self.default_options = self.get_default_options();
		
		self.set_device_presets();
		self.device_dimensions = {};

		self.state = 'not-loaded';
		self.iframe_is_loaded = false;
		self.has_loading_error = false;
		self.loading_error_message = '';
		
		
		self.placeholder_element = null;
		self.viewer_element = null;
		self.iframe_element = null;

		self.dimensions_annotation_width_element = false;
		self.dimensions_annotation_height_element = false;
		self.dimensions_annotation_scale_element = false;
		self.dimensions_annotation_element = false;
		
		self.scrollable_ancestors = [];
	    
		
		self.overridden_options = [];
		self.options = self.get_frame_options();
		self.iframe_src = self.options.iframe_src;

		if (self.is_component_frame) {
			self.is_component_template_url_valid().then(function(){
				self.placeholder_element = self.get_placeholder_element();
				self.placeholder_created = true;
			}, function(){
				self.placeholder_element = self.get_placeholder_element();
				self.placeholder_created = true;
			});
		}
		else {
			self.placeholder_element = self.get_placeholder_element();
			self.placeholder_created = true;
		}
	}

	get_placeholder_created() {
		var self = this;
		return self.placeholder_created;
	}

	is_placeholder_created() {
	    var self = this,
	      timeout_ms = self.get_placeholder_created_timeout(),
	      polling_interval_ms = 500,
	      polling_attempt_threshold = timeout_ms / polling_interval_ms,
	      polling_attempts = 0,
	      placeholder_created_interval = false;

	    return new Promise(function(resolve, reject) {
	      placeholder_created_interval = setInterval(function(){
	        if (polling_attempts < polling_attempt_threshold) {
	          if (self.get_placeholder_created()) {
	            resolve(true);
	            clearInterval(placeholder_created_interval);
	          }
	          else {
	            polling_attempts++;
	          }
	        }
	        else {
	          self.logger('error', 'The Frame placeholder was not created before the timeout threshold: ' + timeout_ms + 'ms');
	          reject('The Frame placeholder was not created before the timeout threshold: ' + timeout_ms + 'ms');
	        }
	      }, polling_interval_ms);
	    });
	}

	get_placeholder_created_timeout() {
		var self = this;
		return self.placeholder_created_timeout;
	}

	get_global_config_option(option_name) {
		var self = this,
			option_value;

		if (self.config_json_global_options !== undefined) {
			option_value = self.config_json_global_options.get(option_name);
			if (option_value !== undefined && option_value.toString().length > 0) {
				option_value = EsbUtil.booleanXorValue(option_value);
			}
		}

		return option_value;
	}

	get_page_level_config_element() {
		var self = this,
			el = self.original_element,
			page_level_config_element = false;
		
		while (el.parentNode) {
			el = el.parentNode;
			if (el.tagName !== undefined && el.getAttribute('data-esb-frame-config') !== null) {
				page_level_config_element = el;
				break;
			}
		}

		return page_level_config_element;
	}

	get_page_level_config_option(option_name) {
		var self = this,
			option_value;

		if (self.page_level_config_element) {
			option_value = self.page_level_config_element.getAttribute('data-esb-' + option_name);
			if (option_value !== null && option_value.length > 0) {
				option_value = EsbUtil.booleanXorValue(option_value);
			}
			else {
				option_value = undefined;
			}
		}

		return option_value;
	}

	get_element_level_config_option(option_name) {
		var self = this,
			option_value;

		option_value = self.original_element.getAttribute('data-esb-' + option_name);
		if (option_value !== null && option_value.length > 0) {
			option_value = EsbUtil.booleanXorValue(option_value);
		}
		else {
			option_value = undefined;
		}

		return option_value;
	}

	get_component_frame_status() {
		var self = this,
			is_component_frame = false,
			global_config_json_variation = self.get_global_config_option('variation'),
			page_level_config_variation = self.get_page_level_config_option('variation'),
			element_level_config_variation = self.get_element_level_config_option('variation');

		if (element_level_config_variation !== undefined || page_level_config_variation !== undefined || global_config_json_variation !== undefined ) {
			is_component_frame = true;
		}

		return is_component_frame;
	}

	get_default_options() {
		var self = this,
			options = {
			'frame': false,
			'source': '',
			'load-immediately': false,
			'unload-when-not-visible': false,
			'title': false,
			'caption': false,
			'dimensions': true,
			'href': false,
			'scrolling': 'no',
			'overlay': true,
			'scale': false,
			'viewport-width': 1000,
			'viewport-aspect-ratio': 1.5,
			'width': 200,
			'height': false,
			'viewport-device': false,
			'viewport-device-orientation': 'portrait',
			'device-annotation': true,
			'device-frame': false,
			'show-browser-ui': false,
			'variation': false,
			'component-frame-template': 'component_frame_template.html',
			'component-frame-template-target': 'body',
			'component-source': '',
			'place': 'replace',
			'crop': false,
			'offset-x': false,
			'offset-y': false
		};

		if (self.is_component_frame) {
			options.width = false;
			options.height = 'auto';
			options.scale = 1;
			options['viewport-width'] = false;
			options['viewport-aspect-ratio'] = false;
		}

		return options; 
	}

	get_frame_options() {
		var self = this,
			options = self.default_options,
			option = null,
			value = null,
			device_dimensions = null;

		// Check each tier of options to see if any overrides exist
		for (option in options) {
			// Instance Level
			value = self.get_element_level_config_option(option);
			if (value === undefined) {
				// Page Level
				value = self.get_page_level_config_option(option);

				// Global Level
				if (value === undefined) {
					value = self.get_global_config_option(option);
				}
			}

			if (value !== undefined) {
				options[option] = value;
				self.overridden_options.push(option);
			}
		}

		//CONDITIONAL DEFAULTS
		
		//OVERLAY
		if (options.scrolling === 'yes') {
			//If scrolling is desired, the overlay has to be disabled or you cannot scroll
			options.overlay = false;
		}

		//CROP
		// if (options.crop) {
		// 	// If the crop option is used, don't show the dimensions annotation
		// 	options.dimensions = false;
		// }

		//VIEWPORT-DEVICE and VIEWPORT-DEVICE-ORIENTATION
		if (options['viewport-device']) {
			device_dimensions = self.get_device_dimensions(options['viewport-device'], options['viewport-device-orientation'], options['show-browser-ui']);
			if (device_dimensions) {
				options['viewport-width'] = device_dimensions.width;
				options['viewport-aspect-ratio'] = device_dimensions['aspect-ratio'];
				self.device_dimensions = device_dimensions;
			}
		}

		options.iframe_src = self.build_iframe_src(options);

		//HREF
		if (options.href === false && self.is_option_overridden('href') === false) {
			// href wasn't set at any level, default to options.frame
			options.href = options.iframe_src;
		}

		return options;
	}

	is_component_template_url_valid() {
		var self = this,
			request = new XMLHttpRequest();

	    return new Promise(function(resolve, reject) {

			request.open('HEAD', self.options['component-frame-template'], true);

			request.onload = function() {
			  if (request.status >= 200 && request.status < 400) {
			    resolve(true);
			  } else {
			    // We reached our target server, but it returned an error
			    self.has_loading_error = true;
			    self.loading_error_message = 'Could not load Component Frame, no component template found at: ' + self.options['component-frame-template'];
			    reject(self.loading_error_message);
			  }
			};

			request.onerror = function() {
			  // There was a connection error of some sort
			    self.has_loading_error = true;
			    self.loading_error_message = 'Could not load Component Frame, a connection error occurred while attempting to load: ' + self.options['component-frame-template'];
			    reject(self.loading_error_message);
			};

			request.send();
	    });
	}

	build_iframe_src(options) {
		var self = this,
			iframe_src;

		// COMPONENT FRAME
		if (self.is_component_frame) {
			iframe_src = self.build_component_iframe_src(options);
		}
		// REGULAR FRAME
		else {
			if (options.source.length > 0 && options.source.slice(-1) !== '/') {
				options.source += '/';
			}

			if (options.frame && options.frame.indexOf('http') === 0) {
				self.logger('info', 'Fully qualified url found for page viewer: ' + options.frame + ', esb-frame uuid: ' + self.uuid);
				iframe_src = options.frame;
			}
			else {
				iframe_src = options.source + options.frame;
			}
		}

		return iframe_src;
	}

	// COMPONENT FRAME ONLY
	build_component_iframe_src(options) {
		// Support legacy 'data-frame-component' syntax
		var self = this,
			component_url = options['component-frame-template'],
			component_name = self.original_element.getAttribute('data-frame-component'),
			component_variation = self.original_element.getAttribute('data-variation'),
			component_source = self.original_element.getAttribute('data-source'),
			component_place = self.original_element.getAttribute('data-place');

		if (component_name === null) {
			component_name = options.frame;
		}

		if (component_variation === null) {
			component_variation = options.variation;
		}

		if (component_source === null) {
			component_source = options['component-source'];
		}

		if (component_place === null) {
			component_place = options.place;
		}

		if (component_url.indexOf('?') !== -1) {
			// already has query params
			component_url += '&';
		}
		else {
			component_url += '?';
		}

		component_url += 	'data-esb-component=' + component_name + 
							'&data-esb-variation=' + component_variation +
							'&data-esb-source=' + component_source +
							'&data-esb-place=' + component_place + 
							'&data-esb-target=' + options['component-frame-template-target'];

		return encodeURI(component_url).replace(/#/, '%23');
	}

	// BOTH - CORE
	is_option_overridden(option_name) {
		var self = this;
		return self.overridden_options.indexOf(option_name) !== -1;
	}

// PLACEHOLDER ELEMENT CONSTRUCTION

	/* FIVE MAIN CONTAINING ELEMENTS:
	.esb-frame outermost wrapper
		.esb-frame-inner-wrap, either a link or a span wrapping all of the contents within
			.esb-frame-title
			.esb-frame-caption
			.esb-frame-device-annotation
			.esb-frame-dimensions-annotation
			.esb-frame-iframe-wrap, wrapper around the iframe related content - can be used to crop the iframe content - not scaled
				.esb-frame-device, <svg> element absolutely positioned within .esb-frame-iframe-wrap as a background for the <iframe>
				.esb-loading-animation
				.esb-frame-iframe-inner-wrap, wrapper around the iframe and any other scaled content - IS scaled
					.esb-frame-iframe, the <iframe> element itself 
	*/
	// BOTH - CORE
	get_placeholder_element() {
		var self = this,
			outer_wrap = self.get_element_outer_wrap(),
			inner_wrap = self.get_element_inner_wrap(),
			title = self.get_element_title(),
			caption = self.get_element_caption(),
			dimensions_annotation = self.get_element_dimensions_annotation(),
			device_annotation = self.get_element_device_annotation(),
			iframe_outer_wrap = self.get_element_iframe_outer_wrap(),
			device_frame = self.get_element_device_frame(self.options['viewport-device'], self.options['viewport-device-orientation']),
			browser_ui_top = self.get_element_browser_ui('top'),
			browser_ui_bottom = self.get_element_browser_ui('bottom'),
			loading_animation = self.get_element_loading_animation(),
			iframe_inner_wrap = self.get_element_iframe_inner_wrap(),
			iframe = self.get_element_iframe(),
			loading_error = self.get_element_loading_error();

		if (browser_ui_top !== undefined) { iframe_inner_wrap.appendChild(browser_ui_top); }

		iframe_inner_wrap.appendChild(iframe);

		if (browser_ui_bottom !== undefined) { iframe_inner_wrap.appendChild(browser_ui_bottom); }

		if (device_frame !== undefined) { iframe_outer_wrap.appendChild(device_frame); }

		iframe_outer_wrap.appendChild(loading_animation);
		iframe_outer_wrap.appendChild(iframe_inner_wrap);

		if (title !== undefined) { inner_wrap.appendChild(title); }

		if (caption !== undefined) { inner_wrap.appendChild(caption); }

		if (device_annotation !== undefined) { inner_wrap.appendChild(device_annotation); }

		if (dimensions_annotation !== undefined) { inner_wrap.appendChild(dimensions_annotation); }

		inner_wrap.appendChild(iframe_outer_wrap);

		if (self.has_loading_error) {
			outer_wrap.appendChild(loading_error);
		}
		else {
			outer_wrap.appendChild(inner_wrap);
		}

		return outer_wrap;
	}

	get_element_loading_error() {
		var self = this,
			loading_error;

		if (self.has_loading_error) {
			loading_error = document.createElement('span');
			EsbUtil.addClass(loading_error, 'esb-frame-loading-error');
			loading_error.textContent = self.loading_error_message;
		}

		return loading_error;
	}

	get_element_outer_wrap() {
		var self = this,
			outer_wrap = document.createElement('div');

		EsbUtil.addClass(outer_wrap, 'esb-frame');
		outer_wrap.setAttribute('data-esb-uuid', self.uuid);

		if (self.options.overlay) { EsbUtil.addClass(outer_wrap, 'esb-frame-has-overlay'); }
		if (self.is_component_frame) { EsbUtil.addClass(outer_wrap, ' esb-frame--is-framed-component'); }
		if (self.has_loading_error) { EsbUtil.addClass(outer_wrap, 'esb-frame--has-loading-error'); }
		if (self.options['device-frame']) { 
			EsbUtil.addClass(outer_wrap, 'esb-frame--has-device-frame esb-frame-device-frame-' + self.options['viewport-device']); 
			EsbUtil.addClass(outer_wrap, 'esb-frame-device-orientation-' + self.options['viewport-device-orientation']); 
		}

		return outer_wrap;
	}

	get_element_inner_wrap() {
		var self = this,
			inner_wrap;

		if (self.options.href) {
			inner_wrap = document.createElement('a');
			EsbUtil.addClass(inner_wrap, 'esb-frame-link');
			inner_wrap.setAttribute('href', self.options.href);
		}
		else {
			inner_wrap = document.createElement('span');
		}

		EsbUtil.addClass(inner_wrap, 'esb-frame-inner-wrap');

		return inner_wrap;
	}

	// BOTH - FEATURE
	get_element_title() {
		var self = this,
			title;

		if (self.options.title) {
			title = document.createElement('h3');
			title.textContent = self.options.title;
			EsbUtil.addClass(title, 'esb-frame-title');
		}

		return title;
	}

	// BOTH - FEATURE
	get_element_caption() {
		var self = this,
			caption;
		if (self.options.caption) {
			caption = document.createElement('p');
			caption.textContent = self.options.caption;
			EsbUtil.addClass(caption, 'esb-frame-caption');
		}

		return caption;
	}

	get_element_device_annotation() {
		var self = this,
			device_annotation,
			annotation_text;

		if (self.options['viewport-device'] && self.options['device-annotation']) {
			device_annotation = document.createElement('p');
			annotation_text = self.device_presets[self.options['viewport-device']]['annotation-name'];
			if (self.options['viewport-device-orientation'] === 'landscape') {
				annotation_text += ', Landscape';
			}
			device_annotation.textContent = annotation_text;
			EsbUtil.addClass(device_annotation, 'esb-frame-device-annotation');
		}

		return device_annotation;
	}

	// BOTH - CORE
	get_element_dimensions_annotation() {
		var self = this,
			dimensions = self.get_iframe_dimensions(),
			dimensions_annotation,
			dimensions_value_element,
			dimensions_value_width_element,
			dimensions_value_height_element,
			dimensions_value_scale_element,
			scale = parseFloat((dimensions.scale*100).toFixed(1));
		
		if (self.options.dimensions) {
			if (self.options.crop === true) {
				dimensions.width = self.options.width;
				dimensions.height = self.options.height;
			}
			
			dimensions_annotation = document.createElement('p');
			EsbUtil.addClass(dimensions_annotation, 'esb-frame-dimensions-annotation esb-frame-dimensions--updating');
			dimensions_annotation.appendChild(self.get_element_icon('dimensions'));
			
			dimensions_value_element = document.createElement('span');
			EsbUtil.addClass(dimensions_value_element, 'esb-frame-dimensions-value');
			
			dimensions_value_width_element = document.createElement('span');
			if (dimensions.width) {
				dimensions_value_width_element.textContent = Math.round(dimensions.width);
			}
			EsbUtil.addClass(dimensions_value_width_element, 'esb-frame-dimensions-width-value');
			
			dimensions_value_height_element = document.createElement('span');
			if (dimensions.height) {
				dimensions_value_height_element.textContent = Math.round(dimensions.height);
			}
			EsbUtil.addClass(dimensions_value_height_element, 'esb-frame-dimensions-height-value');

			dimensions_value_element.appendChild(dimensions_value_width_element);
			dimensions_value_element.innerHTML = dimensions_value_element.innerHTML + '&times;'; 
			dimensions_value_element.appendChild(dimensions_value_height_element);

			dimensions_annotation.appendChild(dimensions_value_element);

			if (scale !== 100) {
				dimensions_annotation.appendChild(self.get_element_icon('scale'));
				dimensions_value_scale_element = document.createElement('span');
				dimensions_value_scale_element.textContent = scale;
				dimensions_value_scale_element.innerHTML = dimensions_value_scale_element.innerHTML + '%';
				EsbUtil.addClass(dimensions_value_scale_element, 'esb-frame-dimensions-scale-value');
				dimensions_annotation.appendChild(dimensions_value_scale_element);
			}
		}

		return dimensions_annotation;
	}

	get_element_icon(icon_name) {
		return EsbUtil.get_svg_icon(icon_name);
	}

	// BOTH - CORE
	get_element_loading_animation() {
		var loading_animation = document.createElement('div');
		EsbUtil.addClass(loading_animation, 'esb-loading-animation');
		return loading_animation;
	}

	// BOTH  - CORE - Rename!
	get_element_iframe_outer_wrap() {
		var self = this,
			iframe_outer_wrap = document.createElement('div'),
			styles = self.get_iframe_outer_wrap_styles(),
			style;

		EsbUtil.addClass(iframe_outer_wrap, 'esb-frame-iframe-wrap');
		for (style in styles) {
			iframe_outer_wrap.style[style] = styles[style];
		}

		return iframe_outer_wrap;
	}

	get_element_iframe_inner_wrap() {
		var self = this,
			iframe_inner_wrap = document.createElement('div'),
			styles = self.get_iframe_inner_wrap_styles(),
			style;

		EsbUtil.addClass(iframe_inner_wrap, 'esb-frame-iframe-inner-wrap');
		for (style in styles) {
			iframe_inner_wrap.style[style] = styles[style];
		}

		return iframe_inner_wrap;
	}


	// BOTH - RENAME
	get_element_iframe() {
		var self = this,
			iframe = document.createElement('iframe');

		EsbUtil.addClass(iframe, 'esb-frame-iframe');
		iframe.setAttribute('data-src', self.iframe_src);
		iframe.setAttribute('scrolling', self.options.scrolling);
		if (self.options['viewport-device']) { 
			iframe.style.height = self.device_dimensions['iframe-height'] + 'px';
		}

		return iframe;
	}



// CALCULATING HEIGHT, WIDTH, SCALE OF FRAME
	// BOTH - CORE - Refactor
	get_iframe_outer_wrap_styles() {
		var self = this,
			styles = {},
			height,
			device_frame_offsets,
			width = self.options.width;

		if (self.options.scale) {
			width = self.options['viewport-width'] * self.options.scale;
		}

		if (self.options.height) {
			height = self.options.height;
		}
		else if (self.is_component_frame) {
			height = 180; //Set a nice default height so the loading animation displays
		}
		else if (width && self.options['viewport-aspect-ratio']) {
			height = width * self.options['viewport-aspect-ratio'];
		}

		if (self.options['device-frame']) {
			device_frame_offsets = self.get_device_frame_dimension_offsets(self.options['viewport-device'], self.options['viewport-device-orientation']);
			width = width * device_frame_offsets.width;
			height = height * device_frame_offsets.height;
		}

		if (self.options.crop) {
			width = self.options.width;
		}

		if (!self.options.crop && self.is_component_frame) {
			width = 100;
			height = 100;
		}

		styles = {
			width: width + 'px',
			height: height + 'px'
		};

		if (height === 'auto') {
			styles[height] = 'auto';
		}

		return styles;
	}

	// BOTH - CORE - Refactor
	get_iframe_inner_wrap_styles() {
		var self = this,
			dimensions = self.get_iframe_dimensions();
		
		dimensions.width = dimensions.width + 'px';
		if (dimensions.height !== 'auto') {
			dimensions.height = dimensions.height + 'px';
		}
		dimensions.transform = 'scale(' + dimensions.scale + ')';
		dimensions.webkitTransform = 'scale(' + dimensions.scale + ')';
		delete dimensions.scale;

		if (self.options['offset-x']) {
			dimensions.left = self.options['offset-x'] + 'px';
		}
		
		if (self.options['offset-y']) {
			dimensions.top = self.options['offset-y'] + 'px';
		}

		return dimensions;
	}

	// BOTH - RENAME
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

		if (self.options.height !== 'auto') {
			if (self.options.height) {
				height = self.options.height / scale;
			}
			else {
				height = self.options['viewport-aspect-ratio'] * width;
			}
		}

		dimensions.height = height;
		dimensions.width = width;
		dimensions.scale = scale;

		return dimensions;
	}


// INSERTING PLACEHOLDER TO DOM, SETTING LOADING BEHAVIOR
	// BOTH - CORE
	inject_placeholder() {
		var self = this;
		self.original_element.parentNode.replaceChild(self.placeholder_element, self.original_element);
		self.viewer_element = self.placeholder_element;
		self.iframe_element = self.viewer_element.querySelector('iframe');
		
		self.dimensions_annotation_width_element = self.viewer_element.querySelector('.esb-frame-dimensions-width-value');
		self.dimensions_annotation_height_element = self.viewer_element.querySelector('.esb-frame-dimensions-height-value');
		self.dimensions_annotation_scale_element = self.viewer_element.querySelector('.esb-frame-scale-value');
		self.dimensions_annotation_element = self.viewer_element.querySelector('.esb-frame-dimensions-annotation');
		
		if (!self.has_loading_error) {
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
	}

	inject_placeholder_if_placeholder_is_created() {
		var self = this;
		self.is_placeholder_created().then(function(){
			self.inject_placeholder();
		});
	}

// MONITORING SCROLLING, VISIBILITY TO TRIGGER LOAD
	// BOTH - CORE
	is_iframe_loaded() {
		var self = this;
		return self.iframe_is_loaded;
	}

	// BOTH - CORE
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

	// BOTH - CORE
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

	// BOTH - CORE
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

	// BOTH - CORE
	monitor_scrollable_ancestors() {
		var self = this;

		Array.prototype.forEach.call(self.scrollable_ancestors, function(el){
			el.addEventListener('scroll', self.debounce_scroll_event.bind(self));
			el.addEventListener('resize', self.debounce_resize_event.bind(self));
		});
	}

	// BOTH - CORE - refactor
	set_iframe_onload_behavior() {
		var self = this;

		self.iframe_element.onload = function(){
			self.iframe_onload();
		};
	}

	iframe_onload() {
		var self = this;

		if (!self.iframe_is_loaded) {
			self.set_state('loaded');
			self.iframe_is_loaded = true;

			if (!self.options['unload-when-not-visible']) {
				self.stop_monitoring_scrollable_ancestors();
			}

			if (self.is_component_frame) {
				self.component_loaded_in_iframe_behavior();
			}
			else {
				self.set_dimensions_annotation_status('updated');
			}
		}
	}

	// COMPONENT FRAME ONLY - REFACTOR
	component_loaded_in_iframe_behavior() {
		var self = this;

		self.fit_frame_to_contents();
	}

	// BOTH - CORE
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

	// BOTH - CORE
	load_iframe() {
		var self = this;

		if (self.iframe_element.getAttribute('src') === null) {
			self.set_state('loading');
			self.iframe_element.setAttribute('src', self.iframe_element.getAttribute('data-src'));

			// trigger onload behavior after a timeout in case the onload event doesn't fire (seems to randomly not fire)
			setTimeout(function(){
				self.iframe_onload();
			}, 800);
		}
	}

	// BOTH - CORE
	load_iframe_if_visible() {
		var self = this;

		if (self.is_visible()) {
			self.load_iframe();
		}
	}

// BIND GLOBAL EVENT LISTENERS
	// BOTH - FEATURE
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


// STATE UPDATE METHODS
	// BOTH - Refactor?
	set_state(state) {
		var self = this;
		self.state = state;
		self.viewer_element.classList.add('esb-frame--is-' + state);
	}

	// BOTH - CORE
	update_dimensions_annotation(dimensions) {
		var self = this;

		if (self.dimensions_annotation_element !== null) {
			if (dimensions.width !== undefined && self.options.crop === false) {
				self.dimensions_annotation_width_element.textContent = dimensions.width;
			}

			if (dimensions.height !== undefined && self.options.crop === false) {
				self.dimensions_annotation_height_element.textContent = dimensions.height;
			}
			
			if (dimensions.scale !== undefined) {
				self.dimensions_annotation_scale_element.textContent = dimensions.scale + '%';
			}

			self.set_dimensions_annotation_status('updated');
		}
	}

	// BOTH - CORE - Refactor
	set_dimensions_annotation_status(status) {
		var self = this;

		if (self.dimensions_annotation_element !== null) {
			if (status === 'updated') {
				EsbUtil.removeClass(self.dimensions_annotation_element, 'esb-frame-dimensions--updating');
			}
			else if (status === 'updating') {
				EsbUtil.addClass(self.dimensions_annotation_element, 'esb-frame-dimensions--updating');
			}
		}
	}


// POST IFRAME LOADED METHODS
	// BOTH - CORE - REFACTOR
	set_frame_height(height) {
		var self = this,
			inner_wrap = self.viewer_element.querySelector('.esb-frame-iframe-inner-wrap'),
			scale = self.options.scale,
			wrap = self.viewer_element.querySelector('.esb-frame-iframe-wrap');
		
		inner_wrap.style.height = height + 'px';
		
		if (!self.options.crop) {
			if (!scale) {
				scale = self.options.width / self.options['viewport-width'];
			}
			wrap.style.height = (height * scale) + 'px';
		}

		self.update_dimensions_annotation({height: height});
	}

	// BOTH - CORE - REFACTOR
	set_frame_width(width) {
		var self = this,
			inner_wrap = self.viewer_element.querySelector('.esb-frame-iframe-inner-wrap'),
			scale = self.options.scale,
			wrap = self.viewer_element.querySelector('.esb-frame-iframe-wrap');

		inner_wrap.style.width = width + 'px';


		if (!self.options.crop) {
			if (!scale) {
				scale = self.options.width / self.options['viewport-width'];
			}
			wrap.style.width = (width * scale) + 'px';
		}

		self.update_dimensions_annotation({width: width});
	}

	// COMPONENT FRAME ONLY
	fit_frame_to_contents() {
		var self = this,
			content,
			content_height,
			content_width,
			document_loaded_interval,
			blocks_done_interval,
			previous_width,
			previous_height,
			assets_done_loading_interval,
			wrapper_element = document.createElement('span');
		
		wrapper_element.style.display = 'inline-block';
		wrapper_element.style.marginTop = '-1px;';
		wrapper_element.style.paddingTop = '1px;';
		wrapper_element.style.marginBottom = '-1px;';
		wrapper_element.style.paddingBottom = '1px;';
		if (self.is_option_overridden('viewport-width')) {
			wrapper_element.style.width = self.options['viewport-width'] + 'px';
		}
		self.set_dimensions_annotation_status('updating');


		document_loaded_interval = setInterval(function(){
			// Make sure the document in the content window exists
			if (self.iframe_element.contentWindow !== null) {
				clearInterval(document_loaded_interval);

				blocks_done_interval = setInterval(function(){
					// Make sure blocks has finished doing its thing
					if (self.iframe_element.contentWindow.blocks_done) {
						clearInterval(blocks_done_interval);

						content = self.iframe_element.contentWindow.document.querySelector(self.options['component-frame-template-target']).innerHTML;
						wrapper_element.innerHTML = content;
						// Wrap contents with a display: inline-block; element to get an accurate height and width
						self.iframe_element.contentWindow.document.querySelector(self.options['component-frame-template-target']).innerHTML = '';
						self.iframe_element.contentWindow.document.querySelector(self.options['component-frame-template-target']).appendChild(wrapper_element);

						// Take a pause before assessing height since the appendChild causes the DOM to reload
						// content_height = EsbUtil.outerHeight(wrapper_element);
						// content_width = EsbUtil.outerWidth(wrapper_element);


						assets_done_loading_interval = setInterval(function(){
							content_height = EsbUtil.outerHeight(wrapper_element);
							content_width = EsbUtil.outerWidth(wrapper_element);
							
							if (content_height === previous_height && content_width === previous_width) {
								// Unwrap contents
								content = wrapper_element.innerHTML;
								self.iframe_element.contentWindow.document.querySelector(self.options['component-frame-template-target']).innerHTML = content;
								clearInterval(assets_done_loading_interval);
								// Add a slight delay so the dom can re-render correctly and we get accurate width and height calculations
								setTimeout(function(){
									self.set_frame_height(content_height);
									self.set_frame_width(content_width);

									EsbUtil.addClass(self.viewer_element, 'esb-frame--dynamically-resized');
								}, 100);
							}
							else {
								previous_height = content_height;
								previous_width = content_width;
							}
							
						}, 250);
					}
				}, 10);
			}
		}, 10);
	}

	// BOTH - CORE
	stop_monitoring_scrollable_ancestors() {
		var self = this;

		Array.prototype.forEach.call(self.scrollable_ancestors, function(el){
			el.removeEventListener('scroll', self.debounce_scroll_event.bind(self));
			el.removeEventListener('resize', self.debounce_resize_event.bind(self));
		});
	}

	// BOTH - CORE
	unload_iframe() {
		var self = this,
			unloaded_frame = self.get_placeholder_element();

		self.viewer_element.parentNode.replaceChild(unloaded_frame, self.viewer_element);
		self.viewer_element = unloaded_frame;
		self.iframe_element = self.viewer_element.querySelector('iframe');
		self.set_iframe_onload_behavior();
		self.iframe_is_loaded = false;
	}

	// BOTH - CORE
	unload_iframe_if_not_visible() {
		var self = this;

		if (!self.is_visible()) {
			self.unload_iframe();
		}
	}


// IPHONE / DEVICE FRAMING FUNCTIONALITY
	// FRAME ONLY - FEATURE
	get_element_browser_ui(direction) {
		var self = this,
			browser_ui,
			browser_ui_height,
			device_orientation = self.options['viewport-device-orientation'],
			device_name = self.options['viewport-device'],
			apple_devices = ['iphone-4', 'iphone-5', 'iphone-6', 'iphone-6-plus', 'ipad'],
			is_apple_device = apple_devices.indexOf(device_name) !== -1,
			browser_ui_class;


		if (self.options['show-browser-ui'] && self.device_presets[device_name]['browser-ui-' + direction + '-' + device_orientation] > 0) {
			browser_ui_height = self.device_presets[device_name]['browser-ui-' + direction + '-' + device_orientation];
			browser_ui_class = 'esb-frame-browser-ui-' + direction + ' esb-frame-browser-ui-' + direction + '-' + device_name;
			if (is_apple_device) {
				browser_ui_class += ' esb-frame-browser-ui-apple';
			}
			else {
				browser_ui_class += ' esb-frame-browser-ui-android';
			}

			browser_ui = document.createElement('div');
			EsbUtil.addClass(browser_ui, browser_ui_class);
			browser_ui.style.height = browser_ui_height + 'px';
		}

		return browser_ui;
	}

	// FRAME ONLY
	get_device_dimensions(key, orientation, show_browser_ui) {
		var self = this,
			result_dimensions = false,
			height,
			iframe_height,
			width,
			aspect_ratio;

		height = self.device_presets[key].height;
		width = self.device_presets[key].width;

		if (orientation === 'landscape') {
			width = self.device_presets[key].height;
			height = self.device_presets[key].width;
		}

		// Calculate aspect ratio without browser ui
		iframe_height = height;
		aspect_ratio = (height / width).toFixed(5);
		
		// Adjust height only if browser ui is shown
		if (show_browser_ui) {
			iframe_height = height - (self.device_presets[key]['browser-ui-top-' + orientation] - self.device_presets[key]['browser-ui-bottom-' + orientation]);
		}

		result_dimensions = {
			'iframe-height': iframe_height,
			'height': height,
			'width': width,
			'aspect-ratio': aspect_ratio		
		};

		return result_dimensions;
	}

	// FRAME ONLY
	get_element_device_frame(key, orientation) {
		var self = this,
			device_frame;

		if (self.device_presets[key] !== undefined) {
			device_frame = document.createElement('div');
			device_frame.innerHTML = self.device_presets[key].svg;

			if (orientation === 'landscape') {
				device_frame.innerHTML = self.device_presets[key]['svg-landscape'];
			}
			device_frame = device_frame.firstChild;
		}

		return device_frame;
	}

	// FRAME ONLY
	get_device_frame_dimension_offsets(key, orientation) {
		var self = this,
			width,
			height;

		width = self.device_presets[key]['frame-width-multiplier'];
		height = self.device_presets[key]['frame-height-multiplier'];

		if (orientation === 'landscape') {
			width = self.device_presets[key]['frame-height-multiplier'];
			height = self.device_presets[key]['frame-width-multiplier'];
		}

		return {'width': width, 'height': height};
	}

	set_device_presets() {
		var self = this;
		self.device_presets = {
			'iphone-4': {
				'annotation-name': 'iPhone 4',
				'width': 320,
				'height': 480,
				'browser-ui-top-portrait': 40,
				'browser-ui-bottom-portrait': 0,
				'browser-ui-top-landscape': 0,
				'browser-ui-bottom-landscape': 0,
				'svg':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 132 243.875" enable-background="new 0 0 132 243.875" xml:space="preserve"> <g> <path id="bezel_2_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M131,226.883c0,8.833-7.191,15.992-16.062,15.992H17.062 C8.191,242.875,1,235.716,1,226.883V16.992C1,8.159,8.191,1,17.062,1h97.875C123.808,1,131,8.159,131,16.992V226.883L131,226.883z" /> <path id="speaker" fill="none" stroke="#7F89A3" d="M78,26.665c0,0.635-0.439,1.147-0.98,1.147H56.917 c-0.542,0-0.98-0.513-0.98-1.147v-2.58c0-0.635,0.439-1.147,0.98-1.147h20.101c0.541,0,0.979,0.513,0.979,1.147v2.58H78z"/> <circle id="camera_1_" fill="none" stroke="#7F89A3" cx="67" cy="12.919" r="3"/> <ellipse id="lock_1_" fill="none" stroke="#7F89A3" cx="66.039" cy="222.92" rx="10.041" ry="10.001"/> </g> </svg>',
				'svg-landscape':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 243.875 132" enable-background="new 0 0 243.875 132" xml:space="preserve"> <g> <path id="bezel_2_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M226.883,1c8.833,0,15.992,7.191,15.992,16.062v97.874 c0,8.87-7.159,16.062-15.992,16.062L16.992,131C8.159,131,1,123.808,1,114.937V17.062C1,8.191,8.159,1,16.992,1H226.883L226.883,1z "/> <path id="speaker" fill="none" stroke="#7F89A3" d="M26.665,54c0.635,0,1.147,0.439,1.147,0.98v20.102 c0,0.543-0.513,0.979-1.147,0.979h-2.58c-0.635,0-1.147-0.438-1.147-0.979V54.98c0-0.541,0.513-0.98,1.147-0.98H26.665L26.665,54z" /> <circle id="camera_1_" fill="none" stroke="#7F89A3" cx="12.919" cy="65" r="3"/> <ellipse id="lock_1_" fill="none" stroke="#7F89A3" cx="222.92" cy="65.959" rx="10.001" ry="10.04"/> </g> </svg>',
				'frame-width-multiplier':'1.189',
				'frame-height-multiplier':'1.465'
			},
			'iphone-5': {
				'annotation-name': 'iPhone 5',
				'width': 320,
				'height': 568,
				'browser-ui-top-portrait': 40,
				'browser-ui-bottom-portrait': 0,
				'browser-ui-top-landscape': 0,
				'browser-ui-bottom-landscape': 0,
				'svg':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 132 273.875" enable-background="new 0 0 132 273.875" xml:space="preserve"> <g> <path id="bezel_1_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M131,256.883c0,8.833-7.191,15.992-16.062,15.992H17.062 C8.191,272.875,1,265.716,1,256.883V16.992C1,8.159,8.191,1,17.062,1h97.875C123.808,1,131,8.159,131,16.992V256.883L131,256.883z" /> <path id="speaker_1_" fill="none" stroke="#7F89A3" d="M78,26.665c0,0.635-0.439,1.147-0.98,1.147H56.917 c-0.542,0-0.98-0.513-0.98-1.147v-2.58c0-0.635,0.439-1.147,0.98-1.147h20.102c0.541,0,0.98,0.513,0.98,1.147V26.665L78,26.665z"/> <circle id="camera_2_" fill="none" stroke="#7F89A3" cx="67" cy="12.919" r="3"/> <ellipse id="lock_2_" fill="none" stroke="#7F89A3" cx="66.039" cy="252.92" rx="10.041" ry="10.001"/> </g> </svg>',
				'svg-landscape':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 273.875 132" enable-background="new 0 0 273.875 132" xml:space="preserve"> <g> <path id="bezel_1_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M256.883,1c8.833,0,15.992,7.191,15.992,16.062v97.876 c0,8.869-7.159,16.062-15.992,16.062H16.992C8.159,131,1,123.808,1,114.938V17.062C1,8.191,8.159,1,16.992,1H256.883L256.883,1z"/> <path id="speaker_1_" fill="none" stroke="#7F89A3" d="M26.665,54c0.635,0,1.147,0.439,1.147,0.98v20.104 c0,0.541-0.513,0.979-1.147,0.979h-2.58c-0.635,0-1.147-0.438-1.147-0.979V54.98c0-0.541,0.513-0.98,1.147-0.98H26.665L26.665,54z" /> <circle id="camera_2_" fill="none" stroke="#7F89A3" cx="12.919" cy="65" r="3"/> <ellipse id="lock_2_" fill="none" stroke="#7F89A3" cx="252.92" cy="65.96" rx="10.001" ry="10.04"/> </g> </svg>',
				'frame-width-multiplier':'1.188',
				'frame-height-multiplier':'1.39'
			},
			'iphone-6': {
				'annotation-name': 'iPhone 6',
				'width': 375,
				'height': 667,
				'browser-ui-top-portrait': 40,
				'browser-ui-bottom-portrait': 0,
				'browser-ui-top-landscape': 0,
				'browser-ui-bottom-landscape': 0,
				'svg':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 150 307.875" enable-background="new 0 0 150 307.875" xml:space="preserve"> <g> <path id="bezel_3_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M149,290.883c0,8.833-7.191,15.992-16.062,15.992H17.062 C8.191,306.875,1,299.716,1,290.883V16.992C1,8.159,8.191,1,17.062,1h115.875C141.809,1,149,8.159,149,16.992V290.883L149,290.883z "/> <path id="speaker_2_" fill="none" stroke="#7F89A3" d="M86.031,26.665c0,0.635-0.439,1.147-0.98,1.147H64.949 c-0.542,0-0.98-0.513-0.98-1.147v-2.58c0-0.635,0.439-1.147,0.98-1.147H85.05c0.541,0,0.979,0.513,0.979,1.147v2.58H86.031z"/> <circle id="camera_3_" fill="none" stroke="#7F89A3" cx="75" cy="12.919" r="3"/> <ellipse id="lock_3_" fill="none" stroke="#7F89A3" cx="75" cy="286.92" rx="10.04" ry="10.001"/> </g> </svg>',
				'svg-landscape':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 307.875 149.998" enable-background="new 0 0 307.875 149.998" xml:space="preserve"> <g> <path id="bezel_3_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M290.883,1c8.833,0,15.992,7.191,15.992,16.062v115.875 c0,8.869-7.159,16.062-15.992,16.062H16.992c-8.833,0-15.992-7.19-15.992-16.06V17.062C1,8.191,8.159,1,16.992,1H290.883L290.883,1 z"/> <path id="speaker_2_" fill="none" stroke="#7F89A3" d="M26.665,63.968c0.635,0,1.147,0.439,1.147,0.98V85.05 c0,0.542-0.513,0.98-1.147,0.98h-2.58c-0.635,0-1.147-0.439-1.147-0.98V64.948c0-0.541,0.513-0.98,1.147-0.98H26.665L26.665,63.968 z"/> <circle id="camera_3_" fill="none" stroke="#7F89A3" cx="12.919" cy="74.999" r="3"/> <ellipse id="lock_3_" fill="none" stroke="#7F89A3" cx="286.92" cy="74.999" rx="10.001" ry="10.04"/> </g> </svg>',
				'frame-width-multiplier':'1.16',
				'frame-height-multiplier':'1.34'
			},
			'iphone-6-plus': {
				'annotation-name': 'iPhone 6 Plus',
				'width': 414,
				'height': 736,
				'browser-ui-top-portrait': 40,
				'browser-ui-bottom-portrait': 0,
				'browser-ui-top-landscape': 0,
				'browser-ui-bottom-landscape': 0,
				'svg':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 164 331.875" enable-background="new 0 0 164 331.875" xml:space="preserve"> <g> <path id="bezel_4_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M163,314.883c0,8.833-7.191,15.992-16.062,15.992H17.062 C8.191,330.875,1,323.716,1,314.883V16.992C1,8.159,8.191,1,17.062,1h129.875C155.808,1,163,8.159,163,16.992V314.883L163,314.883z "/> <path id="speaker_3_" fill="none" stroke="#7F89A3" d="M93.03,26.665c0,0.635-0.438,1.147-0.979,1.147H71.948 c-0.542,0-0.98-0.513-0.98-1.147v-2.58c0-0.635,0.439-1.147,0.98-1.147h20.1c0.541,0,0.98,0.513,0.98,1.147L93.03,26.665 L93.03,26.665z"/> <circle id="camera_4_" fill="none" stroke="#7F89A3" cx="81.999" cy="12.919" r="3"/> <ellipse id="lock_4_" fill="none" stroke="#7F89A3" cx="81.999" cy="310.92" rx="10.042" ry="10.001"/> </g> </svg>',
				'svg-landscape':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 331.875 163.998" enable-background="new 0 0 331.875 163.998" xml:space="preserve"> <g> <path id="bezel_4_" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M314.883,1c8.833,0,15.992,7.191,15.992,16.062v129.875 c0,8.869-7.159,16.062-15.992,16.062H16.992C8.159,162.998,1,155.808,1,146.937V17.062C1,8.191,8.159,1,16.992,1H314.883L314.883,1 z"/> <path id="speaker_3_" fill="none" stroke="#7F89A3" d="M26.665,70.968c0.635,0,1.147,0.439,1.147,0.98V92.05 c0,0.542-0.513,0.98-1.147,0.98h-2.58c-0.635,0-1.147-0.439-1.147-0.98V71.948c0-0.541,0.513-0.98,1.147-0.98H26.665L26.665,70.968 z"/> <circle id="camera_4_" fill="none" stroke="#7F89A3" cx="12.919" cy="81.999" r="3"/> <ellipse id="lock_4_" fill="none" stroke="#7F89A3" cx="310.92" cy="81.999" rx="10.001" ry="10.04"/> </g> </svg> ',
				'frame-width-multiplier':'1.15',
				'frame-height-multiplier':'1.31'
			},
			'ipad': {
				'annotation-name': 'iPad',
				'width': 768,
				'height': 1024,
				'browser-ui-top-portrait': 42,
				'browser-ui-bottom-portrait': 0,
				'browser-ui-top-landscape': 42,
				'browser-ui-bottom-landscape': 0,
				'svg':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 300.917 419.917" enable-background="new 0 0 300.917 419.917" xml:space="preserve"> <g id="IPAD" transform="translate(681.000000, 55.000000)"> <path id="bezel" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M-393.096,363.917h-274.89 c-6.635,0-12.014-5.377-12.014-12.01V-41.99c0-6.633,5.378-12.01,12.014-12.01h274.89c6.635,0,12.014,5.377,12.014,12.01v393.898 C-381.083,358.541-386.461,363.917-393.096,363.917z"/> <path id="bezel-2" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M-393.096,363.917h-274.89 c-6.635,0-12.014-5.377-12.014-12.01V-41.99c0-6.633,5.378-12.01,12.014-12.01h274.89c6.635,0,12.014,5.377,12.014,12.01v393.898 C-381.083,358.541-386.461,363.917-393.096,363.917z"/> <circle id="lock" fill="none" stroke="#7F89A3" cx="-530.541" cy="346.938" r="8.021"/> <circle id="camera" fill="none" stroke="#7F89A3" cx="-530.542" cy="-37.093" r="2.99"/> </g> </svg>',
				'svg-landscape':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 419.917 300.917" enable-background="new 0 0 419.917 300.917" xml:space="preserve"> <g id="IPAD" transform="translate(681.000000, 55.000000)"> <path id="bezel" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M-262.083-41.986v274.89c0,6.635-5.377,12.014-12.01,12.014 H-667.99c-6.633,0-12.01-5.377-12.01-12.014v-274.89C-680-48.622-674.623-54-667.99-54h393.898 C-267.459-54-262.083-48.622-262.083-41.986z"/> <path id="bezel-2" fill="#FFFFFF" stroke="#7F89A3" stroke-width="2" d="M-262.083-41.986v274.89 c0,6.635-5.377,12.014-12.01,12.014H-667.99c-6.633,0-12.01-5.377-12.01-12.014v-274.89C-680-48.622-674.623-54-667.99-54h393.898 C-267.459-54-262.083-48.622-262.083-41.986z"/> <circle id="lock" fill="none" stroke="#7F89A3" cx="-279.063" cy="95.458" r="8.021"/> <circle id="camera" fill="none" stroke="#7F89A3" cx="-663.093" cy="95.459" r="2.99"/> </g> </svg>',
				'frame-width-multiplier':'1.14',
				'frame-height-multiplier':'1.194'
			},
			'nexus-10': {
				'annotation-name': 'Nexus 10',
				'width': 800,
				'height': 1280,
				'browser-ui-top-portrait': 20,
				'browser-ui-bottom-portrait': 0,
				'browser-ui-top-landscape': 20,
				'browser-ui-bottom-landscape': 0,
				'svg':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 472.125 696.723" enable-background="new 0 0 472.125 696.723" xml:space="preserve"> <g> <path fill="#FFFFFF" stroke="#58595B" d="M67.5,696.223c-37.002,0-67-29.997-67-67V67.5c0-37.003,29.998-67,67-67h337.125 c37.004,0,67,29.997,67,67v561.723c0,37.003-29.996,67-67,67H67.5z"/> <circle fill="#FFFFFF" stroke="#000000" cx="443.623" cy="317.894" r="3.25"/> <circle fill="#FFFFFF" stroke="#000000" cx="443.873" cy="376.644" r="4"/> </g> </svg>',
				'svg-landscape':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 696.722 472.125" enable-background="new 0 0 696.722 472.125" xml:space="preserve"> <g> <path fill="#FFFFFF" stroke="#58595B" d="M696.222,404.625c0,37.002-29.998,67-67,67H67.5c-37.003,0-67-29.998-67-67V67.5 c0-37.004,29.997-67,67-67h561.722c37.002,0,67,29.996,67,67V404.625z"/> <circle fill="#FFFFFF" stroke="#000000" cx="317.894" cy="28.502" r="3.25"/> <circle fill="#FFFFFF" stroke="#000000" cx="376.643" cy="28.252" r="4"/> </g> </svg>',
				'frame-width-multiplier':'1.305',
				'frame-height-multiplier':'1.204'
			},
			'galaxy-s6': {
				'annotation-name': 'Galaxy S6',
				'width':360,
				'height':640,
				'browser-ui-top-portrait': 20,
				'browser-ui-bottom-portrait': 0,
				'browser-ui-top-landscape': 20,
				'browser-ui-bottom-landscape': 0,
				'svg':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 163 335" enable-background="new 0 0 163 335" xml:space="preserve"> <g> <path fill="#FFFFFF" stroke="#808285" d="M162.5,308.5c0,14.359-11.641,26-26,26h-110c-14.359,0-26-11.641-26-26v-282 c0-14.359,11.641-26,26-26h110c14.359,0,26,11.641,26,26V308.5z"/> <path fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" d="M100.834,316.5c0,4.418-3.582,8-8,8H70.167c-4.418,0-8-3.582-8-8 l0,0c0-4.418,3.582-8,8-8h22.667C97.252,308.5,100.834,312.082,100.834,316.5L100.834,316.5z"/> <path fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" d="M97.492,13.042c0,1.381-1.119,2.5-2.5,2.5H68.009 c-1.381,0-2.5-1.119-2.5-2.5l0,0c0-1.381,1.119-2.5,2.5-2.5h26.983C96.373,10.542,97.492,11.661,97.492,13.042L97.492,13.042z"/> <circle fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" cx="50.365" cy="12.354" r="2.438"/> <circle fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" cx="57.99" cy="12.354" r="2.438"/> <circle fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" cx="120.428" cy="12.229" r="4.125"/> </g> </svg>',
				'svg-landscape':'<svg class="esb-frame-device" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 335 163" enable-background="new 0 0 335 163" xml:space="preserve"> <g> <path fill="#FFFFFF" stroke="#808285" d="M308.5,0.5c14.359,0,26,11.641,26,26v110c0,14.359-11.641,26-26,26h-282 c-14.359,0-26-11.641-26-26v-110c0-14.359,11.641-26,26-26H308.5z"/> <path fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" d="M316.5,62.166c4.418,0,8,3.582,8,8v22.667c0,4.418-3.582,8-8,8 l0,0c-4.418,0-8-3.582-8-8V70.166C308.5,65.748,312.083,62.166,316.5,62.166L316.5,62.166z"/> <path fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" d="M13.042,65.508c1.381,0,2.5,1.119,2.5,2.5v26.984 c0,1.381-1.119,2.5-2.5,2.5l0,0c-1.381,0-2.5-1.119-2.5-2.5V68.008C10.542,66.627,11.661,65.508,13.042,65.508L13.042,65.508z"/> <circle fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" cx="12.354" cy="112.635" r="2.438"/> <circle fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" cx="12.354" cy="105.01" r="2.438"/> <circle fill="#FFFFFF" stroke="#808285" stroke-miterlimit="10" cx="12.229" cy="42.572" r="4.125"/> </g> </svg>',
				'frame-width-multiplier':'1.098',
				'frame-height-multiplier':'1.268'
			}
		};
	}
}