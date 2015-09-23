import EsbUtil from './esb-util';
import { EsbInclude } from './esb-include';
import { EsbFrame } from 'src/esb-frame';
import { EsbMark } from 'src/esb-mark';

class EsbPage {
  constructor() {
    var self = this;

    self.logger = EsbUtil.logger;
    self.blocks_done = false;
    self.blocks_done_timeout_ms = 15000;

    self.parsed_esb_includes = [];
    self.parsed_esb_frames = [];
    self.parsed_esb_marks = [];
    self.esb_mark_auto_id = 1;

    self.setEventListeners();
  }

  /*
   * @method: display
   *
   * Wrapper for parse and load
   */
  display() {
    var self = this,
        parsed_esb_includes = self.get_parsed_esb_includes(),
        rendered_includes = [],
        all_includes_rendered;

    if (parsed_esb_includes.length > 0) {
      for (let idx in parsed_esb_includes) {
        let include = self.parsed_esb_includes[idx];
        rendered_includes.push(include.render());
      }

      all_includes_rendered = Promise.all(rendered_includes);
      all_includes_rendered.then(function(){
        self.setBlocksDone();
      },
      function(err){
        self.logger('error', err);
      });
    }
    else {
      self.setBlocksDone();
    }

    for (let idx in self.parsed_esb_frames) {
      let frame = self.parsed_esb_frames[idx];

      frame.inject_placeholder_if_placeholder_is_created();
    }
  }

  displayEsbMarks() {
    var self = this,
        parsed_esb_marks = self.getParsedEsbMarks();

    if (parsed_esb_marks.length > 0) {
      for (let idx in parsed_esb_marks) {
        let esb_mark = self.parsed_esb_marks[idx];

        esb_mark.render();
      }
    }
  }

  hideAllEsbMarks() {
    var rendered_marks = document.querySelectorAll('.esb-mark'),
        i;

    for (i = 0; i < rendered_marks.length; i++) {
      EsbUtil.addClass(rendered_marks[i], 'esb-mark--is-hidden');
    }
  }

  showAllEsbMarks() {
    var rendered_marks = document.querySelectorAll('.esb-mark'),
        i;

    for (i = 0; i < rendered_marks.length; i++) {
      EsbUtil.removeClass(rendered_marks[i], 'esb-mark--is-hidden');
    }
  }

  toggleAllEsbMarks() {
    var self = this,
        hidden_marks = document.querySelectorAll('.esb-mark.esb-mark--is-hidden');

    if (hidden_marks.length > 0) {
      self.showAllEsbMarks();
    }
    else {
      self.hideAllEsbMarks();
    }
  }

  processKeyboardEvent(e) {
    var self = this;

    if (e.keyCode === 77 && e.shiftKey === true && e.ctrlKey === true) {
      self.toggleAllEsbMarks();
    }
  }

  setEventListeners() {
    var self = this;
    
    if (window.$ !== undefined) {
      // jQuery's event system is separate from the browser's, so set these up so $(document).trigger will work
      window.$(document).on('show-all-esb-marks', self.showAllEsbMarks.bind(self));
      window.$(document).on('hide-all-esb-marks', self.hideAllEsbMarks.bind(self));
      window.$(document).on('keydown', self.processKeyboardEvent.bind(self));
    }
    else {
      document.addEventListener('show-all-esb-marks', self.showAllEsbMarks.bind(self));
      document.addEventListener('hide-all-esb-marks', self.hideAllEsbMarks.bind(self));
      document.addEventListener('keydown', self.processKeyboardEvent.bind(self));
    }
  }

  getParsedEsbMarks() {
    var self = this;
    return self.parsed_esb_marks;
  }

  get_parsed_esb_includes() {
    var self = this;
    return self.parsed_esb_includes;
  }

  getEsbMarkAutoId() {
    var self = this,
        id = self.esb_mark_auto_id;
    
    self.esb_mark_auto_id++;

    return id;
  }

  parse() {
    var self = this;
    self.parse_esb_includes();
    self.parseEsbFrames();
  }

