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
				'position': 'top-left',
				'outline': true,
				'group': null
			},
			option = null,
			value = null,
			el = self.mark_element,
			page_level_config_element = false,
			config_json_global_options = self.config.get('marks');

			// window.console.log(self.mark_element);

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
			label_element = self.get_label_element();

		EsbUtil.addClass(self.mark_element, 'esb-mark');
		EsbUtil.addClass(self.mark_element, 'esb-mark-position-' + self.options.position);

		self.mark_element.appendChild(label_element);
	}

	get_label_element() {
		var self = this,
			label_element = document.createElement('label'),
			label_id_element = self.get_label_id_element(),
			label_name_element = self.get_label_name_element();

		EsbUtil.addClass(label_element, 'esb-mark-label');

		label_element.appendChild(label_id_element);

		if (label_name_element !== null) {
			label_element.appendChild(label_name_element);
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