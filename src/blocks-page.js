import $ from 'jquery'
import BlocksConfig from './blocks-config'
import { BlocksComponent } from './blocks-component'

class BlocksPage {
  constructor() {
    var self = this;

    self.config = BlocksConfig.getConfig();

    // page cache of components
    self.components = {};
    self.component_variations = {};
    self.cache = {};
    self.time_start = performance.now();
    self.time_duration = null;

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
  }

  /*
   * @method: display
   *
   * Wrapper for parse and load
   */
  display() {
    var self = this,
      page_components = [];

    page_components = self.parse();

    for (let idx in page_components) {
      let page_component = page_components[idx];

      page_component.load();
    }
  }

  parse() {
    var self = this,
      queued_components = [],
      components = [];

    self.name  = $(document).find('head title').text();
    self.$root = $('body');

    if (this.config.get('logging')) {
      window.console.debug('and page has a config!');
    }

    self.$root.find('*[data-component]').each(function () {
      self.child_count++;

      $(this).attr('data-blocks-uuid', self.generateUUID());

      // MUST queue the components to get an accurate child count
      queued_components.push({ page: self, component: $(this) });
    });

    window.console.debug('PAGE ' + self.name + ' has ' + self.child_count + ' children');

    // for (let idx in queued_components) {
    Array.from(queued_components).forEach(function (queued_component) {
      var component;

      // let queued_component = queued_components[idx];

      component = new BlocksComponent({
        page: queued_component.page,
        parent: queued_component.page, // This component's parent is this page
        component: queued_component.component
      });

      components.push(component);
    });

    return components;
  }

  /**
   * @method: childDoneLoading
   * @params: child
   *
   * Takes a BlocksComponent object, tracks that it is finished loading,
   * and calls render on that object.
   *
   * This function is recursive in that it will render children
   * nested inside this child.
   */
  childDoneLoading(child) {
    var self = this;

    self.children_loaded++;

    window.console.debug('READY TO RENDER PAGE LEVEL CHILDREN: ' + child.template_name());

    child.render();
  }

  /**
   * @method: childDoneRendering
   * @params: child
   *
   * Takes a BlocksComponent object, tracks that it has finished rendering
   * itself.
   * Replaces components on the page with their child's rendered elements.
   * Then injects the component Javascript.
   */
  childDoneRendering(child) {
    var self = this,
      $page_component;


    if (child.content !== undefined) {
      $page_component = self.$root.find('[data-component="' + child.name + '"][data-variation="' + child.variation_name + '"][data-content=\'' + child.content + '\']');
    }
    else {
      $page_component = self.$root.find('[data-component="' + child.name + '"][data-variation="' + child.variation_name + '"]').not('[data-content]');
    }

    self.children_rendered++;

    window.console.debug('READY TO RENDER PAGE LEVEL Component: ' + child.template_name());

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
  }

  getIDFromVariation($component) {
    return $component.attr('data-blocks-uuid');
  }

  /**
   * @method: generateUUID
   *
   * Generates a reasonable enough UUID. We only need it to be unique for a load of the page.
   * Copied from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16|0,
        v = c == 'x' ? r : (r&0x3|0x8);

      return v.toString(16);
    });
  }
}

export default new BlocksPage()