  parse_esb_includes() {
    var self = this,
      includes = [],
      i;

    self.name  = self.retrievePageTitle();

    includes = document.querySelectorAll('*[data-component], *[data-esb-component], *[data-esb-include]');
    for (i=0; i < includes.length; i++) {
      let uuid = EsbUtil.generateUUID();
      includes[i].setAttribute('data-esb-uuid', uuid);
      let include = new EsbInclude({
        include_snippet: includes[i],
        uuid: uuid
      });

      self.parsed_esb_includes.push(include);
    }
  }

  parseEsbFrames() {
    var self = this,
        frames = [],
        i = 0;

    self.name  = self.retrievePageTitle();

    frames = document.querySelectorAll('*[data-esb-frame]:not([data-esb-frame-config]), *[data-frame-component]');

    for (i=0; i < frames.length; i++) {
      let uuid = EsbUtil.generateUUID();

      frames[i].setAttribute('data-esb-uuid', uuid);

      let frame = new EsbFrame({
        viewer_element: frames[i],
        original_snippet: frames[i].outerHTML,
        uuid: uuid
      });

      self.parsed_esb_frames.push(frame);
    }
  }

  parseEsbMarks() {
    var self = this,
        marks = [],
        i = 0;

    self.name  = self.retrievePageTitle();

    marks = document.querySelectorAll('*[data-esb-mark]:not([data-esb-mark-config])');

    for (i=0; i < marks.length; i++) {
      let uuid = EsbUtil.generateUUID();

      marks[i].setAttribute('data-esb-uuid', uuid);

      let mark = new EsbMark({
        uuid: uuid,
        mark_element: marks[i]
      });

      self.parsed_esb_marks.push(mark);
    }
  }

  retrievePageTitle() {
    return document.title;
  }

  renderIncludeSnippetFromQueryStringParams() {
    var self = this,
        query_string = EsbUtil.getUrlQueryString(),
        query_params = EsbUtil.convertQueryStringToJson(query_string),
        include_snippet = self.generateIncludeSnippet(query_params),
        target;

    if (include_snippet && query_params['data-esb-target'] !== undefined) {
      target = document.querySelector(query_params['data-esb-target']);
      if (target !== null) {
        EsbUtil.addClass(target, 'include-frame-template-wrapper');
        target.appendChild(include_snippet);
      }
    }
  }

  generateIncludeSnippet(query_params) {
    var i,
    include_snippet = false,
    params = [
      'include',
      'variation',
      'place',
      'source',
      'content'
    ];


    if (query_params['data-esb-include'] !== undefined) {
      include_snippet = document.createElement('div');
      for (i=0; i < params.length; i++) {
        if (query_params['data-esb-' + params[i]] !== undefined) {
          include_snippet.setAttribute('data-esb-' + params[i], query_params['data-esb-' + params[i]]);
        }
      }
    }

    return include_snippet;
  }

  setBlocksDone() {
    var self = this;
    window.blocks_done = true; //Set globally accessible blocks_done variable so other scripts/processes that may be loaded after blocks can query to see if Blocks has finished doing its thing
    self.blocks_done = true;
  }

  getBlocksDone() {
    var self = this;
    return self.blocks_done;
  }

  getBlocksDoneTimeout() {
    var self = this;
    return self.blocks_done_timeout_ms;
  }

  blocksDone() {
    var self = this,
      timeout_ms = self.getBlocksDoneTimeout(),
      polling_interval_ms = 500,
      polling_attempt_threshold = timeout_ms / polling_interval_ms,
      polling_attempts = 0,
      blocks_done_interval = false;


    return new Promise(function(resolve, reject) {
      blocks_done_interval = setInterval(function(){
        if (polling_attempts < polling_attempt_threshold) {
          if (self.getBlocksDone()) {
            resolve(true);
            clearInterval(blocks_done_interval);
          }
          else {
            polling_attempts++;
          }
        }
        else {
          self.logger('error', 'Blocks did not finish processing the page before the timeout threshold: ' + timeout_ms + 'ms');
          reject('Blocks did not finish processing the page before the timeout threshold: ' + timeout_ms + 'ms');
        }
      }, polling_interval_ms);
    });
  }
}

export default new EsbPage();