'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {
  var def = CSSpec;

  // constructor
  CSSpec.TestCase = function(ruleSelector, cssRule) {
    this.clauses = ruleSelector.split(/\s+/);
    this.cssRule = cssRule;
  };

  def.TestCase.prototype = {

    // Evaluate test case if any expectations set (otherwise return 'pending').
    exec: function() {
      var expectations = this.cssRule.style;
      this.failures = [];
      this.result = expectations.length > 0 ? this.testTarget(expectations) : 'pending';
    },

    // Apply selectors and fixure content to the selected element(s) and evaluate test case.
    // Revert DOM state after completed.
    testTarget: function(expectations) {
      return this.revertAfter(function() {

        this.$target = this.applyClauses(def.$fixture);

        return this.$target.length === 0 ? 'inapplicable' :
               (this.targetMeetsExpectations(expectations) ? 'pass' : 'fail');
      });
    },

    // Filter and apply classes and content, clause by clause
    applyClauses: function($el) {
      _.each(this.clauses, _.bind(function(clause, index) {

        // add classes etc.
        $el = this.applyClauseSelectors($el, clause, index);

        // insert content if in resulting selector definition
        this.applyContent($el);

      }, this));

      return $el;
    },

    // Boolean: does this.$target pass the tests?
    targetMeetsExpectations: function(expectations) {
      var i, attrName, pass = true;

      // keeping it local so can return on first failure if preferred
      for (i = 0; i < expectations.length; i++) {
        attrName = expectations[i];
        if (!this.meetsExpectation(this.$target, attrName, expectations[attrName]))
          pass = false;
      }
      return pass;
    },

    // Replace inner HTML of element with CSS :content if defined
    applyContent: function($el) {
      var content = $el.css('content'),
          saveContent;

      if (content) {

        content = content.match(/^\s*(\'(.*)\'|\"(.*)\")\s*$/)[2];
        saveContent = $el.html();
        if (content !== saveContent) {
          $el.html(content);
          this.revert(function() { $el.html(saveContent); });
        }
      }

    },

    // needs another refactor to make comprehensible
    applyClauseSelectors: function($input, clause, clauseIndex) {
      var self = this,
          $el = $input,
          filters = [], 
          contexts = [],
          firstApply = true,
          type,
          force = null;

      _.each(def.splitSelectors(clause), function(selector, selectorIndex) {

        type = force || def.selectorType(selector);
        force = null;

        switch(type) {
          case 'selector':
            filters.push(selector);
            break;
          case 'context':
            contexts.push(selector);
            break;
          case 'stateSelector':
            force = 'afterHyphen'; // trigger afterState case on next selector
            // break intentionally omitted
          case 'state':
          case 'afterHyphen':
            $el = self.applyQueues($el, filters, contexts, clauseIndex === 0, firstApply);
            filters = [];
            contexts = [];
            firstApply = false;
            self.applySelector(selector, $el);
        }

      });

      return this.applyQueues($el, filters, contexts, clauseIndex === 0, firstApply);
    },

    applyQueues: function($el, filters, contexts, firstClause, firstApply) {
      // At the start of EVERY CLAUSE, the first selector
      // will select inside the containing $input element/
      // The one exception is for the first clause only:
      // if there are only context selectors to be applied and
      // NOTHING has yet been applied, then the context
      // selectors are applied TO the containing element.

      if (filters.length > 0) {
        $el = $el[firstApply ? 'find' : 'filter'](filters.join(''));
        this.applySelectors(contexts, $el);
      } else if (firstApply && !firstClause) {
        $el = $el.find(contexts.join(''));
      } else {
        this.applySelectors(contexts, $el);
      }

      return $el;
    },

    applySelectors: function(selectors, $el) {
      _.each(selectors, _.bind(function(selector) {
        this.applySelector(selector, $el);
      }, this));
    },

    applySelector: function(selector, $el) {
      var matches = selector.match(/^(\.|#|\:not\(\.|\:not\(#)([^\)]+)\)?$/),
          prefix = matches[1],
          identifier = matches[2];

      switch (prefix) {
        case '.':
          this.applyClass($el, identifier);
          break;
        case ':not(.':
          this.applyClass($el, identifier, true);
          break;
        case '#':
          this.applyId($el, identifier);
          break;
        case ':not(#':
          this.applyId($el, identifier, true);
          break;
      }

    },

    applyClass: function($el, cls, invert) {
      var has = $el.hasClass(cls);
      if ((!invert && !has) || (invert && has)) {
        $el.toggleClass(cls, !invert);
        this.revert(function() { $el.toggleClass(cls, invert); });
      }
    },

    applyId: function($el, id, invert) {
      var saveId = $el.attr('id');
      if ((!invert && id !== saveId) || (invert && id === saveId)) {
        $el.attr('id', invert ? '' : id);
        this.revert(function() { $el.attr('id', saveId); });
      }
    },

    // 
    revert: function(undo) {
      if (!this.rollbackStack) this.rollbackStack = [];
      this.rollbackStack.push(undo);
    },

    // Establishes a rollback stack and calls each function pushed by the yielded action.
    // Passes result of yield to invoking function.
    revertAfter: function(execute) {
      var result;
      this.rollbackStack = [];

      result = execute.call(this);

      while (this.rollbackStack.length > 0) {
        this.rollbackStack.pop()();
      }
      return result;
    },

    meetsExpectation: function($target, attrName, expectedValue) {
      var actual = this.resolveAttribute($target, attrName);

      if (actual === expectedValue) return true;

      this.failures.push('expected :' + attrName + 
                         ' to be ' + expectedValue +
                         ' but was ' + actual + '.');
      return false;
    },

    resolveAttribute: function($target, attrName) {
      return $target.css(attrName);
    },

    report: function() {
      var label = this.result === 'pass' ? 'SUCCESS' : (this.result === 'fail' ? 'FAILURE' : 'PENDING');
      
      console.log(label + ': ' + this.description());
      _.each(this.failures, function(failure) {
        console.log('    ' + failure);
      });
    },
  
    description: function() {
      var self = this,
          sections = [];

      _.each(this.clauses, function(clause) {

        var selectors = def.splitSelectors(clause),
            types = _.map(selectors, def.selectorType);

        _.each(selectors, function(selector, i) {
          if (types[i] === 'selector') {
            if ((i > 0) && (types[i - 1] === 'stateSelector')) {
              if ((i > 2) && (types[i - 2] === 'selector') && (types[i - 3] === 'stateSelector')) {
                sections.pop();
                sections[sections.length - 1] = sections[sections.length - 1] + selector;
              } else {
                sections.push(selector);
              }
            }
          } else {
            sections.push(def.csspecSelectorToNaturalLanguage(selector, types[i] !== 'stateSelector'));
          }

        });

      });

      return sections.join(' ');
    }

  };

})(jQuery, _);