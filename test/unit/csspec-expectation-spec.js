'use strict';

describe('expectation', function(){
  var mod = CSSpec;

  var instance = function(testCase, attribute, expected) {
    return new mod.Expectation(
                  testCase  || new mod.TestCase('.some-class', { selectorText: ('.some-class'), style: [] }), 
                  attribute || 'attribute',
                  expected  || 'expected'
               );
  }

  describe('::new', function() {
    it('should initialize properties', function() {
      var testCase = new mod.TestCase('.class', { selectors: ['.class'], declarations: [] }),
          attribute = 'test-attribute',
          expected = 'expected value',
          expectation = instance(testCase, attribute, expected);
      expect(expectation.testCase).toBe(testCase);
      expect(expectation.attribute).toEqual(attribute);
      expect(expectation.expected).toEqual(expected);
    });
  });
  describe('#test', function() {
    var expectation = instance(null, null, 'expected value');
    it('should resolve the expected expression', function() {
      var $el = $('<div />');
      expectation.testCase.$target = $el;
      spyOn(expectation, 'resolveAttribute');
      spyOn(expectation, 'resolveExpression');
      expectation.test();
      expect(expectation.resolveExpression.calls.argsFor(0)).toEqual([$el, 'expected value']);
    });
    describe('when the resolved attribute equals the expectation', function() {
      beforeEach(function() {
        spyOn(expectation, 'resolveAttribute').and.returnValue('expected value');
      });
      it('should return true', function() {
        expect(expectation.test()).toBe(true);
      });
      it('should not report a failure', function() {
        expectation.test();
        expect(expectation.error).toBe(undefined);
      });
    });
    describe('when the resolved attribute does not equal the expectation', function() {
      beforeEach(function() {
        spyOn(expectation, 'resolveAttribute').and.returnValue('unexpected value');
      });
      it('should return false', function() {
        expect(expectation.test()).toBe(false);
      });
      it('should report a failure', function() {
        expectation.test();
        expect(expectation.error).not.toBe(null);
      });
    });
  });

  describe('#resolveAttribute', function() {
    var expectation = instance(),
        $el = $('<div />', {
          css: {
            position     : 'fixed',
            'margin-top' : '10px',
            'font-size'  : '20px'
          }
        }),
        $inner = $('<div id="inner" />');
        $('body').append($el);
        $($el).append($inner);
    afterAll(function() { $el.remove();});
    it('should return custom attributes', function() {
      spyOn(expectation, 'customAttribute').and.returnValue('VALUE');
      expect(expectation.resolveAttribute($el, 'position')).toEqual('VALUE');
    });
    it('should return normal CSS attributes', function() {
      expect(expectation.resolveAttribute($el, 'position')).toEqual('fixed');
      expect(expectation.resolveAttribute($el, 'margin-top')).toEqual('10px');
    });
    it('should return default CSS attributes', function() {
      expect(expectation.resolveAttribute($el, 'display')).toEqual('block');
      expect(expectation.resolveAttribute($inner, 'position')).toEqual('static');
    });
    it('should return inherited CSS attributes', function() {
      expect(expectation.resolveAttribute($inner, 'font-size')).toEqual('20px');
    });
  });

  describe('#customAttribute', function() {
    var expectation = instance();
    it('should evalute a custom attribute function defined directly the test element selector', function() {
      var styleSheet = mod.appendStyleSheet(".target { custom-attr: \"function() { return 12345 }\" }"),
          $el = $('<div />', { class: 'target' }).appendTo('body');
      expect(expectation.customAttribute($el, 'custom-attr')).toEqual(12345);
      styleSheet.remove();
      $el.remove();
    });
    xit('it should use new Function()');
    xit('it should provide access to the DOM element');
    xit('it should provide access to the jQuery-wrapped element');
    xit('it should provide access to the attribute name');
    xit('it should provide access to the Expectation object');
  });

  describe('#resolveExpression', function() {
    var expectation = instance(),
        $el = $('<div />', {
          css: { position: 'fixed' }
        }).appendTo('body');
    afterAll(function() { $el.remove();});
    it('should pass through regular CSS expressions', function() {
      expect(expectation.resolveExpression($el, 'fixed')).toEqual('fixed');
      expect(expectation.resolveExpression($el, '10px')).toEqual('10px');
    });
    it('should resolve bracketed attributes onto the target', function() {
      expect(expectation.resolveExpression($el, '[position]')).toEqual('fixed');
    });
    it('should resolve bracketed attributes onto the target', function() {
      expect(expectation.resolveExpression($el, '[position]')).toEqual('fixed');
    });
    it('should resolve bracketed attributes onto other elements', function() {
      var $other = $('<div />', { css: { display: 'inline-block' } }).appendTo('body');
      spyOn(expectation, 'resolveRelativeElement').and.returnValue($other);
      expect(expectation.resolveExpression($el, 'selector[display]')).toEqual('inline-block');
      expect(expectation.resolveExpression($el, '&[display]')).toEqual('inline-block');
      $other.remove();
    });
    it('should recognized a selector expression in parentheses', function() {
      spyOn(expectation, 'resolveRelativeElement').and.returnValue($('<div />'));
      expectation.resolveExpression($el, '(.selector)[display]');
      expect(expectation.resolveRelativeElement.calls.argsFor(0)).toEqual(['.selector', $el]);
    });
    it('should recognize a compound selector in parentheses', function() {
      spyOn(expectation, 'resolveRelativeElement').and.returnValue($('<div />'));
      expectation.resolveExpression($el, '(div.selector#thing)[display]');
      expect(expectation.resolveRelativeElement.calls.argsFor(0)).toEqual(['div.selector#thing', $el]);
    });
  });

  describe('#resolveRelativeElement', function() {
    var expectation = instance(), $el, $sel;
    afterEach(function() { $el && $el.remove();})
    function mapIds($els) { return $els.map(function() { return this.id; }).get(); }
    function selectorsToIds(ruleSelector, testSelector) { 
      return mapIds(expectation.resolveRelativeElement(testSelector, $(ruleSelector)));
    }
    describe('an identifier', function() {
      it('should select within the current element', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a', '#b')).toEqual(['b']);
        expect(selectorsToIds('#a', 'div')).toEqual(['b', 'c']);
      });
      it('should select by multiple clauses within the current element', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a', 'div div')).toEqual(['c']);
        expect(selectorsToIds('#a', 'div > div')).toEqual(['c']);
        expect(selectorsToIds('#a', '#b >div')).toEqual(['c']);
      });
    });
    describe('a caret-star selector', function() {
      xit('should find all selector parents', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a #b #c', '^*')).toEqual(['b', 'a']);
      });
      it('should find an immediately preceeding parent', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a #c', '^*#a')).toEqual(['a']);
      });
      it('should find a subset of selector parents', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a div div', '^*#a')).toEqual(['a']);
      });
      it('should find multiple matches on selector parents', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('div div div', '^*div')).toEqual(['b', 'a']);
      });
      xit('should find a preceeding compound selector', function() {
        // each element needs to be qualified as being in the parent tree
        // or the selection will encompass children as well
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a #b #c', '^*div ^*div')).toEqual(['b']);
      });
      xit('should find a preceeding immediate descendant compound selector');
      xit('should find a preceeding adjacent sibling compound selector');
      xit('should find a preceeding general sibling compound selector');
      it('should find decendents of a selector parent', function() {
        $el = $('<div id="a"><div id="b"></div><div id="c"></div></div>').appendTo('body');
        expect(selectorsToIds('#a #b', '^*div div')).toEqual(['b', 'c']);
      });
      xit('should find <body> and <html>');
      xit('should find a cousin decendent of body');
    });
    describe('an ampersand', function() {
      it('should reference the current element', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a #c', '&')).toEqual(['c']);
      });
      describe('qualified by additional selectors', function() {
        it('should reference the current element if selectors match', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('#a #c', '&#c')).toEqual(['c']);
        });
        it('should return an empty set if selectors do not match', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('#a #c', '&#a')).toEqual([]);
        });
        it('should select within the element', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('#a', '& div')).toEqual(['b', 'c']);
          expect(selectorsToIds('#a', '& > div')).toEqual(['b']);
        });
      });
    });
    describe('a caret', function() {
      it('should find the parent selector element', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a #c', '^')).toEqual(['a']);
      });
      it('should find the parent of a selector immediate descendant', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('div > #c', '^')).toEqual(['b']);
      });
      it('should find the selector preceeding adjacent sibling', function() {
        $el = $('<div id="a"></div><div id="b"></div><div id="c"></div>').appendTo('body');
        expect(selectorsToIds('div + #c', '^')).toEqual(['b']);
      });
      it('should find the selector preceeding general siblings', function() {
        $el = $('<div><div id="a"></div><div id="b"></div><div id="c"></div></div>').appendTo('body');
        expect(selectorsToIds('div ~ #c', '^')).toEqual(['b']);
      });
      describe('qualified by additional selectors', function() {
        it('should find a parent selector element', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div #c', '^#a')).toEqual(['a']);
        });
        it('should not find multiple parent selector elements', function() {
          $el = $('<div id="a" class="x"><div id="b" class="x"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div #c', '^.x')).toEqual(['b']);
        });
        it('should find no parent selector elements', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div #c', '^#c')).toEqual([]);
        });
        it('should find the parent of a selector immediate descendant', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div > #c', '^#b')).toEqual(['b']);
        });
        it('should not find the parent of a selector immediate descendant if fails qualifications', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div > #c', '^#a')).toEqual([]);
        });
        it('should find the selector preceeding adjacent sibling', function() {
          $el = $('<div id="a"></div><div id="b"></div><div id="c"></div>').appendTo('body');
          expect(selectorsToIds('div + #c', '^div#b')).toEqual(['b']);
        });
        it('should find the selector preceeding adjacent sibling if fails qualifications', function() {
          $el = $('<div id="a"></div><div id="b"></div><div id="c"></div>').appendTo('body');
          expect(selectorsToIds('div + #c', '^#a')).toEqual([]);
        });
        it('should find the selector preceeding general siblings', function() {
          $el = $('<div><div id="a"></div><div id="b"></div><div id="c"></div></div>').appendTo('body');
          expect(selectorsToIds('div ~ #c', '^div')).toEqual(['b']);
        });
        it('should only find selectors preceeding general siblings that match qualifications', function() {
          $el = $('<div><div id="a" class="x"></div><div id="b"></div><div id="c"></div></div>').appendTo('body');
          expect(selectorsToIds('div ~ #c', '^.x')).toEqual(['a']);
        });
        it('should only match elements that are in the target element\'s actual hierarchy', function() {
          $el = $('<div id="a"><div id="b"></div><div id="c"></div></div>').appendTo('body');
          expect(selectorsToIds('div #b', '^div')).toEqual(['a']);
        });
      });
      describe('with cousin descendents', function() {
        it('should find a cousin by class', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div><div id="d" class="cousin"></div></div>').appendTo('body');
          expect(selectorsToIds('#a #c', '^ .cousin')).toEqual(['d']);
        });
      });
      describe('multiple carets', function() {
        it('should find higher parent selector elements', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('#a div #c', '^^')).toEqual(['a']);
        });
        it('should find a grandparent with additional selection filtering', function() {
          $el = $('<div id="a"><div id="b"><div id="c"><div id="d"></div></div></div></div>').appendTo('body');
          expect(selectorsToIds('#a div #d', '^^#a')).toEqual(['a']);
        });
        xit('should find the parent of a selector immediate descendant');
        xit('should find the selector preceeding adjacent sibling');
        xit('should find the selector preceeding general siblings');
      });
    });
  });

});
