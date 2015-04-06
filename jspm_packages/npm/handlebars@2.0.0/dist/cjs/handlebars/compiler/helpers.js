/* */ 
"use strict";
var Exception = require("../exception")["default"];
function stripFlags(open, close) {
  return {
    left: open.charAt(2) === '~',
    right: close.charAt(close.length - 3) === '~'
  };
}
exports.stripFlags = stripFlags;
function prepareBlock(mustache, program, inverseAndProgram, close, inverted, locInfo) {
  if (mustache.sexpr.id.original !== close.path.original) {
    throw new Exception(mustache.sexpr.id.original + ' doesn\'t match ' + close.path.original, mustache);
  }
  var inverse = inverseAndProgram && inverseAndProgram.program;
  var strip = {
    left: mustache.strip.left,
    right: close.strip.right,
    openStandalone: isNextWhitespace(program.statements),
    closeStandalone: isPrevWhitespace((inverse || program).statements)
  };
  if (mustache.strip.right) {
    omitRight(program.statements, null, true);
  }
  if (inverse) {
    var inverseStrip = inverseAndProgram.strip;
    if (inverseStrip.left) {
      omitLeft(program.statements, null, true);
    }
    if (inverseStrip.right) {
      omitRight(inverse.statements, null, true);
    }
    if (close.strip.left) {
      omitLeft(inverse.statements, null, true);
    }
    if (isPrevWhitespace(program.statements) && isNextWhitespace(inverse.statements)) {
      omitLeft(program.statements);
      omitRight(inverse.statements);
    }
  } else {
    if (close.strip.left) {
      omitLeft(program.statements, null, true);
    }
  }
  if (inverted) {
    return new this.BlockNode(mustache, inverse, program, strip, locInfo);
  } else {
    return new this.BlockNode(mustache, program, inverse, strip, locInfo);
  }
}
exports.prepareBlock = prepareBlock;
function prepareProgram(statements, isRoot) {
  for (var i = 0,
      l = statements.length; i < l; i++) {
    var current = statements[i],
        strip = current.strip;
    if (!strip) {
      continue;
    }
    var _isPrevWhitespace = isPrevWhitespace(statements, i, isRoot, current.type === 'partial'),
        _isNextWhitespace = isNextWhitespace(statements, i, isRoot),
        openStandalone = strip.openStandalone && _isPrevWhitespace,
        closeStandalone = strip.closeStandalone && _isNextWhitespace,
        inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;
    if (strip.right) {
      omitRight(statements, i, true);
    }
    if (strip.left) {
      omitLeft(statements, i, true);
    }
    if (inlineStandalone) {
      omitRight(statements, i);
      if (omitLeft(statements, i)) {
        if (current.type === 'partial') {
          current.indent = (/([ \t]+$)/).exec(statements[i - 1].original) ? RegExp.$1 : '';
        }
      }
    }
    if (openStandalone) {
      omitRight((current.program || current.inverse).statements);
      omitLeft(statements, i);
    }
    if (closeStandalone) {
      omitRight(statements, i);
      omitLeft((current.inverse || current.program).statements);
    }
  }
  return statements;
}
exports.prepareProgram = prepareProgram;
function isPrevWhitespace(statements, i, isRoot) {
  if (i === undefined) {
    i = statements.length;
  }
  var prev = statements[i - 1],
      sibling = statements[i - 2];
  if (!prev) {
    return isRoot;
  }
  if (prev.type === 'content') {
    return (sibling || !isRoot ? (/\r?\n\s*?$/) : (/(^|\r?\n)\s*?$/)).test(prev.original);
  }
}
function isNextWhitespace(statements, i, isRoot) {
  if (i === undefined) {
    i = -1;
  }
  var next = statements[i + 1],
      sibling = statements[i + 2];
  if (!next) {
    return isRoot;
  }
  if (next.type === 'content') {
    return (sibling || !isRoot ? (/^\s*?\r?\n/) : (/^\s*?(\r?\n|$)/)).test(next.original);
  }
}
function omitRight(statements, i, multiple) {
  var current = statements[i == null ? 0 : i + 1];
  if (!current || current.type !== 'content' || (!multiple && current.rightStripped)) {
    return;
  }
  var original = current.string;
  current.string = current.string.replace(multiple ? (/^\s+/) : (/^[ \t]*\r?\n?/), '');
  current.rightStripped = current.string !== original;
}
function omitLeft(statements, i, multiple) {
  var current = statements[i == null ? statements.length - 1 : i - 1];
  if (!current || current.type !== 'content' || (!multiple && current.leftStripped)) {
    return;
  }
  var original = current.string;
  current.string = current.string.replace(multiple ? (/\s+$/) : (/[ \t]+$/), '');
  current.leftStripped = current.string !== original;
  return current.leftStripped;
}
