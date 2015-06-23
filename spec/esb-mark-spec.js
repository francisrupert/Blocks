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
		mark = load_mark('page-with-mark.html', uuid);
		EsbPage.esb_mark_auto_id = 1;
	});


	it("should have a uuid", function(){
		expect(mark.uuid).toEqual(uuid);
	});

	it ("should have default options", function(){
		expect(mark.options).toEqual({'mark': null, 'id': null, 'show-id': true, 'mark-position': 'top-left', 'outline': true, 'group': null});
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
	    expect($('#jasmine-fixtures .esb-mark.secondary.grouping-class').length).toEqual(1);
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

	it ("should render an esb-mark-name element when a value is provided for data-esb-mark", function(){
		mark.options.mark = 'Fuzzy Bunny';
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-name').text()).toEqual('Fuzzy Bunny');
	});

	it ("should render an esb-mark-id element with content that matches the id option when the id option is provided", function(){
		mark.options.id = 'A';
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-id').text()).toEqual('A');
	});

	it ("should not render an esb-mark-id element when show-id is set to false", function(){
		mark.options['show-id'] = false;
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label .esb-mark-label-id').length).toEqual(0);
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
		mark = load_mark('page-with-input-mark.html', uuid);
		mark.render();
		expect($("#jasmine-fixtures .esb-mark input").length).toEqual(1);
	});
});

describe("EsbMark config options", function(){
	var mark = null,
		mark_snippet = null,
		uuid = null;

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		mark = load_mark('page-with-mark.html', uuid);
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
		expect(mark.options).toEqual({'mark': null, 'id': null, 'show-id': true, 'mark-position': 'top-right', 'outline': false, 'group': 'alternate-style'});
	});

	it ("should use options from page level config when set", function(){
		mark = load_mark('page-with-mark-page-level-config.html', uuid);		
		expect(mark.options).toEqual({'mark': null, 'id': null, 'show-id': true, 'mark-position': 'bottom-left', 'outline': true, 'group': 'page-level-style'});
	});

	it ("should use options from instance level data attributes when set", function(){
		mark = load_mark('page-with-mark-data-attribute-options.html', uuid);		
		expect(mark.options).toEqual({'mark': 'Call To Action Button', 'id': null, 'show-id': true, 'mark-position': 'bottom-right', 'outline': false, 'group': 'instance-style'});
	});
});