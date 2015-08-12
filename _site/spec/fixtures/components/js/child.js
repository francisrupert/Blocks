/*jslint browser: true, eqeq: true, nomen: true, plusplus: true, maxerr: 50, indent: 2, white: false */
/*global $ */

var $component = $('[data-object="child"]');

$(document).on('child_v01', function () {
  window.console.log('CHILD component detected component JS trigger event');
});

$(document).on('blocks-done', function () {
  window.console.log('CHILD component detected that blocks finished loading');

  // Confirm that we can get at config data. Not sure how to turn this into a test
  var config = $('body').data('config'),
    user2 = config.template_data.base.user.two;

  if (user2.name !== undefined && user2.name.length > 0) {
    window.console.log('Obtained config values');
  }
});