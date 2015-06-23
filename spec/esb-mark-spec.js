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

beforeAll(function(done){
	jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
	EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
		done();
	}, function(err){
		console.log(err);
	});
})

describe("EsbMark", function(){
	var mark = null,
		mark_snippet = null,
		uuid = null;

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		mark = load_mark('page-with-mark.html', uuid);
		EsbPage.esb_mark_auto_id = 1;
	});


	it("should have a uuid", function(){
		expect(mark.uuid).toEqual(uuid);
	});

	it ("should have default options", function(){
		expect(mark.options).toEqual({'mark': null, 'id': null, 'position': 'top-left', 'outline': true, 'group': null});
	});

	it("should inject an esb-mark-label into the DOM", function(){
		mark.render();
	    expect($('#jasmine-fixtures label.esb-mark-label')).toBeInDOM();
	});

	it ("should have a class of esb-mark-position-top-left by default", function(){
		mark.render();
	    expect($('#jasmine-fixtures .esb-mark-position-top-left').length).toEqual(1);
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
});