import $ from 'jquery';
import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import EsbPage from 'src/esb-page';

function load_and_render_component(fixture, uuid) {
	var frame, frame_snippet;
	uuid = typeof uuid === 'undefined' ? EsbUtil.generateUUID() : uuid;

	loadFixtures(fixture);
	EsbPage.parse(); //Finds all blocks components, viewers, etc. and preps them for loading/display
	EsbPage.display();
}

describe("EsbComponent Loaded Result", function(){
	var frame = null,
		frame_snippet = null,
		uuid = null;

	beforeAll(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});
	});

	it ("should render a component onto the page", function(done){
		load_and_render_component('page-with-component.html');
		EsbPage.blocksDone().then(
			function(){
			    expect($('#jasmine-fixtures h1:contains("This is a header in a component")')).toBeInDOM();
				done();
			},
		  	function() {
		    	EsbUtil.logger('error', 'BlocksDone did not fire.');
		  	}
		);
	});

	it ("should render a nested component onto the page", function(done){
		load_and_render_component('page-with-nested-component.html');
		EsbPage.blocksDone().then(
			function(){
			    expect($('#jasmine-fixtures h1:contains("from the parent component and the header below is from a different component")')).toBeInDOM();
			    expect($('#jasmine-fixtures h3:contains("Child One")')).toBeInDOM();
				done();
			},
		  	function() {
		    	EsbUtil.logger('error', 'BlocksDone did not fire.');
		  	}
		);
	});
});