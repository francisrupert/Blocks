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


describe("EsbFrame", function(){
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
	
	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		frame = load_frame('page-with-frame.html', uuid);
	});


	it("should have a uuid", function(){
		expect(frame.uuid).toEqual(uuid);
	});

	it("should have default options", function(){
		expect(frame.options.frame).toEqual("http://google.com");
		expect(frame.options['load-immediately']).toEqual(false);
		expect(frame.options['unload-when-not-visible']).toEqual(false);
	});

	it("should have access to BlocksConfig", function(){
		expect(frame.config.get("frames").get("source")).toEqual('base/spec/fixtures/frames');
	});

	it ("should get the correct width, height, and aspect ratio options when given a device of 'iphone-5'", function(){
		expect(frame.get_device_dimensions('iphone-5')).toEqual({"width":320, "height":568, "iframe-height": 568, "aspect-ratio":'1.77500'});
	});

	it ("should get the correct width, height, and aspect ratio options when given a device of 'iphone-5' and show-browser-ui='true'", function(){
		expect(frame.get_device_dimensions('iphone-5', 'portrait', true)).toEqual({"width":320, "height":568, "iframe-height": 528, "aspect-ratio":'1.77500'});
	});

	it ("should get the correct width, height, and aspect ratio options when given a device of 'iphone-5' and an orientation of 'landscape'", function(){
		expect(frame.get_device_dimensions('iphone-5', 'landscape')).toEqual({"width":568, "height":320, "iframe-height": 320, "aspect-ratio":'0.56338'});
	});

	describe("with option overrides", function(){
		beforeEach(function(){
			frame = load_frame('frame-with-option-overrides.html');
		});
	
		it("should override the default options", function(){
			expect(frame.iframe_src).toEqual("base/spec/fixtures/frames/just-a-default-example.html");
			expect(frame.options["load-immediately"]).toEqual(true);
		});

		it("should load immediately", function(){
			spyOn(frame, 'load_iframe');
			frame.inject_placeholder();
			expect(frame.load_iframe).toHaveBeenCalled();
		});

		it("should keep track of which options have been overridden", function(){
			expect(frame.is_option_overridden('load-immediately')).toEqual(true);
			expect(frame.is_option_overridden('title')).toEqual(false);
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
			expect(frame.placeholder_element.outerHTML).toMatch(/data-src="http:\/\/google.com"/);
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
			expect(frame.placeholder_element.outerHTML).toMatch(/data-src="some\/made-up\/path\/example.html"/);
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
			expect(frame.placeholder_element.outerHTML).toMatch(/data-src="base\/spec\/fixtures\/frames\/just-a-default-example.html"/);
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
		    // expect($('#jasmine-fixtures .esb-frame-iframe-inner-wrap').length).toEqual(1);
		    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to programatically unload the iframe by triggering an event", function(){
			frame.inject_placeholder();
			frame.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();

			// if (window.CustomEvent) {
			//   var event = new CustomEvent('unload-esb-frame-' + frame.uuid);
			// } else {
			//   var event = document.createEvent('CustomEvent');
			//   event.initCustomEvent('unload-esb-frame-' + frame.uuid, true, true);
			// }

			// document.dispatchEvent(event);

		 //    expect($('#jasmine-fixtures iframe[src="base/spec/fixtures/frames/just-a-default-example.html"]')).not.toBeInDOM();
		 //    expect($('#jasmine-fixtures iframe[data-src="base/spec/fixtures/frames/just-a-default-example.html"]')).toBeInDOM();
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
			expect(frame.options.title).toEqual("My Framed Page");
			expect(frame.options.caption).toEqual("This is smaller caption text");
			expect(frame.options.href).toEqual("http://example.com");
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
			expect(frame.get_iframe_inner_wrap_styles()).toEqual({width: '1000px', height:'1500px', transform: 'scale(0.3)', webkitTransform: 'scale(0.3)'});
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(frame.get_iframe_outer_wrap_styles()).toEqual({width:'300px', height:'450px'});
		});
	});

	describe("with data-scale option set", function() {
		beforeEach(function(){
			frame = load_frame('frame-with-scale-option.html');
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(frame.get_iframe_inner_wrap_styles()).toEqual({width:'320px', height:'480px', transform: 'scale(0.25)', webkitTransform: 'scale(0.25)'});
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(frame.get_iframe_outer_wrap_styles()).toEqual({width:'80px', height:'120px'});
		});
	});

	describe("with data-esb-height option set", function() {
		beforeEach(function(){
			frame = load_frame('frame-with-height-option.html');
		});

		it ("should calculate the correct width, height, and scale of the iframe ", function(){
			expect(frame.get_iframe_inner_wrap_styles()).toEqual({width:'320px', height:'1200px', transform: 'scale(0.25)', webkitTransform: 'scale(0.25)'});
		});

		it ("should calculate the correct width and height of the iframe wrapper", function(){
			expect(frame.get_iframe_outer_wrap_styles()).toEqual({width:'80px', height:'300px'});
		});

		it ("should create a dimensions string", function() {
			expect(frame.get_element_dimensions_annotation().outerHTML).toContain('320');
			expect(frame.get_element_dimensions_annotation().outerHTML).toContain('1200');
			expect(frame.get_element_dimensions_annotation().outerHTML).toContain('25%');
		});
	});

	describe("for a framed component", function() {
		beforeEach(function(){
			frame = load_frame('frame-component-modern-syntax.html');
		});

		it ("should create a dynamic component url", function() {
			expect(frame.iframe_src).toEqual('base/spec/fixtures/component_frame_template.html?data-esb-component=header&data-esb-variation=base&data-esb-source=&data-esb-place=replace&data-esb-target=body');
		});

		it ("should persist any existing query params on the component frame template", function(){
			frame.options['component-frame-template'] = "component_frame_template.html?fuzzy=bunny&foo=bar";
			expect(frame.build_iframe_src(frame.options)).toEqual('component_frame_template.html?fuzzy=bunny&foo=bar&data-esb-component=header&data-esb-variation=base&data-esb-source=&data-esb-place=replace&data-esb-target=body')
		});

		// it ("should use the same defaults as a regular Frame", function(){
		// 	frame.options['load-immediately'] = true;
		// 	frame.inject_placeholder();
		// 	expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-inner-wrap").width()).toEqual(1000);
		// 	expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-wrap").width()).toEqual(200);
		// });
	});

	describe("for a framed component that has loaded", function(){
		var originalTimeout;

		beforeEach(function(done){
			var loaded_interval,
				frame = load_frame('frame-component-modern-syntax.html');
			originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
			jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

			frame.options['load-immediately'] = true;
			frame.inject_placeholder_if_placeholder_is_created();

			loaded_interval = setInterval(function(){
				if ($("#jasmine-fixtures .esb-frame--dynamically-resized").length === 1) {
					clearInterval(loaded_interval);
					done();
				}
			}, 500);
		});

	    afterEach(function() {
	      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
	    });

		it ("should conform the frame to the size of the component by default", function(){
			expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-inner-wrap").height()).toEqual(100);
			expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-inner-wrap").width()).toEqual(400);

		});
	});

	describe("for a cropped framed component that has loaded", function(){
		var originalTimeout;

		beforeEach(function(done){
			var loaded_interval,
				frame = load_frame('frame-component-modern-syntax-cropped.html');
			originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
			jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

			frame.options['load-immediately'] = true;
			frame.inject_placeholder_if_placeholder_is_created();

			loaded_interval = setInterval(function(){
				if ($("#jasmine-fixtures .esb-frame--dynamically-resized").length === 1) {
					clearInterval(loaded_interval);
					done();
				}
			}, 500);
		});

	    afterEach(function() {
	      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
	    });

		it ("should crop the iframe to the given height and width", function(){
			expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-inner-wrap").height()).toEqual(100);
			expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-inner-wrap").width()).toEqual(400);
			expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-wrap").width()).toEqual(100);
			expect($("#jasmine-fixtures .esb-frame .esb-frame-iframe-wrap").height()).toEqual(100);
		});
	});
});

describe("EsbFrame with alternate config", function(){
	var frame = null,
		frame_snippet = null,
		uuid = null;

	beforeAll(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-test-alt-config.json').then(function(data){
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
			expect(frame.options.title).toEqual("Global Page Viewer Title");
			expect(frame.options.caption).toEqual("This caption is unique to the component");
			expect(frame.options.source).toEqual("");
			expect(frame.options.scrolling).toEqual("yes");
			expect(frame.options.overlay).toEqual(false);
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