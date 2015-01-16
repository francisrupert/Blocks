/* */ 
"use strict";
var COMPILER_REVISION = require("../base").COMPILER_REVISION;
var REVISION_CHANGES = require("../base").REVISION_CHANGES;
var Exception = require("../exception")["default"];
function Literal(value) {
  this.value = value;
}
function JavaScriptCompiler() {}
JavaScriptCompiler.prototype = {
  nameLookup: function(parent, name) {
    if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
      return parent + "." + name;
    } else {
      return parent + "['" + name + "']";
    }
  },
  depthedLookup: function(name) {
    this.aliases.lookup = 'this.lookup';
    return 'lookup(depths, "' + name + '")';
  },
  compilerInfo: function() {
    var revision = COMPILER_REVISION,
        versions = REVISION_CHANGES[revision];
    return [revision, versions];
  },
  appendToBuffer: function(string) {
    if (this.environment.isSimple) {
      return "return " + string + ";";
    } else {
      return {
        appendToBuffer: true,
        content: string,
        toString: function() {
          return "buffer += " + string + ";";
        }
      };
    }
  },
  initializeBuffer: function() {
    return this.quotedString("");
  },
  namespace: "Handlebars",
  compile: function(environment, options, context, asObject) {
    this.environment = environment;
    this.options = options;
    this.stringParams = this.options.stringParams;
    this.trackIds = this.options.trackIds;
    this.precompile = !asObject;
    this.name = this.environment.name;
    this.isChild = !!context;
    this.context = context || {
      programs: [],
      environments: []
    };
    this.preamble();
    this.stackSlot = 0;
    this.stackVars = [];
    this.aliases = {};
    this.registers = {list: []};
    this.hashes = [];
    this.compileStack = [];
    this.inlineStack = [];
    this.compileChildren(environment, options);
    this.useDepths = this.useDepths || environment.depths.list.length || this.options.compat;
    var opcodes = environment.opcodes,
        opcode,
        i,
        l;
    for (i = 0, l = opcodes.length; i < l; i++) {
      opcode = opcodes[i];
      this[opcode.opcode].apply(this, opcode.args);
    }
    this.pushSource('');
    if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
      throw new Exception('Compile completed with content left on stack');
    }
    var fn = this.createFunctionContext(asObject);
    if (!this.isChild) {
      var ret = {
        compiler: this.compilerInfo(),
        main: fn
      };
      var programs = this.context.programs;
      for (i = 0, l = programs.length; i < l; i++) {
        if (programs[i]) {
          ret[i] = programs[i];
        }
      }
      if (this.environment.usePartial) {
        ret.usePartial = true;
      }
      if (this.options.data) {
        ret.useData = true;
      }
      if (this.useDepths) {
        ret.useDepths = true;
      }
      if (this.options.compat) {
        ret.compat = true;
      }
      if (!asObject) {
        ret.compiler = JSON.stringify(ret.compiler);
        ret = this.objectLiteral(ret);
      }
      return ret;
    } else {
      return fn;
    }
  },
  preamble: function() {
    this.lastContext = 0;
    this.source = [];
  },
  createFunctionContext: function(asObject) {
    var varDeclarations = '';
    var locals = this.stackVars.concat(this.registers.list);
    if (locals.length > 0) {
      varDeclarations += ", " + locals.join(", ");
    }
    for (var alias in this.aliases) {
      if (this.aliases.hasOwnProperty(alias)) {
        varDeclarations += ', ' + alias + '=' + this.aliases[alias];
      }
    }
    var params = ["depth0", "helpers", "partials", "data"];
    if (this.useDepths) {
      params.push('depths');
    }
    var source = this.mergeSource(varDeclarations);
    if (asObject) {
      params.push(source);
      return Function.apply(this, params);
    } else {
      return 'function(' + params.join(',') + ') {\n  ' + source + '}';
    }
  },
  mergeSource: function(varDeclarations) {
    var source = '',
        buffer,
        appendOnly = !this.forceBuffer,
        appendFirst;
    for (var i = 0,
        len = this.source.length; i < len; i++) {
      var line = this.source[i];
      if (line.appendToBuffer) {
        if (buffer) {
          buffer = buffer + '\n    + ' + line.content;
        } else {
          buffer = line.content;
        }
      } else {
        if (buffer) {
          if (!source) {
            appendFirst = true;
            source = buffer + ';\n  ';
          } else {
            source += 'buffer += ' + buffer + ';\n  ';
          }
          buffer = undefined;
        }
        source += line + '\n  ';
        if (!this.environment.isSimple) {
          appendOnly = false;
        }
      }
    }
    if (appendOnly) {
      if (buffer || !source) {
        source += 'return ' + (buffer || '""') + ';\n';
      }
    } else {
      varDeclarations += ", buffer = " + (appendFirst ? '' : this.initializeBuffer());
      if (buffer) {
        source += 'return buffer + ' + buffer + ';\n';
      } else {
        source += 'return buffer;\n';
      }
    }
    if (varDeclarations) {
      source = 'var ' + varDeclarations.substring(2) + (appendFirst ? '' : ';\n  ') + source;
    }
    return source;
  },
  blockValue: function(name) {
    this.aliases.blockHelperMissing = 'helpers.blockHelperMissing';
    var params = [this.contextName(0)];
    this.setupParams(name, 0, params);
    var blockName = this.popStack();
    params.splice(1, 0, blockName);
    this.push('blockHelperMissing.call(' + params.join(', ') + ')');
  },
  ambiguousBlockValue: function() {
    this.aliases.blockHelperMissing = 'helpers.blockHelperMissing';
    var params = [this.contextName(0)];
    this.setupParams('', 0, params, true);
    this.flushInline();
    var current = this.topStack();
    params.splice(1, 0, current);
    this.pushSource("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
  },
  appendContent: function(content) {
    if (this.pendingContent) {
      content = this.pendingContent + content;
    }
    this.pendingContent = content;
  },
  append: function() {
    this.flushInline();
    var local = this.popStack();
    this.pushSource('if (' + local + ' != null) { ' + this.appendToBuffer(local) + ' }');
    if (this.environment.isSimple) {
      this.pushSource("else { " + this.appendToBuffer("''") + " }");
    }
  },
  appendEscaped: function() {
    this.aliases.escapeExpression = 'this.escapeExpression';
    this.pushSource(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"));
  },
  getContext: function(depth) {
    this.lastContext = depth;
  },
  pushContext: function() {
    this.pushStackLiteral(this.contextName(this.lastContext));
  },
  lookupOnContext: function(parts, falsy, scoped) {
    var i = 0,
        len = parts.length;
    if (!scoped && this.options.compat && !this.lastContext) {
      this.push(this.depthedLookup(parts[i++]));
    } else {
      this.pushContext();
    }
    for (; i < len; i++) {
      this.replaceStack(function(current) {
        var lookup = this.nameLookup(current, parts[i], 'context');
        if (!falsy) {
          return ' != null ? ' + lookup + ' : ' + current;
        } else {
          return ' && ' + lookup;
        }
      });
    }
  },
  lookupData: function(depth, parts) {
    if (!depth) {
      this.pushStackLiteral('data');
    } else {
      this.pushStackLiteral('this.data(data, ' + depth + ')');
    }
    var len = parts.length;
    for (var i = 0; i < len; i++) {
      this.replaceStack(function(current) {
        return ' && ' + this.nameLookup(current, parts[i], 'data');
      });
    }
  },
  resolvePossibleLambda: function() {
    this.aliases.lambda = 'this.lambda';
    this.push('lambda(' + this.popStack() + ', ' + this.contextName(0) + ')');
  },
  pushStringParam: function(string, type) {
    this.pushContext();
    this.pushString(type);
    if (type !== 'sexpr') {
      if (typeof string === 'string') {
        this.pushString(string);
      } else {
        this.pushStackLiteral(string);
      }
    }
  },
  emptyHash: function() {
    this.pushStackLiteral('{}');
    if (this.trackIds) {
      this.push('{}');
    }
    if (this.stringParams) {
      this.push('{}');
      this.push('{}');
    }
  },
  pushHash: function() {
    if (this.hash) {
      this.hashes.push(this.hash);
    }
    this.hash = {
      values: [],
      types: [],
      contexts: [],
      ids: []
    };
  },
  popHash: function() {
    var hash = this.hash;
    this.hash = this.hashes.pop();
    if (this.trackIds) {
      this.push('{' + hash.ids.join(',') + '}');
    }
    if (this.stringParams) {
      this.push('{' + hash.contexts.join(',') + '}');
      this.push('{' + hash.types.join(',') + '}');
    }
    this.push('{\n    ' + hash.values.join(',\n    ') + '\n  }');
  },
  pushString: function(string) {
    this.pushStackLiteral(this.quotedString(string));
  },
  push: function(expr) {
    this.inlineStack.push(expr);
    return expr;
  },
  pushLiteral: function(value) {
    this.pushStackLiteral(value);
  },
  pushProgram: function(guid) {
    if (guid != null) {
      this.pushStackLiteral(this.programExpression(guid));
    } else {
      this.pushStackLiteral(null);
    }
  },
  invokeHelper: function(paramSize, name, isSimple) {
    this.aliases.helperMissing = 'helpers.helperMissing';
    var nonHelper = this.popStack();
    var helper = this.setupHelper(paramSize, name);
    var lookup = (isSimple ? helper.name + ' || ' : '') + nonHelper + ' || helperMissing';
    this.push('((' + lookup + ').call(' + helper.callParams + '))');
  },
  invokeKnownHelper: function(paramSize, name) {
    var helper = this.setupHelper(paramSize, name);
    this.push(helper.name + ".call(" + helper.callParams + ")");
  },
  invokeAmbiguous: function(name, helperCall) {
    this.aliases.functionType = '"function"';
    this.aliases.helperMissing = 'helpers.helperMissing';
    this.useRegister('helper');
    var nonHelper = this.popStack();
    this.emptyHash();
    var helper = this.setupHelper(0, name, helperCall);
    var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');
    this.push('((helper = (helper = ' + helperName + ' || ' + nonHelper + ') != null ? helper : helperMissing' + (helper.paramsInit ? '),(' + helper.paramsInit : '') + '),' + '(typeof helper === functionType ? helper.call(' + helper.callParams + ') : helper))');
  },
  invokePartial: function(name, indent) {
    var params = [this.nameLookup('partials', name, 'partial'), "'" + indent + "'", "'" + name + "'", this.popStack(), this.popStack(), "helpers", "partials"];
    if (this.options.data) {
      params.push("data");
    } else if (this.options.compat) {
      params.push('undefined');
    }
    if (this.options.compat) {
      params.push('depths');
    }
    this.push("this.invokePartial(" + params.join(", ") + ")");
  },
  assignToHash: function(key) {
    var value = this.popStack(),
        context,
        type,
        id;
    if (this.trackIds) {
      id = this.popStack();
    }
    if (this.stringParams) {
      type = this.popStack();
      context = this.popStack();
    }
    var hash = this.hash;
    if (context) {
      hash.contexts.push("'" + key + "': " + context);
    }
    if (type) {
      hash.types.push("'" + key + "': " + type);
    }
    if (id) {
      hash.ids.push("'" + key + "': " + id);
    }
    hash.values.push("'" + key + "': (" + value + ")");
  },
  pushId: function(type, name) {
    if (type === 'ID' || type === 'DATA') {
      this.pushString(name);
    } else if (type === 'sexpr') {
      this.pushStackLiteral('true');
    } else {
      this.pushStackLiteral('null');
    }
  },
  compiler: JavaScriptCompiler,
  compileChildren: function(environment, options) {
    var children = environment.children,
        child,
        compiler;
    for (var i = 0,
        l = children.length; i < l; i++) {
      child = children[i];
      compiler = new this.compiler();
      var index = this.matchExistingProgram(child);
      if (index == null) {
        this.context.programs.push('');
        index = this.context.programs.length;
        child.index = index;
        child.name = 'program' + index;
        this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
        this.context.environments[index] = child;
        this.useDepths = this.useDepths || compiler.useDepths;
      } else {
        child.index = index;
        child.name = 'program' + index;
      }
    }
  },
  matchExistingProgram: function(child) {
    for (var i = 0,
        len = this.context.environments.length; i < len; i++) {
      var environment = this.context.environments[i];
      if (environment && environment.equals(child)) {
        return i;
      }
    }
  },
  programExpression: function(guid) {
    var child = this.environment.children[guid],
        depths = child.depths.list,
        useDepths = this.useDepths,
        depth;
    var programParams = [child.index, 'data'];
    if (useDepths) {
      programParams.push('depths');
    }
    return 'this.program(' + programParams.join(', ') + ')';
  },
  useRegister: function(name) {
    if (!this.registers[name]) {
      this.registers[name] = true;
      this.registers.list.push(name);
    }
  },
  pushStackLiteral: function(item) {
    return this.push(new Literal(item));
  },
  pushSource: function(source) {
    if (this.pendingContent) {
      this.source.push(this.appendToBuffer(this.quotedString(this.pendingContent)));
      this.pendingContent = undefined;
    }
    if (source) {
      this.source.push(source);
    }
  },
  pushStack: function(item) {
    this.flushInline();
    var stack = this.incrStack();
    this.pushSource(stack + " = " + item + ";");
    this.compileStack.push(stack);
    return stack;
  },
  replaceStack: function(callback) {
    var prefix = '',
        inline = this.isInline(),
        stack,
        createdStack,
        usedLiteral;
    if (!this.isInline()) {
      throw new Exception('replaceStack on non-inline');
    }
    var top = this.popStack(true);
    if (top instanceof Literal) {
      prefix = stack = top.value;
      usedLiteral = true;
    } else {
      createdStack = !this.stackSlot;
      var name = !createdStack ? this.topStackName() : this.incrStack();
      prefix = '(' + this.push(name) + ' = ' + top + ')';
      stack = this.topStack();
    }
    var item = callback.call(this, stack);
    if (!usedLiteral) {
      this.popStack();
    }
    if (createdStack) {
      this.stackSlot--;
    }
    this.push('(' + prefix + item + ')');
  },
  incrStack: function() {
    this.stackSlot++;
    if (this.stackSlot > this.stackVars.length) {
      this.stackVars.push("stack" + this.stackSlot);
    }
    return this.topStackName();
  },
  topStackName: function() {
    return "stack" + this.stackSlot;
  },
  flushInline: function() {
    var inlineStack = this.inlineStack;
    if (inlineStack.length) {
      this.inlineStack = [];
      for (var i = 0,
          len = inlineStack.length; i < len; i++) {
        var entry = inlineStack[i];
        if (entry instanceof Literal) {
          this.compileStack.push(entry);
        } else {
          this.pushStack(entry);
        }
      }
    }
  },
  isInline: function() {
    return this.inlineStack.length;
  },
  popStack: function(wrapped) {
    var inline = this.isInline(),
        item = (inline ? this.inlineStack : this.compileStack).pop();
    if (!wrapped && (item instanceof Literal)) {
      return item.value;
    } else {
      if (!inline) {
        if (!this.stackSlot) {
          throw new Exception('Invalid stack pop');
        }
        this.stackSlot--;
      }
      return item;
    }
  },
  topStack: function() {
    var stack = (this.isInline() ? this.inlineStack : this.compileStack),
        item = stack[stack.length - 1];
    if (item instanceof Literal) {
      return item.value;
    } else {
      return item;
    }
  },
  contextName: function(context) {
    if (this.useDepths && context) {
      return 'depths[' + context + ']';
    } else {
      return 'depth' + context;
    }
  },
  quotedString: function(str) {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + '"';
  },
  objectLiteral: function(obj) {
    var pairs = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        pairs.push(this.quotedString(key) + ':' + obj[key]);
      }
    }
    return '{' + pairs.join(',') + '}';
  },
  setupHelper: function(paramSize, name, blockHelper) {
    var params = [],
        paramsInit = this.setupParams(name, paramSize, params, blockHelper);
    var foundHelper = this.nameLookup('helpers', name, 'helper');
    return {
      params: params,
      paramsInit: paramsInit,
      name: foundHelper,
      callParams: [this.contextName(0)].concat(params).join(", ")
    };
  },
  setupOptions: function(helper, paramSize, params) {
    var options = {},
        contexts = [],
        types = [],
        ids = [],
        param,
        inverse,
        program;
    options.name = this.quotedString(helper);
    options.hash = this.popStack();
    if (this.trackIds) {
      options.hashIds = this.popStack();
    }
    if (this.stringParams) {
      options.hashTypes = this.popStack();
      options.hashContexts = this.popStack();
    }
    inverse = this.popStack();
    program = this.popStack();
    if (program || inverse) {
      if (!program) {
        program = 'this.noop';
      }
      if (!inverse) {
        inverse = 'this.noop';
      }
      options.fn = program;
      options.inverse = inverse;
    }
    var i = paramSize;
    while (i--) {
      param = this.popStack();
      params[i] = param;
      if (this.trackIds) {
        ids[i] = this.popStack();
      }
      if (this.stringParams) {
        types[i] = this.popStack();
        contexts[i] = this.popStack();
      }
    }
    if (this.trackIds) {
      options.ids = "[" + ids.join(",") + "]";
    }
    if (this.stringParams) {
      options.types = "[" + types.join(",") + "]";
      options.contexts = "[" + contexts.join(",") + "]";
    }
    if (this.options.data) {
      options.data = "data";
    }
    return options;
  },
  setupParams: function(helperName, paramSize, params, useRegister) {
    var options = this.objectLiteral(this.setupOptions(helperName, paramSize, params));
    if (useRegister) {
      this.useRegister('options');
      params.push('options');
      return 'options=' + options;
    } else {
      params.push(options);
      return '';
    }
  }
};
var reservedWords = ("break else new var" + " case finally return void" + " catch for switch while" + " continue function this with" + " default if throw" + " delete in try" + " do instanceof typeof" + " abstract enum int short" + " boolean export interface static" + " byte extends long super" + " char final native synchronized" + " class float package throws" + " const goto private transient" + " debugger implements protected volatile" + " double import public let yield").split(" ");
var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};
for (var i = 0,
    l = reservedWords.length; i < l; i++) {
  compilerWords[reservedWords[i]] = true;
}
JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
  return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
};
exports["default"] = JavaScriptCompiler;
