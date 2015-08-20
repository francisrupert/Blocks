import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import { EsbMark } from 'src/esb-mark';
import EsbPage from 'src/esb-page';

function load_mark(fixture, uuid) {
	var mark;
	uuid = typeof uuid === 'undefined' ? EsbUtil.generateUUID() : uuid;

	loadFixtures(fixture);
	mark_element = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-mark]')[0];

	mark = new EsbMark({
        uuid: uuid,
        mark_element: mark_element
	});	

	return mark;
}


describe("EsbMark", function(){
	var mark = null,
		mark_snippet = null,
		uuid = null;

	beforeAll(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});
	});

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		mark = load_mark('mark.html', uuid);
		EsbPage.esb_mark_auto_id = 1;
	});


	it("should have a uuid", function(){
		expect(mark.uuid).toEqual(uuid);
	});

	it ("should have default options", function(){
		expect(mark.options).toEqual({'mark': null, 'id': null, 'show-id-with-name': false, 'mark-position': 'top-left', 'outline': true, 'group': null, 'visible-on-load': true, 'href': false});
	});

	it("should inject an esb-mark-label into the DOM", function(){
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label')).toBeInDOM();
	});

	it ("should have a class of esb-mark-position-top-left by default", function(){
		mark.render();
	    expect($('#jasmine-fixtures .esb-mark-position-top-left').length).toEqual(1);
	});

	it ("should have a class of esb-mark--has-outline by default", function(){
		mark.render();
	    expect($('#jasmine-fixtures .esb-mark--has-outline').length).toEqual(1);
	});

	it ("should add additional classes when the group option is used", function(){
		mark.options.group = "secondary grouping-class";
		mark.render();
	    expect($('#jasmine-fixtures .esb-mark.esb-mark-group-secondary.esb-mark-group-grouping-class').length).toEqual(1);
	});

	it ("should not add an esb-mark--has-outline class when the outline option is set to false", function(){
		mark.options.outline = false;
		mark.render();
	    expect($('#jasmine-fixtures .esb-mark--has-outline').length).toEqual(0);
	});

	it ("should modify the position class when a different position option is set", function(){
		mark.options['mark-position'] = "bottom-right";
		mark.render();
	    expect($('#jasmine-fixtures .esb-mark-position-bottom-right').length).toEqual(1);
	});

	it ("should use an auto-incremented ID in the label if no id is provided using options", function(){
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-id').text()).toEqual('1');
	});

	it ("should not render an esb-mark-name element if no value is provided for data-esb-mark", function(){
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-name')).not.toBeInDOM();
	});

	it ("should render an esb-mark-name element and not render an esb-mark-id element when a value is provided for data-esb-mark", function(){
		mark.options.mark = 'Fuzzy Bunny';
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-name').text()).toEqual('Fuzzy Bunny');
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-id').length).toEqual(0);
	});

	it ("should render an esb-mark-id element with content that matches the id option when the id option is provided", function(){
		mark.options.id = 'A';
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-id').text()).toEqual('A');
	});

	it ("should render an esb-mark-id element with the esb-mark-name element when show-id-with-name is set to true", function(){
		mark.options['show-id-with-name'] = true;
		mark.options.mark = 'Fuzzy Bunny';
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-id').length).toEqual(1);
	});

	it ("should add a class when the element being marked has static position", function(){
		mark.render();
		expect($("#jasmine-fixtures .esb-mark.esb-mark--has-static-position").length).toEqual(1);
	});

	it ("should add a class when the element being marked has absolute position", function(){
		$("#jasmine-fixtures").append("<style> .button { position: absolute; }</style>");
		mark.render();
		expect($("#jasmine-fixtures .esb-mark.esb-mark--has-absolute-position").length).toEqual(1);
	});

	it ("should add a class when the element being marked has relative position", function(){
		$("#jasmine-fixtures .button").css("position", "relative");
		mark.render();
		expect($("#jasmine-fixtures .esb-mark.esb-mark--has-relative-position").length).toEqual(1);
	});

	it ("should wrap the marked element with a new element when the element being marked cannot have children appended", function(){
		mark = load_mark('mark-input.html', uuid);
		mark.render();
		expect($("#jasmine-fixtures .esb-mark input").length).toEqual(1);
	});

	it ("should have a hidden class when the visible-on-load option is set to false", function(){
		mark.options['visible-on-load'] = false;
		mark.render();
		expect($("#jasmine-fixtures .esb-mark.esb-mark--is-hidden").length).toEqual(1);
	});

	it ("should make the Mark's label a link when the href option is provided with a value", function(){
		mark.options.href = "http://example.com";
		mark.render();
		expect($("#jasmine-fixtures .esb-mark .esb-mark-label[href='http://example.com']").length).toEqual(1);
	});
});

describe("EsbMark config options", function(){
	var mark = null,
		mark_snippet = null,
		uuid = null;

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		mark = load_mark('mark.html', uuid);
		EsbPage.esb_mark_auto_id = 1;
	});


	beforeAll(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-test-alt-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});	
	});

	it ("should use options from global config", function(){
		expect(mark.options).toEqual({'mark': null, 'id': null, 'show-id-with-name': false, 'mark-position': 'top-right', 'outline': false, 'group': 'alternate-style', 'visible-on-load': true, 'href': false});
	});

	it ("should use options from page level config when set", function(){
		mark = load_mark('mark-page-level-config.html', uuid);		
		expect(mark.options).toEqual({'mark': null, 'id': null, 'show-id-with-name': false, 'mark-position': 'bottom-left', 'outline': true, 'group': 'page-level-style', 'visible-on-load': true, 'href': false});
	});

	it ("should use options from instance level data attributes when set", function(){
		mark = load_mark('mark-data-attribute-options.html', uuid);		
		expect(mark.options).toEqual({'mark': 'Call To Action Button', 'id': null, 'show-id-with-name': false, 'mark-position': 'bottom-right', 'outline': false, 'group': 'instance-style', 'visible-on-load': true, 'href': false});
	});

	it ("should use options from query string params when set", function(){
		spyOn(EsbUtil, 'getUrlQueryString').and.returnValue('?mark-position=bottom-left&outline=true&visible-on-load=false');
		mark = load_mark('mark-data-attribute-options.html', uuid);		
		expect(mark.options).toEqual({'mark': 'Call To Action Button', 'id': null, 'show-id-with-name': false, 'mark-position': 'bottom-left', 'outline': true, 'group': 'instance-style', 'visible-on-load': false, 'href': false});
	});
});