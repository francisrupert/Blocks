/*jslint browser: true, eqeq: true, nomen: true, plusplus: true, maxerr: 50, indent: 2, white: false */
/*global document, Handlebars, _, window */
/*!
 * EightShapes Blocks framework
 * https://github.com/EightShapes/Blocks
 *
 * ©Copyright 2014 Eight Shapes LLC
 *
 * Terms of Use: http://unify.eightshapes.com/about-the-system/terms-of-use/
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function ($, console, document) {
  "use strict";

  var BlocksLoader = function (element, opts) {
    this.$el = $(element);
    this.config = null;
    this.components = [];
    this.component_variations = {};
    this.cache = {};
    this.bus = {};
    this.logging = true;
    this.time_duration = null;

    this.prepare();
    this.loadConfig(opts);
  };

  var Component = function (opts) {
    this.config = opts.parent.config; // stupid way to share config between objects
    this.parent = opts.parent;
    this.page = opts.page;
    this.init(opts.component);
  };

  Component.prototype = {
    init: function ($component) {
      var self = this;

      self.setID($component);

      self.$el = $component;
      self.name = $component.attr('data-component');
      self.source = $component.attr('data-source');

      self.setComponentPath();
      self.setVariationName($component);
      self.setTemplateData($component);
      self.setWrappingMarkup($component);

      self.is_nested = (self.parent.type === undefined || self.parent.type === 'component');
      self.has_nested = false;

      self.classes = [];
      self.classes.push($component.attr('class'));
      self.attributes = {};

      // Kids!
      self.children = {};

      // This is irritating but, we need to track the header classes for
      // nested components for when it comes time to render
      self.child_classes = {};
      self.child_attributes = {};

      // Rendering configuration
      self.setRenderingConfig();

      // Keep count of child dependencies (nested components)
      self.child_count = 0;
      self.children_loaded = 0;
      self.children_rendered = 0;
      // For components with no children we can skip ahead
      self.no_children = false;

      $.when(self.fetch()).then(function (data) {
        self.parse(data).done(function () {
          self.parent.childDoneLoading(self);
        });
      });
    },

    addTemplate: function (variation) {
      var self = this,
        variation_html = variation.html(),
        tmpl;

      if (variation_html !== undefined && variation_html.length > 0) {
        tmpl = $.trim(variation_html).replace(/\n\s*/g, '');

        if (!self.template) {
          self.template = Handlebars.compile(tmpl);
          window.debug.debug('Added fetched template: ' + self.template_name());
        }
      } else {
        window.debug.error('FAILED TO FIND VARIATION: ' + self.variation_name + ' in ' + self.name);
        // TODO: Fail fast here and stop loading the page
        window.alert('FAILED TO FIND VARIATION: ' + self.variation_name + ' in ' + self.name);
      }
    },

    childDoneLoading: function (child) {
      var self = this;

      window.debug.debug('CHILD LOADED: ' + child.template_name());
      self.children_loaded++;

      self.children[child.uuid] = child;

      if (self.child_count === self.children_loaded) {
        if (self.parent !== undefined) {
          self.parent.childDoneLoading(self);
        }
      }
    },

    template_uri: function () {
      return this.component_path + this.name + ".html";
    },

    css_uri: function () {
      return this.component_path + "css/" + this.name + ".css";
    },

    js_uri: function () {
      return this.component_path + "js/" + this.name + ".js";
    },

    // Sets two variation names: the original and the sanitized version
    setVariationName: function ($el) {
      var name = $el.attr('data-variation'),
        tmpl_name = this.constructVariationName(name);

      this.variation_name = tmpl_name;
      this.sanitized_variation_name = this.sanitizeVariationName(tmpl_name);
    },

    // This is the sanitized and unique compound of the component and variation name
    // The template system requires this.
    template_name: function () {
      return [this.name, this.sanitized_variation_name].join('_');
    },

    constructVariationName: function (name) {
      return name !== undefined ? name : 'default';
    },

    sanitizeVariationName: function (name) {
      return name.replace(/-/g, '_');
    },

    // Helper function to get a template name for a child component's DOM element
    getTemplateNameFromVariation: function ($component) {
      var self = this,
        variation_name = $component.attr('data-variation'),
        tmpl_name = self.constructVariationName(variation_name);

      tmpl_name = self.sanitizeVariationName(tmpl_name);

      return [$component.attr('data-component'), tmpl_name].join('_');
    },

    getIDFromVariation: function ($component) {
      return $component.attr('data-blocks-uuid');
    },

    updateImgSrcPath: function () {
      var self = this,
        path;

      self.$variation.find('img').each(function (idx, img) {
        path = $(img).attr('src');

        if (path.match(/^http/) === null) {
          $(img).attr('src', 'library/' + path);
        }
      });
    },

    fetch: function () {
      var self = this,
        uri = self.template_uri(),
        fetch_config = {
          type: 'GET',
          url: uri,
          dataType: 'html',
          cache: false,
          timeout: 15000
        },
        promise;

      // TODO: This cache key name needs to handle library conflicts
      promise = self.page.cache[self.name];

      if (promise === undefined) {
        promise = $.ajax(fetch_config);
        self.page.cache[self.name] = promise;
        window.debug.debug('Queued component template: ' + self.name);

        self.injectCSS();
      }

      promise.done(function (results) {
        if (results !== undefined && results !== '') {
          self.fetched_data = results;

          // Collects a unique list of page components fetched
          // Used to inject JS once all page components are fully loaded
          self.page.components[self.name] = self;

          window.debug.debug('Returned component template: ' + self.name);
        }
      });

      promise.fail(function () {
        // Returns: jqXHR, textStatus, error
        window.debug.error('FAILED TO FETCH TEMPLATE: ' + self.name);
        // TODO: Fail fast here and stop loading the page
        window.alert('FAILED TO FETCH TEMPLATE: ' + self.name);
      });

      return promise;
    },

    parse: function (results) {
      var self = this,
        $component_html,
        $header,
        $documentation,
        $nested_components,
        queued_components = [];

      self.parse_deferred = new $.Deferred();

      window.debug.debug('PARSING ' + self.template_uri());

      // Yes, it needs to be wrapped.
      results = "<div>" + results + "</div>";

      // Split the file by variation
      $component_html = $($(results).children('#variations'));

      $header = $($(results).children('header'));
      self.$header = $header;

      $documentation = $($(results).children('#documentation'));
      self.$documentation = $documentation;

      // Collect header classes for component
      self.classes.push($header.attr('class'));

      // The not() here is to avoid finding nested component varations
      self.$variation = $component_html.find('[data-variation="' + self.variation_name + '"]').not('[data-component]');

      // Collect variation classes for component
      self.classes.push(self.$variation.attr('class'));

      // Collect variation data attributes for component
      _.each(self.$variation.prop('attributes'), function (attr) {
        if (attr.name === 'class') {
          return true;
        }
        self.attributes[attr.name] = attr.value;
      });

      // Nested components need to put their classes in a special place
      if (self.is_nested) {
        self.parent.child_classes[self.template_name()] = self.classes;
        self.parent.child_attributes[self.template_name()] = self.attributes;
      }

      // Update img src path for library components
      if (self.source === 'library') {
        self.updateImgSrcPath();
      }

      $nested_components = self.$variation.find('*[data-component]');

      if ($nested_components !== undefined && $nested_components.length > 0) {
        $nested_components.each(function (idx, nested_component) {
          var $nested_component = $(nested_component),
            nested_component_id = self.parent.generateUUID();

          window.debug.debug('FOUND nested component: ' + $nested_component.attr('data-component'));
          self.child_count++;

          // Assign a UUID to find the component in the DOM later
          $nested_component.attr('data-blocks-uuid', nested_component_id);

          // MUST queue the components to get an accurate child count
          // Otherwise a race condition is created where the child count doesn't
          // fully increment (never gets beyond 1) before child fetches start returning
          // (especially for a cached component)
          queued_components.push({parent: self, component: $nested_component });
        });
      } else {
        self.no_children = true;
      }

      // Render our template now that the UUIDs have been set on the nested components
      self.addTemplate(self.$variation);

      // If we've got no children then we can resolve the parsing promise
      if (self.no_children === true) {
        self.parse_deferred.resolve();
      }

      if (self.child_count > 0) {
        window.debug.debug('TMPL ' + self.template_name() + ' has ' + self.child_count + ' children');

        _.each(queued_components, function (queued_component) {
          var component;

          component = new Component({
            parent: queued_component.parent,
            component: queued_component.component,
            page: queued_component.parent.page
          });
        });
      }

      return self.parse_deferred;
    },

    render: function () {
      var self = this;

      if (self.no_children === true ||
          self.children_rendered === self.children_loaded) {

        self.renderTemplate();

        if (self.parent) {
          self.parent.childDoneRendering(self);
        }
      } else {
        // Render each child down the tree
        _.each(self.children, function (child) {
          child.render();
        });
      }
    },

    childDoneRendering: function (child) {
      var self = this;

      self.children_rendered++;

      if (self.child_count === self.children_rendered) {
        self.renderTemplate();
        window.debug.debug('CHILD RENDERED: ' + child.template_name());

        // Update your DOM with your kids' rendered templates
        self.$el.find('[data-component]').each(function (idx, nested_component) {
          var $nested_component = $(nested_component),
            tmpl_name = self.getTemplateNameFromVariation($nested_component),
            uuid = self.getIDFromVariation($nested_component),
            target_child = self.children[uuid];

          $(nested_component).replaceWith(target_child.$el);
        });

        self.parent.childDoneRendering(self);
      }
    },

    renderTemplate: function () {
      var self = this,
        rendered_tmpl = self.template(self.template_data),
        wrapWithComments = function () {
          self.$el.prepend(self.comment_start);
          self.$el.append(self.comment_end);
        },
        wrapWithDocFrame = function () {
          var $doc_frame = self.documentationFrame(),
            $component = self.$el.clone();

          if ($doc_frame !== undefined) {
            $doc_frame
              .find('*')
              .contents()
              .filter(function () {
                return this.nodeType === 8;
              })
              .replaceWith($component);

            self.$el.replaceWith($doc_frame.children());
          }
        };

      if (self.replace_reference === true) {

        if (self.enclose !== undefined && self.enclose.length > 0) {
          self.$el = self.enclose;

          if (self.$el.children().length === 0) {
            self.$el.append(rendered_tmpl);
          } else {
            self.$el.children().last().append(rendered_tmpl);
          }
        } else {
          self.$el = $(rendered_tmpl);
        }

        if (self.config.components.wrap_with_comments === undefined || self.config.components.wrap_with_comments === true) {
          wrapWithComments();
        }

      } else {

        if (self.enclose !== undefined && self.enclose.length > 0) {
          self.$el = self.enclose;

          if (self.$el.children().length === 0) {
            self.$el.append(rendered_tmpl);
            self.$el.attr('class', _.uniq(_.compact(self.classes)).join(' '));

            _.each(self.attributes, function (value, name) {
              self.$el.attr(name, value);
            });

          } else {
            self.$el.children().last().append(rendered_tmpl);
          }

        } else {
          self.$el.append(rendered_tmpl);

          self.$el.attr('class', _.uniq(_.compact(self.classes)).join(' '));
          _.each(self.attributes, function (value, name) {
            self.$el.attr(name, value);
          });
        }
      }

      if (self.hasDocumentation() && self.hasDocumentationFrame()) {
        wrapWithDocFrame();
        // Signal to the Page to replace the componet with the doc frame
        self.frame_with_documentation = true;
      }
    },

    injectCSS: function () {
      // We do a HEAD request so that we only load present files
      var self = this,
        uri = self.css_uri(),
        $head = $('head'),
        fetch_config = {
          type: 'HEAD',
          url: uri,
          dataType: 'html',
          cache: false
        },
        promise;

      promise = $.ajax(fetch_config);

      promise.done(function () {
        // Note: Content-Length isn't present when Blocks is loaded via file://
        // and responseText isn't present when Blocks is loaded via http://.

        /*
        The Content-Encoding check should not be needed, however some servers
        are not reliably sending the Content-Length header when serving our prototype's css files
        as of 1/10/14
        */
        if (promise.getResponseHeader('Content-Length') > 0 ||
            promise.responseText.length > 0 ||
            promise.getResponseHeader('Content-Encoding') === 'gzip') {
          $head.append('<link rel="stylesheet" href="' + uri + '" />');
        } else {
          window.debug.warn('CSS resource is empty: ' + uri);
        }
      });

      promise.fail(function () {
        // Returns: jqXHR, textStatus, error
        window.debug.debug('CSS resource is missing: ' + uri);
      });
    },

    injectJS: function (page) {
      var self = this,
        uri = self.js_uri(),
        event_name = self.template_name(),
        triggerCallback = function () {
          window.debug.debug('Triggering ' + event_name);
          $(document).trigger(event_name);
        },
        notifyParent = function () {
          page.childDoneInjectingJS();
        },
        fetch_config = {
          type: 'HEAD',
          url: uri,
          dataType: 'html', // DO NOT set to 'script'. jQuery will use $.getScript() which automatically inserts the JS into the DOM thus all component JS will execute twice
          cache: false
        },
        promise;

      promise = $.ajax(fetch_config);

      promise.done(function () {
        // Note: Content-Length isn't present when Blocks is loaded via file://
        // and responseText isn't present when Blocks is loaded via http://.

        // The Content-Encoding check should not be needed, however some servers are not
        // reliably sending the Content-Length header when serving our prototype's css files as of 1/10/14
        if (promise.getResponseHeader('Content-Length') > 0 ||
            promise.responseText.length > 0 ||
            promise.getResponseHeader('Content-Encoding') === 'gzip') {
            if (self.config.wrap_injected_js_with_comments) {
              $('head').append('<!--<script data-blocks-injected-js="true" src="' + uri + '"></script>-->'); //config option will wrap injected scripts inside a comment preventing them from executing. Useful when using blocks with other processing tools that can later uncomment the scripts
            } else {
              $('head').append('<script src="' + uri + '"></script>');
              triggerCallback();
            }
        } else {
          window.debug.warn('JS resource is empty: ' + uri);
        }

        notifyParent();
      });

      promise.fail(function () {
        // Returns: jqXHR, textStatus, error
        window.debug.debug('JS resource is missing: ' + uri);
        notifyParent();
      });
    },

    /*
     * @method: setComponentPath
     *
     * Uses the data-source attribute or components.source from
     * the config to obtain the path to the component template files.
     * If your parent is in the library then, you are too.
     */
    setComponentPath: function () {
      var self = this,
        source = self.source,
        path = 'components/';

      if (source !== undefined && source.length > 0) {
        path = source;
      } else if (self.config.components !== undefined) {
        if (self.config.components.source !== undefined) {
          path = self.config.components.source;
        }
      } else {
        window.debug.error('Could not determine path to components.');
      }

      if (self.parent !== undefined && self.parent.type !== 'page') {
        if (self.parent.source === 'library') {
          path = 'library';
        }
      }

      if (path === 'library') {
        self.source = path;
        path = 'library/components/';
      }

      self.component_path = path;
    },

    documentationFrame: function () {
      var self = this,
        variation_name = self.$el.attr('data-frame-variation'),
        $variation;

      if (self.hasDocumentation() && self.hasDocumentationFrame()) {
        $variation = self.$documentation.find('*[data-variation="' + variation_name + '"]');

        if ((variation_name !== undefined && $variation !== undefined) &&
            (variation_name.length > 0 && $variation.length > 0)) {
          return $variation;
        }
      }
    },

    hasDocumentationFrame: function () {
      var self = this,
        variation_name = self.$el.attr('data-frame-variation');

      return (variation_name !== undefined && variation_name.length > 0);
    },

    hasDocumentation: function () {
      var self = this;
      return (self.$documentation !== undefined && self.$documentation.length > 0);
    },

    setID: function ($el) {
      var self = this;

      self.uuid = $el.attr('data-blocks-uuid');
    },

    /*
     * @method: setRenderingConfig
     *
     * If either the data-place attribute or components.replace_reference
     * is set to true then the element, a component, will be replaced
     * rather than appended to.
     *
     */
    setRenderingConfig: function () {
      var self = this;

      if (self.config.components !== undefined && self.config.components !== '') {
        if (self.config.components.replace_reference === true) {
          self.replace_reference = true;
        }
      }

      if (self.$el.attr('data-place') !== undefined) {
        if (self.$el.attr('data-place') === 'replace') {
          self.replace_reference = true;
        } else if (self.$el.attr('data-place') === 'inner') {
          self.replace_reference = false;
        }
      }

      if (self.replace_reference === true) {
        self.comment_start = '<!-- #block data-component="' + self.name + ' data-variation="' + self.variation_name + '" -->';
        self.comment_end = '<!-- /block data-component="' + self.name + ' data-variation="' + self.variation_name + '" -->';
      }
    },

    setTemplateData: function ($el) {
      var self = this,
        content = $el.attr('data-content'),
        tmpl_data,
        getTemplateData = function (key_string, config_data) {
          var obj = config_data,
            data = false,
            keys = key_string.split('.'),
            key,
            key_exists = function (obj, key) {
              return obj.hasOwnProperty(key);
            };

          for (var i = 0; i < keys.length; i++) {
            key = keys[i];

            if (key_exists(obj, key)) {
              obj = obj[key];

              if (i === keys.length - 1) {
                data = obj;
              }
            } else {
              break;
            }
          }
          return data;
        };

      if (content !== undefined && self._isJSON(content)) {
         // Raw JSON passed in as the data-content-param
         tmpl_data = $.parseJSON(content);
         self.content = content;
      } else if (self.config.template_data !== undefined && self.config.template_data !== '') {
        if (content !== undefined) {
          tmpl_data = getTemplateData(content, self.config.template_data);
          self.content = content;
        }
      }

      self.template_data = tmpl_data;
    },

    /*
     * @method: setWrappingMarkup
     *
     * If a component has a data-enclose attribute the value will be used
     * to generate markup that will wrap the component.
     *
     */
    setWrappingMarkup: function ($el) {
      var self = this,
        enclose = $el.attr('data-enclose'),
        wrappers = [],
        elements = [];

      if (enclose !== undefined && enclose.length > 0) {
        wrappers = enclose.split('>');

        _.each(wrappers, function (wrapper) {
          var result = wrapper.split(/[\.#\[]/),
            container,
            ID,
            remainder,
            attrs = [],
            classes = [],
            element;

          // The first element of result is the containing element
          container = result[0];

          if (container !== undefined && container.length > 0) {
            element = window.document.createElement(container);
          }

          // Remove the container from
          // the rest of the result (which has the ID, classes, etc.)
          wrapper = wrapper.replace(result[0], '');

          // Now wrapper contains only one or more of ID, class, attribute
          // There can only be one ID so pull that out first
          ID = wrapper.match(/(#\w+)[^\[\.]/);

          if (ID !== null) {
            ID = ID[0];
          }

          if ((element !== undefined && element !== '') && (ID !== null)) {
            $(element).attr('id', ID.replace('#', ''));

            // Remove the ID from the remaining string
            wrapper = wrapper.replace(ID, '');
          }

          // Split the remainder on dot to find classes or attributes
          remainder = wrapper.split('.');

          _.each(remainder, function (str) {
            var result = str.match(/^\[([a-z-]+=\w+)\]/);
            if (result !== null) {
              attrs.push(result[1]);
            } else { // Class
              classes.push(str);
            }
          });

          if (element !== undefined && element !== '') {
            if (!_.isEmpty(classes)) {
              $(element).attr('class', _.compact(classes).join(' '));
            }

            if (!_.isEmpty(attrs)) {
              _.each(attrs, function (attribute) {
                $(element).attr(attribute.split('=')[0], attribute.split('=')[1]);
              });
            }

            elements.push($(element));
          }
        });

        self.enclose = _.reduce(elements, function (memo, $el) {
          return (memo !== undefined ? memo.append($el) : memo = $el);
        }, undefined);
      }
    },

    tmplError: function (e, tmpl_name, component_name) {
      if (e.name === 'TypeError' &&
          e.message == "Cannot call method 'indexOf' of undefined") {
        window.debug.error('FAILED to find variation ' + tmpl_name + ' in ' + component_name);
      } else {
        window.debug.error('FAILED to render template: ' + tmpl_name + ' NAME: ' + e.name + ' MSG: ' + e.message);
      }
    },

    // "PRIVATE" methods (we jam econo)
    /**
     * @method: _isJSON
     *
     * Wraps a call to parseJSON
     */
    _isJSON: function (str) {
      try {
        $.parseJSON(str);
      } catch (e) {
        return false;
      }
      return true;
    }
  };

  BlocksLoader.prototype = {
    constructor: BlocksLoader,

    prepare: function () {
      var self = this;

      $(self.bus).on('config_loaded', function () {
        // We've got a config. Let's start
        self.init();
      });
    },

    loadConfig: function (opts) {
      var self = this,
        uri = opts.config_path + 'config.json',
        fetch_config = {
          type: 'GET',
          dataType: 'json',
          cache: false,
          url: uri,
          timeout: 30000,
          success: function (data) {
            self.config = $.extend(opts, data);
            $(self.bus).trigger('config_loaded');
          },
          error: function (err) {
            // NOTE: Logging isn't setup until we fetch the config thus window.debug doesn't yet exist
            debug.error('FAILED TO FETCH CONFIG: ' + uri + ' returned ' + JSON.stringify(err));
            self.config = opts;
            self.trigger('config_loaded'); // We continue on with default options
          }
        };

      $.ajax(fetch_config);
    },

    /*
     * @method: init
     *
     * Parses the page, finds component references, creates Component objects
     * from them.
     */
    init: function () {
      var self = this,
        $root = self.$el,
        component_id,
        queued_components = [];

      self._setupLogging();

      // page cache of components
      self.components = {};

      // Keep track of kids purely to know when the page is finished rendering
      // in order to fire off JS at the end and trigger a page done event
      self.child_count = 0;
      self.children_loaded = 0;
      self.children_rendered = 0;
      self.child_count_js = 0;
      self.child_js_injected = 0;

      // A flag for children to know that there are no more parents to notify
      // The 'page' type is the root
      self.type = 'page';

      $root.find('*[data-component]').each(function () {
        self.child_count++;

        $(this).attr('data-blocks-uuid', self.generateUUID());

        // MUST queue the components to get an accurate child count
        queued_components.push({ page: self, component: $(this) });
      });

      window.debug.debug('PAGE ' + self.name + ' has ' + self.child_count + ' children');

      _.each(queued_components, function (queued_component) {
        var component;

        component = new Component({
          page: queued_component.page,
          parent: queued_component.page, // This component's parent is this page
          component: queued_component.component
        });
      });

      if (self.config.backward_compatible === true) {
        self._makeBackwardCompatible();
      }
    },

    childDoneInjectingJS: function () {
      var self = this;

      self.child_js_injected++;

      if (self.child_count_js === self.child_js_injected) {
        if (window.self !== window.top) {
          // If blocks is being run inside an iFrame (Blocks Viewer)
          window.debug.debug('TRIGGERING blocks-done on parent body from within iFrame');
          parent.$('body').trigger('blocks-done');

          window.debug.debug('TRIGGERING blocks-done-inside-viewer on parent body from within iFrame');
          parent.$('body').trigger('blocks-done-inside-viewer', {"iframe_id": window.frameElement.id});

          // This triggers blocks-done within the iFrame itself. BlocksViewer has a listener for this event so the height and width of the iframe can be dynamically set after BlocksLoader has finished
          $('body').trigger('blocks-done');
        }
        else {
          // Blocks loader is being used without BlocksViewer
          window.debug.debug('TRIGGERING blocks-done');
          $(document).trigger('blocks-done');
        }

        window.blocks_done = true; //Set globally accessible blocks_done variable so other scripts/processes that may be loaded after blocks can query to see if Blocks has finished doing its thing
      }
    },

    childDoneLoading: function (child) {
      var self = this;

      self.children_loaded++;

      window.debug.debug('READY TO RENDER PAGE LEVEL CHILDREN: ' + child.template_name());

      // This function is recursive in that it will render children
      // nested inside this child
      child.render();
    },

    childDoneRendering: function (child) {
      var self = this,
        $root = self.$el,
        $page_component;


      if (child.content !== undefined) {
        $page_component = $root.find('[data-component="' + child.name + '"][data-variation="' + child.variation_name + '"][data-content=\'' + child.content + '\']');
      }
      else {
        $page_component = $root.find('[data-component="' + child.name + '"][data-variation="' + child.variation_name + '"]').not('[data-content]');
      }

      self.children_rendered++;

      window.debug.debug('READY TO RENDER PAGE LEVEL Component: ' + child.template_name());

      if (child.replace_reference || child.frame_with_documentation) {
        $page_component.replaceWith(child.$el);
      } else {
        $page_component.append(child.$el);
      }

      // Once all of the kids are done we'll spawn all JS
      if (self.child_count === self.children_rendered) {
        self.injectComponentJS();
      }

      // Exposing just the page level component variations
      // to pages using Blocks
      self.component_variations[child.template_name()] = child;
    },
    /**
     * @method: generateUUID
     *
     * Generates a reasonable enough UUID. We only need it to be unique for a load of the page.
     * Copied from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
     */
    generateUUID: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16|0,
          v = c == 'x' ? r : (r&0x3|0x8);

        return v.toString(16);
      });
    },

    injectComponentJS: function  () {
      var self = this;

      _.each(self.components, function (component) {
        component.injectJS(self);
        self.child_count_js++;
      });
    },

    // "PRIVATE" methods (we jam econo)
    /**
     * @method: _makeBackwardCompatible
     *
     * Calls a series of functions to make the componentMgr compatible
     * with older versions of Blocks.
     */
    _makeBackwardCompatible: function () {
      var self = this;

      // Wrap in 2 sections, pages.active and page.active.currentpage
      self._wrapPage();
    },

    _setupLogging: function () {
      var self = this,
        console,
        logging = self.config.logging !== undefined ? self.config.logging : self.logging;

      self.name = $(document).find('head title').text();

      if (logging !== true) {
        debug.setLevel(0);
      }
    },

    _wrapPage: function () {
      var $body = $('body'),
        $viewport = $('.viewport'),
        $page;

      $viewport.wrapAll('<article class="page active currentpage" />');

      $page = $body.find('.page.active');
      $page.wrapAll('<section class="pages active" />');
    }
  };

  // Plugin definition
  var old = $.fn.BlocksLoader;

  $.fn.BlocksLoader = function (option) {
    return this.each(function () {
      var $self = $(this),
        data = $self.data('BlocksLoader'),
        options = $.extend({}, $.fn.BlocksLoader.defaults, $self.data(), typeof option == 'object' && option);

      if (!data) {
        $self.data('BlocksLoader', (data = new BlocksLoader(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.BlocksLoader.defaults = {
    backward_compatible: false,
    config_path: '',
    components: {
      source: 'components/'
    }
  };

  $.fn.BlocksLoader.Constructor = BlocksLoader;

  // Prevent conflicts
  $.fn.BlocksLoader.noConflict = function () {
    $.fn.BlocksLoader = old;
    return this;
  };

  var $blocksScript = $("script[data-blocks='true']");
  var autoload = true;
  if ($blocksScript.length > 0) {
    if ($blocksScript.attr("data-autoload") == "false") {
      autoload = false;
    }
  }

  if (autoload === true) {
    $(window).on('load', function () {
      $('body').BlocksLoader();
    });
  }

  window.blocks_done = false; //Set globally accessible blocks_done variable so other scripts/processes that may be loaded after blocks can query to see if Blocks has finished doing its thing

})(window.jQuery, window.debug, document);
