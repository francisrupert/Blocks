import BlocksConfig from 'src/blocks-config'

describe("BlocksConfig default config", function(){
	var config;
	
	beforeEach(function(){
		config = BlocksConfig.getConfig();
	})

	it("should define backward_compatible as false", function(){
		expect(config.get("backward_compatible")).toEqual(false);
	});

	it("should define path as ''", function(){
		expect(config.get("path")).toEqual('');
	});

	it("should define components as a map with source = components/", function(){
		expect(config.get("components").get("source")).toEqual('components/');
	});
});

describe("Blocks with config.json loaded", function(){
	var config;

	beforeEach(function(done){
		// Karma prepends statically served files with 'base/'
		BlocksConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
			config = BlocksConfig.getConfig();
			done();
		});
	});

	it("should have a logging level of 'debug'", function(){
		expect(config.get("logging")).toEqual("debug");
	});

	it("should components as a map with replace_reference = true", function(){
		expect(config.get("components").get("replace_reference")).toEqual(true);
	});
});