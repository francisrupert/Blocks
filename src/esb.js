import BlocksConfig from './blocks-config';
import BlocksPage from './blocks-page';

BlocksConfig.load().then(function(){
  BlocksPage.parse(); //Finds all blocks components, viewers, etc. and preps them for loading/display
  BlocksPage.display();
});

export default {};
