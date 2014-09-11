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
      self._replaceComponentReferenceWithFrame();
      self._makeFrameResizable();
      self._setupAutoZoom();
      autoZoomFrame(self.id);
      self._addBasicStyling();
    },

    // The responsive selector is the only Frame Component at the moment
    // These will all eventually be distinct templates in Backbone.js
    _createFrameComponents: function () {
      var self = this;

      if (self.frame_properties.resizable === true) {
        // Create a resizable select box for the component if resizing is enabled
        var $selector = $('<span data-object="blocks-doc-component-responsive_selector"></span>'),
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
      }
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
    },

    _wrapFrame: function () {
      var self = this,
        $frameContainer = $('<div></div>'),
        $viewerContainer = $('<div></div>'),
        $figure = $('<p></p>');

      // Wrap the iframe in a div container set to the frame's height and width
      $frameContainer.addClass('b-frame_container');
      $frameContainer.attr('id', self.frame_container_ID);
      $frameContainer.append(self.$frame);

      // Add a figure, add the responsive selector to the figure,
      $figure.addClass('b-figure').text(self.figure);
      if (typeof self.$responsive_selector == 'object') {
        $figure.append(self.$responsive_selector); 
      }

      $viewerContainer.addClass('b-viewer_container');
      $viewerContainer.append($figure);
      $viewerContainer.append($frameContainer);
      self.$viewerContainer = $viewerContainer;
    },

    _replaceComponentReferenceWithFrame: function () {
      var self = this;

      self.$frame.bind('load', function () {
        // Once the viewer template has loaded, inject the component into the frame, otherwise the template html would stomp the component html
        self._injectComponentInFrame();
      });
      self.$component.replaceWith(self.$viewerContainer);
    },

    _injectComponentInFrame: function () {
      var self = this,
        iframeDoc,
        revised_component = self._cleanComponent();

      iframeDoc = window.document.getElementById(self.id).contentWindow.document;
      self.$iframe = $('html', iframeDoc);
      self.$iframe.find('body').append(revised_component);

      var script = iframeDoc.createElement("script");
      script.src = self.config.blocks_loader;
      iframeDoc.head.appendChild(script);

      // Blocks has to be instantiated in the iframe
      // The code in the plugin tries to fire Blocks on $(window) and not window
      var iframeBlocksLoadedInterval = setInterval(function () {
        if (typeof window.document.getElementById(self.id).contentWindow.$ == 'function' && typeof window.document.getElementById(self.id).contentWindow.$('body').BlocksLoader == 'function') {
          // Jquery has been loaded, now see if the component is in the iFrame's dom yet?
          clearInterval(iframeBlocksLoadedInterval);

          // Listens for when Blocks is done inside the iFrame so the height and width of the frame can be adjusted
          window.document.getElementById(self.id).contentWindow.$('body').on("blocks-done", function(){
            self._setHeightAndWidth()
          });
          window.document.getElementById(self.id).contentWindow.$('body').BlocksLoader();
        }
      }, 500);
    },

    _makeFrameResizable: function () {
      var self = this;

      if (self.frame_properties.resizable === true) {
        // Make the frame container resizable
        $('#' + self.frame_container_ID).resizable().parent().addClass('is-resizable');
      }
    },

    _setupAutoZoom: function () {
      var self = this,
        $iframe = $("#" + self.id);

      if (self.frame_properties.zoomable == 'auto') {
        $iframe.attr("data-presentation-frame-width", self.width).addClass("auto-zoom").parent(".b-frame_container").css("width", "auto"); //remove fixed width on parent container
      }
      if (self.frame_properties["zoomable-annotation"] === true) {
        $iframe.attr("data-zoomable-annotation", "true");
      }
    },

    _cleanComponent: function () {
      var self = this,
        component = self.$component.clone(),
        component_name = component.attr('data-frame-component');

      component.attr('data-component', component_name);
      component.removeAttr('data-frame-component');
      component.removeAttr('data-frame-width');
      component.removeAttr('data-frame-height');

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
          "width": "auto",
          "height": "auto",
          "resizable": false,
          "scale": "",
          "scrollable": false,
          "zoomable": false,
          "zoomable-annotation": false,
          "zoom-levels": [1, 0.66, 0.5, 0.33]
        },
        prop_name;

      self.frame_properties = {};

      _.each(properties, function (default_value, prop) {
        prop_name = 'data-frame-' + prop;

        if (self.$component.attr(prop_name) !== undefined && self.$component.attr(prop_name) !== '') {
          // Ensure that "true" and "false" strings are converted to boolean equivalents
          var value = self.$component.attr(prop_name);
          if (value === "true") {
            value = true;
          }
          else if (value === "false") {
            value = false;
          }
          self.frame_properties[prop] = value;

        } else if (self.config.frame !== undefined) {
          if (self.config.frame[prop] !== undefined) {
            self.frame_properties[prop] = self.config.frame[prop];
          }
        } else {
          self.frame_properties[prop] = default_value;
        }
      });

      // Convert scrollable setting from boolean to html attr value of "yes" or "no"
      if (self.frame_properties["scrollable"] == true) {
        self.frame_properties["scrollable"] = "yes";
      }
      else {
        self.frame_properties["scrollable"] = "no";
      }
    },

    _setFigure: function () {
      var self = this;

      self.figure = self.$component.attr('data-figure');
    },

    _addBasicStyling: function () {
      var self = this;
      if (typeof self.config.use_blocks_viewer_default_styles == 'undefined' || self.config.use_blocks_viewer_default_styles == true) {
        self.$viewerContainer.css({"background":"lightblue", "padding":"10px"});
        self.$viewerContainer.find(".b-figure").css({"padding":"0", "margin":"0"});
        self.$viewerContainer.find(".b-frame_container").css({"display":"inline-block", "border":"solid 1px black", "margin":"0", "padding":"0"});

        // Append a warning to the page stating that the default Blocks Viewer styles are being used
        if ($(".viewer-style-warning").length == 0) {
          $('body').prepend("<div class='viewer-style-warning'>The Default Blocks Styles are Being used. To override and use your own Blocks Viewer Styles, set 'use_blocks_viewer_default_styles' to false in your Blocks config.json)</div>");
          $(".viewer-style-warning").css({"position":"fixed", "top":0, "width":"100%", "background":"red", "padding":"10px", "color":"white", "font-family":"sans-serif"})
        }
      }
    },

    _updateResizableValues: function () {
      var self = this;

      if (self.frame_properties.resizable === true) {
        var height = self.$frame.css("height");
        var width = self.$frame.css("width");
        var selector_value = width.replace("px", "") + "x" + height.replace("px","");
        if (self.$responsive_selector.find("select").find("option[value='" + selector_value + "']").length == 0) {
          self.$responsive_selector.find("select").prepend("<option value='" + selector_value + "' selected>" + selector_value + "</option>");
        }
      }
    },

    _autoSizeHeight: function () {
      var self = this;

      // This is a hack, waiting until content is at rendered height and width. Not sure if this delay
      // is needed due to CSS not loading completely or not
      setTimeout( function() {
        self.$frame.css("height", "0");
        // get scroll height of iFrame contents
        var content_height = self.$frame[0].contentWindow.document.documentElement.scrollHeight;
        // set height of iFrame to actual height of contents
        self.$viewerContainer.find(".b-frame_container").css("height", content_height + "px");
        self.$frame.css("height", "100%");
        self._updateResizableValues();      
      }, 500);
    },

    _autoSizeWidth: function () {
      var self = this;

      // This is a hack, waiting until content is at rendered height and width. Not sure if this delay
      // is needed due to CSS not loading completely or not
      setTimeout( function() {
        self.$frame.css("width", "0");
        // get scroll width of iFrame contents
        var content_width = self.$frame[0].contentWindow.document.documentElement.scrollWidth;
        // set height of iFrame to actual height of contents
        self.$viewerContainer.find(".b-frame_container").css("width", content_width + "px");
        self.$frame.css("width", "100%");
        self._updateResizableValues();      
      }, 500);
    },

    _setHeightAndWidth: function () {
      var self = this;
      self.$frame.css({"height":"100%", "width":"100%"});

      if (self.frame_properties.height !== "auto") {
        self.$viewerContainer.find(".b-frame_container").css("height", self.frame_properties.height);
      }
      else {
        self._autoSizeHeight();
      }

      if (self.frame_properties.width !== "auto") {
        self.$viewerContainer.find(".b-frame_container").css("width", self.frame_properties.width);
      }
      else {
        self._autoSizeWidth();
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
      console.log(content_height);
    $iframe.css("height", content_height + "px");
    // get true height of scaled iframe
    if ($iframe.hasClass("auto-zoom")) {
      var scaled_iframe_height = $iframe[0].getBoundingClientRect().height;
      // set iframe wrapper height to true height of scaled iframe
      $iframe.parent().css({"height": scaled_iframe_height + "px"});
    }
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

  // $(window).on('resize', function () {
  //   throttle(autoZoomAllFrames(), 1000);
  // });

  // $(document).on('blocks-done-inside-viewer', function (event, data) {
  //   var iframe_id = data.iframe_id;
  //   autoAdjustHeight(iframe_id);
  // });

})(window.jQuery, window.console, document);