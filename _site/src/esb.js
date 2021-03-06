import EsbConfig from './esb-config';
import EsbPage from './esb-page';
import EsbUtil from './esb-util';

EsbConfig.load().then(function() {
  EsbPage.renderIncludeSnippetFromQueryStringParams(); //Used by Frame to generate a include snippet from query string params
	EsbPage.parse(); //Finds all blocks includes, viewers, etc. and preps them for loading/display
	EsbPage.display();
  EsbPage.blocksDone().then(
    function(){
      EsbPage.parseEsbMarks();
      EsbPage.displayEsbMarks();
    },
    function() {
      EsbUtil.logger('error', 'BlocksDone did not fire.');
    });
  }, function(err) {
	window.console.log('Couldn\'t load EsbConfig: ' + err);
});

export default {};
