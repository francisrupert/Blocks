import EsbConfig from './esb-config';
import EsbPage from './esb-page';
import EsbUtil from './esb-util';

EsbConfig.load().then(function() {
  EsbPage.renderComponentFromQueryStringParams(); //Used by Frame to generate a component snippet from query string params
	EsbPage.parse(); //Finds all blocks components, viewers, etc. and preps them for loading/display
	EsbPage.display();
    EsbPage.blocksDone().then(
      function(){
        EsbPage.parseEsbMarks();
        EsbPage.displayEsbMarks();
        // Set basic window variable so other sources can poll and check
        window.blocks_done = true;
      },
      function() {
        EsbUtil.logger('error', 'BlocksDone did not fire.');
      }
    );
}, function(err) {
	window.console.log('Couldn\'t load EsbConfig: ' + err);
});

export default {};
