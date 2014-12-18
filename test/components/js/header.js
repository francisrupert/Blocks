/*jslint browser: true, eqeq: true, nomen: true, plusplus: true, maxerr: 50, indent: 2, white: false */
/*global $ */

var $component = $('[data-object="header"]');

window.console.log('HEADER component is ' + $component.height() + 'px tall');

$(document).on('header_with_content', function () {
  window.console.log('HEADER component detected component JS trigger event');
});

$(document).on('blocks-done', function () {
  window.console.log('HEADER component detected that blocks finished loading');
});