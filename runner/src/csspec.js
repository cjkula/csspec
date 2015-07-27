'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {

  var mod = CSSpec;

  // On DOM ready, do it all
  $(function() {
    mod.run();
  });

  _.extend(mod, {

    fixtureSelector: '#csspec-fixture',

    styleSheets: [],

    // Prepare, execute and report on all test cases. Execution
    // is conditional on the existence of the test fixture.
    run: function() {
      mod.$fixture = $(mod.fixtureSelector);
      if (mod.$fixture.length > 0) {
        mod.prepare(function() {
          mod.execAllTestCases();
          mod.report();
        });
      }
    },

    // read all stylesheets and extract tests that 
    // contain test cases (i.e. '.-it-' clauses)
    prepare: function(complete) {
      _.each(this.docStyleSheets(), function(docStyleSheet) {
        mod.appendStyleSheet(docStyleSheet, function() {
          if (_.every(_.pluck(mod.styleSheets, 'loaded'), _.identity)) complete();          
        });
      });
      if (mod.styleSheets.length === 0) complete();
    },

    appendStyleSheet: function(styleObj, complete) {
      var styleSheet = new mod.StyleSheet(styleObj, complete);
      mod.styleSheets.push(styleSheet);
      return styleSheet;
    },

    execAllTestCases: function() {
      _.invoke(this.styleSheets, 'execTestCases');
    },

    // for test stubbing
    docStyleSheets: function() {
      return document.styleSheets;
    },

    // override earlier test criteria with later
    // when evaluating the same properties by the same selectors
    cascade: function(complete) {

    },

    report: function() {
      var testCases = _.flatten(_.pluck(mod.styleSheets, 'testCases'));
          results   =  _.pluck(testCases,'result'),
          counts    = { pass: 0, fail: 0, pending: 0, inapplicable: 0 },
          dotReport = _.map(results, function(result) {
                        switch(result) {
                          case 'pass'         : return '.';
                          case 'fail'         : return 'F'; 
                          case 'pending'      : return '*';
                          case 'inapplicable' : return '_';
                          default             : return '?';
                        }
                      }).join('');

      _.extend(counts, _.countBy(results));

      console.log(dotReport);
      console.log(results.length      + ' CASES: ' + 
                  counts.pass         + ' PASS, '  + 
                  counts.fail         + ' FAIL, '  + 
                  counts.inapplicable + ' N/A, '   +
                  counts.pending      + ' PENDING');
      console.log('');

      _.chain(testCases)
       .filter(function(testCase) { return testCase.result === 'fail'; })
       .invoke('report');

    },

    selectorType: function(selector) {
      if (/^\.-describe/.test(selector)) return 'context';
      if (/^\.-when.*-$/.test(selector)) return 'stateSelector';
      if (/^\.-when/.test(selector)) return 'state';
      if (/^\.-it/.test(selector)) return 'test'; 
      return 'selector';   
    },

    // split a compound selector into element-level clauses
    splitClauses: function(selector) {
      return selector.trim().replace(/(>|\+|~|\^|&+)\s*/g, function(match, p1) {
        return ' ' + p1;
      }).split(/\s+/);
    },

    // Split a clause into component selectors.
    splitSelectors: function(clause) {
      return clause.match(/(\:not\()?[.#:]*[^.#:]+\)?/g);
    },

    scopeToNaturalLanguage: function(csspecClass, omitType) {
      if (mod.selectorType(csspecClass) === 'selector') return null;
      return _.rest(csspecClass.split('-'), omitType ? 2 : 1).join(' ').trim();
    },

    hasTestSelector: function(selectorText) {
      var matches = selectorText.match(/\.\-it\-/g);

      if (!matches) return false;
      if (matches.length === 1) return true;

      throw "Nested Requirement";
    },

    matchAttributeName: function(cssAttribute) {
      return (cssAttribute.match(/^\-fn\-(.*)$/) || [])[1];
    },

    unquote: function(quotedString) {
      var m = quotedString.match(/^\s*(\'(.*)\'|\"(.*)\")\s*$/);
      if (!m) return quotedString;
      return (m[2] || m[3]).replace(/\\\"/g, '"').replace(/\\\'/g, "'");
    },

    elementFnAttribute: function($el, attribute) {
      return _.chain(this.styleSheets)
              .invoke('matchFnAttribute', $el, attribute)
              .compact()
              .reduce(function(memo, fnAttribute) {
                return fnAttribute.specificity >= memo.specificity ? fnAttribute : memo;
              })
              .value();
    },

    parseSelector: function(selector, $el) {
      var m, negative, typeIdentifier, type, token, closeParen, result;
      m = selector.match(/^(\:not\()?(\*|\.|#|\:|\:\:)?([\w\-]+)?(\))?$/);
      if (!m) throw 'CSSpec.parseSelector: Invalid Selector';

      negative = m[1];
      typeIdentifier = m[2];
      type = mod.selectorTypeFromTypeIdentifier(typeIdentifier || '');
      token = m[3];
      closeParen = m[4];
      if (typeIdentifier === ':' && (token === 'before' || token === 'after')) type = 'psuedoElement';

      if (!typeIdentifier && !token)     throw 'CSSpec.parseSelector: Empty Selector';
      if (negative && !closeParen)       throw 'CSSpec.parseSelector: Missing ) in Negative Selector';
      if (type === 'universal' && token) throw 'CSSpec.parseSelector: Invalid Character Following * Selector';

      result = { type: type };
      if (token)    result.token = token;
      if (negative) result.negative = true;
      return result;
    },

    selectorTypeFromTypeIdentifier: function(typeIdentifier) {
      switch (typeIdentifier) {
        case '*'  : return 'universal';
        case ''   : return 'element';
        case '::' : return 'psuedoElement';
        case '.'  : return 'class';
        case ':'  : return 'psuedoClass';
        case '#'  : return 'id';
      }
      throw  'CSSpec.selectorTypeFromTypeIdentifier: Invalid Identifier Type';
    },

    // No way (I think) for it to have a selector and also be inline, 
    // so perhaps those should collapse to one argument.
    // Pass true rather than a string to represent inline? Or an object?
    selectorSpecificity: function(compoundSelector, inline, important) {

      var types = compoundSelector ?
                  _.chain(mod.splitClauses(compoundSelector))
                   .map(mod.splitSelectors)
                   .flatten()
                   .map(mod.parseSelector)
                   .countBy('type')
                   .value()
                  : {};

      return (types.element       || 0)              +
             (types.psuedoElement || 0)              +
             (types.class         || 0) * 256        +
             (types.psuedoClass   || 0) * 256        +
             (types.id            || 0) * 256 * 256  +
             (inline    ? 256 * 256 * 256       : 0) +
             (important ? 256 * 256 * 256 * 256 : 0);

    }

  });

})(jQuery, _);