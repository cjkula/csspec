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

      // note judicious use of double equal sign to permit duck-type comparison.
      if (actual == expected) return true;
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
      var fnAttr = mod.elementFnAttribute($el, attribute);
      return fnAttr ? fnAttr.evaluate($el, this) : null;
    },

    resolveExpression: function($el, expression) { 
      var re = /\(?(([.#:]*[^.#:)]+\s*)*)\)?\[([^\]]+)\]/g;
      return mod.unquote(expression).replace(re, _.bind(function(m, selectors, _, attribute) {
        var $target = selectors ? this.resolveRelativeElement(selectors, $el): $el;
        return this.resolveAttribute($target, attribute);
      }, this));
    },

    resolveRelativeElement: function(relativeSelector, $current) {
      var clauses = mod.splitClauses($current.selector),
          m = relativeSelector.match(/((\^+)(\*)?|(&))?(\S+)?(\s+(.+))?/),
          caretCount = (m[2] || '').length,
          star = m[3],
          ampersand = m[4],
          selector = m[5],
          childSelectors = m[7],
          single = false,
          initialClauses,
          $ret;

      if (star) { // implied ^* (or ^^* etc.)

        // SHOULD be all _selector_ parents; added carets would skip closest parents
        $ret = $current.parents(); // DOM parents, i.e. not yet accounting for +, ~ operators

      } else if (caretCount > 0) {

        single = true;
        initialClauses = _.initial(clauses, caretCount).join(' ');

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

      } else { // selecting on/within $current

        $ret = $current;

        if (!ampersand) {
          // first selector, if any, is actually the beginning of child selectors
          childSelectors = ((selector || '') + ' ' + (childSelectors || '')).trim();
          selector = null;
        }

      }

      if (selector) $ret = $ret.filter(selector);
      if (childSelectors) $ret = $ret.find(childSelectors);
      if (single) $ret = $ret.eq(0);

      return $ret;
    }

  };

})(jQuery, _);