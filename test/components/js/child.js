/*jslint browser: true, eqeq: true, nomen: true, plusplus: true, maxerr: 50, indent: 2, white: false */
/*global $ */

var $component = $('[data-object="child"]');

$(document).on('child_v01', function () {
  window.console.log('CHILD component detected component JS trigger event');
});

$(document).on('blocks-done', function () {
  window.console.log('CHILD component detected that blocks finished loading');
});