'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {
  var mod = CSSpec;

  // constructor
  CSSpec.FnAttribute = function(attribute, fn, selector, inline, important) {
    this.attribute = attribute;
    this.selector = selector;
    this.fn = fn;
    this.specificity = mod.selectorSpecificity(selector, inline, important);
  };

  // mod.FnAttribute.prototype = {
    
  // };

})(jQuery, _);