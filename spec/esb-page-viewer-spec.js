import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import EsbPage from 'src/esb-page';
import { EsbPageViewer } from 'src/esb-page-viewer';

function load_page_viewer(fixture, uuid) {
	var page_viewer, page_viewer_snippet;
	uuid = typeof uuid === 'undefined' ? EsbUtil.generateUUID() : uuid;

	loadFixtures(fixture);
	page_viewer_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-page-viewer]')[0];
	page_viewer_snippet.setAttribute('data-esb-uuid', uuid);

	page_viewer = new EsbPageViewer({
		viewer_element: page_viewer_snippet,
        original_snippet: page_viewer_snippet.outerHTML,
        uuid: uuid
	});	

	return page_viewer;
}

beforeAll(function(done){
	jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
	EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
		done();
	}, function(err){
		console.log(err);
	});
})

describe("EsbPageViewer", function(){
	var page_viewer = null,
		page_viewer_snippet = null,
		uuid = null;

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		page_viewer = load_page_viewer('page-with-page-viewer.html', uuid);
	});


	it("should have a uuid", function(){
		expect(page_viewer.uuid).toEqual(uuid);
	});

	it("should have default options", function(){
		expect(page_viewer.options).toEqual({"load-immediately": false, "title": false, "caption": false, "dimensions": true, "href": "http://google.com", "scrolling": "no", "overlay": true, "scale": false, "viewport-width": 1000, "viewport-aspect-ratio": 1.5, "width": 200, "height": false});
	});

	it("should have access to BlocksConfig", function(){
		expect(page_viewer.config.get("page-viewers").get("source")).toEqual('base/spec/fixtures/page-viewers');
	});

	describe("with option overrides", function(){
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-with-option-overrides.html');
		});
	
		it("should override the default options", function(){
			expect(page_viewer.options).toEqual({"load-immediately": true, "title": false, "caption": false, "dimensions": true, "href": "base/spec/fixtures/page-viewers/just-a-default-example.html", "scrolling": "no", "overlay": true, "scale": false, "viewport-width": 1000, "viewport-aspect-ratio": 1.5, "width": 200, "height": false});
		});

		it("should load immediately", function(){
			spyOn(page_viewer, 'load_iframe');
			page_viewer.inject_placeholder();
			expect(page_viewer.load_iframe).toHaveBeenCalled();
		});
	});

	describe("for a fully qualified URL", function(){
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-fully-qualified-url.html');
		});

		it("should use the URL as-is", function(){
			expect(page_viewer.iframe_src).toEqual('http://google.com');
		});

		it("should create a placeholder iframe", function(){
			expect(page_viewer.placeholder_element).toMatch(/data-src="http:\/\/google.com"/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="http://google.com"]')).toBeInDOM();
		});
	});

	describe("with a data-source attribute", function(){
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-with-data-source-attribute.html');
		});

		it("should create the iframe_src using the data-source attribute plus the file name", function(){
			expect(page_viewer.iframe_src).toEqual('some/made-up/path/example.html');
		});

		it("should create a placeholder iframe", function(){
			expect(page_viewer.placeholder_element).toMatch(/data-src="some\/made-up\/path\/example.html"/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="some/made-up/path/example.html"]')).toBeInDOM();
		});
	});

	describe("with no data-source attribute visible at the top of the page", function(){
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-with-no-data-source-attribute.html');
		});

		it("should create the iframe_src using the data-source attribute plus the file name", function(){
			expect(page_viewer.iframe_src).toEqual('base/spec/fixtures/page-viewers/just-a-default-example.html');
		});

		it("should create a placeholder iframe", function(){
			expect(page_viewer.placeholder_element).toMatch(/data-src="base\/spec\/fixtures\/page-viewers\/just-a-default-example.html"/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to load the iframe within the placeholder", function(){
			page_viewer.inject_placeholder();
			page_viewer.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to unload the iframe", function(){
			page_viewer.inject_placeholder();
			page_viewer.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();

		    page_viewer.unload_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).not.toBeInDOM();
		    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to programatically unload the iframe by triggering an event", function(){
			page_viewer.inject_placeholder();
			page_viewer.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();

			if (window.CustomEvent) {
			  var event = new CustomEvent('unload-esb-page-viewer-' + page_viewer.uuid);
			} else {
			  var event = document.createEvent('CustomEvent');
			  event.initCustomEvent('unload-esb-page-viewer-' + page_viewer.uuid, true, true);
			}

			document.dispatchEvent(event);

		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).not.toBeInDOM();
		    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be visible", function(){
			page_viewer.inject_placeholder();
			expect(page_viewer.is_visible()).toEqual(true);
		});

		it ("should automatically load after BlocksDone has been called", function(){
			spyOn(EsbPage, 'blocksDone').and.returnValue({then: function(){return true;}});
			page_viewer.inject_placeholder();
			expect(EsbPage.blocksDone).toHaveBeenCalled();
		});
	});

	describe("when nested inside a hidden element", function(){
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-hidden.html');
		});

		it ("should know that it is not visible", function(){
			page_viewer.inject_placeholder();
			expect(page_viewer.is_visible()).toEqual(false);
		});

		it ("should know that it is visible when the parent element becomes visible", function(){
			page_viewer.inject_placeholder();
			document.getElementById("hidden-wrapper").style.display = "block";
			expect(page_viewer.is_visible()).toEqual(true);
		});

		it("should be able to programmatically load a hidden Page Viewer", function(){
			spyOn(page_viewer, 'load_iframe');
			page_viewer.inject_placeholder();
			expect(page_viewer.iframe_is_loaded).toEqual(false);

			if (window.CustomEvent) {
			  var event = new CustomEvent('load-esb-page-viewer-' + page_viewer.uuid);
			} else {
			  var event = document.createEvent('CustomEvent');
			  event.initCustomEvent('load-esb-page-viewer-' + page_viewer.uuid, true, true);
			}

			document.dispatchEvent(event);
			expect(page_viewer.load_iframe).toHaveBeenCalled();
		});
	});

	describe("when not yet scrolled into view", function(){
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-scrolled-out-of-view.html');
		});

		it ("should have scrollable ancestors", function(){
			page_viewer.inject_placeholder();
			expect(page_viewer.scrollable_ancestors.length).toEqual(2);
		});

		it ("should know that it is not visible", function(){
			page_viewer.inject_placeholder();
			expect(page_viewer.is_visible()).toEqual(false);
		});

		it ("should automatically load the iFrame when the viewer is scrolled into view", function(){
			spyOn(page_viewer, 'load_iframe');
			page_viewer.inject_placeholder();

			// programatically 'scroll' the wrapper div
			var wrapper = document.getElementById("scrollable-wrapper");
			wrapper.scrollTop = 1;
			var event = document.createEvent('HTMLEvents');
			event.initEvent('scroll', true, false);
			wrapper.dispatchEvent(event);

			expect(page_viewer.load_iframe).toHaveBeenCalled();
		});

		it ("should know the viewer is no longer visible when scrolled out of view", function(){
			spyOn(page_viewer, 'load_iframe');
			page_viewer.inject_placeholder();

			// programatically 'scroll' the wrapper div
			var wrapper = document.getElementById("scrollable-wrapper");
			wrapper.scrollTop = 1;
			var scroll = document.createEvent('HTMLEvents');
			scroll.initEvent('scroll', true, false);
			wrapper.dispatchEvent(scroll);
			expect(page_viewer.load_iframe).toHaveBeenCalled();

		    var viewer_height = $('#jasmine-fixtures .esb-page-viewer').height();

			wrapper.scrollTop = 400 + viewer_height; //400 is the height of the element above the viewer in the fixture
			wrapper.dispatchEvent(scroll);
			
			expect(page_viewer.is_visible()).toEqual(false);
		});

		it ("should automatically unload the iFrame when the viewer is scrolled out of view", function(){
			spyOn(page_viewer, 'load_iframe');
			page_viewer.inject_placeholder();

			// programatically 'scroll' the wrapper div
			var wrapper = document.getElementById("scrollable-wrapper");
			wrapper.scrollTop = 1;
			var scroll = document.createEvent('HTMLEvents');
			scroll.initEvent('scroll', true, false);
			wrapper.dispatchEvent(scroll);
			expect(page_viewer.load_iframe).toHaveBeenCalled();

		    var viewer_height = $('#jasmine-fixtures .esb-page-viewer').height();

			spyOn(page_viewer, 'unload_iframe');
			spyOn(page_viewer, 'is_iframe_loaded').and.returnValue(true);
			wrapper.scrollTop = 400 + viewer_height; //400 is the height of the element above the viewer in the fixture
			wrapper.dispatchEvent(scroll);

			expect(page_viewer.is_visible()).toEqual(false);
			expect(page_viewer.is_iframe_loaded()).toEqual(true);
			expect(page_viewer.unload_iframe).toHaveBeenCalled();
		});
	});

	describe("with title, caption, and href functionality", function(){
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-with-title-caption-href-and-immediate-load.html');
		});

		it ("should override the default options", function() {
			expect(page_viewer.options).toEqual({"load-immediately": true, "title": "My Framed Page", "caption": "This is smaller caption text", "dimensions": true, "href": "http://example.com", "scrolling": "yes", "overlay": false, "scale": false, "viewport-width": "1000", "viewport-aspect-ratio": "1.5", "width": "300", "height": false});
		});

		it ("should have a title", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures h3:contains("My Framed Page")')).toBeInDOM();
		});

		it ("should have a caption", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures p:contains("This is smaller caption text")')).toBeInDOM();
		});

		it ("should have a href", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures a[href="http://example.com"]')).toBeInDOM();
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(page_viewer.get_iframe_styles()).toEqual('width:1000px; height:1500px; transform: scale(0.3); -webkit-transform: scale(0.3); ');
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(page_viewer.get_iframe_wrap_styles()).toEqual('width:300px; height:450px;');
		});
	});

	describe("with data-scale option set", function() {
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-with-scale-option.html');
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(page_viewer.get_iframe_styles()).toEqual('width:320px; height:480px; transform: scale(0.25); -webkit-transform: scale(0.25); ');
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(page_viewer.get_iframe_wrap_styles()).toEqual('width:80px; height:120px;');
		});

		it ("should calculate the correct width of the outer wrapper", function(){
			expect(page_viewer.get_placeholder_element_styles()).toEqual('width:80px; ');
		});
	});

	describe("with data-esb-height option set", function() {
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-with-height-option.html');
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(page_viewer.get_iframe_styles()).toEqual('width:320px; height:1200px; transform: scale(0.25); -webkit-transform: scale(0.25); ');
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(page_viewer.get_iframe_wrap_styles()).toEqual('width:80px; height:300px;');
		});

		it ("should calculate the correct width of the outer wrapper", function(){
			expect(page_viewer.get_placeholder_element_styles()).toEqual('width:80px; ');
		});

		it ("should create a dimensions string", function() {
			expect(page_viewer.get_dimensions_annotation()).toEqual('<p class="esb-page-viewer-dimensions-annotation">320&times;1200px @ 25% scale</p>');
		});
	});
});

describe("EsbPageViewer with alternate config", function(){
	var page_viewer = null,
		page_viewer_snippet = null,
		uuid = null;

	beforeAll(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-page-viewer-alt-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});	
	});

	describe("with no source specified in the config.json", function() {
		beforeEach(function(){
			page_viewer = load_page_viewer('page-viewer-with-alternate-config-json.html');
		});

		it ("should use a relative path for the source", function (){
			expect(page_viewer.iframe_src).toEqual('base/spec/fixtures/page-viewers/just-a-default-example.html');
		});

		it ("should inherit options from the config file but allow them to be overridden at a parent-wrapper level and at the component level", function() {
			expect(page_viewer.options).toEqual({"load-immediately": false, "title": "Global Page Viewer Title", "caption": "This caption is unique to the component", "dimensions": false, "href": "#link", "scrolling": "yes", "overlay": true, "scale": false, "viewport-width": 500, "viewport-aspect-ratio": 0.5, "width": 300, "height": false})
		});
	});
});