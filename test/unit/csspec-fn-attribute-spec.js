'use strict';

describe('FnAttribute', function(){
  var mod = CSSpec;

  var instance = function(attribute, selector, fn) {
    return new mod.FnAttribute(attribute || 'attr', selector || '.class', fn || function(){});
  }

  describe('::new', function() {
    it('should initialize properties', function() {
      var attribute = 'some-attribute',
          selector = '#some-selector',
          fn = function() { var voila },
          fnAttr = instance(attribute, fn, selector);
      expect(fnAttr.attribute).toEqual(attribute);
      expect(fnAttr.selector).toEqual(selector);
      expect(fnAttr.fn).toBe(fn);
    });
    it('should calculate selector specificity', function() {
      spyOn(mod, 'selectorSpecificity').and.returnValue(1001);
      expect(instance().specificity).toEqual(1001);
    });
  });

});