import $ from 'jquery';
import BlocksPage from 'src/blocks-page';
import { EsbPageViewer } from 'src/esb-page-viewer';

describe("Blocks Page parsing", function(){
	var components = null;

	beforeEach(function(){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
	});

	describe("when there are no blocks components found", function(){
		beforeEach(function(){
			loadFixtures('blocks-page-no-components.html');

			spyOn(BlocksPage, 'retrievePageTitle').and.returnValue('Jasmine Test Title');
			spyOn(BlocksPage, 'retrieveRootElement').and.returnValue($("#jasmine-fixtures"));
			BlocksPage.parse();
		});

		it("should call retrievePageTitle", function(){
			expect(BlocksPage.retrievePageTitle).toHaveBeenCalled();
			expect(BlocksPage.retrievePageTitle()).toEqual('Jasmine Test Title');
		});

		it("should call retrieveRootElement", function(){
			expect(BlocksPage.retrieveRootElement).toHaveBeenCalled();
			expect(BlocksPage.retrieveRootElement().html()).toEqual('<div id="outer-wrap"></div>');
		});

		it ("should have a components count of 0", function(){
			expect(BlocksPage.parsed_esb_components.length).toEqual(0);
		});
	});

	describe("when there is an esb-component on the page", function(){
		beforeEach(function(){
			loadFixtures('blocks-page-containing-component.html');
			spyOn(BlocksPage, 'retrieveRootElement').and.returnValue($("#jasmine-fixtures"));
			BlocksPage.parse();
		});

		it ("should have a components count of 1", function(){
			expect(BlocksPage.parsed_esb_components.length).toEqual(1);
		});
	});

	describe("when there is an esb-page-viewer on the page", function(){
		beforeEach(function(){
			loadFixtures('blocks-page-containing-esb-page-viewer.html');
			spyOn(BlocksPage, 'retrieveRootElement').and.returnValue($("#jasmine-fixtures"));
			BlocksPage.parse();
		});

		it ("should have an esb-page-viewers count of 1", function(){
			expect(BlocksPage.parsed_esb_page_viewers.length).toEqual(1);
		});

		it ("should create an EsbPageViewer instance", function(){
			expect(BlocksPage.parsed_esb_page_viewers[0].original_snippet).toMatch(/data-esb-page-viewer="http:\/\/google.com"/);
		});
	});
});
