'use strict';

describe('CSSpec', function(){
  var mod = CSSpec, $ = jQuery;


  describe('HTML fixture location', function() {
    it('should default to #csspec-fixture', function() {
      expect(mod.fixtureSelector).toEqual('#csspec-fixture');
    });
    it('should initialize .styleSheets', function() {
      expect(mod.styleSheets).toEqual([]);
    });
  });


  describe('.run', function() {
    it('should not proceed if the fixture doesn\'t exist', function() {
      spyOn(mod, 'prepare');
      mod.run();
      expect(mod.prepare).not.toHaveBeenCalled();
    });
    it('should call .prepare', function() {
      var $fixture = $('<div id="csspec-fixture"></div>');
      $('body').append($fixture);
      spyOn(mod, 'prepare').and.callFake(function(complete) { complete() });
      spyOn(mod, 'execAllTestCases');
      spyOn(mod, 'report');
      mod.run();
      expect(mod.prepare).toHaveBeenCalled();
      expect(mod.execAllTestCases).toHaveBeenCalled();
      expect(mod.report).toHaveBeenCalled();
      $fixture.remove();
    });
  });


  describe('.prepare', function() {
    it('should create a StyleSheet object for each document styleSheet', function() {
      mod.styleSheets = [];
      spyOn(mod, 'docStyleSheets').and.returnValue([{},{},{}]);
      mod.prepare();
      expect(mod.styleSheets.length).toEqual(3);
    });
    it('should invoke the callback when all stylesheets are loaded', function() {
      var completed = 0;
      spyOn(mod, 'docStyleSheets').and.returnValue([{},{},{}]);
      spyOn(mod, 'StyleSheet').and.callFake(function(css, callback) { 
        completed = completed + 1;
        callback({ parse: function() {} });
      });
      mod.prepare();
      expect(completed).toEqual(3);
    });
  });


  //   appendStyleSheet: function(styleObj, complete) {
  //   var styleSheet = new mod.StyleSheet(styleObj, complete);
  //   mod.styleSheets.push(styleSheet);
  //   return styleSheet;
  // },

  describe('.appendStyleSheet', function() {
    it('should create a new stylesheet from the passed style object', function() {
      var beforeCount = mod.styleSheets.length,
          styleSheet = mod.appendStyleSheet('#id1 { color: #fff }');
      expect(mod.styleSheets.length).toEqual(beforeCount + 1);
      styleSheet.remove();
    });
    it('should append the new stylesheet to an existing list', function() {
      var ss1 = mod.appendStyleSheet(''),
          ss2 = mod.appendStyleSheet('#id2 { color: #fff }');
      expect(_.last(mod.styleSheets)).toBe(ss2);
      ss1.remove();
      ss2.remove();
    });
    it('should return the new styleSheet', function() {
      var css = ':hover { font-weight: 700 }'
      expect(mod.appendStyleSheet(css).source).toEqual(css);
    });
  });


  describe('.execAllTestCases', function() {
    it('should execute each of the test cases', function() {
      var ss1 = { execTestCases: function(){} }, ss2 = { execTestCases: function(){} };
      spyOn(ss1, 'execTestCases');
      spyOn(ss2, 'execTestCases');
      mod.styleSheets = [ss1, ss2];
      mod.execAllTestCases();
      expect(ss1.execTestCases).toHaveBeenCalled();
      expect(ss2.execTestCases).toHaveBeenCalled();
    });
  });


  describe('.docStyleSheets', function() {
    it('should read document.styleSheets', function() {
      expect(mod.docStyleSheets()).toEqual(document.styleSheets);
    });
  })


  describe('.cascade', function() {
    pending();
    // no functionality yet
  });


  describe('.report', function() {
    pending();
    // tests pending creation of a release-quality output mechanism
  });


  describe('.selectorType', function() {
    var meth = mod.selectorType;
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


  describe('splitClauses', function() {
    it('should split elements by whitespace', function() {
      expect(mod.splitClauses(' #id123 ')).toEqual(['#id123']);
      expect(mod.splitClauses(" .my-class\t.this#element")).toEqual(['.my-class', '.this#element']);
    });
    it('should split elements by descendent and sibling operators', function() {
      expect(mod.splitClauses('.first>.second')).toEqual(['.first', '>.second']);
      expect(mod.splitClauses('.first+.second')).toEqual(['.first', '+.second']);
      expect(mod.splitClauses('.first~.second')).toEqual(['.first', '~.second']);
    });
    it('should group descendent operators with the subsequent clause regardless of whitespace', function() {
      expect(mod.splitClauses('.first > .second')).toEqual(['.first', '>.second']);
      expect(mod.splitClauses(".first+\t.second")).toEqual(['.first', '+.second']);
      expect(mod.splitClauses(".first    ~.second")).toEqual(['.first', '~.second']);
    });
  });


  describe('splitSelectors', function() {
    it('should keep a single selector unsplit', function() {
      expect(mod.splitSelectors('.some-class')).toEqual(['.some-class']);
      expect(mod.splitSelectors('#someId')).toEqual(['#someId']);
      expect(mod.splitSelectors(':not(.some-class)')).toEqual([':not(.some-class)']);
      expect(mod.splitSelectors(':not(.someId)')).toEqual([':not(.someId)']);
      expect(mod.splitSelectors(':psuedo-state')).toEqual([':psuedo-state']);
    });
    it('should split multiple selectors into components', function() {
      expect(mod.splitSelectors('.class1.class2')).toEqual(['.class1', '.class2']);
      expect(mod.splitSelectors('#id1#id2')).toEqual(['#id1', '#id2']);
      expect(mod.splitSelectors('.classA#idB')).toEqual(['.classA', '#idB']);
      expect(mod.splitSelectors('.classA:hover')).toEqual(['.classA', ':hover']);
      expect(mod.splitSelectors('.classA:not(#idB)')).toEqual(['.classA', ':not(#idB)']);
      expect(mod.splitSelectors(':not(.classA)#idB')).toEqual([':not(.classA)', '#idB']);
      expect(mod.splitSelectors('#idA:not(:focus)')).toEqual(['#idA', ':not(:focus)']);
    });
  });


  describe('.scopeToNaturalLanguage', function() {
    var meth = mod.scopeToNaturalLanguage;
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
    var meth = mod.hasTestSelector;
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


  describe('.isFnAttribute', function() {
    pending();
  });


  describe('.unwrapFunction', function() {
    pending();
  });


  describe('.unquote', function() {
    it('should remove surrounding single or double quotes', function() {
      expect(mod.unquote('"double-quoted"')).toEqual('double-quoted');
      expect(mod.unquote("'single-quoted'")).toEqual('single-quoted');
    });
    it('should ignore space outside of quotes', function() {
      expect(mod.unquote(" ' spaces ' ")).toEqual(' spaces ');
      expect(mod.unquote(' " spaces " ')).toEqual(' spaces ');

    });
    it('should unescape single and double quotes', function() {
      expect(mod.unquote("'\\\"escaped\\\"'")).toEqual("\"escaped\"");
      expect(mod.unquote("'\\\'escaped\\\''")).toEqual("'escaped'");
      expect(mod.unquote('"\\\'escaped\\\'"')).toEqual('\'escaped\'');
      expect(mod.unquote('"\\\"escaped\\\""')).toEqual('"escaped"');
    });
  });


  describe('elementAttributeFunction', function() {
    var $el = $('<div />'),
        attribute = 'custom-attr';
    describe('when there are stylesheets', function() {
      beforeAll(function() {
        mod.styleSheets = [];
        mod.appendStyleSheet('');
        mod.appendStyleSheet('');
      })
      afterAll(function() {
        _.invoke(mod.styleSheets, 'remove');
        mod.styleSheets = [];
      });
      it('should call each stylesheet for matches', function() {
        spyOn(mod.StyleSheet.prototype, 'matchFnAttribute').and.returnValue({});
        mod.elementAttributeFunction($el, attribute);
        expect(mod.StyleSheet.prototype.matchFnAttribute.calls.count()).toEqual(2);
        expect(mod.StyleSheet.prototype.matchFnAttribute).toHaveBeenCalledWith($el, attribute);
      });
      describe('when a function attribute matches the element', function() {
        it('should return the matched function', function() {
          var fn = function() {0};
          spyOn(mod.StyleSheet.prototype, 'matchFnAttribute').and.returnValue({fn: fn});
          expect(mod.elementAttributeFunction($el, attribute)).toBe(fn);
        });
      });
      describe('when results have equal specificity', function() {
        it('should return the last-matched function', function() {
          var fn1 = function() {1}, fn2 = function() {2}, count = 0;
          spyOn(mod.StyleSheet.prototype, 'matchFnAttribute').and.callFake(function() {
            return { fn: (count++ ? fn2 : fn1), specificity: 10 };
          });
          expect(mod.elementAttributeFunction($el, attribute)).toBe(fn2);
        });
      });
      describe('when results have unequal specificity', function() {
        it('should return the function with the highest specificity', function() {
          var fn1 = function() {1}, fn2 = function() {2}, count = 0;
          spyOn(mod.StyleSheet.prototype, 'matchFnAttribute').and.callFake(function() {
            return count++ ? { fn: fn1, specificity: 100 } : { fn: fn2, specificity: 10 };
          });
          expect(mod.elementAttributeFunction($el, attribute)).toBe(fn1);
        });
      });
      describe('when a function attribute does not match the element', function() {
        it('should return null', function() {
          var fn = function() {0};
          spyOn(mod.StyleSheet.prototype, 'matchFnAttribute').and.returnValue(null);
          expect(mod.elementAttributeFunction($el, 'no-match')).toBe(null);
        });
      });
    });
    describe('when there are no stylesheets', function() {
      it('should return null', function() {
        mod.styleSheets = [];
        expect(mod.elementAttributeFunction($el, attribute)).toBe(null);
      });
    });
  });


  describe('.parseSelector', function() {
    it('should parse an asterisk', function() {
      expect(mod.parseSelector('*')).toEqual({ type: 'universal' });
    });
    it('should parse an element', function() {
      expect(mod.parseSelector('table')).toEqual({ type: 'element', token: 'table' });
    });
    it('should parse a negative element', function() {
      expect(mod.parseSelector(':not(table)')).toEqual({ type: 'element', token: 'table', negative: true });
    });
    it('should parse a psuedo-element', function() {
      expect(mod.parseSelector('::before')).toEqual({ type: 'psuedoElement', token: 'before' });
    });
    it('should parse a legacy psuedo-element', function() {
      expect(mod.parseSelector(':before')).toEqual({ type: 'psuedoElement', token: 'before' });
      expect(mod.parseSelector(':after')).toEqual({ type: 'psuedoElement', token: 'after' });
    });
    it('should parse a negative psuedo-element', function() {
      expect(mod.parseSelector(':not(::before)')).toEqual({ type: 'psuedoElement', token: 'before', negative: true });
    });
    it('should parse a class', function() {
      expect(mod.parseSelector('.my-class')).toEqual({ type: 'class', token: 'my-class' });
    });
    it('should parse a negative class', function() {
      expect(mod.parseSelector(':not(.my-class)')).toEqual({ type: 'class', token: 'my-class', negative: true });
    });
    it('should parse a psuedo-class', function() {
      expect(mod.parseSelector(':hover')).toEqual({ type: 'psuedoClass', token: 'hover' });
    });
    it('should parse a negative psuedo-class', function() {
      expect(mod.parseSelector(':not(:hover)')).toEqual({ type: 'psuedoClass', token: 'hover', negative: true });
    });
    it('should parse an id', function() {
      expect(mod.parseSelector('#my-id')).toEqual({ type: 'id', token: 'my-id' });
    });
    it('should parse a negative id', function() {
      expect(mod.parseSelector(':not(#my-id)')).toEqual({ type: 'id', token: 'my-id', negative: true });
    });
  });


  describe('.selectorTypeFromTypeIdentifier', function() {
    it('maps identifiers to descriptions', function() {
      expect(mod.selectorTypeFromTypeIdentifier('*')).toEqual('universal');
      expect(mod.selectorTypeFromTypeIdentifier('')).toEqual('element');
      expect(mod.selectorTypeFromTypeIdentifier('::')).toEqual('psuedoElement');
      expect(mod.selectorTypeFromTypeIdentifier('.')).toEqual('class');
      expect(mod.selectorTypeFromTypeIdentifier(':')).toEqual('psuedoClass');
      expect(mod.selectorTypeFromTypeIdentifier('#')).toEqual('id');
    });
  });


  describe('.selectorSpecificity', function() {
    it('should weight the universal selector as zero', function() {
      expect(mod.selectorSpecificity('*')).toEqual(0);
    });
    it('should weight elements as 1', function() {
      expect(mod.selectorSpecificity('div')).toEqual(1);
      expect(mod.selectorSpecificity('body div')).toEqual(2);
      expect(mod.selectorSpecificity('div table tr thead td')).toEqual(5);
    });
    it('should weight pseudo-elements as 1', function() {
      expect(mod.selectorSpecificity('::before')).toEqual(1);
      expect(mod.selectorSpecificity('::before ::after')).toEqual(2);
    });
    it('should weight classes as 256', function() {
      expect(mod.selectorSpecificity('.class-one')).toEqual(256);
      expect(mod.selectorSpecificity('.class-one.class-two')).toEqual(256 * 2);
      expect(mod.selectorSpecificity('.class-one .class-two')).toEqual(256 * 2);
    });
    it('should weight psuedo-classes as 256', function() {
      expect(mod.selectorSpecificity(':hover')).toEqual(256);
      expect(mod.selectorSpecificity(':hover:visited')).toEqual(256 * 2);
      expect(mod.selectorSpecificity(':focus :hover')).toEqual(256 * 2);
    });
    it('should weight ids as 256^2', function() {
      expect(mod.selectorSpecificity('#id1')).toEqual(256 * 256);
      expect(mod.selectorSpecificity('#id1#id2')).toEqual(256 * 256 * 2);
      expect(mod.selectorSpecificity('#id1 #id2')).toEqual(256 * 256 * 2);
    });
    it('should handle mixed selectors in the same clause', function() {
      expect(mod.selectorSpecificity('td#id1:hover.class')).toEqual(1 + (256 * 256) + 256 + 256);
    });
    it('should handle mixed selector in different clauses', function() {
      expect(mod.selectorSpecificity('td #id1 :hover .class')).toEqual(1 + (256 * 256) + 256 + 256);
    });
    it('should weight inline styling as 256^3', function() {
      expect(mod.selectorSpecificity(null, true)).toEqual(256 * 256 * 256);
    });
    it('should weight !important as 256^4', function() {
      expect(mod.selectorSpecificity(null, false, true)).toEqual(256 * 256 * 256 * 256);
      expect(mod.selectorSpecificity('div', false, true)).toEqual(1 + (256 * 256 * 256 * 256));
    });
  });

});

