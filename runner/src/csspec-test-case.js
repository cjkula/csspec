'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {
  var def = CSSpec;

  CSSpec.TestCase = function(ruleSelector, cssRule) {
    this.clauses = ruleSelector.split(/\s+/);
    this.cssRule = cssRule;
  };

  def.TestCase.prototype = {

    exec: function() {
      var self = this,
          expectedAttrs = this.cssRule.style,
          $target = this.prepareTarget();

      this.failures = [];
      this.result = expectedAttrs.length > 0 ? 'pass' : 'pending';
      this.targetCount = $target.length;

      if (this.targetCount > 0) {
      
        _.each(expectedAttrs, _.bind(function(attrName) {
          var evaluation = self.evaluateCriterion($target, attrName, expectedAttrs[attrName]);
          if (evaluation.result === 'fail') {
            self.result = 'fail';
            self.failures.push(evaluation.report);
          }
        }, this));

      } else {
        this.result = 'inapplicable';
      }

      this.rollback();
    },

    prepareTarget: function() {
      var self = this,
          $el = def.$fixture;

      this.rollbackStack = [];  // hooks to undo DOM changes

      _.each(this.clauses, function(clause, index) {

        $el = self.applyClauseSelectors($el, clause, index); // add classes etc.
        self.applyContent($el);   // insert content if part of
                                  // resulting selector definition
      });

      return $el;
    },

    splitSelectors: function(clause) {
      return clause.match(/(\:not\()?[.#:]*[^.#:]+\)?/g);
    },

    applyContent: function($el) {
      var content = $el.css('content'),
          saveContent;

      if (content) {

        content = content.match(/^\s*(\'(.*)\'|\"(.*)\")\s*$/)[2];
        saveContent = $el.html();
        if (content !== saveContent) {

          $el.html(content);

          this.rollbackStack.push(function() {
            $el.html(saveContent);
          });

        }
      }

    },

    applyClauseSelectors: function($input, clause, clauseIndex) {
      var self = this,
          $el = $input,
          filters = [], 
          contexts = [],
          firstFlush = true,
          type,
          force = null;

      function flushQueues() {
        // At the start of EVERY CLAUSE, the first selector
        // will select inside the containing $input element/
        // The one exception is for the first clause only:
        // if there are only context selectors to be applied and
        // NOTHING has yet been applied, then the context
        // selectors are applied TO the containing element.

        if (filters.length > 0) {
          if (firstFlush) {
            $el = $el.find(filters.join(''));
          } else {
            $el = $el.filter(filters.join(''));
          }
        }

        if (filters.length > 0) {
          self.applySelectors(contexts, $el);
        } else if (firstFlush && clauseIndex > 0) {
            $el = $el.find(contexts.join(''));
        } else {
          self.applySelectors(contexts, $el);
        }

        filters = [];
        contexts = [];
        firstFlush = false;
      }

      _.each(this.splitSelectors(clause), function(selector, selectorIndex) {

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
            flushQueues();
            self.applySelector(selector, $el);
            break;
          case 'test':
            self.test = selector;
        }

      });

      flushQueues();

      return $el;
    },

    applySelectors: function(selectors, $el) {
      _.each(selectors, _.bind(function(selector) {
        this.applySelector(selector, $el);
      }, this));
    },

    applySelector: function(selector, $el) {
      var matches = selector.match(/^(\.|#|\:not\(\.)(.+)\)?$/),
          prefix = matches[1],
          identifier = matches[2],
          saveIdentifier;

      switch (prefix) {

        case '.':
          if (!$el.hasClass(identifier)) {
            $el.addClass(identifier);
            this.rollbackStack.push(function() {
              $el.removeClass(identifier);
            });
          }
          break;

        case '#':
          saveIdentifier = $el.attr('id');
          if (identifier !== saveIdentifier) {
            $el.attr('id', identifier);
            this.rollbackStack.push(function() {
              $el.attr('id', saveIdentifier);
            });
          }
          break;

        case ':not(.':
          if ($el.hasClass(identifier)) {
            $el.removeClass(identifier);
            this.rollbackStack.push(function() {
              $el.addClass(identifier);
            });
          }
          break;

      }

    },

    // undo applied states
    rollback: function() {
      while (this.rollbackStack && this.rollbackStack.length > 0) {
        this.rollbackStack.pop()();
      }
    },

    evaluateCriterion: function($target, attrName, expectedValue) {
      var actual = this.resolveAttribute($target, attrName);
      if (actual === expectedValue) return { result: 'pass' };
      return {
        result: 'fail',
        report: 'expected :' + attrName + 
                ' to be ' + expectedValue +
                ' but was ' + actual + '.'
      };
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

        var selectors = self.splitSelectors(clause),
            types = _.map(selectors, def.selectorType);

        _.each(self.splitSelectors(clause), function(selector, i) {
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