/* */ 
"use strict";
var Exception = require("../exception")["default"];
function LocationInfo(locInfo) {
  locInfo = locInfo || {};
  this.firstLine = locInfo.first_line;
  this.firstColumn = locInfo.first_column;
  this.lastColumn = locInfo.last_column;
  this.lastLine = locInfo.last_line;
}
var AST = {
  ProgramNode: function(statements, strip, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "program";
    this.statements = statements;
    this.strip = strip;
  },
  MustacheNode: function(rawParams, hash, open, strip, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "mustache";
    this.strip = strip;
    if (open != null && open.charAt) {
      var escapeFlag = open.charAt(3) || open.charAt(2);
      this.escaped = escapeFlag !== '{' && escapeFlag !== '&';
    } else {
      this.escaped = !!open;
    }
    if (rawParams instanceof AST.SexprNode) {
      this.sexpr = rawParams;
    } else {
      this.sexpr = new AST.SexprNode(rawParams, hash);
    }
    this.id = this.sexpr.id;
    this.params = this.sexpr.params;
    this.hash = this.sexpr.hash;
    this.eligibleHelper = this.sexpr.eligibleHelper;
    this.isHelper = this.sexpr.isHelper;
  },
  SexprNode: function(rawParams, hash, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "sexpr";
    this.hash = hash;
    var id = this.id = rawParams[0];
    var params = this.params = rawParams.slice(1);
    this.isHelper = !!(params.length || hash);
    this.eligibleHelper = this.isHelper || id.isSimple;
  },
  PartialNode: function(partialName, context, hash, strip, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "partial";
    this.partialName = partialName;
    this.context = context;
    this.hash = hash;
    this.strip = strip;
    this.strip.inlineStandalone = true;
  },
  BlockNode: function(mustache, program, inverse, strip, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = 'block';
    this.mustache = mustache;
    this.program = program;
    this.inverse = inverse;
    this.strip = strip;
    if (inverse && !program) {
      this.isInverse = true;
    }
  },
  RawBlockNode: function(mustache, content, close, locInfo) {
    LocationInfo.call(this, locInfo);
    if (mustache.sexpr.id.original !== close) {
      throw new Exception(mustache.sexpr.id.original + " doesn't match " + close, this);
    }
    content = new AST.ContentNode(content, locInfo);
    this.type = 'block';
    this.mustache = mustache;
    this.program = new AST.ProgramNode([content], {}, locInfo);
  },
  ContentNode: function(string, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "content";
    this.original = this.string = string;
  },
  HashNode: function(pairs, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "hash";
    this.pairs = pairs;
  },
  IdNode: function(parts, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "ID";
    var original = "",
        dig = [],
        depth = 0,
        depthString = '';
    for (var i = 0,
        l = parts.length; i < l; i++) {
      var part = parts[i].part;
      original += (parts[i].separator || '') + part;
      if (part === ".." || part === "." || part === "this") {
        if (dig.length > 0) {
          throw new Exception("Invalid path: " + original, this);
        } else if (part === "..") {
          depth++;
          depthString += '../';
        } else {
          this.isScoped = true;
        }
      } else {
        dig.push(part);
      }
    }
    this.original = original;
    this.parts = dig;
    this.string = dig.join('.');
    this.depth = depth;
    this.idName = depthString + this.string;
    this.isSimple = parts.length === 1 && !this.isScoped && depth === 0;
    this.stringModeValue = this.string;
  },
  PartialNameNode: function(name, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "PARTIAL_NAME";
    this.name = name.original;
  },
  DataNode: function(id, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "DATA";
    this.id = id;
    this.stringModeValue = id.stringModeValue;
    this.idName = '@' + id.stringModeValue;
  },
  StringNode: function(string, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "STRING";
    this.original = this.string = this.stringModeValue = string;
  },
  NumberNode: function(number, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "NUMBER";
    this.original = this.number = number;
    this.stringModeValue = Number(number);
  },
  BooleanNode: function(bool, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "BOOLEAN";
    this.bool = bool;
    this.stringModeValue = bool === "true";
  },
  CommentNode: function(comment, locInfo) {
    LocationInfo.call(this, locInfo);
    this.type = "comment";
    this.comment = comment;
    this.strip = {inlineStandalone: true};
  }
};
exports["default"] = AST;
