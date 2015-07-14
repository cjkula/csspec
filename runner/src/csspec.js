'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {

  var def = CSSpec;

  // On DOM ready, do it all
  $(function() {
    def.prepare();
    def.exec(def.fixtureSelector);
    def.report();
  });

  _.extend(def, {

    fixtureSelector: '#csspec-fixture',

    selectorType: function(selector) {
      if (/^\.-describe/.test(selector)) return 'context';
      if (/^\.-when.*-$/.test(selector)) return 'state-';
      if (/^\.-when/.test(selector)) return 'state';
      if (/^\.-it/.test(selector)) return 'test'; 
      return 'selector';   
    },

    testClassToNaturalLanguage: function(testClass, omitType) {
      if (def.selectorType(testClass) === 'selector') return null;
      return _.rest(testClass.split('-'), omitType ? 2 : 1).join(' ').trim();
    },

    // simple approach
    // (test directive namespaces should be cascade-configurable)
    hasRequirement: function(selectorText) {
      var matches = selectorText.match(/\.\-it\b/g);

      if (!matches) return false;
      if (matches.length === 1) return true;

      throw "Nested Requirement";
      // It is possible (though peculiar?) to have multiple
      // it- clauses as part the same selector if 
      // they are evaluating different test cases on
      // the same element, which, if I am thinking about
      // this correctly, would necessarily have identical
      // success criteria. These should either be split 
      // into distinct test cases, OR be reported as such.
    },

    ruleTestCases: function(cssRule) {
      return _.chain(cssRule.selectorText.split(/,\s*/))
              .filter(def.hasRequirement)
              .map(function(selector) { return new def.testCase(selector, cssRule); })
              .value();
    },

    prepare: function() {
      def.testCases = _.chain(document.styleSheets)
                          .pluck('cssRules')
                          .map(_.toArray).flatten()
                          .map(def.ruleTestCases)
                          .flatten().value();
    },

    // override earlier requirement criteria with later
    // when evaluating the same properties by the same selectors
    cascade: function(complete) {

    },

    exec: function(fixtureEl) {
      def.$fixture = $(fixtureEl);
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

    }

  });

})(jQuery, _);