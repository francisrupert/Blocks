import EsbConfig from 'src/esb-config';
import EsbUtil from 'src/esb-util';
import { EsbInclude } from 'src/esb-include';

function load_include(fixture, uuid) {
	var include, include_snippet;
	uuid = typeof uuid === 'undefined' ? EsbUtil.generateUUID() : uuid;

	loadFixtures(fixture);
	include_snippet = document.getElementById("jasmine-fixtures").querySelectorAll('*[data-esb-include]')[0];
	include_snippet.setAttribute('data-esb-uuid', uuid);

	include = new EsbInclude({
		include_snippet: include_snippet,
		uuid: uuid
	});

	return include;
}

function test_include_html() {
	return '<article id="variations"><section data-esb-variation="v1"><h1>Hello Include within the spec!</h1><h2>{{fuzzy_bunny_replacement}}</h2></section></article>';
}

function test_legacy_include_html() {
	return '<article id="variations"><section data-variation="v1"><h1>Hello Include within the spec with legacy syntax!</h1><h2>{{fuzzy_bunny_replacement}}</h2></section></article>';
}

function test_variation_html() {
	return '<h2>{{fuzzy_bunny_replacement}}</h2>';
}

function nested_include_html() {
	return '<h1>Nested includes</h1><div data-esb-include="child-include" data-esb-variation="one"></div><div data-esb-include="child-include" data-esb-variation="two"></div>';
}

