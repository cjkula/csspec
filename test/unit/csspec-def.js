'use strict';


describe('CSSpec', function(){
  var def = CSSpec;

  describe('HTML fixture location', function() {
    it('should default to #csspec-fixture', function() {
      expect(def.fixtureSelector).toEqual('#csspec-fixture');
    });
  });

  describe('.selectorType', function() {
    it('should call -describe CSS selectors a "context"', function() {
      expect(def.selectorType(".-describe-something")).toBe('context');
    });
    it('should call -when-xxx CSS selectors a "state"', function() {
      expect(def.selectorType(".-when-something")).toBe('state');
    });
    it('should call -when-xxx- CSS selectors a "state-"', function() {
      expect(def.selectorType(".-when-something-")).toBe('state-');
    });
    it('should call -it CSS selectors a "test"', function() {
      expect(def.selectorType(".-it-should")).toBe('test');
    });
  });

});

