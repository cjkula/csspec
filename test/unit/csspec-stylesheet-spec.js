'use strict';

describe('stylesheet', function(){
  var mod = CSSpec;

  var instance = function(style, callback) {
    return new mod.StyleSheet(style || '', callback);
  }

  describe('::new', function() {
    it('should reference a document styleSheet', function() {
      var docStyleSheet = { href: 'http://url/style.css' };
      spyOn(mod.StyleSheet.prototype, 'loadSource');
      expect(instance(docStyleSheet).docStyleSheet).toBe(docStyleSheet);
    });
    it('should asynchronously load the source of a document styleSheet', function() {
      var styleSheet;
      spyOn(mod.StyleSheet.prototype, 'loadSource');
      styleSheet = instance({ href: 'http:url.com/style.css' });
      expect(mod.StyleSheet.prototype.loadSource).toHaveBeenCalled();
      expect(styleSheet.loaded).toBe(false);
    });
    describe('when passed a CSS string', function() {
      it('should create a style tag', function() {
        var text = '.test-class { display: block }',
            styleSheet;
        spyOn(mod.StyleSheet.prototype, 'createStyleTag');
        styleSheet = instance(text);
        expect(styleSheet.source).toEqual(text);
        expect(mod.StyleSheet.prototype.createStyleTag).toHaveBeenCalledWith(text);
      });
      it('should immediately execute the completion callback', function() {
        var called = false,
            styleSheet = instance('.class {}', function() { called = true });
        expect(styleSheet.loaded).toBe(true);
        expect(called).toBe(true);
      });
      it('should obtain a reference to the resulting document styleSheet', function() {
        var styleSheet = instance('.my-terrific-class { display: none }');
        expect(styleSheet.docStyleSheet.cssRules[0].selectorText).toEqual('.my-terrific-class');
      });
    })
  });

  describe('#createStyleTag', function() {
    it('should create a new style tag containing the passed CSS text', function() {
      var beforeCount = $('head style').length,
          style = '.sample { x: 0 }';
      instance(style);
      expect($('head style').length).toEqual(beforeCount + 1);
      expect($('head style').last().html()).toEqual(style);
    });
    it('should result in a new document styleSheet', function() {
      var beforeCount = mod.docStyleSheets().length;
      instance('.sample { y: 1 }');
      expect(mod.docStyleSheets().length).toEqual(beforeCount + 1);
    });
  });

  describe('#removeStyleTag', function() {
    it('should remove an associated style tag from the DOM', function() {
      var css = '.a-class {}',
          styleSheet = instance(css);
      expect($('head style').last().html()).toEqual(css);
      styleSheet.removeStyleTag();
      expect($('head style').last().html()).not.toEqual(css);
    });
  });

  describe('#loadSource', function() {
    it('should made an ajax request for the document stylesheet source', function() {
      var docStyleSheet = { href: 'http://url/style.css' };
      spyOn(jQuery, 'ajax').and.returnValue({ done: function() {} });
      instance(docStyleSheet);
      expect(jQuery.ajax).toHaveBeenCalled();
    });
    describe('completion callback', function() {
      it('should call #afterLoad if successful', function() {
        var docStyleSheet = { href: 'http://url/style.css' },
            styleSheet,
            css = '.sample {}';
        spyOn(mod.StyleSheet.prototype, 'afterLoad');
        spyOn(jQuery, 'ajax').and.returnValue({ done: function(callback) { callback(css) } });
        styleSheet = instance(docStyleSheet);
        expect(mod.StyleSheet.prototype.afterLoad).toHaveBeenCalledWith(css);
      })
    });
  });

  describe('#afterLoad', function() {
    it('should record the css source', function() {
      var css = '.the-css {}',
          styleSheet = instance('');
      styleSheet.afterLoad(css);
      expect(styleSheet.source).toEqual(css);
    });
    it('should prepare the styleSheet', function() {
      var css = '.the-css {}',
          styleSheet = instance('');
      spyOn(styleSheet, 'prepare');
      styleSheet.afterLoad(css);
      expect(styleSheet.prepare).toHaveBeenCalled();
    });
    it('should mark the stylesheet as loaded', function() {
      var styleSheet = instance('');
      styleSheet.loaded = false;
      styleSheet.afterLoad('.some-css {}');
      expect(styleSheet.loaded).toBe(true);
    });
    it('should call the onLoad callback', function() {
      var wasCalled,
          styleSheet = instance('', function() { wasCalled = true });
      wasCalled = false;
      styleSheet.afterLoad('');
      expect(wasCalled).toBe(true);
    });
  });

  describe('#prepare', function() {
    it('should parse the source document', function() {
      var css = '.css-source { x: 0 }';
      spyOn(mod, 'parse').and.returnValue({ stylesheet: { rules: [] } });
      instance(css).prepare();
      expect(mod.parse).toHaveBeenCalledWith(css);
    });
    it('should create test cases and function attributes', function() {
      var styleSheet, rules = [{ selectors: ['.test'] }];
      spyOn(mod, 'parse').and.returnValue({ stylesheet: { rules: rules } });
      styleSheet = instance('');
      spyOn(styleSheet, 'createTestCases');
      spyOn(styleSheet, 'createFnAttributes');
      styleSheet.prepare();
      expect(styleSheet.createTestCases).toHaveBeenCalledWith(rules);
      expect(styleSheet.createFnAttributes).toHaveBeenCalledWith(rules);
      styleSheet.remove();
    });
  });

  describe('#createTestCases', function() {
    it('should create a test case for each selector with an -it- clause', function() {
      var css = ".not-it { y: 10 }\n.-it-is-a-clause { color: red }\n.-it-is-another { color: blue }",
          styleSheet = instance(''),
          rules = mod.parse(css).stylesheet.rules;
      styleSheet.createTestCases(rules);
      expect(styleSheet.testCases.length).toEqual(2);
      expect(styleSheet.testCases[0].clauses).toEqual(['.-it-is-a-clause']);
      expect(styleSheet.testCases[1].clauses).toEqual(['.-it-is-another']);
      styleSheet.remove();
    });
  });

  describe('#createFnAttributes', function() {
    it('should create a fnAttributeCollection, passing the style rules', function() {
      var styleSheet = instance(''),
          rules = [{ selectors: [], declarations: [] }];
      styleSheet.fnAttributeCollection = null;
      spyOn(mod.FnAttributeCollection.prototype, 'createFnAttributes').and.returnValue({});
      styleSheet.createFnAttributes(rules);
      expect(mod.FnAttributeCollection.prototype.createFnAttributes).toHaveBeenCalledWith(rules);
    });
  });

  describe('#matchFnAttribute', function() {
    it('delegates call to the fnAttributeCollection', function() {
      var styleSheet = instance(''),
          $el = $('<div />'),
          attribute = '.some-attr';
      spyOn(styleSheet.fnAttributeCollection, 'matchFnAttribute');
      styleSheet.matchFnAttribute($el, attribute);
      expect(styleSheet.fnAttributeCollection.matchFnAttribute).toHaveBeenCalledWith($el, attribute);
      styleSheet.remove();
    });
  });

  describe('#execTestCases', function() {
    it('should call #exec on each test case', function() {
      var styleSheet = instance('.something {}'),
          tc1 = new mod.TestCase('.selector', {}),
          tc2 = new mod.TestCase('.selector', {});

      styleSheet.testCases = [tc1, tc2];
      spyOn(tc1, 'exec');
      spyOn(tc2, 'exec');
      styleSheet.execTestCases();
      expect(tc1.exec).toHaveBeenCalled();
      expect(tc2.exec).toHaveBeenCalled();

    });
  });

  describe('#remove', function() {
    it('should call #removeStyleTag', function() {
      var styleSheet = mod.appendStyleSheet('');
      spyOn(styleSheet, 'removeStyleTag');
      styleSheet.remove();
      expect(styleSheet.removeStyleTag).toHaveBeenCalled();
    });
    it('should delete the styleSheet from mod.styleSheets', function() {
      var beforeCount = mod.styleSheets.length,
          styleSheet = mod.appendStyleSheet('');
      expect(mod.styleSheets.length).toEqual(beforeCount + 1);
      expect(_.last(mod.styleSheets)).toBe(styleSheet);
      styleSheet.remove();
      expect(mod.styleSheets.length).toEqual(beforeCount);
    });
    it('should not delete other styleSheets', function() {
      var beforeCount = mod.styleSheets.length,
          styleSheet1 = mod.appendStyleSheet('.first {}'),
          styleSheet2 = mod.appendStyleSheet('.second {}');
      expect(mod.styleSheets.length).toEqual(beforeCount + 2);
      styleSheet1.remove();
      expect(_.last(mod.styleSheets)).toBe(styleSheet2);
      styleSheet2.remove();
    });
  });

});