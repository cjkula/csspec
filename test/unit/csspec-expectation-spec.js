'use strict';

describe('test case', function(){

  var instance = function(testCase, attribute, expected) {
    return new CSSpec.Expectation(
                  testCase  || new CSSpec.TestCase('.some-class', { selectorText: ('.some-class'), style: [] }), 
                  attribute || 'attribute',
                  expected  || 'expected'
               );
  }

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
    describe('a caret selector', function() {
      it('alone should find all selector parents');
      it('should find a preceeding selector', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a #c', '^#a')).toEqual(['a']);
      });
      it('should find multiple matches of a preceeding selector', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('div div div', '^div')).toEqual(['b', 'a']);
      });
      it('should find a twice preceeding selector', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a div div', '^#a')).toEqual(['a']);
      });
      it('should find a preceeding compound selector');
      it('should find a preceeding immediate descendent compound selector');
      it('should find a preceeding adjacent sibling compound selector');
      it('should find a preceeding general sibling compound selector');
      it('should find a cousin decendent of a selector parent');
      it('should find <body> and <html>');
      it('should find a cousin decendent of body');
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
    describe('a double ampersand', function() {
      it('should find a parent selector element', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('#a #c', '&&')).toEqual(['a']);
      });
      it('should find multiple parent selector elements', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('div #c', '&&')).toEqual(['b', 'a']);
      });
      it('should find the parent of a selector immediate descendant', function() {
        $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
        expect(selectorsToIds('div > #c', '&&')).toEqual(['b']);
      });
      it('should find the selector preceeding adjacent sibling', function() {
        $el = $('<div id="a"></div><div id="b"></div><div id="c"></div>').appendTo('body');
        expect(selectorsToIds('div + #c', '&&')).toEqual(['b']);
      });
      it('should find the selector preceeding general siblings', function() {
        $el = $('<div><div id="a"></div><div id="b"></div><div id="c"></div></div>').appendTo('body');
        expect(selectorsToIds('div ~ #c', '&&')).toEqual(['b', 'a']);
      });
      describe('qualified by additional selectors', function() {
        it('should find a parent selector element', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div #c', '&&#a')).toEqual(['a']);
        });
        it('should find multiple parent selector elements', function() {
          $el = $('<div id="a" class="x"><div id="b" class="x"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div #c', '&&.x')).toEqual(['b', 'a']);
        });
        it('should find no parent selector elements', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div #c', '&&#c')).toEqual([]);
        });
        it('should find the parent of a selector immediate descendant', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div > #c', '&&#b')).toEqual(['b']);
        });
        it('should not find the parent of a selector immediate descendant if fails qualifications', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('div > #c', '&&#a')).toEqual([]);
        });
        it('should find the selector preceeding adjacent sibling', function() {
          $el = $('<div id="a"></div><div id="b"></div><div id="c"></div>').appendTo('body');
          expect(selectorsToIds('div + #c', '&&div#b')).toEqual(['b']);
        });
        it('should find the selector preceeding adjacent sibling if fails qualifications', function() {
          $el = $('<div id="a"></div><div id="b"></div><div id="c"></div>').appendTo('body');
          expect(selectorsToIds('div + #c', '&&#a')).toEqual([]);
        });
        it('should find the selector preceeding general siblings', function() {
          $el = $('<div><div id="a"></div><div id="b"></div><div id="c"></div></div>').appendTo('body');
          expect(selectorsToIds('div ~ #c', '&&div')).toEqual(['b', 'a']);
        });
        it('should only find selector preceeding general siblings that match qualifications', function() {
          $el = $('<div><div id="a" class="x"></div><div id="b"></div><div id="c"></div></div>').appendTo('body');
          expect(selectorsToIds('div ~ #c', '&&.x')).toEqual(['a']);
        });
      });
      describe('with cousin descendents', function() {
        it('should find a cousin by class', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div><div id="d" class="cousin"></div></div>').appendTo('body');
          expect(selectorsToIds('#a #c', '&& .cousin')).toEqual(['d']);
        });
      });
      describe('multiple ampersands', function() {
        it('should find the next parent selector elements', function() {
          $el = $('<div id="a"><div id="b"><div id="c"></div></div></div>').appendTo('body');
          expect(selectorsToIds('#a div #c', '&&&')).toEqual(['a']);
        });
        it('should find a parent with additional selection filtering');
        it('should find the parent of a selector immediate descendant');
        it('should find the selector preceeding adjacent sibling');
        it('should find the selector preceeding general siblings');
      });
    });
  });

});
