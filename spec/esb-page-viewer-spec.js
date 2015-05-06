import EsbUtil from 'src/esb-util';
import { EsbPageViewer } from 'src/esb-page-viewer';

describe("Blocks Page Viewer", function(){
	var page_viewer = null,
		page_viewer_snippet = null,
		uuid = null;

	beforeEach(function(){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		loadFixtures('page-with-page-viewer.html');
		uuid = EsbUtil.generateUUID();
		page_viewer_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-page-viewer]')[0];
		page_viewer_snippet.setAttribute('data-esb-uuid', uuid);

		page_viewer = new EsbPageViewer({
	        original_snippet: page_viewer_snippet.outerHTML,
	        uuid: uuid
		});
	});

	it("should have a uuid", function(){
		expect(page_viewer.uuid).toEqual(uuid);
	});
});
