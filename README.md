CSSpec
======

This is a pre-release WIP. 

CSSpec is a supersyntax of SASS which compiles to SASS/CSS and implements nested descriptions and test cases for CSS client-side unit and integration tests. CSSpec is syntactic sugar and all features of CSSpec test runners are codeable directly in SASS, SCSS, or CSS.

HAML can be used inline to generate client-side markup and can also be assigned to SASS variables.

See https://github.com/cjkula/csspec-angular for a sample integration into an AngularJS application.

Usage
-----

    npm install csspec --save-dev

Exposed methods: 

`preprocess(csspec)` parses CSSpec into its SASS equivalent.

`preprocessFile(source, dest)` does the same for files with fully-qualified pathnames.

For Grunt-enabled package use:

    npm install grunt-csspec --save-dev

See that project's docs for Gruntfile configuration.

Note that SASS compilation is not currently bundled into the package and so should be automated to run following CSSpec preprocessing.

Syntax
------

Define what element(s) you are querying with SASS nested structure. Group tests with `describe`, and group expectations with `it ...`. Force the application or removal of classes, ids, and psuedo-states with `when`. Create fixture markup with a line-terminating equal sign followed by HAML (which can also include inline HTML).

    $fixture =
      .feature test

    describe my feature
      content: $fixture
      .feature
        describe by default
          it should not be displayed
            display: none
        when activated -> .active
          it should be displayed
            display: block

This compiles to:

    $fixture = '<div class"feature">test</div>'
    
    &.-describe-my-feature
      content: $fixture
      .feature
        &.-describe-by-default
          &.-it-should-not-be-displayed
            display: none
        &.-when-activated-.active
          &.-it-should-be-displayed
            display: block

Vision
------

CSSpec leverages existing SASS/CSS (plus a dash of HAML) tools to deliver a browser-parseable test suite built on the same structural abstractions as CSS -- because it is coded in CSS itself. By adopting CSS as the abstract test framework, CSSpec also aims to provide a tool that is understandable and useable by those who already work comfortably in that language.

By bringing coded specifications and automated regression testing to stylesheet development workflow, modularity and refactoring becomes more practical and achievable, and at the same time opens up the possibility that styling issues can be managed primarily in the style layer, freeing up HTML to be a cleaner semantic representation of underlying content.

But Who Will Test the Testers
-----------------------------

Test-runner tests: `npm test`
Compiler tests: `npm run compiler-test`

License
-------

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

