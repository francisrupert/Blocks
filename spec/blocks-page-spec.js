import BlocksPage from 'src/blocks-page'

describe("Blocks Page parsing", function(){
	beforeEach(function(){
		spyOn(BlocksPage, 'retrieve_page_title');
		BlocksPage.parse();
	});

	it("should call retrieve_page_title", function(){
		expect(BlocksPage.retrieve_page_title).toHaveBeenCalled();
	});
});
