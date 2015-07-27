'use strict';

describe('FnAttribute', function(){
  var mod = CSSpec;

  var instance = function(attribute, fn, selector) {
    return new mod.FnAttribute(attribute || 'attr', fn || function(){}, selector || '.example');
  }

  describe('::new', function() {
    it('should initialize properties', function() {
      var attribute = 'some-attribute',
          fn = function() { var voila },
          selector = '#some-selector',
          fnAttr = instance(attribute, fn, selector);
      expect(fnAttr.attribute).toEqual(attribute);
      expect(fnAttr.selector).toEqual(selector);
      expect(fnAttr.fn).toBe(fn);
    });
    xit('should reference a passed function directly');
    xit('should convert function text to a function');
    it('should calculate selector specificity', function() {
      spyOn(mod, 'selectorSpecificity').and.returnValue(1001);
      expect(instance().specificity).toEqual(1001);
    });
  });

  xdescribe('#createFunction');
  //xit('it should use new Function()');


  // Not sure if this precisely it. The scope of the fnAttrs should reflect
  // the structure of the CSSpec document, not necessarily the DOM hierarchy.
  describe('#matchElement', function() {
    var fnAttr = instance(),
        $parent = $('<div class="parent"><div class="child"></div></div>').appendTo('body'),
        $child = $parent.find('.child');
    afterAll(function() {
      $parent.remove();
    });
    it('should return true if the passed element matches its scope selector', function() {
      fnAttr.selector = '.parent';
      expect(fnAttr.matchElement($parent)).toBe(true);
      fnAttr.selector = '.child';
      expect(fnAttr.matchElement($child)).toBe(true);
      expect(fnAttr.matchElement($parent)).toBe(false);
    });
    it('should return true if a selector parent of the passed element matches its scope selector', function() {
      fnAttr.selector = '.parent';
      expect(fnAttr.matchElement($child)).toBe(true);
    });
  });

  
  describe('#evaluate', function() {
    var fnAttr = instance('custom-attr'),
        $el = $('<div />').appendTo('body');
    afterAll(function() {
      $el.remove();
    });
    it('should call its function and return the result', function() {
      fnAttr.fn = function() { return 'result!'; }
      expect(fnAttr.evaluate($el)).toEqual('result!');
    });
    it('it should provide access to the DOM element', function() {
      fnAttr.fn = function() { return this; }
      expect(fnAttr.evaluate($el)).toEqual($el[0]);
    });
    it('it should provide access to the jQuery-wrapped element', function() {
      fnAttr.fn = fnAttr.createFunction('return $el');
      expect(fnAttr.evaluate($el)).toEqual($el);
    });
    it('it should provide access to the attribute name', function() {
      fnAttr.fn = fnAttr.createFunction('return attribute');
      expect(fnAttr.evaluate($el)).toEqual('custom-attr');
    });
    it('it should provide access to the Expectation object', function() {
      var expectation = { expectation: 'object' };
      fnAttr.fn = fnAttr.createFunction('return expectation');
      expect(fnAttr.evaluate($el, expectation)).toBe(expectation);
    });
    it('it should provide access to jQuery', function() {
      fnAttr.fn = fnAttr.createFunction('return $');
      expect(fnAttr.evaluate($el)).toBe($);
    });
    xit('it should provide access to Underscore.js', function() {
      fnAttr.fn = fnAttr.createFunction('return _');
      expect(fnAttr.evaluate($el)).toBe(_);
    });
  });

});