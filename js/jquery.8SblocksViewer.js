/*jslint browser: true, eqeq: true, nomen: true, plusplus: true, maxerr: 50, indent: 2, white: false */
/*global document, _, window */
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

  var BlocksViewer = function (element, opts) {
    this.$el = $(element);
    this.config = null;
    this.opts = opts;
    this.components = [];
    this.cache = {};

    this.FRAME_CONTAINER_PADDING = 14 * 2;
    this.RESPONSIVE_SIZES = [
      '320x444',
      '360x640',
      '600x800',
      '768x1024',
      '800x1280',
      '980x1280',
      '1280x600',
      '1900x900'
    ];
    this.LOGGING = true;

    this.loadConfig(opts);

    this._setupLogging();

    this.init();
  };

  var Frame = function (opts) {
    this.cache = {};
    this.page = opts.page;
    this.config = this.page.config;
    this.index = opts.index;
    this.init(opts.component);
  };

  Frame.prototype = {
    init: function ($component) {
      var self = this;

      self.$component = $component;
      self.$revised_component = ''; // place holder for cleaned and wrapped component
      self.template = self.$component.html();
      self.width = parseInt(self.$component.attr('data-frame-width'), 10);
      self.height = parseInt(self.$component.attr('data-frame-height'), 10);

      self._setFrameName();
      self._setFrameID();
      self._setFrameContainerID();
      self._setFrameProperties();
      self._setFigure();

      self.createFrame();
    },

    createFrame: function () {
      var self = this;

      self._createFrameComponents();
      self._createFrame();
      self._wrapFrame();
      self._makeFrameResizable();
      self._attachFrame();
      self._setupAutoZoom();
      autoZoomFrame(self.id);
    },

    // The responsize selector is the only Frame Component at the moment
    // These will all eventually be distinct templates in Backbone.js
    _createFrameComponents: function () {
      var self = this,
        $selector = $('<span data-object="blocks-doc-component-responsive_selector"></span>'),
        $select = $('<select></select>'),
        $option;

      _.each(self.page.RESPONSIVE_SIZES, function (rsp_size) {
        $option = $('<option></option>');
        $option
          .attr('value', rsp_size)
          .text(rsp_size);

        $select.append($option);
      });

      $selector
        .addClass('b-responsive_sizes')
        .append($select);

      self.$responsive_selector = $selector;
    },

    _createFrame: function () {
      var self = this;

      self.$frame = $('<iframe></iframe>');
      self.$frame.attr('id', self.id);
      self.$frame.attr('src', self.config.viewer_template_uri);
      self.$frame.attr('frameborder', '0');
      self.$frame.attr('sandbox', 'allow-same-origin allow-forms allow-scripts');
      self.$frame.attr('seamless', true);
      self.$frame.attr('scrolling', self.frame_properties.scrollable);
      self.$frame.css("width", '100%');
      self.$frame.css("height", '100%');

      self.$frame.bind('load', function () {
        setTimeout(function () {
          // Blocks has to be instantiated in the iframe
          // The code in the plugin tries to fire Blocks on $(window) and not window
          window.document.getElementById(self.id).contentWindow.$('body').BlocksLoader();
        }, 800);
      });
    },

    _wrapFrame: function () {
      var self = this,
        $frameContainer = $('<div></div>'),
        frame_container_height = parseInt(self.page.FRAME_CONTAINER_PADDING + self.height, 10),
        frame_container_width = parseInt(self.page.FRAME_CONTAINER_PADDING + self.width, 10),
        $viewerContainer = $('<div></div>'),
        $figure = $('<p></p>');

      // Replace our corresponding component with an iframe
      self.$component.wrap(self.$frame);

      // Wrap the iframe in a div container set to the frame's height and width
      $frameContainer.css('height', frame_container_height);
      $frameContainer.css('width', frame_container_width);
      $frameContainer.addClass('b-frame_container');
      $frameContainer.attr('id', self.frame_container_ID);
      $('#' + self.id).wrap($frameContainer);

      // Add a figure, add the responsive selector to the figure,
      //  then wrap both the figure and
      // frame_container in a viewer container
      $viewerContainer.addClass('b-viewer_container');
      $figure
        .addClass('b-figure')
        .text(self.figure)
        .append(self.$responsive_selector);

      $('#' + self.frame_container_ID).wrap($viewerContainer);
      $('#' + self.frame_container_ID).parent().prepend($figure);
    },

    _makeFrameResizable: function () {
      var self = this;

      if (self.frame_properties.resizable !== 'false') {
        // Make the frame container resizable
        $('#' + self.frame_container_ID).resizable().parent().addClass('is-resizable');
      } else {
        // Remove the responsive selector component
        $('#' + self.frame_container_ID)
          .parent().find('[data-variation="component-responsive_selector"]')
          .append('<span class="b-non_responsize_sizes">' + self.width + 'x' + self.height + '</span>');
      }
    },

    _setupAutoZoom: function () {
      var self = this,
        $iframe = $("#" + self.id);

      if (self.frame_properties.zoomable == 'auto') {
        $iframe.attr("data-presentation-frame-width", self.width).addClass("auto-zoom").parent(".b-frame_container").css("width", "auto"); //remove fixed width on parent container
      }
      if (self.frame_properties["zoomable-annotation"] === "true") {
        $iframe.attr("data-zoomable-annotation", "true");
      }
    },

    _attachFrame: function () {
      var self = this,
        iframeDoc,
        revised_component = self._cleanComponent();

      setTimeout(function () {
        // We MUST control the order otherwise blocksLoader loads before the component is present
        iframeDoc = window.document.getElementById(self.id).contentWindow.document;
        self.$iframe = $('html', iframeDoc);
        self.$iframe.find('body').append(revised_component);

        var script = iframeDoc.createElement("script");
        script.src = self.config.blocks_loader;
        iframeDoc.head.appendChild(script);
      }, 500);
    },

    _cleanComponent: function () {
      var self = this,
        component = self.$component.clone(),
        component_name = component.attr('data-frame-component');

      component.attr('data-component', component_name);
      component.removeAttr('data-frame-component');
      component.removeAttr('data-frame-width');
      component.removeAttr('data-frame-height');

      if (component.attr('data-frame-variation') === undefined) {
        component.attr('data-frame-variation', 'default');
      }

      return component;
    },

    _setFrameID: function () {
      var self = this;

      self.id = self.$component.attr('id') ? self.$component.attr('id') : self.name + '-' + self.index;
    },

    _setFrameContainerID: function () {
      var self = this;

      self.frame_container_ID = 'container-' + self.id;
    },

    _setFrameName: function () {
      var self = this;

      self.name = self.$component.attr('data-frame-component') + '-frame';
    },

    _setFrameProperties: function () {
      var self = this,
        properties = {
          "width": "100%",
          "height": "100%",
          "resizable": true,
          "scale": "",
          "scrollable": "no",
          "zoomable": "true",
          "zoomable-annotation": "true",
          "zoom-levels": [1, 0.66, 0.5, 0.33]
        },
        prop_name;

      self.frame_properties = {};

      _.each(properties, function (default_value, prop) {
        prop_name = 'data-frame-' + prop;

        if (self.$component.attr(prop_name) !== undefined &&
            self.$component.attr(prop_name) !== '') {
          self.frame_properties[prop] = self.$component.attr(prop_name);
        } else if (self.config.frame !== undefined) {
          if (self.config.frame[prop] !== undefined) {
            self.frame_properties[prop] = self.config.frame[prop];
          }
        } else {
          self.frame_properties[prop] = default_value;
        }
      });
    },

    _setFigure: function () {
      var self = this;

      self.figure = self.$component.attr('data-figure');
    },

    _wrapComponent: function () {
      var self = this,
        component_html = self.$component.html(),
        $component_html;

      // If the component contains markup, use it to wrap the component
      if (component_html !== undefined && component_html.length > 0) {
        $component_html = $(component_html);

        self.$revised_component.empty();
        $component_html.find('.place-component-here').replaceWith(self.$revised_component.clone());

        self.$revised_component = $component_html;
      }
    }
  };

  BlocksViewer.prototype = {
    constructor: BlocksViewer,

    loadConfig: function (opts) {
      var self = this,
        uri = opts.config_path + 'config.json',
        fetch_config = {
          type: 'GET',
          dataType: 'json',
          async: false, // We want this to block and go first
          cache: false,
          url: uri,
          timeout: 30000,
          success: function (data) {
            self.config = $.extend(opts, data);
          },
          error: function (err) {
            window.console.error('FAILED TO FETCH CONFIG: ' + uri + ' returned ' + JSON.stringify(err));
            self.config = opts;
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
        idx = 0;

      // For logging
      self.name = $(document).find('head title').text();
      self._setTemplateURI();
      self._enableJS();

      self.$el.find('*[data-frame-component]').each(function () {
        var frame;

        idx++;

        frame = new Frame({
          page: self,
          component: $(this),
          index: idx
        });
      });

      // Binds interactive elements of the page
      self._setupPage();

    },

    _setupPage: function () {
      var self = this;

      self._setupResponsiveSelector();
      self._enableTabs();
    },

    _enableJS: function () {
      $(document).find('html').removeClass('no-js').addClass('js');
    },

    _enableTabs: function () {
      var self = this,
        $tabs = self.$el.find('*[data-object="blocks-doc-component-tabs"]'),
        $active_tab = $tabs.find('[data-state="is-active"]'),
        makePaneActive = function ($tab) {
          var target_name = $tab.attr('data-target'),
            $target_pane = $tab.parent().parent().find(target_name);

          $target_pane.siblings().attr('data-state', 'is-inactive');
          $target_pane.attr('data-state', 'is-active');
        },
        makeTabActive = function ($tab) {
          $tab.siblings().attr('data-state', 'is-inactive');
          $tab.attr('data-state', 'is-active');
        },
        $selected_tab;

      // Find the active tab and make the pane active
      makePaneActive($active_tab);

      // Bind the tabs to make the pane active
      self.$el.on('click', '*[data-object="blocks-doc-component-tabs"] [data-target] a', function (event) {
        $selected_tab = $(this).parent();
        event.preventDefault();
        makeTabActive($selected_tab);
        makePaneActive($selected_tab);
      });
    },

    /*
     * @method: _setupResponsiveSelector
     *
     * Finds each select menu in the viewer that controls the height and width of
     * the (closest) iframe
     */
    _setupResponsiveSelector: function () {
      var self = this,
        $selector,
        $option,
        $frame,
        height,
        width;

      self.$el.on('change', '*[data-object="blocks-doc-component-responsive_selector"]', function () {
        $selector = $(this);
        $option = $selector.find(':selected');
        $frame = $selector.closest('.is-resizable').find('.ui-resizable');
        width = parseInt($option.attr('value').split('x')[0] * 1 + self.FRAME_CONTAINER_PADDING, 10);
        height = parseInt($option.attr('value').split('x')[1] * 1 + self.FRAME_CONTAINER_PADDING, 10);

        $frame.animate({ width:  width, height: height});
      });
    },

    _setTemplateURI: function () {
      var self = this,
        template_override = self.$el.attr('data-viewer_template');

      self.config.viewer_template_uri = self.opts.viewer_template_uri;

      if (template_override !== undefined) {
        self.config.viewer_template_uri = template_override;
      }
    },

    _setupLogging: function () {
      var self = this,
        console,
        logging = self.config.logging !== undefined ? self.config.logging : self.LOGGING,
        methods = [ 'error', 'warn', 'info', 'debug', 'log' ];

      window.debug = {};

      if (typeof(window.console) === undefined) {
        window.console = {};
      }

      console = window.console;

      _.each(methods, function (method) {
        window.debug[method] = function () {
          if (logging === true) {
            console[method].apply(console, arguments);
          }
        };
      });
    },
  };

  // Plugin definition
  var old = $.fn.BlocksViewer;

  $.fn.BlocksViewer = function (option) {
    return this.each(function () {
      var $self = $(this),
        data = $self.data('BlocksViewer'),
        options = $.extend({}, $.fn.BlocksViewer.defaults, $self.data(), typeof option == 'object' && option);

      if (!data) {
        $self.data('BlocksViewer', (data = new BlocksViewer(this, options)));
      }

      if (typeof option === 'string') {
        data[option]();
      }
    });
  };

  $.fn.BlocksViewer.defaults = {
    config_path: '',
    blocks_loader: '../blocks/build/blocks-loader-2.1.3.min.js',
    viewer_template_uri: 'viewer-template.html',
    components: {
      source: 'components/'
    }
  };

  $.fn.BlocksViewer.Constructor = BlocksViewer;

  // Prevent conflicts
  $.fn.BlocksViewer.noConflict = function () {
    $.fn.BlocksViewer = old;
    return this;
  };

  function autoZoomFrame(iframe_id) {
    var $iframe = $("#" + iframe_id);
    $iframe.css("width", "100%");
    var actual_width = $iframe.width(),
      presentation_width = $iframe.attr("data-presentation-frame-width"),
      scale = Math.min((actual_width / presentation_width), 1); //Don't scale above 100%
    $iframe.css({"width": presentation_width + "px", "-webkit-transform-origin": "0 0", "-webkit-transform": "scale(" + scale + ")", "transform-origin": "0 0", "transform": "scale(" + scale + ")"});
    // update annotation
    if ($iframe.attr("data-zoomable-annotation") === "true") {
      $iframe.parent().siblings(".b-figure").html("Displayed in viewport <span class='auto-zoom-width'>" + presentation_width + "px wide</span> @ <span class='auto-zoom-percentage'>" + Math.round(scale * 100) + "%</span> scale");
    }

    autoAdjustHeight(iframe_id);
  }

// The initial time this is run it needs to happen after blocks has finished loading - figure out how to bind to the iframe documents "blocks-done" event
  function autoAdjustHeight(iframe_id) {
    // set iframe height to 0
    var $iframe = $("#" + iframe_id);
    $iframe.css("height", "0");
    // get scroll height of iFrame contents
    var content_height = $iframe[0].contentWindow.document.documentElement.scrollHeight;
    // set height of iFrame to actual height of contents
    $iframe.css("height", content_height + "px");
    // get true height of scaled iframe
    var scaled_iframe_height = $iframe[0].getBoundingClientRect().height;
    // set iframe wrapper height to true height of scaled iframe
    $iframe.parent().css({"height": scaled_iframe_height + "px"});
  }

  function autoZoomAllFrames() {
    $("iframe.auto-zoom").each(function () {
      autoZoomFrame($(this).attr("id"));
    });
  }

  // Two functions copied from underscore.js
  //     Underscore.js 1.3.1
  //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
  //     Underscore is freely distributable under the MIT license.
  //     Portions of Underscore are inspired or borrowed from Prototype,
  //     Oliver Steele's Functional, and John Resig's Micro-Templating.
  //     For all details and documentation:
  //     http://documentcloud.github.com/underscore
  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  function throttle(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = debounce(function () { more = throttling = false; }, wait);
    return function () {
      context = this;
      args = arguments;
      var later = function () {
        timeout = null;
        if (more) {
          func.apply(context, args);
        }
        whenDone();
      };
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  }
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this, args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  $(window).on('load', function () {
    $('body').BlocksViewer();
  });

  $(window).on('resize', function () {
    throttle(autoZoomAllFrames(), 1000);
  });

  $(document).on('blocks-done-inside-viewer', function (event, data) {
    var iframe_id = data.iframe_id;
    autoAdjustHeight(iframe_id);
  });

})(window.jQuery, window.console, document);