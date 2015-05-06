import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import { EsbPageViewer } from 'src/esb-page-viewer';

describe("EsbPageViewer", function(){
	var page_viewer = null,
		page_viewer_snippet = null,
		uuid = null;
	jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';

	beforeEach(function(){
		loadFixtures('page-with-page-viewer.html');
		uuid = EsbUtil.generateUUID();
		page_viewer_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-page-viewer]')[0];
		page_viewer_snippet.setAttribute('data-esb-uuid', uuid);

		page_viewer = new EsbPageViewer({
			viewer_element: page_viewer_snippet,
	        original_snippet: page_viewer_snippet.outerHTML,
	        uuid: uuid
		});
	});


	it("should have a uuid", function(){
		expect(page_viewer.uuid).toEqual(uuid);
	});

	it("should have default options", function(){
		expect(page_viewer.options).toEqual({"load-immediately": false});
	});

	describe("with option overrides", function(){
		beforeEach(function(){
			loadFixtures('page-viewer-with-option-overrides.html');
			uuid = EsbUtil.generateUUID();
			page_viewer_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-page-viewer]')[0];
			page_viewer_snippet.setAttribute('data-esb-uuid', uuid);

			page_viewer = new EsbPageViewer({
				viewer_element: page_viewer_snippet,
		        original_snippet: page_viewer_snippet.outerHTML,
		        uuid: uuid
			});
		});
	
		it("should override the default options", function(){
			expect(page_viewer.options).toEqual({"load-immediately": true});
		});

		it("should load immediately", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[src="spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		});
	});

	describe("after EsbConfig is loaded", function(){
		beforeEach(function(done){
			EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
				page_viewer = new EsbPageViewer({
					viewer_element: page_viewer_snippet,
			        original_snippet: page_viewer_snippet.outerHTML,
			        uuid: uuid
				});
				done();
			});
		})
	
		it("should have access to BlocksConfig", function(){
			expect(page_viewer.config.get("page-viewers").get("source")).toEqual('spec/fixtures/page-viewers');
		});
	});

	describe("for a fully qualified URL", function(){
		beforeEach(function(){
			loadFixtures('page-viewer-fully-qualified-url.html');
			uuid = EsbUtil.generateUUID();
			page_viewer_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-page-viewer]')[0];
			page_viewer_snippet.setAttribute('data-esb-uuid', uuid);

			page_viewer = new EsbPageViewer({
				viewer_element: page_viewer_snippet,
		        original_snippet: page_viewer_snippet.outerHTML,
		        uuid: uuid
			});
		});

		it("should use the URL as-is", function(){
			expect(page_viewer.iframe_src).toEqual('http://google.com');
		});

		it("should create a placeholder iframe", function(){
			expect(page_viewer.placeholder_element).toMatch(/<iframe data-src="http:\/\/google.com"><\/iframe>/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="http://google.com"]')).toBeInDOM();
		});
	});

	describe("with a data-source attribute", function(){
		beforeEach(function(){
			loadFixtures('page-viewer-with-data-source-attribute.html');
			uuid = EsbUtil.generateUUID();
			page_viewer_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-page-viewer]')[0];
			page_viewer_snippet.setAttribute('data-esb-uuid', uuid);

			page_viewer = new EsbPageViewer({
				viewer_element: page_viewer_snippet,
		        original_snippet: page_viewer_snippet.outerHTML,
		        uuid: uuid
			});
		});

		it("should create the iframe_src using the data-source attribute plus the file name", function(){
			expect(page_viewer.iframe_src).toEqual('some/made-up/path/example.html');
		});

		it("should create a placeholder iframe", function(){
			expect(page_viewer.placeholder_element).toMatch(/<iframe data-src="some\/made-up\/path\/example.html"><\/iframe>/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="some/made-up/path/example.html"]')).toBeInDOM();
		});
	});

	describe("with no data-source attribute", function(){
		beforeEach(function(){
			loadFixtures('page-viewer-with-no-data-source-attribute.html');
			uuid = EsbUtil.generateUUID();
			page_viewer_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-page-viewer]')[0];
			page_viewer_snippet.setAttribute('data-esb-uuid', uuid);

			page_viewer = new EsbPageViewer({
				viewer_element: page_viewer_snippet,
		        original_snippet: page_viewer_snippet.outerHTML,
		        uuid: uuid
			});
		});

		it("should create the iframe_src using the data-source attribute plus the file name", function(){
			expect(page_viewer.iframe_src).toEqual('spec/fixtures/page-viewers/just-a-default-example.html');
		});

		it("should create a placeholder iframe", function(){
			expect(page_viewer.placeholder_element).toMatch(/<iframe data-src="spec\/fixtures\/page-viewers\/just-a-default-example.html"><\/iframe>/);
		});

		it("should replace the original snippet with the placeholder iframe", function(){
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		});

		it("should be able to load the iframe within the placeholder", function(){
			page_viewer.inject_placeholder();
			page_viewer.load_iframe();
		    expect($('#jasmine-fixtures iframe[src="spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		});
	});
});
