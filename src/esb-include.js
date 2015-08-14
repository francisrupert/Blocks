import handlebars from 'handlebars';
import EsbConfig from './esb-config';
import EsbUtil from './esb-util';

export class EsbInclude {
// SETUP
	constructor(opts) {
		var self = this;
		self.config = EsbConfig.getConfig();
	    self.logger = EsbUtil.logger;

		self.original_element = opts.viewer_element;
		self.include_snippet = opts.include_snippet;
		self.uuid = opts.uuid;
		self.parent_include = opts.parent_include === undefined ? false : opts.parent_include;
		self.child_include_snippets = false;
		self.compiled_html = false;


		self.overridden_options = [];
		self.options = self.get_include_options();
		self.include_file_path = self.get_include_file_path();
		self.content_object = self.get_content_object();
	}

	get_default_options() {
		var self = this,
			options = {
				variation: 'default',
				source: 'includes/',
				replace_snippet: true,
				include: false,
				component: false,
				content: false
			};

		return options;
	}

	get_global_config_option(option_name) {
		var self = this,
			option_value,
			config_json_global_options = self.config.get('includes');

		// Backward compatibility with config.json 'components'
		if (config_json_global_options === undefined && self.config.get('components') !== undefined) {
			config_json_global_options = self.config.get('components');
		}

		if (config_json_global_options !== undefined) {
			option_value = config_json_global_options.get(option_name);
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
			if (el.tagName !== undefined && el.getAttribute('data-esb-include-config') !== null) {
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

		option_value = self.include_snippet.getAttribute('data-esb-' + option_name);
		if (option_value !== null && option_value.length > 0) {
			option_value = EsbUtil.booleanXorValue(option_value);
		}
		else {
			option_value = undefined;
		}

		return option_value;
	}

	get_include_options() {
		var self = this,
			options = self.get_default_options(),
			option = null,
			value = null;

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

		return options;
	}

	get_include_file_path() {
		var self = this,
			file_path;
		if (!self.options.source.match(/\/$/)) {
			self.options.source += '/';
		}

		if (self.options.include) {
			file_path = self.options.source + self.options.include;
		}
		else if (self.options.component) {
			file_path = self.options.source + self.options.component;
		}

		if (!file_path.match(/.html$/)) {
			file_path += '.html';
		}

		return file_path;
	}

	get_content_object() {
		var self = this,
			content_object = {},
			data_keys,
			content_data,
			i;

		if (self.options.content) {
			if (EsbUtil.is_json(self.options.content)) {
				content_object = JSON.parse(self.options.content);
			}
			else {
				data_keys = self.options.content.split('.');
				content_data = self.config.get('template_data');
				
				if (content_data !== undefined) {
					content_object = content_data;
					for (i=0; i < data_keys.length; i++) {
						content_object = content_object[data_keys[i]];
					}
				}
			}
		}

		return content_object;
	}

// RENDERING
	retrieve_html() {
		var self = this,
			uri,
			req;

	    return new Promise(function(resolve, reject) {
			uri = self.include_file_path;
			req = new XMLHttpRequest();

			req.open('GET', uri);

			req.onload = function() {
				if (req.status === 200 || req.readyState === 4) {
				  resolve(req.response);
				}
				else {
					self.logger('error', 'FAILED TO FETCH INCLUDE FILE: ' + uri + ' returned ' + req.statusText);
					resolve(Error(req.statusText));
				}
			};

			req.onerror = function() {
				reject(Error('Network Error'));
			};

			req.send();
		});
	}

	parse_variation(full_include_html) {
		// Given the raw HTML out of an include file, find just the variation we're looking for
		var self = this,
			temp_dom = document.createElement('html'),
			variation_html;

			temp_dom.innerHTML = full_include_html;
			variation_html = temp_dom.querySelectorAll('*[data-esb-variation="' + self.options.variation + '"]')[0].innerHTML;
		return variation_html;
	}

	compile_html_with_content(variation_html) {
		var self = this;
        return handlebars.compile(variation_html)(self.content_object);
	}

	find_include_snippets() {
		var self = this,
			temp_dom = document.createElement('html'),
			include_snippets,
			uuid,
			i;

		temp_dom.innerHTML = self.compiled_html;
		include_snippets = temp_dom.querySelectorAll('*[data-esb-component], *[data-component], *[data-esb-include]');
		window.console.log(include_snippets);

		if (include_snippets === undefined) {
			include_snippets = [];
		}
		else {
			for (i=0; i<include_snippets.length; i++) {
				uuid = EsbUtil.generateUUID();
				include_snippets[0].setAttribute('data-esb-uuid', uuid);
			}
			// write compiled_html back after adding uuids to all child includes
			self.compiled_html = temp_dom.getElementsByTagName('body')[0].innerHTML;
		}
		return include_snippets;
	}

	render_child_includes() {
		var self = this,
			i,
			child_include_promises = [],
			include_snippet,
			include,
			uuid;

		for(i=0; i < self.child_include_snippets.length; i++) {
			include_snippet = self.child_include_snippets[i];
			uuid = include_snippet.getAttribute('data-esb-uuid');
			include = new EsbInclude({include_snippet: include_snippet, uuid: uuid, parent_include: self})
			child_include_promises.push(include.render_include());
		}

		return Promise.all(child_include_promises);
	}

	render_include() {
		var self = this,
			variation_html,
			compiled_html,
			rendered_include,
			child_include,
			temp_dom,
			i;

		return new Promise(function(resolve, reject){
			self.retrieve_html().then(function(html){
				variation_html = self.parse_variation(html);
				self.compiled_html = self.compile_html_with_content(variation_html);

				self.child_include_snippets = self.find_include_snippets();
				if (self.child_include_snippets.length === 0) {
					rendered_include = self.compiled_html;
					// No children, replace/insert compiled_html where snippet is and resolve
					// self.insert_rendered_include(rendered_include);
					resolve(self);
				}
				else {
					// Recursion here somehow
					self.render_child_includes().then(function(rendered_include_array){
						var temp_dom = document.createElement('html');
						temp_dom.innerHTML = self.compiled_html;
						for (i=0; i<rendered_include_array.length; i++) {
							child_include = rendered_include_array[i];
							// Find the location of each child snippet within the parent and replace it with the compiled html
							temp_dom.querySelector('[data-esb-uuid="' + child_include.uuid + '"]').outerHTML = child_include.compiled_html;
						}
						self.compiled_html = temp_dom.getElementsByTagName('body')[0].innerHTML;
						resolve(self);
					});
				}
			}, function(error){
				reject(error);
			});
		});
	}
}