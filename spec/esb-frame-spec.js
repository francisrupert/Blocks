import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import EsbPage from 'src/esb-page';
import { EsbFrame } from 'src/esb-frame';

function load_frame(fixture, uuid) {
	var frame, frame_snippet;
	uuid = typeof uuid === 'undefined' ? EsbUtil.generateUUID() : uuid;

	loadFixtures(fixture);
	frame_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-frame]')[0];
	frame_snippet.setAttribute('data-esb-uuid', uuid);

	frame = new EsbFrame({
		viewer_element: frame_snippet,
        original_snippet: frame_snippet.outerHTML,
        uuid: uuid
	});	

	return frame;
}

beforeAll(function(done){
	jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
	EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
		done();
	}, function(err){
		console.log(err);
	});
})

describe("EsbFrame", function(){
	var frame = null,
		frame_snippet = null,
		uuid = null;

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		frame = load_frame('page-with-frame.html', uuid);
	});


	it("should have a uuid", function(){
		expect(frame.uuid).toEqual(uuid);
	});

	it("should have default options", function(){
		expect(frame.options).toEqual({"frame":"http://google.com", "source":"base/spec/fixtures/frames/", "load-immediately": false, "unload-when-not-visible": false, "title": false, "caption": false, "dimensions": true, "href": "http://google.com", "scrolling": "no", "overlay": true, "scale": false, "viewport-width": 1000, "viewport-aspect-ratio": 1.5, "width": 200, "height": false, "viewport-device": false, "viewport-device-orientation": "portrait", "device-annotation": true, "device-frame": false});
	});

	it("should have access to BlocksConfig", function(){
		expect(frame.config.get("frames").get("source")).toEqual('base/spec/fixtures/frames');
	});

	it ("should get the correct width, height, and aspect ratio options when given a device of 'iphone-5'", function(){
		expect(frame.get_device_dimensions('iphone-5')).toEqual({"width":320, "height":568, "aspect-ratio":'1.77500'});
	});

	it ("should get the correct width, height, and aspect ratio options when given a device of 'iphone-5' and an orientation of 'landscape'", function(){
		expect(frame.get_device_dimensions('iphone-5', 'landscape')).toEqual({"width":568, "height":320, "aspect-ratio":'0.56338'});
	});

	describe("with option overrides", function(){
		beforeEach(function(){
			frame = load_frame('frame-with-option-overrides.html');
		});
	
		it("should override the default options", function(){
			expect(frame.options).toEqual({"frame": "base/spec/fixtures/frames/just-a-default-example.html", "source": "base/spec/fixtures/frames/", "load-immediately": true, "unload-when-not-visible": false, "title": false, "caption": false, "dimensions": true, "href": "base/spec/fixtures/frames/just-a-default-example.html", "scrolling": "no", "overlay": true, "scale": false, "viewport-width": 1000, "viewport-aspect-ratio": 1.5, "width": 200, "height": false, "viewport-device": false, "viewport-device-orientation": "portrait", "device-annotation": true, "device-frame": false});
		});

		it("should load immediately", function(){
			spyOn(frame, 'load_iframe');
			frame.inject_placeholder();
			expect(frame.load_iframe).toHaveBeenCalled();
		});
	});

	describe("for a fully qualified URL", function(){
		beforeEach(function(){
			frame = load_frame('frame-fully-qualified-url.html');
		});

		it("should use the URL as-is", function(){
			expect(frame.iframe_src).toEqual('http://google.com');
		});

		it("should create a placeholder iframe", function(){
			expect(frame.placeholder_element).toMatch(/data-src="http:\/\/google.com"/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			frame.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="http://google.com"]')).toBeInDOM();
		});
	});

	describe("with a data-source attribute", function(){
		beforeEach(function(){
			frame = load_frame('frame-with-data-source-attribute.html');
		});

		it("should create the iframe_src using the data-source attribute plus the file name", function(){
			expect(frame.iframe_src).toEqual('some/made-up/path/example.html');
		});

		it("should create a placeholder iframe", function(){
			expect(frame.placeholder_element).toMatch(/data-src="some\/made-up\/path\/example.html"/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			frame.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="some/made-up/path/example.html"]')).toBeInDOM();
		});
	});

	describe("with no data-source attribute visible at the top of the page", function(){
		beforeEach(function(){
			frame = load_frame('frame-with-no-data-source-attribute.html');
		});

		it("should create the iframe_src using the data-source attribute plus the file name", function(){
			expect(frame.iframe_src).toEqual('base/spec/fixtures/frames/just-a-default-example.html');
		});

		it("should create a placeholder iframe", function(){
			expect(frame.placeholder_element).toMatch(/data-src="base\/spec\/fixtures\/frames\/just-a-default-example.html"/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			frame.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to load the iframe within the placeholder", function(){
			frame.inject_placeholder();
			frame.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to unload the iframe", function(){
			frame.inject_placeholder();
			frame.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();

		    frame.unload_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/frames/just-a-default-example.html"]')).not.toBeInDOM();
		    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to programatically unload the iframe by triggering an event", function(){
			frame.inject_placeholder();
			frame.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();

			if (window.CustomEvent) {
			  var event = new CustomEvent('unload-esb-frame-' + frame.uuid);
			} else {
			  var event = document.createEvent('CustomEvent');
			  event.initCustomEvent('unload-esb-frame-' + frame.uuid, true, true);
			}

			document.dispatchEvent(event);

		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/frames/just-a-default-example.html"]')).not.toBeInDOM();
		    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be visible", function(){
			frame.inject_placeholder();
			expect(frame.is_visible()).toEqual(true);
		});

		it ("should automatically load after BlocksDone has been called", function(){
			spyOn(EsbPage, 'blocksDone').and.returnValue({then: function(){return true;}});
			frame.inject_placeholder();
			expect(EsbPage.blocksDone).toHaveBeenCalled();
		});
	});

	describe("when nested inside a hidden element", function(){
		beforeEach(function(){
			frame = load_frame('frame-hidden.html');
		});

		it ("should know that it is not visible", function(){
			frame.inject_placeholder();
			expect(frame.is_visible()).toEqual(false);
		});

		it ("should know that it is visible when the parent element becomes visible", function(){
			frame.inject_placeholder();
			document.getElementById("hidden-wrapper").style.display = "block";
			expect(frame.is_visible()).toEqual(true);
		});

		it("should be able to programmatically load a hidden Page Viewer", function(){
			spyOn(frame, 'load_iframe');
			frame.inject_placeholder();
			expect(frame.iframe_is_loaded).toEqual(false);

			if (window.CustomEvent) {
			  var event = new CustomEvent('load-esb-frame-' + frame.uuid);
			} else {
			  var event = document.createEvent('CustomEvent');
			  event.initCustomEvent('load-esb-frame-' + frame.uuid, true, true);
			}

			document.dispatchEvent(event);
			expect(frame.load_iframe).toHaveBeenCalled();
		});
	});

	describe("when not yet scrolled into view", function(){
		beforeEach(function(){
			frame = load_frame('frame-scrolled-out-of-view.html');
		});

		it ("should have scrollable ancestors", function(){
			frame.inject_placeholder();
			expect(frame.scrollable_ancestors.length).toEqual(2);
		});

		it ("should know that it is not visible", function(){
			frame.inject_placeholder();
			expect(frame.is_visible()).toEqual(false);
		});

		it ("should automatically load the iFrame when the viewer is scrolled into view", function(){
			spyOn(frame, 'load_iframe');
			frame.inject_placeholder();

			// programatically 'scroll' the wrapper div
			var wrapper = document.getElementById("scrollable-wrapper");
			wrapper.scrollTop = 1;
			var event = document.createEvent('HTMLEvents');
			event.initEvent('scroll', true, false);
			wrapper.dispatchEvent(event);

			expect(frame.load_iframe).toHaveBeenCalled();
		});

		it ("should know the viewer is no longer visible when scrolled out of view", function(){
			spyOn(frame, 'load_iframe');
			frame.inject_placeholder();

			// programatically 'scroll' the wrapper div
			var wrapper = document.getElementById("scrollable-wrapper");
			wrapper.scrollTop = 1;
			var scroll = document.createEvent('HTMLEvents');
			scroll.initEvent('scroll', true, false);
			wrapper.dispatchEvent(scroll);
			expect(frame.load_iframe).toHaveBeenCalled();

		    var viewer_height = $('#jasmine-fixtures .esb-frame').height();

			wrapper.scrollTop = 400 + viewer_height; //400 is the height of the element above the viewer in the fixture
			wrapper.dispatchEvent(scroll);
			
			expect(frame.is_visible()).toEqual(false);
		});

		it ("should automatically unload the iFrame when the viewer is scrolled out of view", function(){
			spyOn(frame, 'load_iframe');
			frame.inject_placeholder();

			// programatically 'scroll' the wrapper div
			var wrapper = document.getElementById("scrollable-wrapper");
			wrapper.scrollTop = 1;
			var scroll = document.createEvent('HTMLEvents');
			scroll.initEvent('scroll', true, false);
			wrapper.dispatchEvent(scroll);
			expect(frame.load_iframe).toHaveBeenCalled();

		    var viewer_height = $('#jasmine-fixtures .esb-frame').height();

			spyOn(frame, 'unload_iframe');
			spyOn(frame, 'is_iframe_loaded').and.returnValue(true);
			wrapper.scrollTop = 400 + viewer_height; //400 is the height of the element above the viewer in the fixture
			wrapper.dispatchEvent(scroll);

			expect(frame.is_visible()).toEqual(false);
			expect(frame.is_iframe_loaded()).toEqual(true);
			expect(frame.unload_iframe).toHaveBeenCalled();
		});
	});

	describe("with title, caption, and href functionality", function(){
		beforeEach(function(){
			frame = load_frame('frame-with-title-caption-href-and-immediate-load.html');
		});

		it ("should override the default options", function() {
			expect(frame.options).toEqual({"frame": "base/spec/fixtures/frames/just-a-default-example.html", "source": "base/spec/fixtures/frames/", "load-immediately": true, "unload-when-not-visible": false, "title": "My Framed Page", "caption": "This is smaller caption text", "dimensions": true, "href": "http://example.com", "scrolling": "yes", "overlay": false, "scale": false, "viewport-width": "1000", "viewport-aspect-ratio": "1.5", "width": "300", "height": false, "viewport-device": false, "viewport-device-orientation": "portrait", "device-annotation": true, "device-frame": false});
		});

		it ("should have a title", function(){
			frame.inject_placeholder();
		    expect($('#jasmine-fixtures h3:contains("My Framed Page")')).toBeInDOM();
		});

		it ("should have a caption", function(){
			frame.inject_placeholder();
		    expect($('#jasmine-fixtures p:contains("This is smaller caption text")')).toBeInDOM();
		});

		it ("should have a href", function(){
			frame.inject_placeholder();
		    expect($('#jasmine-fixtures a[href="http://example.com"]')).toBeInDOM();
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(frame.get_iframe_styles()).toEqual('width:1000px; height:1500px; transform: scale(0.3); -webkit-transform: scale(0.3); ');
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(frame.get_iframe_wrap_styles()).toEqual('width:300px; height:450px;');
		});
	});

	describe("with data-scale option set", function() {
		beforeEach(function(){
			frame = load_frame('frame-with-scale-option.html');
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(frame.get_iframe_styles()).toEqual('width:320px; height:480px; transform: scale(0.25); -webkit-transform: scale(0.25); ');
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(frame.get_iframe_wrap_styles()).toEqual('width:80px; height:120px;');
		});
	});

	describe("with data-esb-height option set", function() {
		beforeEach(function(){
			frame = load_frame('frame-with-height-option.html');
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(frame.get_iframe_styles()).toEqual('width:320px; height:1200px; transform: scale(0.25); -webkit-transform: scale(0.25); ');
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(frame.get_iframe_wrap_styles()).toEqual('width:80px; height:300px;');
		});

		it ("should create a dimensions string", function() {
			expect(frame.get_dimensions_annotation()).toContain('320&times;1200');
			expect(frame.get_dimensions_annotation()).toContain('25%');
		});
	});
});

