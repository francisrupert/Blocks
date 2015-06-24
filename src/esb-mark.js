import EsbConfig from './esb-config';
import EsbUtil from './esb-util';
import EsbPage from './esb-page';

export class EsbMark {
	constructor(opts) {
		var self = this,
			uuid = opts.uuid;
			self.mark_element = opts.mark_element;

			self.config = EsbConfig.getConfig();
			self.uuid = uuid;
			self.options = null;
			self.set_mark_options();
	}

	set_mark_options() {
		var self = this,
			options = {
				'mark': null,
				'id': null,
				'show-id': true,
				'mark-position': 'top-left',
				'outline': true,
				'group': null,
				'visible-on-load': true,
				'href': false
			},
			option = null,
			value = null,
			el = self.mark_element,
			page_level_config_element = false,
			config_json_global_options = self.config.get('marks');

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
			if (el.tagName !== undefined && el.getAttribute('data-esb-mark-config') !== null) {
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
			value = self.mark_element.getAttribute('data-esb-' + option);
			if (value !== null && value.length > 0) {
				options[option] = EsbUtil.booleanXorValue(value);
			}
		}

		self.options = options;
	}

	render() {
		var self = this,
			label_element = self.get_label_element(),
			mark_wrapper,
			i,
			group_classes;

		if (EsbUtil.isVoidElement(self.mark_element)) {
			// The element being marked cannot have children appended (img, input, etc.)
			mark_wrapper = self.add_mark_wrapper();
		}
		else {
			mark_wrapper = self.mark_element;
		}

		EsbUtil.addClass(mark_wrapper, 'esb-mark');
		EsbUtil.addClass(mark_wrapper, 'esb-mark-position-' + self.options['mark-position']);
		EsbUtil.addClass(mark_wrapper, self.get_css_position_class(mark_wrapper));

		if (!self.options['visible-on-load']) {
			EsbUtil.addClass(mark_wrapper, 'esb-mark--is-hidden');
		}

		if (self.options.outline) {
			EsbUtil.addClass(mark_wrapper, 'esb-mark--has-outline');
		}

		if (self.options.group !== null) {
			group_classes = self.options.group.split(' ');
			for (i=0; i < group_classes.length; i++) {
				group_classes[i] = 'esb-mark-group-' + group_classes[i];
			}
			self.options.group = group_classes.join(' ');
			EsbUtil.addClass(mark_wrapper, self.options.group);
		}

		mark_wrapper.appendChild(label_element);
	}

	add_mark_wrapper() {
		var self = this,
			wrapper = document.createElement('span'),
			original_element_styles,
			i,
			original_value,
			property_name,
			styles_to_copy = [
				'float',
				'display'
			];

		original_element_styles = window.getComputedStyle(self.mark_element, null);

		for (i=0; i < styles_to_copy.length; i++) {
			property_name = styles_to_copy[i];
			original_value = original_element_styles.getPropertyValue(property_name);

			if (property_name === 'display' && original_value === 'inline') {
				original_value = 'inline-block';
			}

			wrapper.style[property_name] = original_value;
		}

		// wrapper.style.cssText = window.getComputedStyle(self.mark_element, null).cssText;
		wrapper.appendChild(self.mark_element.cloneNode((true)));

		self.mark_element.parentNode.replaceChild(wrapper, self.mark_element);

		return wrapper;
	}

	get_css_position_class(wrapper) {
		var css_position_class = '',
			css_position = 'static';

		css_position = window.getComputedStyle(wrapper, null).getPropertyValue('position');

		css_position_class = 'esb-mark--has-' + css_position + '-position';
		return css_position_class;
	}

	get_label_element() {
		var self = this,
			label_element = document.createElement('label'),
			label_id_element = self.get_label_id_element(),
			label_name_element = self.get_label_name_element();

		if (self.options.href) {
			label_element = document.createElement('a');
			label_element.href = self.options.href;
			EsbUtil.addClass(label_element, 'esb-mark-link');
		}

		EsbUtil.addClass(label_element, 'esb-mark-label');

		if (self.options['show-id']) {
			label_element.appendChild(label_id_element);
		}

		if (label_name_element !== null) {
			label_element.appendChild(label_name_element);
			EsbUtil.addClass(label_element, 'esb-mark-label--has-name');
		}

		return label_element;
	}

	get_label_name_element() {
		var self = this,
			label_name = document.createElement('span'),
			label_content = self.get_label_name();

		if (label_content === null) {
			label_name = null;
		}
		else {
			label_name.textContent = label_content;
			EsbUtil.addClass(label_name, 'esb-mark-label-name');
		}

		return label_name;
	}

	get_label_name() {
		var self = this,
			mark_label = self.options.mark;

		return mark_label;
	}

	get_label_id_element() {
		var self = this,
			label_id = document.createElement('span'),
			label_content = self.get_label_id();

		label_id.textContent = label_content;
		EsbUtil.addClass(label_id, 'esb-mark-label-id');

		return label_id;
	}

	get_label_id() {
		var self = this,
			id = self.options.id;

		if (id === null) {
			id = EsbPage.getEsbMarkAutoId();
		}

		return id;
	}
}