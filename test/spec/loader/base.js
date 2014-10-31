'use strict';

describe("Blocks2 loader by default", function() {
  beforeEach(function () {
    // var f = jasmine.getFixtures();
    // f.fixturesPath = 'base';
    // f.load('test/fixtures/base.html');
    jasmine.getFixtures().fixturesPath = 'fixtures/';
  });

  it("does not alter or remove elements on a page", function() {
    // loadFixtures('base.html');
    expect($('#base .initial-class')).toBeInDOM();
  });
});


describe("Blocks loader asynchronously", function() {
  var value;

  beforeEach(function(done) {
    $(document).on('blocks-done', function () {
      done();
    });
  });

  it("loads a component", function(done) {
    expect($('#base .l-header figure')).toBeInDOM();
    expect($('#base .l-header.with-content')).toBeInDOM();
    expect($('#base .l-header.with-content .name')).toHaveText('Nathan Curtis');
    done();
  });
});
