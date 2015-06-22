import EsbConfig from './esb-config';
import EsbPage from './esb-page';

EsbConfig.load().then(function() {
	EsbPage.parse(); //Finds all blocks components, viewers, etc. and preps them for loading/display
	EsbPage.display();
}, function(err) {
	window.console.log('Couldn\'t load EsbConfig: ' + err);
});

export default {};
