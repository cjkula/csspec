'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {

  var def = CSSpec;

  // On DOM ready, do it all
  $(function() {
    def.run();
  });

  _.extend(def, {

    fixtureSelector: '#csspec-fixture',

    // prepare, execute and report on all test cases
    // execution is conditional on the existence of a 
    // test fixture, since no actual tests can be run
    // without an instantiated target element
    run: function() {
      def.$fixture = $(def.fixtureSelector);
      if (def.$fixture.length > 0) {
        def.prepare();
        def.execTestCases();
        def.report();
      }
    },

    // read all stylesheets and extract tests that 
    // contain test cases (i.e. '.-it-' clauses)
    prepare: function() {
      def.testCases = _.chain(def.styleSheets())
                       .pluck('cssRules')
                       .map(_.toArray)
                       .flatten()
                       .map(def.ruleTestCases)
                       .flatten()
                       .value();
    },

    // override earlier test criteria with later
    // when evaluating the same properties by the same selectors
    cascade: function(complete) {

    },

    execTestCases: function() {
      _.invoke(def.testCases, 'exec');
    },

    report: function() {

      var results   = _.pluck(def.testCases, 'result'),
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

      _.chain(def.testCases)
       .filter(function(testCase) { return testCase.result === 'fail'; })
       .invoke('report');

    },

    // primarily to permit test stubbing
    styleSheets: function() {
      return document.styleSheets;
    },

    selectorType: function(selector) {
      if (/^\.-describe/.test(selector)) return 'context';
      if (/^\.-when.*-$/.test(selector)) return 'stateSelector';
      if (/^\.-when/.test(selector)) return 'state';
      if (/^\.-it/.test(selector)) return 'test'; 
      return 'selector';   
    },

    // Split a clause into component selectors.
    splitSelectors: function(clause) {
      return clause.match(/(\:not\()?[.#:]*[^.#:]+\)?/g);
    },

    csspecSelectorToNaturalLanguage: function(csspecClass, omitType) {
      if (def.selectorType(csspecClass) === 'selector') return null;
      return _.rest(csspecClass.split('-'), omitType ? 2 : 1).join(' ').trim();
    },

    hasTestSelector: function(selectorText) {
      var matches = selectorText.match(/\.\-it\-/g);

      if (!matches) return false;
      if (matches.length === 1) return true;

      throw "Nested Requirement";
    },

    ruleTestCases: function(cssRule) {
      return _.chain(cssRule.selectorText.split(/,\s*/))
              .filter(def.hasTestSelector)
              .map(function(selector) { return new def.TestCase(selector, cssRule); })
              .value();
    }

  });

})(jQuery, _);