import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import { EsbMark } from 'src/esb-mark';

function load_mark(fixture, uuid) {
	var mark;
	uuid = typeof uuid === 'undefined' ? EsbUtil.generateUUID() : uuid;

	loadFixtures(fixture);
	mark_snippet = $("#jasmine-fixtures")[0].querySelectorAll('*[data-esb-mark]')[0];

	mark = new EsbMark({
        uuid: uuid,
        mark_snippet
	});	

	return mark;
}

beforeAll(function(done){
	jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
	EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
		done();
	}, function(err){
		console.log(err);
	});
})

describe("EsbMark", function(){
	var mark = null,
		mark_snippet = null,
		uuid = null;

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		mark = load_mark('page-with-mark.html', uuid);
	});


	it("should have a uuid", function(){
		expect(mark.uuid).toEqual(uuid);
	});
});