describe("EsbFrame with alternate config", function(){
	var frame = null,
		frame_snippet = null,
		uuid = null;

	beforeAll(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-frame-alt-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});	
	});

	describe("with no source specified in the config.json", function() {
		beforeEach(function(){
			frame = load_frame('frame-with-alternate-config-json.html');
		});

		it ("should use a relative path for the source", function (){
			expect(frame.iframe_src).toEqual('base/spec/fixtures/frames/just-a-default-example.html');
		});

		it ("should inherit options from the config file but allow them to be overridden at a parent-wrapper level and at the component level", function() {
			expect(frame.options).toEqual({"frame": "base/spec/fixtures/frames/just-a-default-example.html", "source": "", "load-immediately": false, "unload-when-not-visible": false, "title": "Global Page Viewer Title", "caption": "This caption is unique to the component", "dimensions": false, "href": "#link", "scrolling": "yes", "overlay": false, "scale": false, "viewport-width": 500, "viewport-aspect-ratio": 0.5, "width": 300, "height": false, "viewport-device": false, "viewport-device-orientation": "portrait", "device-annotation": true, "device-frame": false})
		});
	});

	describe("EsbFrame with data-esb-frame set in config.json", function(){
		beforeEach(function(){
			frame = load_frame('frame-with-framer-set-in-config-json.html');
		});

		it ("should inherit options from the config file including esb-page-viewer itself", function() {
			expect(frame.iframe_src).toEqual("set_in_config_json.html");
		});
	});

	describe("EsbFrame with data-esb-frame set within a page-level-config", function(){
		beforeEach(function(){
			frame = load_frame('frame-with-framer-set-in-page-level-config.html');
		});

		it ("should inherit options from the page-level config including esb-page-viewer itself", function() {
			expect(frame.iframe_src).toEqual("set_in_page_level_config.html");
		});
	});
});