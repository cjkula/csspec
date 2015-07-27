'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {
  var mod = CSSpec;

  // constructor
  CSSpec.FnAttribute = function(attribute, fnOrText, selector, inline, important) {
    this.attribute = attribute;
    this.fn = (typeof fnOrText === 'function') ? fnOrText : this.createFunction(fnOrText);
    this.selector = selector;
    this.specificity = mod.selectorSpecificity(selector, inline, important);
  };

  mod.FnAttribute.prototype = {

    createFunction: function(text) {
      return new Function('$el', 'attribute', 'expectation', '$', '_', text);
    },

    matchElement: function($el) {
      return ($el.is(this.selector + ' *') || $el.is(this.selector));
    },

    evaluate: function($el, expectation) {
      return this.fn.call($el[0], $el, this.attribute, expectation, jQuery, _);
    }

  };

})(jQuery, _);