'use strict';

window.CSSpec = window.CSSpec || {};

(function($, _) {

  var module = CSSpec;

  // On DOM ready, do it all
  $(function() {
    module.prepare();
    module.exec(module.fixtureSelector);
    module.report();
  });

  _.extend(module, {

    fixtureSelector: '#csspec-fixture',

    selectorType: function(selector) {
      if (/^\.-describe/.test(selector)) return 'group';
      if (/^\.-when.*-$/.test(selector)) return 'state-';
      if (/^\.-when/.test(selector)) return 'state';
      if (/^\.-it/.test(selector)) return 'requirement'; 
      return 'selector';   
    },

    testClassToNaturalLanguage: function(testClass, omitType) {
      if (module.selectorType(testClass) === 'selector') return null;
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
              .filter(module.hasRequirement)
              .map(function(selector) { return new module.testCase(selector, cssRule); })
              .value();
    },

    prepare: function() {
      module.testCases = _.chain(document.styleSheets)
                          .pluck('cssRules')
                          .map(_.toArray).flatten()
                          .map(module.ruleTestCases)
                          .flatten().value();
    },

    // override earlier requirement criteria with later
    // when evaluating the same properties by the same selectors
    cascade: function(complete) {

    },

    exec: function(fixtureEl) {
      module.$fixture = $(fixtureEl);
      _.invoke(module.testCases, 'exec');
    },

    report: function() {

      var results   = _.pluck(module.testCases, 'result'),
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

      _.chain(module.testCases)
       .filter(function(testCase) { return testCase.result === 'fail'; })
       .invoke('report');

    }

  });

})(jQuery, _);