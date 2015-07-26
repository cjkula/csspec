'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {
  var mod = CSSpec;

  // constructor
  // accepts either a document styleSheet object or a CSS string
  CSSpec.StyleSheet = function(styleObj, onLoad) {

    this.onLoad = onLoad;
    this.loaded = false;
    this.testCases = [];

    if (_.isString(styleObj)) { // create inline style tag in <head>
      this.createStyleTag(styleObj);
      this.docStyleSheet = _.last(mod.docStyleSheets());
      this.afterLoad(styleObj);
    } else if (styleObj.href) {
      this.docStyleSheet = styleObj;
      this.loadSource(styleObj.href);
    }

  };

  mod.StyleSheet.prototype = {

    createStyleTag: function(styleText) {
      this.$styleTag = $('<style />', { html: styleText }).appendTo('head');
    },

    removeStyleTag: function() {
      if (this.$styleTag) this.$styleTag.remove();
    },

    loadSource: function(url) {
      $.ajax({ url: url })
       .done(_.bind(this.afterLoad, this));
    },

    afterLoad: function(css) {
      this.source = css;
      this.prepare();
      this.loaded = true;
      if (this.onLoad) this.onLoad();
    },

    prepare: function() {
      var rules = mod.parse(this.source).stylesheet.rules;
      this.createTestCases(rules);
      this.createFnAttributes(rules);
    },

    createTestCases: function(rules) {
      this.testCases = _.chain(rules)
                        .map(function(rule) {
                          return _.chain(rule.selectors)
                                  .filter(mod.hasTestSelector)
                                  .map(function(selector) {
                                    return new CSSpec.TestCase(selector, rule);
                                  }).value()
                        }).flatten().value();
    },

    createFnAttributes: function(rules) {
      this.fnAttributeCollection = new mod.FnAttributeCollection(rules);
    },

    matchFnAttribute: function($el, attribute) {
      return this.fnAttributeCollection.matchFnAttribute($el, attribute);
    },

    execTestCases: function() {
      _.invoke(this.testCases, 'exec');
    },

    remove: function() {
      var i = _.indexOf(mod.styleSheets, this);
      this.removeStyleTag();
      if (i > -1) mod.styleSheets.splice(i, 1);
    }

  };

})(jQuery, _);