describe("EsbInclude", function(){
	var include = null,
		include_snippet = null,
		uuid = null;

	beforeAll(function(done){
		jasmine.getFixtures().fixturesPath = 'base/spec/fixtures';
		EsbConfig.load('base/spec/fixtures/esb-test-config.json').then(function(data){
			done();
		}, function(err){
			console.log(err);
		});
	});

	beforeEach(function(){
		uuid = EsbUtil.generateUUID();
		include = load_include('include.html', uuid);
	});

	afterEach(function(){
		// Remove dynamically added script and link tags from test so they don't persist in future tests 
		$('script[src="base/spec/fixtures/includes/js/test-include.js"]').remove();
		$('link[href="base/spec/fixtures/includes/css/test-include.css"]').remove();
		$('script[src="base/spec/fixtures/includes/js/child-include.js"]').remove();
		$('link[href="base/spec/fixtures/includes/css/child-include.css"]').remove();
	});

	it ("should have a uuid", function(){
		expect(include.uuid).toEqual(uuid);
	});

	it ("should have default options", function(){
		var options = include.get_default_options();
		expect(options.variation).toEqual('default');
		expect(options.source).toEqual('includes/');
		expect(options.replace_snippet).toEqual(true);
	});

	it("should have access to BlocksConfig", function(){
		expect(include.config.get("includes").get("source")).toEqual('base/spec/fixtures/includes/');
	});

	it ("should use options from BlocksConfig as overrides to the default options", function(){
		expect(include.options.source).toEqual('base/spec/fixtures/includes/');
	});

	it ("should use options from page-level config when present", function(){
		include = load_include('include-with-page-level-config.html');
		expect(include.options.variation).toEqual('set-at-page-level-variation');
	});

	it ("should use JSON passed in as the data-esb-content attribute", function(){
		expect(include.content_object.fuzzy_bunny_replacement).toEqual("Fluffy Rabbit's Day Out");
	});

	it ("should reference template_data in config.json when a key string is passed as the data-esb-content attribute", function(){
		include = load_include('include-using-template-data.html');
		expect(include.content_object.name).toEqual("Nathan Curtis");
	});

	it ("should have an include file path", function(){
		expect(include.include_file_path).toEqual('base/spec/fixtures/includes/test-include.html');
	});

	it ("should have a stylesheet file path", function(){
		expect(include.stylesheet_file_path).toEqual('base/spec/fixtures/includes/css/test-include.css');
	});

	it ("should have a script file path", function(){
		expect(include.script_file_path).toEqual('base/spec/fixtures/includes/js/test-include.js');
	});

	it ("should be able to retrieve the html within the include file", function(done){
		include.retrieve_html(include.include_file_path).then(function(html){
			expect(html).toMatch(/<h1>Hello Includes!<\/h1>/);
			done();
		}, function(err){
			console.log(err);
		});
	});


	it ("should be able to retrieve a variation from within the html file", function(){
		expect(include.parse_variation(test_include_html())).toMatch(/<h1>Hello Include within the spec!<\/h1>/);
	});

	it ("should be able to retrieve a variation from within the html file if the variation uses the legacy data-variation syntax", function(){
		expect(include.parse_variation(test_legacy_include_html())).toMatch(/<h1>Hello Include within the spec with legacy syntax!<\/h1>/);
	});

	it ("should compile the variation html with handlebars", function(){
		expect(include.compile_html_with_content(test_variation_html())).toMatch(/<h2>Fluffy Rabbit&#x27;s Day Out<\/h2>/);
	});

	it ("should be able to find include snippets within an html string", function(){
		include.compiled_html = nested_include_html();
		var nested_include_snippets = include.find_include_snippets();
		expect(nested_include_snippets.length).toEqual(2);
		expect(nested_include_snippets[0].outerHTML).toMatch(/data-esb-variation="one"/);
		expect(nested_include_snippets[1].outerHTML).toMatch(/data-esb-variation="two"/);
	});

	it ("should write script and style tags to the dom", function(done){
		include.render_asset_tags().then(function(){
			expect($('script[src="base/spec/fixtures/includes/js/test-include.js"]').length).toEqual(1);
			expect($('link[href="base/spec/fixtures/includes/css/test-include.css"]').length).toEqual(1);
			done();
		},
		function(err){
			console.log(err);
		});
	});

	it ("should render child includes", function(done){
		include.compiled_html = nested_include_html();
		include.child_include_snippets = include.find_include_snippets();
		include.render_child_includes().then(function(child_includes_array){
			expect(child_includes_array[0].compiled_html).toMatch(/<h2>I'm the nested part!<\/h2>/);
			expect(child_includes_array[1].compiled_html).toMatch(/<h3>Me too!<\/h3>/);
			done();
		}, function(err){
			console.log(err);
		});
	});

	it ("should include children within a parent include", function(done){
		include = load_include('include-nested.html', uuid);
		include.render_include().then(function(rendered_include){
			expect(rendered_include.compiled_html).toMatch(/<h2>I'm the nested part!<\/h2>/);
			expect(rendered_include.compiled_html).toMatch(/<h3>Me too!<\/h3>/);
			done();
		}, function(err){
			console.log(err);
		});
	});

	it ("should render an include to the dom along with its assets", function(done){
		include = load_include('include-nested.html', uuid);
		include.render().then(function(rendered_include){
		    expect($('#jasmine-fixtures h1:contains("Nested includes")')).toBeInDOM();
    		expect($('script[src="base/spec/fixtures/includes/js/test-include.js"]').length).toEqual(1);
			expect($('link[href="base/spec/fixtures/includes/css/test-include.css"]').length).toEqual(1);

			// There are two child includes, but the script and style should only be inserted once
    		expect($('script[src="base/spec/fixtures/includes/js/child-include.js"]').length).toEqual(1);
			expect($('link[href="base/spec/fixtures/includes/css/child-include.css"]').length).toEqual(1);
			done();		
		});
	});

	it ("should be able to pass variables to nested includes", function(done){
		include = load_include('include-nested-variables.html');
		include.render().then(function(rendered_include){
		    expect($('#jasmine-fixtures p:contains("The nested variable value is: x-wing")')).toBeInDOM();
			done();		
		});
	});

	it ("should wrap injected javascript files in comments if set in config", function(done){
		include = load_include('include-nested.html', uuid);
		include.config.set('wrap_injected_js_with_comments', true);
		include.render().then(function(rendered_include){
			var comments = [];
			var head_nodes = document.head.childNodes;
			for (var i=0; i < head_nodes.length; i++) {
				var node = head_nodes[i];
				if (node.nodeType === 8) {
					comments.push(node);
				}
			}

			for (i=0; i < comments.length; i++) {
				if (comments[i].textContent.match(/test-include.js/)){
					expect(comments[i].textContent).toEqual('<script src="base/spec/fixtures/includes/js/test-include.js" data-blocks-injected-js="true"></script>');
					done();
				}
			}
		});
	});

	xit ("should inject javascript assets only once per include even when wrapped in comments", function(done){
		include = load_include('include-nested.html', uuid);
		include.config.set('wrap_injected_js_with_comments', true);
		include.render().then(function(rendered_include){
			var comments = [];
			var comment_count = 0;
			var head_nodes = document.head.childNodes;
			for (var i=0; i < head_nodes.length; i++) {
				var node = head_nodes[i];
				if (node.nodeType === 8) {
					comments.push(node);
				}
			}

			for (i=0; i < comments.length; i++) {
				if (comments[i].textContent.match(/child-include.js/)){
					comment_count++;
				}
			}
			expect(comment_count).toEqual(1);
			done();
		});
	});
});