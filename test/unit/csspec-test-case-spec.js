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

  describe('#applyClauses', function() {
    var $fixture = $('<div id="fixture" />');
    $('#fixture').remove(); // remove any existing
    $fixture.appendTo('body');

    function target(selector) {
      return instance(selector, {}).applyClauses($fixture);
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
        var $style = $("<style>.-describe-fixture { content: 'FIXTURE CONTENT' }</style>");
        $("head").append($style);
        target('.-describe-fixture');
        expect($fixture.html()).toEqual('FIXTURE CONTENT');
        $style.remove();
      });
      it('should replace element html with :content', function() {
        var $style = $("<style>.-describe-element { content: 'ELEMENT CONTENT' }</style>");
        $fixture.html('<div class="element"></div>');
        $("head").append($style);
        target('.element.-describe-element');
        expect($fixture.find('.element').html()).toEqual('ELEMENT CONTENT');
        $style.remove();
      });
      it('should replace element html with :content and select within that content', function() {
        var $style = $("<style>.-describe-element { content: '<div id=\"e0\" class=\"inner\"></div>' }</style>");
        $fixture.html('<div class="element"></div>');
        $("head").append($style);
        target('.element.-describe-element .inner');
        expect($fixture.find('.element .inner').attr('id')).toEqual('e0');
        $style.remove();
      });
      it('should replace multiple element html with :content', function() {
        var $style = $("<style>.-describe-multiple { content: 'MULTICONTENT' }</style>");
        $fixture.html('<div id="e1" class="multiple"></div><div id="e2" class="multiple"></div>');
        $("head").append($style);
        target('.multiple.-describe-multiple');
        expect($fixture.find('#e1').html()).toEqual('MULTICONTENT');
        expect($fixture.find('#e2').html()).toEqual('MULTICONTENT');
        $style.remove();
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

  });

});
