'use strict';

describe("Blocks loader by default", function() {
  it("does not alter or remove elements on a page", function() {
    expect($('#base .initial-class')).toBeInDOM();
  });
});

describe("Blocks loader renders a template", function() {
  beforeEach(function(done) {
    $(document).on('header_with_content', function () {
      done();
    });
  });

  it("with content", function (done) {
    expect($('#base .l-header.with-content .name')).toHaveText('Nathan Curtis');
    done();
  });
});

describe("Blocks loader merges classes", function() {
  beforeEach(function(done) {
    setTimeout(function () {
      done();
    }, 300);
  });

  it("with classes placed on the variation", function (done) {
    expect($('#base .l-header.with-content')).toBeInDOM();
    done();
  });
});

describe("Blocks loader renders nested components", function() {
  beforeEach(function(done) {
    setTimeout(function () {
      done();
    }, 300);
  });

  it("of the same variation", function (done) {
    expect($('#base .l-parent.v01 > .child-v01')).toHaveLength(2);
    done();
  });

  it("of different variations", function (done) {
    expect($('#base .l-parent.v02 > .child-v02')).toBeInDOM();
    done();
  });
});

describe('Blocks loader replaces comeponents with their contents when data-place="replace"', function() {
  beforeEach(function(done) {
    setTimeout(function () {
      done();
    }, 300);
  });

  it('and the component markup is not present', function(done) {
    expect($('#base .i-should-not-appear')).not.toBeInDOM();
    done();
  });
});
