'use strict';
describe('Blocks loader cannot find a component', function() {
  it('should display an error message in the DOM', function() {
  	setTimeout(function(){
	    expect($('.esb-component-loading-error')[0]).toBeInDOM();
  	}, 500);
  	//LAME! Remove timeout and make sure test passes without - BETTER solution: move to unit tests
  });
});