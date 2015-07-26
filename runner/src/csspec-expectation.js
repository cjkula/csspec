'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {
  var mod = CSSpec;

  // constructor
  CSSpec.Expectation = function(testCase, attribute, expectedExpr) {
    this.testCase = testCase;
    this.attribute = attribute;
    this.expected = expectedExpr;
  };

  mod.Expectation.prototype = {

    test: function() {
      var actual = this.resolveAttribute(this.testCase.$target, this.attribute),
          expected = this.resolveExpression(this.testCase.$target, this.expected);

      if (actual === expected) return true;
      this.error = 'expected :' + this.attribute + ' to be ' + expected +' but was ' + actual + '.';
      return false;
    },

    resolveAttribute: function($el, attrName) {
      var el = $el[0];
      return this.customAttribute($el, attrName)
        || $el.css(attrName) 
        || (el.currentStyle && el.currentStyle[attrName]) 
        || window.getComputedStyle(el)[attrName];
    },

    customAttribute: function($el, attribute) {
      var fn = mod.elementAttributeFunction($el, attribute);
      return fn ? fn.call($el[0], $el, attribute, this) : null;
    },

    resolveExpression: function($el, expression) { 
      var re = /\(?(([.#:]*[^.#:)]+\s*)*)\)?\[([^\]]+)\]/g;
      return expression.replace(re, _.bind(function(m, selectors, _, attribute) {
        var $target = selectors ? this.resolveRelativeElement(selectors, $el): $el;
        return this.resolveAttribute($target, attribute);
      }, this));
    },

    resolveRelativeElement: function(relativeSelector, $current) {
      var clauses = mod.splitClauses($current.selector),
          m = relativeSelector.match(/(\^)?(&+)?(\S*)(\s+(.+))?/),
          caret = m[1],
          ampersandCount = (m[2] || '').length,
          selector = m[3],
          childSelectors = m[4],
          initialClauses,
          $ret;

      if(caret) {
        $ret = $current.parents();

      } else if (ampersandCount === 0) {

        $ret = $current;
        childSelectors = ((selector || '') + ' ' + (childSelectors || '')).trim();
        selector = null;

      } else if (ampersandCount === 1) {

        $ret = $current;

      } else {

        initialClauses = _.initial(clauses, ampersandCount - 1).join(' ');

        switch(_.last(clauses).charAt(0)) {
          case '>': // trace back to immediate ancestor
            $ret = $current.parent();
            break;
          case '+': // trace back to adjacent sibling
            $ret = $current.prev();
            break;
          case '~': // check all previous siblings
            $ret = $current.prevAll(initialClauses);
            break;
          default:  // check all ancestors
            $ret = $current.parents(initialClauses);
        }
      }

      if (selector) $ret = $ret.filter(selector);
      if (childSelectors) $ret = $ret.find(childSelectors);

      return $ret;
    }

  };

})(jQuery, _);