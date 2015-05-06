import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import { EsbPageViewer } from 'src/esb-page-viewer';

describe("Blocks Page Viewer", function(){
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
			expect(page_viewer.placeholder_element).toEqual('<div class="esb-page-viewer"><iframe data-src="http://google.com"></iframe></div>')
		});

		it("should replace the original snippet with the placeholder iframe", function(){
		    expect($('#jasmine-fixtures div[data-esb-uuid="' + uuid + '"]')).toBeInDOM();
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="http://google.com"]')).toBeInDOM();
		    expect($('#jasmine-fixtures div[data-esb-uuid="' + uuid + '"]')).not.toBeInDOM();
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
			expect(page_viewer.placeholder_element).toEqual('<div class="esb-page-viewer"><iframe data-src="some/made-up/path/example.html"></iframe></div>')
		});

		it("should replace the original snippet with the placeholder iframe", function(){
		    expect($('#jasmine-fixtures div[data-esb-uuid="' + uuid + '"]')).toBeInDOM();
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="some/made-up/path/example.html"]')).toBeInDOM();
		    expect($('#jasmine-fixtures div[data-esb-uuid="' + uuid + '"]')).not.toBeInDOM();
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
			expect(page_viewer.placeholder_element).toEqual('<div class="esb-page-viewer"><iframe data-src="spec/fixtures/page-viewers/just-a-default-example.html"></iframe></div>')
		});

		it("should replace the original snippet with the placeholder iframe", function(){
		    expect($('#jasmine-fixtures div[data-esb-uuid="' + uuid + '"]')).toBeInDOM();
			page_viewer.inject_placeholder();
		    expect($('#jasmine-fixtures iframe[data-src="spec/fixtures/page-viewers/just-a-default-example.html"]')).toBeInDOM();
		    expect($('#jasmine-fixtures div[data-esb-uuid="' + uuid + '"]')).not.toBeInDOM();
		});
	});
});
