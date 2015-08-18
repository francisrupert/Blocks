import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';

describe("EsbUtil", function(){
	beforeEach(function(done){
		EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});
	});

	it ("should be able to convert a string 'true' or 'false' to the boolean equivalent", function() {
		expect(EsbUtil.booleanXorValue('true')).toEqual(true);
		expect(EsbUtil.booleanXorValue('TRUE')).toEqual(true);
		expect(EsbUtil.booleanXorValue('True')).toEqual(true);
		expect(EsbUtil.booleanXorValue(true)).toEqual(true);
		expect(EsbUtil.booleanXorValue('false')).toEqual(false);
		expect(EsbUtil.booleanXorValue('FALSE')).toEqual(false);
		expect(EsbUtil.booleanXorValue('False')).toEqual(false);
		expect(EsbUtil.booleanXorValue(false)).toEqual(false);
		expect(EsbUtil.booleanXorValue('foo')).toEqual('foo');
	});

	it ("should be able to convert a query string to a JSON object", function() {
		expect(EsbUtil.convertQueryStringToJson('?data-esb-component=my-navbar&data-esb-variation=foo&data-esb-source=library&data-esb-target=#jasmine-fixtures&data-esb-place=replace')).toEqual({
			"data-esb-component": "my-navbar",
			"data-esb-variation": "foo",
			"data-esb-source": "library",
			"data-esb-target": "#jasmine-fixtures",
			"data-esb-place": "replace"
		})
	});

	it ("should know when a string is valid JSON", function(){
		expect(EsbUtil.is_json('{"valid":"json", "for-sure":1, "boolean":true}')).toEqual(true);
	});

	it ("should know when a string is NOT valid JSON", function(){
		expect(EsbUtil.is_json('data.key')).toEqual(false);
	});
});