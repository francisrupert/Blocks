/* */ 
"use strict";
var SafeString = require("./safe-string")["default"];
var escape = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};
var badChars = /[&<>"'`]/g;
var possible = /[&<>"'`]/;
function escapeChar(chr) {
  return escape[chr];
}
function extend(obj) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }
  return obj;
}
exports.extend = extend;
var toString = Object.prototype.toString;
exports.toString = toString;
var isFunction = function(value) {
  return typeof value === 'function';
};
if (isFunction(/x/)) {
  isFunction = function(value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
var isArray = Array.isArray || function(value) {
  return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
};
exports.isArray = isArray;
function escapeExpression(string) {
  if (string instanceof SafeString) {
    return string.toString();
  } else if (string == null) {
    return "";
  } else if (!string) {
    return string + '';
  }
  string = "" + string;
  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}
exports.escapeExpression = escapeExpression;
function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}
exports.isEmpty = isEmpty;
function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}
exports.appendContextPath = appendContextPath;
