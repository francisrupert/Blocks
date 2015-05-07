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
});