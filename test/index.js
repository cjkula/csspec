var should         = require('chai').should(),
    simple         = require('simple-mock'),
    parser         = new (require('../index'))({ registerMultiTask: simple.stub() }),
    fs             = require('fs'),
    HAML           = require('hamljs'),
    preprocess     = parser.preprocess,
    preprocessLine = parser.preprocessLine,
    preprocessFile = parser.preprocessFile;



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
  it('converts test case scopes', function() {
    preprocessLine("  IT should have a NICE little hat\t\t").should.equal("  &.-it-should-have-a-NICE-little-hat");
  });
  it('converts state scopes', function() {
    preprocessLine("\t\twhen it is featured").should.equal("\t\t&.-when-it-is-featured");
  });
  it('converts state scopes defined with an id', function() {
    preprocessLine("\t\twhen #top").should.equal("\t\t&.-when-has-id-top#top");
  });
  it('converts state scopes defined with a class', function() {
    preprocessLine("\t\twhen .active").should.equal("\t\t&.-when-has-class-active.active");
  });
  it('converts state scopes defined with a class and a text description', function() {
    preprocessLine("\t\twhen activated -> .active").should.equal("\t\t&.-when-activated.active");
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

    read.lastCall.args[0].should.match(/\/source$/);
    write.lastCall.args[0].should.match(/\/dest$/);
    write.lastCall.args[1].should.equal('.csspec');

    simple.restore();
  });
});

