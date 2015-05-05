import $ from 'jquery';
import BlocksConfig from './blocks-config';
import BlocksPage from './blocks-page';

BlocksConfig.load().then(function(data){
  BlocksPage.display();
});

export default {};
