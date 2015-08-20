import EsbConfig from 'src/esb-config';

describe("EsbConfig default config", function(){
	var config;
	
	beforeEach(function(){
		EsbConfig.setDefaults();
		config = EsbConfig.getConfig();
	})

	it("should define backward_compatible as false", function(){
		expect(config.get("backward_compatible")).toEqual(false);
	});

	it("should define path as ''", function(){
		expect(config.get("path")).toEqual('');
	});

	it("should define includes as a map with source = includes/", function(){
		expect(config.get("includes").get("source")).toEqual('includes/');
	});
});

describe("EsbConfig with config.json loaded", function(){
	var config;

	beforeEach(function(done){
		// Karma prepends statically served files with 'base/'
		EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
			config = EsbConfig.getConfig();
			done();
		}, function(err){
			console.log(err);
		});
	});

	it("should have a logging level of 'none'", function(){
		expect(config.get("logging")).toEqual("none");
	});
});