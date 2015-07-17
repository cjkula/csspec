'use strict';

describe('test case', function(){

  var instance = function(selector, cssRule) {
    return new CSSpec.TestCase(selector, cssRule);
  }


  describe('new', function() {
    it('should split the selector into element clauses', function() {
      var testCase = instance('#first-clause .second-clause.-it-is-a-thing');
      expect(testCase.clauses).toEqual(['#first-clause', '.second-clause.-it-is-a-thing']);
    });
    it('keeps a reference to the rule', function() {
      var rule = { selectorText: '.selector, .other' },
          testCase = instance('.selector', rule);
      expect(testCase.cssRule).toBe(rule);
    });
  });


  describe('#exec', function() {
    var testCase;
    beforeEach(function() {
      testCase = instance('.element', { style: [] });
    });
    it('should clear the failures log object', function() {
      testCase.failures = ['something to clear'];
      testCase.exec();
      expect(testCase.failures).toEqual([]);
    });
    it('should set the result to "pending" if there are no expectations', function() {
      testCase.exec();
      expect(testCase.result).toEqual('pending');
    });
    it('should evalute expectations with #testTarget', function() {
      testCase.cssRule = { style: ['position'] };
      spyOn(testCase, 'testTarget').and.returnValue('RESULT');
      testCase.exec();
      expect(testCase.testTarget.calls.argsFor(0)[0]).toEqual(['position']);
      expect(testCase.result).toEqual('RESULT');
    });
  });


  describe('#testTarget', function() {
    var testCase;
    beforeEach(function() {
      testCase = instance('.element', { style: [] });
    });
    it('should set the target by applying the clauses to the fixture', function() {
      spyOn(testCase, 'applyClauses').and.returnValue(['TARGET']);
      spyOn(testCase, 'targetMeetsExpectations');
      testCase.testTarget(['property']);
      expect(testCase.applyClauses).toHaveBeenCalled();
      expect(testCase.$target).toEqual(['TARGET']);
    });
    it('should return "inapplicable" if target is empty', function() {
      spyOn(testCase, 'applyClauses').and.returnValue([]);
      expect(testCase.testTarget(['property'])).toEqual('inapplicable');
    });
    it('should return "pass" if #targetMeetsExpectations', function() {
      spyOn(testCase, 'applyClauses').and.returnValue(['TARGET']);
      spyOn(testCase, 'targetMeetsExpectations').and.returnValue(true);
      expect(testCase.testTarget(['property'])).toEqual('pass');
    });
    it('should return "fail" if !#targetMeetsExpectations', function() {
      spyOn(testCase, 'applyClauses').and.returnValue(['TARGET']);
      spyOn(testCase, 'targetMeetsExpectations').and.returnValue(false);
      expect(testCase.testTarget(['property'])).toEqual('fail');
    });
  });


  describe('#applyClauses', function() {
    var $fixture = $('<div id="fixture" />');
    $('#fixture').remove(); // clean up
    $fixture.appendTo('body');

    function target(selector) {
      return instance(selector, {}).applyClauses($fixture);
    }
    // Applies CSS properties with an inline stylesheet executes a callback
    // to run tests and finally deletes the <style> block. The second argument
    // is used to provide different specificity for the element selection.
    function styleTarget(styleSelector, targetSelector, properties, callback) {
      var key, propLines = [], $styleTag, $target;
      for (key in properties) {
        propLines.push(key + ': '  + properties[key]);
      }
      $styleTag = $("<style> " + styleSelector + ' { ' + propLines.join('; ')  + " } </style>");
      $("head").append($styleTag);
      $target = target(targetSelector || styleSelector);
      if (callback) callback.call(this, $target);
      $styleTag.remove();
      return $target;
    }
    function idsFromSelector(selector) {
      return $.map(target(selector), function(el) { return $(el).attr('id') });
    }

    describe('selected by class and id' ,function() {
      beforeEach(function() {
        $fixture.html('<div id="element1" class="single multiple"><span id="inner1" class="inner"></span></div><div id="element2" class="multiple"></div>');
      });
      it('should select an element by class', function() {
        expect(idsFromSelector('.single')).toEqual(['element1']);
      });
      it('should select an element by multiple classes', function() {
        expect(idsFromSelector('.single.multiple')).toEqual(['element1']);
      });
      it('should select a nested element by class', function() {
        expect(idsFromSelector('.single .inner')).toEqual(['inner1']);
      });
      it('should select multiple elements by class', function() {
        expect(idsFromSelector('.multiple')).toEqual(['element1', 'element2']);
      });
      it('should select an element by id', function() {
        expect(idsFromSelector('#element1')).toEqual(['element1']);
      });
      it('should select a nested element by id', function() {
        expect(idsFromSelector('#element1 #inner1')).toEqual(['inner1']);
      });
      it('should select elements by class and id', function() {
        expect(idsFromSelector('.single#element1')).toEqual(['element1']);
        expect(idsFromSelector('.single #inner1')).toEqual(['inner1']);
        expect(idsFromSelector('#element1 .inner')).toEqual(['inner1']);
      });
      it('should select by negative class', function() {
        expect(idsFromSelector('.multiple:not(.single)')).toEqual(['element2']);
      });
      it('should select by negative id', function() {
        expect(idsFromSelector('.multiple:not(#element2)')).toEqual(['element1']);
      });
    });

    describe('with -describe- classes' ,function() {
      beforeEach(function() {
        $fixture.attr('class', '');
        $fixture.html('<div id="element1" class="single multiple"><span id="inner1" class="inner"></span></div><div id="element2" class="multiple"></div>');
      });
      it('should add first-clause unqualified -describe- classes directly to the fixture', function() {
        expect(idsFromSelector('.-describe-this')).toEqual(['fixture'])
        expect($fixture.hasClass('-describe-this')).toBe(true);
      });
      it('should add first-clause nested -describe- classes directly to the fixture', function() {
        target('.-describe-this.-describe-that');
        expect($fixture.hasClass('-describe-this')).toBe(true);
        expect($fixture.hasClass('-describe-that')).toBe(true);
      });
      it('should add qualified -describe- classes to an element inside of fixture', function() {
        target('#inner1.-describe-this');
        expect($fixture.hasClass('-describe-this')).toBe(false);
        expect($fixture.find('#inner1').hasClass('-describe-this')).toBe(true);
      });
      it('should add qualified -describe- classes to multiple elements inside of fixture', function() {
        target('.multiple.-describe-this');
        expect($fixture.find('#element1').hasClass('-describe-this')).toBe(true);
        expect($fixture.find('#element2').hasClass('-describe-this')).toBe(true);
      });
    });

    describe('with -describe- classes including :content' ,function() {
      beforeEach(function() {
        $fixture.attr('class', '');
      });
      it('should replace fixture html with :content', function() {
        styleTarget('.-describe-fixture', null, { content: "'FIXTURE CONTENT'" }, function() {
          expect($fixture.html()).toEqual('FIXTURE CONTENT');
        });
      });
      it('should replace element html with :content', function() {
        $fixture.html('<div class="element"></div>');
        styleTarget('.element.-describe-element', null, { content: "'ELEMENT CONTENT'" }, function() {
          expect($fixture.find('.element').html()).toEqual('ELEMENT CONTENT');
        });
      });
      it('should replace element html with :content and select within that content', function() {
        $fixture.html('<div class="element"></div>');
        styleTarget('.element.-describe-element', '.element.-describe-element .inner', 
                                { content: "'<div id=\"e0\" class=\"inner\"></div>'" }, function($target) {
          expect($target.attr('id')).toEqual('e0');
        });
      });
      it('should replace multiple element html with :content', function() {
        $fixture.html('<div id="e1" class="multiple"></div><div id="e2" class="multiple"></div>');
        styleTarget('.multiple.-describe-multiple', null, { content: "'MULTICONTENT'" }, function() {
          expect($fixture.find('#e1').html()).toEqual('MULTICONTENT');
          expect($fixture.find('#e2').html()).toEqual('MULTICONTENT');
        });
      });
    });

    describe('including simple -when- classes' ,function() {
      beforeEach(function() {
        $fixture.attr('class', '');
        $fixture.html('<div id="element1" class="single multiple"><span id="inner1" class="inner"></span></div><div id="element2" class="multiple"></div>');
      });
      it('should add -when- class to the fixture', function() {
        expect(idsFromSelector('.-when-in-a-state')).toEqual(['fixture'])
        expect($fixture.hasClass('-when-in-a-state')).toBe(true);
      });
      it('should add -when- class to an element', function() {
        expect(idsFromSelector('.single.-when-in-a-state')).toEqual(['element1'])
        expect($fixture.hasClass('-when-in-a-state')).toBe(false);
      });
      it('should replace element html with :content', function() {
        var $style = $("<style>.-when-element { content: 'ELEMENT CONTENT' }</style>");
        $("head").append($style);
        target('.single.-when-element');
        expect($fixture.find('.single').html()).toEqual('ELEMENT CONTENT');
        $style.remove();
      });
    });

    describe('with -when- classes with selectors' ,function() {
      beforeEach(function() {
        $fixture.attr('class', '');
        $fixture.html('<div id="element1" class="single"><span id="inner1" class="inner"></span></div>');
      });
      it('should add -when- class and corresponding selector to the fixture', function() {
        expect(idsFromSelector('.-when-in-a-state-.fixture-state')).toEqual(['fixture']);
        expect($fixture.hasClass('-when-in-a-state-')).toBe(true);
        expect($fixture.hasClass('fixture-state')).toBe(true);
      });
      it('should add -when- class and attached class to element', function() {
        target('.single.-when-in-a-state-.activate');
        expect($fixture.find('.single').hasClass('-when-in-a-state-')).toBe(true);
        expect($fixture.find('.single').hasClass('activate')).toBe(true);
      });
      it('should add -when- class and id to element', function() {
        target('.single.-when-in-a-state-#newID');
        expect($fixture.find('.single').attr('id')).toEqual('newID');
      });
      it('should add -when- class and remove negative class from element', function() {
        target('#element1.-when-not-single-:not(.single)');
        expect($fixture.find('#element1').hasClass('single')).toBe(false);
      });
      it('should add -when- class and remove negative id from element', function() {
        target('.single.-when-unidentified-:not(#element1)');
        expect($fixture.find('.single').attr('id')).toEqual('');
      });
      it('should add -when- class and multiple attached classes to an element', function() {
        target('#inner1.-when-in-a-state-.activate.-when-.featured');
        expect($fixture.find('#inner1').hasClass('-when-in-a-state-')).toBe(true);
        expect($fixture.find('#inner1').hasClass('activate')).toBe(true);
        expect($fixture.find('#inner1').hasClass('featured')).toBe(true);
      });
    });

    describe('with -when- classes including :content' ,function() {
      beforeEach(function() {
        $fixture.attr('class', '');
      });
      it('should replace fixture html with :content', function() {
        styleTarget('.-when-fixture', null, { content: "'FIXTURE CONTENT'" }, function() {
          expect($fixture.html()).toEqual('FIXTURE CONTENT');
        });
      });
      it('should replace element html with :content', function() {
        $fixture.html('<div class="element"></div>');
        styleTarget('.element.-when-element', null, { content: "'ELEMENT CONTENT'" }, function() {
          expect($fixture.find('.element').html()).toEqual('ELEMENT CONTENT');
        });
      });
      it('should add an attached class and replace html with :content', function() {
        $fixture.html('<div class="element"></div>');
        styleTarget('.element.-when-state-.state', null, { content: "'STATE CONTENT'" }, function() {
          expect($fixture.find('.element').html()).toEqual('STATE CONTENT');
        });
      });
      it('should replace multiple element html with :content', function() {
        $fixture.html('<div id="e1" class="multiple"></div><div id="e2" class="multiple"></div>');
        styleTarget('.multiple.-when-multiple', null, { content: "'MULTICONTENT'" }, function() {
          expect($fixture.find('#e1').html()).toEqual('MULTICONTENT');
          expect($fixture.find('#e2').html()).toEqual('MULTICONTENT');
        });
      });
    });

  });

  describe('#targetMeetsExpectations', function() {
    var testCase;
    beforeEach(function() {
      testCase = instance('.element', {});
    });
    it('should check each expectation', function() {
      var expectations = ['first', 'second', 'third'];
      expectations.first = 'one';
      expectations.second = 'two';
      expectations.third = 'three';
      testCase.$target = ['t'];
      spyOn(testCase, 'meetsExpectation').and.returnValue(true);
      testCase.targetMeetsExpectations(expectations);
      expect(testCase.meetsExpectation.calls.argsFor(0)).toEqual([['t'], 'first', 'one']);
    });
    it('should return true if all expectations pass', function() {
      var expectations = ['first', 'second'];
      expectations.first = 'one';
      expectations.second = 'two';
      spyOn(testCase, 'meetsExpectation').and.returnValue(true);
      expect(testCase.targetMeetsExpectations(expectations)).toEqual(true);
    });
    it('should return false if an expectation fails', function() {
      var expectations = ['first', 'second'],
          alreadyCalled = false;
      expectations.first = 'one';
      expectations.second = 'two';
      spyOn(testCase, 'meetsExpectation').and.callFake(function() {
        if (alreadyCalled) return false;
        alreadyCalled = true;
        return true;
      });
      expect(testCase.targetMeetsExpectations(expectations)).toEqual(false);
    });
  });


  describe('#applyContent', function() {
    var testCase, $el;
    beforeEach(function() {
      testCase = instance('.example', {});
      $el = $('<div class="element">ORIGINAL CONTENT</div>').appendTo('body');
    });
    afterEach(function() {
      $el.remove();
    });
    function contentStyle(selector, content, callback) {
      var $styleTag = $("<style> " + selector + ' { content: \'' + content + "'; } </style>");
      $("head").append($styleTag);
      callback();
      $styleTag.remove();
    }
    it('should replace the content of an element with the :content', function() {
      contentStyle('.element', 'NEW CONTENT', function() {
        expect($el.html()).toEqual('ORIGINAL CONTENT');
        testCase.applyContent($el);
        expect($el.html()).toEqual('NEW CONTENT');
      });
    });
    it('should not replace the content of an element if no :content attribute', function() {
      testCase.applyContent($el);
      expect($el.html()).toEqual('ORIGINAL CONTENT');
    });
    it('should push a revert method', function() {
      contentStyle('.element', 'NEW CONTENT', function() {
        testCase.rollbackStack = [];
        testCase.applyContent($el);
        expect($el.html()).toEqual('NEW CONTENT');
        testCase.rollbackStack[0]();
        expect($el.html()).toEqual('ORIGINAL CONTENT');        
      });
    });
    it('should not change content or push a revert method if new content matches old', function() {
      $el.html('SAME CONTENT');
      contentStyle('.element', 'SAME CONTENT', function() {
        testCase.rollbackStack = [];
        testCase.applyContent($el);
        expect($el.html()).toEqual('SAME CONTENT');   
        expect(testCase.rollbackStack.length).toBe(0);     
      });
    });
  });


  // tests after refactor
  describe('#applyClauseSelectors', function() {
  });


  // tests after refactor
  describe('#applyQueues', function() {
  });


  describe('#applySelectors', function() {
    var calls, testCase = instance('.example', {});
    it('should apply each selector', function() {
      spyOn(testCase, 'applySelector');
      testCase.applySelectors(['#id', '.class'], $('<div />'));
      expect(testCase.applySelector.calls.argsFor(0)[0]).toEqual('#id');
      expect(testCase.applySelector.calls.argsFor(1)[0]).toEqual('.class');
    });
  });


  describe('#applySelector', function() {
    var testCase, $el = $('<div />');
    beforeEach(function() {
      testCase = instance('.example', {});
      spyOn(testCase, 'applyClass');
      spyOn(testCase, 'applyId');
    });
    it('should apply a class', function() {
      testCase.applySelector('.someclass', $el);
      expect(testCase.applyClass.calls.argsFor(0)).toEqual([$el, 'someclass']);
    });
    it('should apply an id', function() {
      testCase.applySelector('#someid', $el);
      expect(testCase.applyId.calls.argsFor(0)).toEqual([$el, 'someid']);
    });
    it('should remove a negative class', function() {
      testCase.applySelector(':not(.someclass)', $el);
      expect(testCase.applyClass.calls.argsFor(0)).toEqual([$el, 'someclass', true]);
    });
    it('should remove a negative id', function() {
      testCase.applySelector(':not(#someid)', $el);
      expect(testCase.applyId.calls.argsFor(0)).toEqual([$el, 'someid', true]);
    });
  });

  describe('#applyClass', function() {
    it('should add a class to the element and push a revert function', function() {
      var testCase = instance('.example', {}), 
          $el = $('<div />');
      testCase.rollbackStack = [];
      testCase.applyClass($el, 'my-class');
      expect($el.hasClass('my-class')).toBe(true);
      testCase.rollbackStack[0]();
      expect($el.hasClass('my-class')).toBe(false);      
    });
    it('should remove a class from the element and push a revert function', function() {
      var testCase = instance('.example', {}), 
          $el = $('<div class="remove-this" />');
      testCase.rollbackStack = [];
      testCase.applyClass($el, 'remove-this', true);
      expect($el.hasClass('remove-this')).toBe(false);
      testCase.rollbackStack[0]();
      expect($el.hasClass('remove-this')).toBe(true);      
    });
    it('should not remove a class from the element if not present', function() {
      var testCase = instance('.example', {}), 
          $el = $('<div class="do-not-remove-this" />');
      testCase.rollbackStack = [];
      testCase.applyClass($el, 'remove-this', true);
      expect($el.hasClass('do-not-remove-this')).toBe(true);
      expect(testCase.rollbackStack.length).toEqual(0);
    });
  });


  describe('#applyId', function() {
    it('should change the element ID and push a revert function', function() {
      var testCase = instance('.example', {}), 
          $el = $('<div id="original" />');
      testCase.rollbackStack = [];
      testCase.applyId($el, 'new');
      expect($el.attr('id')).toEqual('new');
      testCase.rollbackStack[0]();
      expect($el.attr('id')).toEqual('original');
    });
    it('should remove the element ID and push a revert function', function() {
      var testCase = instance('.example', {}),
          $el = $('<div id="original" />');
      testCase.rollbackStack = [];
      testCase.applyId($el, 'original', true);
      expect($el.attr('id')).toEqual('');
      testCase.rollbackStack[0]();
      expect($el.attr('id')).toEqual('original');
    });
    it('should not remove the ID if does present', function() {
      var testCase = instance('.example', {}),
          $el = $('<div id="original" />');
      testCase.rollbackStack = [];
      testCase.applyId($el, 'another', true);
      expect($el.attr('id')).toEqual('original');
      expect(testCase.rollbackStack.length).toEqual(0);
    });
  });


  describe('#revert', function() {
    var testCase = instance('.example', {}),
        sampleFunc = function(myfunc) {};
    it('should create rollbackStack if necessary', function() {
      testCase.rollbackStack = null;
      testCase.revert(sampleFunc);
      expect(testCase.rollbackStack).toEqual([sampleFunc]);
    });
    it('should append a function to the stack', function() {
      testCase.rollbackStack = [ function(otherFunc){} ];
      testCase.revert(sampleFunc);
      expect(testCase.rollbackStack[1]).toEqual(sampleFunc);
    });
  });


  describe('#revertAfter', function() {
    var testCase = instance('.example', {});
    it('should clear the rollback stack', function() {
      testCase.rollbackStack = ['not empty'];
      testCase.revertAfter(function() {
        expect(testCase.rollbackStack).toEqual([]);
      });
    });
    it('should call the callback with the instance context', function() {
      testCase.revertAfter(function() {
        expect(this).toBe(testCase);
      });
    });
    it('should call the rollback functions', function() {
      var fn = {
        one: function() {},
        two: function() {}
      }
      spyOn(fn, 'one');
      spyOn(fn, 'two');
      testCase.revertAfter(function() {
        this.revert(fn.one);
        this.revert(fn.two);
      });
      expect(fn.one).toHaveBeenCalled();
      expect(fn.two).toHaveBeenCalled();      
    });
    it('should pass through the return value from the callback function', function() {
      var result = testCase.revertAfter(function() {
        return 'VALUE';
      });
      expect(result).toEqual('VALUE');
    });
  });


  describe('#meetsExpectation', function() {
    var testCase = instance('.example', {});
    beforeEach(function() {
      testCase.failures = [];
      spyOn(testCase, 'resolveAttribute').and.returnValue('resolved value');
    });
    describe('when the resolved attribute equals the expectation', function() {
      it('should return true', function() {
        expect(testCase.meetsExpectation($('<div />'), 'dummy', 'resolved value')).toBe(true);
      });
      it('should not report a failure', function() {
        testCase.meetsExpectation($('<div />'), 'dummy', 'resolved value');
        expect(testCase.failures.length).toEqual(0);
      });
    });
    describe('when the resolved attribute does not equal the expectation', function() {
      it('should return false', function() {
        expect(testCase.meetsExpectation($('<div />'), 'dummy', 'expected value')).toBe(false);
      });
      it('should report a failure', function() {
        testCase.meetsExpectation($('<div />'), 'dummy', 'expected value');
        expect(testCase.failures.length).toEqual(1);
      });
    });
  });


  // not ready for prime time
  describe('#resolveAttribute', function() {
    var testCase = instance('.example', {}),
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
    afterAll(function() {
      $el.remove();
    });
    it('should return normal CSS attributes', function() {
      expect(testCase.resolveAttribute($el, 'position')).toEqual('fixed');
      expect(testCase.resolveAttribute($el, 'margin-top')).toEqual('10px');
    });
    it('should return default CSS attributes', function() {
      expect(testCase.resolveAttribute($el, 'display')).toEqual('block');
      expect(testCase.resolveAttribute($inner, 'position')).toEqual('static');
    });
    it('should return inherited CSS attributes', function() {
      expect(testCase.resolveAttribute($inner, 'font-size')).toEqual('20px');
    });
  });


  // wait to test until karma integration is begun
  describe('#report', function() {
  });


  describe('#description', function() {
    it('should represent a group with test', function() {
      var testCase = instance('.-describe-a-thing .-it-should-do-stuff', {});
      expect(testCase.description()).toEqual('a thing should do stuff');
    });
    it('should represent nested groups with test', function() {
      var testCase = instance('.-describe-a-thing .-describe-in-its-native-habitat .-it-should-do-stuff', {});
      expect(testCase.description()).toEqual('a thing in its native habitat should do stuff');
    });
    it('should represent a group, state and test', function() {
      var testCase = instance('.-describe-a-thing.-when-properly-arranged .-it-should-do-stuff', {});
      expect(testCase.description()).toEqual('a thing properly arranged should do stuff');
    });
  });

});
