import $ from 'jquery';
import EsbConfig from 'src/esb-config';
import EsbPage from 'src/esb-page';
import EsbUtil from 'src/esb-util';
import { EsbFrame } from 'src/esb-frame';

describe("EsbPage", function(){
	beforeEach(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});
	});

	it("should have a method called blocks_done that returns a promise that resolves when blocks_done is set to true within the timeout", function(done){
		var promise = EsbPage.blocksDone();
		spyOn(EsbPage, 'getBlocksDone').and.returnValue(true);

		promise.then(function(value){
			expect(value).toEqual(true);
			done();
		});
	});

	it("should have a method called blocks_done that returns a promise that rejects when blocks_done is still false after the timeout", function(done){
		spyOn(EsbPage, 'getBlocksDone').and.returnValue(false);
		spyOn(EsbPage, 'getBlocksDoneTimeout').and.returnValue(20);
		
		var promise = EsbPage.blocksDone();

		promise.then(
			function(value){
				expect(true).toEqual('The promise should not resolve, but it is'); //this expectation is only here to ensure the test fails properly
			},
			function(error_msg){
				expect(error_msg).toEqual('Blocks did not finish processing the page before the timeout threshold: 20ms');
				done();
			}
		);
	});

	it("should resolve the blocksDone promise immediately if no includes are found on the page", function(){
		spyOn(EsbPage, 'get_parsed_esb_includes').and.returnValue([]);
		EsbPage.display();
		var promise = EsbPage.blocksDone();

		promise.then(function(value){
			expect(value).toEqual(true);
			done();
		});
	});

	describe("when there are no blocks includes found", function(){
		beforeEach(function(){
			loadFixtures('no-blocks-elements.html');
			spyOn(EsbPage, 'retrievePageTitle').and.returnValue('Jasmine Test Title');
			EsbPage.parse();
		});

		it("should call retrievePageTitle", function(){
			expect(EsbPage.retrievePageTitle).toHaveBeenCalled();
			expect(EsbPage.retrievePageTitle()).toEqual('Jasmine Test Title');
		});

		it ("should have a includes count of 0", function(){
			expect(EsbPage.parsed_esb_includes.length).toEqual(0);
		});
	});

	describe("when there is an esb-include on the page", function(){
		beforeEach(function(){
			loadFixtures('include-all-syntaxes.html');
			EsbPage.parse();
		});

		it ("should have an includes count of 3 respecting both the 'data-component', 'data-esb-component', and 'data-esb-include' syntax", function(){
			expect(EsbPage.parsed_esb_includes.length).toEqual(3);
		});
	});

	describe("when there is an esb-frame on the page", function(){
		beforeEach(function(){
			loadFixtures('frame.html');
			EsbPage.parse();
		});

		it ("should have an esb-frames count of 1", function(){
			expect(EsbPage.parsed_esb_frames.length).toEqual(1);
		});

		it ("should create an EsbFrame instance", function(){
			expect(EsbPage.parsed_esb_frames[0].original_snippet).toMatch(/data-esb-frame="http:\/\/google.com"/);
		});
	});

	describe("when there are multiple esb-frame-includes on the page", function(){
		beforeEach(function(){
			loadFixtures('frame-includes.html');
			EsbPage.parsed_esb_frames = [];
			EsbPage.parse();
		});

		it ("should have an esb-frames count of 2", function(){
			expect(EsbPage.parsed_esb_frames.length).toEqual(2);
		});
	});

	describe("when there is an esb-mark on the page", function(){
		beforeEach(function(){
			loadFixtures('mark.html');
			EsbPage.parseEsbMarks();
			EsbPage.esb_mark_auto_id = 1;
		});

		it ("should have an esb-marks count of 1", function(){
			expect(EsbPage.parsed_esb_marks.length).toEqual(1);
		});

		it ("should display all ESB Mark instances", function(){
			EsbPage.displayEsbMarks();
			expect(EsbPage.parsed_esb_marks[0].mark_element.outerHTML).toMatch(/class="button esb-mark/);
		});

		it ("should return an auto-incrementing number to be used as a default Mark id", function(){
			expect(EsbPage.getEsbMarkAutoId()).toEqual(1);
			expect(EsbPage.getEsbMarkAutoId()).toEqual(2);
		});

		it ("should be able to show/hide the esb marks", function(){
			EsbPage.displayEsbMarks();
			EsbPage.hideAllEsbMarks();
			expect($("#jasmine-fixtures .esb-mark.esb-mark--is-hidden").length).toEqual(1);
			EsbPage.showAllEsbMarks();
			expect($("#jasmine-fixtures .esb-mark.esb-mark--is-hidden").length).toEqual(0);
			expect($("#jasmine-fixtures .esb-mark").length).toEqual(1);
		});

		it ("should be able to toggle the esb marks", function(){
			EsbPage.displayEsbMarks();
			EsbPage.toggleAllEsbMarks();
			expect($("#jasmine-fixtures .esb-mark.esb-mark--is-hidden").length).toEqual(1);
			EsbPage.toggleAllEsbMarks();
			expect($("#jasmine-fixtures .esb-mark.esb-mark--is-hidden").length).toEqual(0);
			expect($("#jasmine-fixtures .esb-mark").length).toEqual(1);
		});

		it ("should trigger the hideAllEsbMarks method when a document level event of 'hide-all-esb-marks' is fired", function(){
			spyOn(EsbPage, 'hideAllEsbMarks');
			EsbPage.setEventListeners();
			
			if (window.CustomEvent) {
			  var event = new CustomEvent('hide-all-esb-marks');
			} else {
			  var event = document.createEvent('CustomEvent');
			  event.initCustomEvent('hide-all-esb-marks', true, true);
			}

			document.dispatchEvent(event);
			
			expect(EsbPage.hideAllEsbMarks).toHaveBeenCalled();
		});

		it ("should trigger the showAllEsbMarks method when a document level event of 'show-all-esb-marks' is fired", function(){
			spyOn(EsbPage, 'showAllEsbMarks');
			EsbPage.setEventListeners();
			
			if (window.CustomEvent) {
			  var event = new CustomEvent('show-all-esb-marks');
			} else {
			  var event = document.createEvent('CustomEvent');
			  event.initCustomEvent('show-all-esb-marks', true, true);
			}

			document.dispatchEvent(event);
			
			expect(EsbPage.showAllEsbMarks).toHaveBeenCalled();
		});

		it ("should trigger the toggleAllEsbMarks method when a keypress of Cmd + Shift + M occurs", function(){
			spyOn(EsbPage, 'toggleAllEsbMarks');
			EsbPage.setEventListeners();
			
			if (window.CustomEvent) {
			  var event = new CustomEvent('keydown');
			} else {
			  var event = document.createEvent('CustomEvent');
			  event.initCustomEvent('keydown', true, true);
			}

			event.keyCode = 77;
			event.shiftKey = true;
			event.ctrlKey = true;

			document.dispatchEvent(event);
			
			expect(EsbPage.toggleAllEsbMarks).toHaveBeenCalled();
		});
	});

	describe("when an include is passed via query string parameters on the URL", function(){

		it ("should generate the include snippet", function(){
			spyOn(EsbUtil, 'getUrlQueryString').and.returnValue('?data-esb-include=my-navbar&data-esb-variation=foo&data-esb-source=library&data-esb-target=#jasmine-fixtures&data-esb-place=replace&data-esb-content=%7B%22brand%22:%22Community%22%7D');
			var query_params = EsbUtil.convertQueryStringToJson(EsbUtil.getUrlQueryString());
			var include_snippet = EsbPage.generateIncludeSnippet(query_params);
			expect(include_snippet.getAttribute('data-esb-include')).toEqual("my-navbar");
			expect(include_snippet.getAttribute('data-esb-variation')).toEqual("foo");
			expect(include_snippet.getAttribute('data-esb-place')).toEqual("replace");
			expect(include_snippet.getAttribute('data-esb-source')).toEqual("library");
			expect(include_snippet.getAttribute('data-esb-content')).toEqual('{"brand":"Community"}');
		});

		it ("should append the include to the target element", function(){
			spyOn(EsbUtil, 'getUrlQueryString').and.returnValue('?data-esb-include=my-navbar&data-esb-variation=foo&data-esb-source=library&data-esb-target=#jasmine-fixtures&data-esb-place=replace');
			loadFixtures('no-blocks-elements.html');
			EsbPage.renderIncludeSnippetFromQueryStringParams();
		    expect($('#jasmine-fixtures div[data-esb-include="my-navbar"]').length).toEqual(1);
		});
	});

	describe("rendering of an include into the dom", function(){
		it ("should parse the includes on the page and render them to the dom", function(done){
			loadFixtures('include.html');
			EsbPage.parse();
			EsbPage.display();
			EsbPage.blocksDone().then(function(){
			    expect($('#jasmine-fixtures h1:contains("Hello Includes!")').length).toEqual(1);
				done();
			}, function(err){
				console.log(err);
			});
		});
	});
});
