process.env.NODE_ENV = 'test';

var should         = require('chai').should(),
    simple         = require('simple-mock'),
    parser         = require('../../index'),
    fs             = require('fs'),
    HAML           = require('hamljs'),
    preprocess     = parser.preprocess,
    preprocessFile = parser.preprocessFile,
    preprocessLine = parser._private.preprocessLine;

describe('#preprocess', function() {
  it('passes a simple class through unchanged', function() {
    preprocess(".testing").should.equal(".testing");
  });
  it('passes SASS through unchanged', function() {
    var sass = "#element\n\tdisplay: none\n\t&.active\n\t\tdisplay: absolute";
    preprocess(sass).should.equal(sass);
  });
  it('converts describe clauses to SASS classes', function() {
    preprocess("#element\n\tdescribe my element   \n\t\tdisplay: absolute").should
        .equal("#element\n\t&.-describe-my-element\n\t\tdisplay: absolute");
  });

  describe('containing HAML', function() {
    it('processes a HAML template into a variable', function() {
      preprocess("\t$fixture =\n\t\t#some.element hi").should
          .equal("\t$fixture : '<div id=\"some\" class=\"element\">hi</div>'");
    });
    it('processes a HAML template into an attribute', function() {
      preprocess(" content =\n  %span.element").should
          .equal(" content : '<span class=\"element\"></span>'");
    });
    it('processes multiline HAML', function() {
      preprocess("$fixture =\n  #outer\n    .inner").should
          .equal("$fixture : '<div id=\"outer\"> <div class=\"inner\"></div></div>'");
    });
    it('escapes single quotes in HAML', function() {
      preprocess("$haml=\n %a 'link'").should
          .equal("$haml: '<a>\\'link\\'</a>'");
    });
    it('processes HAML followed by SASS', function() {
      preprocess("$haml=\n %a link\n.sass-class").should
          .equal("$haml: '<a>link</a>'\n.sass-class");
    });
    it('processes HAML followed by CSSpec', function() {
      preprocess("\t$haml=\n\t\t%a x\n\tdescribe something").should
          .equal("\t$haml: '<a>x</a>'\n\t&.-describe-something");
    });
    it('processes HAML following SASS', function() {
      preprocess(".item\n\t$img =\n\t\t%img").should
          .equal(".item\n\t$img : '<img/>'");
    });
    it('ports trailing comments into SASS');
  });
});

describe('#preprocessLine', function() {
  it('leaves a simple class unchanged', function() {
    preprocessLine(".testing").should.equal(".testing");
  });
  it('leaves a compound selector unchanged', function() {
    var sass = 'td#thing.state:hover'
    preprocessLine(sass).should.equal(sass);
  });
  it('converts grouping scopes', function() {
    preprocessLine("\tdescribe my element  ").should.equal("\t&.-describe-my-element");
  });
  it('omits the parent selector & on root-level grouping scopes', function() {
    preprocessLine("describe my root level element  ").should.equal(".-describe-my-root-level-element");
  });
  it('converts test case scopes', function() {
    preprocessLine("  IT should have a NICE little hat\t\t").should.equal("  &.-it-should-have-a-NICE-little-hat");
  });
  it('converts state scopes', function() {
    preprocessLine("\t\twhen it is featured").should.equal("\t\t&.-when-it-is-featured");
  });
  it('converts state scopes defined with an id', function() {
    preprocessLine("\t\twhen #top").should.equal("\t\t&.-when-#top");
  });
  it('converts state scopes defined with a class', function() {
    preprocessLine("\t\twhen .active").should.equal("\t\t&.-when-.active");
  });
  it('converts state scopes defined with more than one class', function() {
    preprocessLine("\t\twhen .active.top").should.equal("\t\t&.-when-.active.-when-.top");
  });
  it('converts state scopes defined with a text description and a class', function() {
    preprocessLine("\t\twhen activated -> .active").should.equal("\t\t&.-when-activated-.active");
  });
  it('converts state scopes defined with a text description and multiple classes', function() {
    preprocessLine("\t\twhen activated -> .active.xx").should.equal("\t\t&.-when-activated-.active.-when-.xx");
  });
  it('maintains trailing whitespace and comments', function() {
    preprocessLine(".testing\t// c ").should.equal(".testing\t// c ");
    preprocessLine("\tdescribe my element  // c").should.equal("\t&.-describe-my-element  // c");
    preprocessLine("  it must\t\t// c\t").should.equal("  &.-it-must\t\t// c\t");
    preprocessLine("\twhen featured//c").should.equal("\t&.-when-featured//c");
    preprocessLine("\twhen #bottom //\tc\t").should.equal("\t&.-when-#bottom //\tc\t");
    preprocessLine("\twhen .stop ///").should.equal("\t&.-when-.stop ///");
    preprocessLine("\twhen go -> .go-cls // comment").should.equal("\t&.-when-go-.go-cls // comment");
  });
  it('works around scope declaration trailing comment issue'); // SASS errors when a scope line ending with a comment is followed by a property declaration
  describe('inline custom attribute JavaScript', function() {
    it('converts Javascript follow a -> to a string', function() {
      preprocessLine("\tcustom-attr -> return '#fff'").should.equal("\t-fn-custom-attr: \"return '#fff'\"");
    });
    it('escapes double quotes', function() {
      preprocessLine('black -> return "#000"').should.equal('-fn-black: "return \\"#000\\""');
    });
  });
});

describe('hamljs', function() {
  it('should compile HAML', function() {
    HAML.render('%td.cell#excellent1 hello').trim().should
        .equal('<td id="excellent1" class="cell">hello</td>');
  });
});

describe('#preprocessFile', function() {
  it('should process a source file into a dest file through #preprocessor', function() {
    var exists  = simple.mock(fs, 'existsSync').returnWith(true),
        read    = simple.mock(fs, 'readFileSync').returnWith('.csspec'),
        write   = simple.mock(fs, 'writeFileSync', simple.stub());

    preprocessFile('source', 'dest');

    read.lastCall.args[0].should.equal('source');
    write.lastCall.args[0].should.equal('dest');
    write.lastCall.args[1].should.equal('.csspec');

    simple.restore();
  });
});

