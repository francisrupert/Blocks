import $ from 'jquery';
import EsbPage from 'src/esb-page';
import { EsbPageViewer } from 'src/esb-page-viewer';

describe("Blocks Page parsing", function(){
	var components = null;

	beforeEach(function(){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
	});

	describe("when there are no blocks components found", function(){
		beforeEach(function(){
			loadFixtures('page-with-no-components.html');

			spyOn(EsbPage, 'retrievePageTitle').and.returnValue('Jasmine Test Title');
			spyOn(EsbPage, 'retrieveRootElement').and.returnValue($("#jasmine-fixtures"));
			EsbPage.parse();
		});

		it("should call retrievePageTitle", function(){
			expect(EsbPage.retrievePageTitle).toHaveBeenCalled();
			expect(EsbPage.retrievePageTitle()).toEqual('Jasmine Test Title');
		});

		it("should call retrieveRootElement", function(){
			expect(EsbPage.retrieveRootElement).toHaveBeenCalled();
			expect(EsbPage.retrieveRootElement().html()).toEqual('<div id="outer-wrap"></div>');
		});

		it ("should have a components count of 0", function(){
			expect(EsbPage.parsed_esb_components.length).toEqual(0);
		});
	});

	describe("when there is an esb-component on the page", function(){
		beforeEach(function(){
			loadFixtures('page-with-component.html');
			spyOn(EsbPage, 'retrieveRootElement').and.returnValue($("#jasmine-fixtures"));
			EsbPage.parse();
		});

		it ("should have a components count of 1", function(){
			expect(EsbPage.parsed_esb_components.length).toEqual(1);
		});
	});

	describe("when there is an esb-page-viewer on the page", function(){
		beforeEach(function(){
			loadFixtures('page-with-page-viewer.html');
			spyOn(EsbPage, 'retrieveRootElement').and.returnValue($("#jasmine-fixtures"));
			EsbPage.parse();
		});

		it ("should have an esb-page-viewers count of 1", function(){
			expect(EsbPage.parsed_esb_page_viewers.length).toEqual(1);
		});

		it ("should create an EsbPageViewer instance", function(){
			expect(EsbPage.parsed_esb_page_viewers[0].original_snippet).toMatch(/data-esb-page-viewer="http:\/\/google.com"/);
		});
	});
});
