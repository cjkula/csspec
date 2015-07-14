'use strict';


describe('CSSpec', function(){
  var def = CSSpec,
      $ = jQuery;

  describe('HTML fixture location', function() {
    it('should default to #csspec-fixture', function() {
      expect(def.fixtureSelector).toEqual('#csspec-fixture');
    });
  });

  describe('.run', function() {
    it('should not proceed if the fixture doesn\'t exist', function() {
      spyOn(def, 'prepare');
      def.run();
      expect(def.prepare).not.toHaveBeenCalled();
    });
    it('should not proceed if the fixture doesn\'t exist', function() {
      var $fixture = $('<div id="csspec-fixture"></div>');
      $('body').append($fixture);
      spyOn(def, 'prepare');
      spyOn(def, 'execTestCases');
      spyOn(def, 'report');
      def.run();
      expect(def.prepare).toHaveBeenCalled();
      expect(def.execTestCases).toHaveBeenCalled();
      expect(def.report).toHaveBeenCalled();
      $fixture.remove();
    });
  });

  describe('.prepare', function() {
    beforeEach(function() {
      def.testCases = null;
    });
    it('should poplate .testCases from .styleSheets', function() {
      var rule = { selectorText: '.-it-is-a-test' };
      spyOn(def, 'styleSheets').and.returnValue([{ cssRules: [rule] }]);
      spyOn(def, 'ruleTestCases').and.returnValue(['new testCase']);
      def.prepare();
      expect(def.ruleTestCases.calls.argsFor(0)[0]).toEqual(rule);
      expect(def.testCases).toEqual(['new testCase']);
    });
    it('should only populate test cases with .-it- clauses', function() {
      var testCase = { selectorText: '.example.-it-should-do-something' },
          nonTestCase = { selectorText: '.example.-describe-a-thing' };
      spyOn(def, 'styleSheets').and.returnValue([{ cssRules: [ testCase, nonTestCase ] }]);
      def.prepare();
      expect(def.testCases.length).toEqual(1);
      expect(def.testCases[0].cssRule).toBe(testCase);
    });
    it('should populate multiple selectors separately from the same rule', function() {
      var rule = { selectorText: '#this.-it-should-do-something, #that.-it-should-do-something-else' };
      spyOn(def, 'styleSheets').and.returnValue([{ cssRules: [ rule ] }]);
      def.prepare();
      expect(def.testCases.length).toEqual(2);
      expect(def.testCases[0].clauses[0]).toEqual('#this.-it-should-do-something');
      expect(def.testCases[1].clauses[0]).toEqual('#that.-it-should-do-something-else');
    });
  });

  describe('.cascade', function() {

  });

  describe('.execTestCases', function() {
    it('should execute each of the test cases', function() {
      var case1 = { exec: function(){} }, case2 = { exec: function(){} };
      spyOn(case1, 'exec');
      spyOn(case2, 'exec');
      def.testCases = [case1, case2];
      def.execTestCases();
      expect(case1.exec).toHaveBeenCalled();
      expect(case2.exec).toHaveBeenCalled();
    });
  });

  describe('.report', function() {
    // tests pending creation of a more appropriate output mechanism
  });

  describe('.styleSheets', function() {
    it('should read document.styleSheets', function() {
      expect(def.styleSheets()).toEqual(document.styleSheets);
    });
  })

  describe('.selectorType', function() {
    var meth = def.selectorType;
    it('should map -describe CSS selectors to "context"', function() {
      expect(meth(".-describe-something")).toBe('context');
    });
    it('should map -when-xxx CSS selectors to "state"', function() {
      expect(meth(".-when-something")).toBe('state');
    });
    it('should map -when-xxx- CSS selectors to "stateSelector"', function() {
      expect(meth(".-when-something-")).toBe('stateSelector');
    });
    it('should map -it CSS selectors to "test"', function() {
      expect(meth(".-it-should")).toBe('test');
    });
  });

  describe('.csspecSelectorToNaturalLanguage', function() {
    var meth = def.csspecSelectorToNaturalLanguage;
    it('should change hyphens into spaces', function() {
      expect(meth('.-describe-something')).toEqual('describe something');
    });
    it('should ignore trailing hyphens', function() {
      expect(meth('.-describe-something-else-')).toEqual('describe something else');
    });
    describe('with omitType set', function() {
      it('should omit the first word', function() {
        expect(meth('.-describe-this-thing', true)).toEqual('this thing');
      });
    });
  });

  describe('.hasTestSelector', function() {
    var meth = def.hasTestSelector;
    it('should return false if no test class', function() {
      expect(meth('.no-test')).toEqual(false);
    });
    it('should return true if one test class', function() {
      expect(meth('#this.-it-is-being-tested')).toEqual(true);
    });
    it('should throw an exception if multiple test classes are nested', function() {
      expect(function() { meth('.-it-does-this .-it-does-that'); }).toThrow();
    });
  });

  describe('.ruleTestCases', function() {
    var meth = def.ruleTestCases;
    it('should return a TestCase for each selector', function() {
      var testCases = meth({ selectorText: '.-it-can, .-it-does' });
      expect(testCases.length).toEqual(2);
      expect(testCases[0].clauses).toEqual(['.-it-can']);
      expect(testCases[1].clauses).toEqual(['.-it-does']);
    });
    it('should not return a TestCase for a clause without an -it class', function() {
      var testCases = meth({ selectorText: '.no-test, .-it-is-a-test' });
      expect(testCases.length).toEqual(1);
      expect(testCases[0].clauses).toEqual(['.-it-is-a-test']);
    });
  });

});

