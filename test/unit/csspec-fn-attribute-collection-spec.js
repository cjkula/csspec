'use strict';

describe('FnAttributeCollection', function(){
  var mod = CSSpec;

  var instance = function() {
    return new mod.FnAttributeCollection();
  }

  describe('::new', function() {
    it('should initialize properties', function() {
      var collection = instance();
      expect(collection.fnAttributes).toEqual({});
    });
  });

  describe('#createFnAttributes', function() {
    it('should populate FnAttributes from stylesheet rules', function() {
      var css = ".some-class { -fn-custom-attr: \"return 321;\" }",
          collection = instance(),
          rules = mod.parse(css).stylesheet.rules,
          fnAttr;
      collection.FnAttributes = {};
      collection.createFnAttributes(rules);
      expect(_.keys(collection.fnAttributes).length).toEqual(1);
      fnAttr = collection.fnAttributes['custom-attr'][0];
      expect(fnAttr.selector).toEqual('.some-class');
      expect(fnAttr.fn()).toEqual(321);
    });
  });

  describe('#appendFnAttribute', function(){
    it('should add a new function-attribute', function() {
      var collection = instance(null),
          attribute = 'offset-top',
          selector = '.selector',
          fn = function() { var test },
          fnAttr;
      collection.appendFnAttribute(attribute, fn, selector, true, true);
      expect(_.keys(collection.fnAttributes).length).toEqual(1);
      fnAttr = collection.fnAttributes[attribute][0];
      expect(fnAttr.attribute).toEqual(attribute);
      expect(fnAttr.selector).toEqual(selector);
      expect(fnAttr.fn).toEqual(fn);
      expect(fnAttr.specificity).toEqual(mod.selectorSpecificity(selector, true, true));
    });
  });

  describe('#matchFnAttribute', function() {
    var fn1 = function() { return 1 }, 
        fn2 = function() { return 2 }, 
        fn3 = function() { return 3 },
        coll,
        $outer = $('<div id="A" class="outer"><div id="B" class="inner"></div></div>').appendTo('body'),
        $inner = $outer.find('.inner');
    function addFn(fn, selector, attribute) { 
      return coll.appendFnAttribute(attribute || 'custom-attr', fn, selector);
    }
    beforeEach(function() {
      coll = new mod.FnAttributeCollection();
    });
    afterAll(function() {
      $fixture.remove();
    });
    it('should call #matchElement on each attribute-matching fnAttribute', function() {
      var fnAttr1 = addFn(fn1, '.inner'),
          fnAttr2 = addFn(fn2, '.outer'),
          fnAttr3 = addFn(fn3, '.other');
      spyOn(fnAttr1, 'matchElement').and.returnValue(false);
      spyOn(fnAttr2, 'matchElement').and.returnValue(false);
      spyOn(fnAttr3, 'matchElement').and.returnValue(false);
      coll.matchFnAttribute($outer, 'custom-attr');
      expect(fnAttr1.matchElement).toHaveBeenCalledWith($outer);
      expect(fnAttr2.matchElement).toHaveBeenCalledWith($outer);
      expect(fnAttr3.matchElement).toHaveBeenCalledWith($outer);
    });
    it('should not call #matchElement on non-attribute-matching fnAttributes', function() {
      
    });
    it('should return a function with a selector matching the passed element', function() {
      addFn(fn1, '.outer');
      addFn(fn2, '.inner');
      expect(coll.matchFnAttribute($outer, 'custom-attr').fn).toBe(fn1);
      expect(coll.matchFnAttribute($inner, 'custom-attr').fn).toBe(fn2);
    });
    it('should return the selector that was matched', function() {
      addFn(fn3, '.inner');     
      expect(coll.matchFnAttribute($inner, 'custom-attr').selector).toBe('.inner');
    });
    it('should return the selector point value', function() {
      addFn(fn1, '.outer');     
      expect(coll.matchFnAttribute($outer, 'custom-attr').specificity).toEqual(256);
    });
    describe('when more than one selector matches the passed element', function() {
      it('should return the function matching the selector with the highest point count', function() {
        addFn(fn1, '#B');
        addFn(fn2, '#A div');     
        addFn(fn3, '.inner');
        expect(coll.matchFnAttribute($inner, 'custom-attr').fn).toBe(fn2);
      });      
      it('should return the function matching the last selector if points are tied', function() {
        spyOn(mod, 'selectorSpecificity').and.returnValue(1);
        addFn(fn1, '#B');
        addFn(fn2, '#A div');     
        addFn(fn3, '.inner');
        expect(coll.matchFnAttribute($inner, 'custom-attr').fn).toBe(fn3);
      });      
    });
    describe('when a containing element matches the selector', function() {
      it('should return the containing selector', function() {
        addFn(fn1, '.outer');
        expect(coll.matchFnAttribute($inner, 'custom-attr').selector).toBe('.outer');
      });
    });
    describe('when no selector matches the element', function() {
      it('should return null', function() {
        addFn(fn1, '.other');
        expect(coll.matchFnAttribute($outer, 'custom-attr')).toBe(null);
      });      
    });
    describe('when no match for the attribute is found', function() {
      it('should return null', function() {
        addFn(fn1, '.outer');
        expect(coll.matchFnAttribute($outer, 'another-attr')).toBe(null);
      });
    });
  });

});