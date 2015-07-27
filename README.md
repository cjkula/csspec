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
    
    $fixture : '<div class="feature">test</div>'

    .-describe-my-feature
      content: $fixture
      .feature
        &.-describe-by-default
          &.-it-should-not-be-displayed
            display: none
        &.-when-activated-.active
          &.-it-should-be-displayed
            display: block

The resulting two tests, "my feature by default should not be displayed" and "my feature when activated should be displayed", are tested comparing the actual DOM element properties to the expectations defined inside each -it- clause.

### Testing Against Attributes and Elements

Right-hand expressions inside of -it- blocks can evaluate other attributes of the target element, its children, its selector parents, or cousins (which provides access to the full document).

    describe my nested boxes
      .parent-box
        .child-box
          it should be square
            height: [width]
          it should inherit text color
            color: ^[color]
          it should correspond in text alignment of its first child
            text-align: ::first-child[text-align]
          it should match the dimensions of its siblings
            height: (^ > *)[height]
            width: (^ > *)[width]
          it should have the same font as the document
            font: ^body[font]

* Without a ^ operator the selector is applied on or within the current element. & is the self operator: essentially the same as above, so not needed except to clarify syntax or to qualify the current element in order to skip undesired test cases (probably not the best practice -- better to qualify the case from its CSSpec context).
* ^ gets the closest _selector_ parent (not DOM parent) which matches the rest of the selector.
* ^^ is similar to ^ but skips the immediate selector parent. ^^^ skips past the grandparent, etc.
* ^* represents all selector parents.

### Custom Attributes

Use the -> operator in CSSpec to declare a JavaScript function which will evaluate like a regular element attribute. Custom attributes can be used as the attribute name, i.e. before the colon, or in the right-hand expression using the above bracket notation [], and can therefore also refer to custom attributes on other elements using the above selectors.

    describe element comparison
      content =
        .first-el
        .second-el
      offset-top -> return $el.offset().top
      .first-el + .second-el
        it should be vertically top-aligned with the previous element
          offset-top: "^[offset-top]"

In SASS/CSS, function attributes are namespaced with the -fn- prefix. The above -> declaration parses to the following SASS:

    -fn-offset-top: "return $el.offset().top"

The snippet has access to:

* this: the DOM element (as in jQuery)
* $el: the jQuery-wrapped element
* attribute: the name of the custom attribute being called (to allow for future wildcard attributes)
* expectation: the internal oject running the test, enabling access to much of the CSSpec internal context
* $: the jQuery object
* _: the Underscore object

Note that the above interface is in flux, and will probably be wrapped up differently once CoffeeScript is integrated (v.0.4.0).

### Calculation

Soon to come.

Vision
------

CSSpec leverages existing SASS/CSS (plus a dash of HAML) tools to deliver a browser-parseable test suite built on the same structural abstractions as CSS -- because it is coded in CSS itself. By adopting CSS as the abstract test framework, CSSpec also aims to provide a tool that is understandable and useable by those who already work comfortably in that language.

By bringing coded specifications and automated regression testing to stylesheet development workflow, modularity and refactoring becomes more practical and achievable, and at the same time opens up the possibility that styling issues can be managed primarily in the style layer, freeing up HTML to be a cleaner semantic representation of underlying content.

The following mixin accepts as an argument a selector (could be a class, psuedo-class, or otherwise) which triggers the display of the element:

    =show-active($active-sel)
      display: none
      &#{$active-sel}
        display: block

This CSSpec mixin corresponds to the above module, and can be invoked by integration tests in whatever context the mixin is used in an actual application:

    =show-active-test($active-sel)
      &#{$active-sel}
        it should be shown
          display: block
      &:not(#{$active-sel})
        it should be hidden
          display: none

More significantly, this pattern offers a level of abstraction for selectors of nested elements such as layouts, insets, etc., avoiding the need to saddle DOM elements with classes that couple them tightly to a given style implementation and require significant JavaScript manipulation. The addition of style regression testing makes it possible to employ SASS tools to safely decouple style from semantic structure.

Who Tests the Testers?
----------------------

Compiler tests: `npm run compiler-test`

Browser test-runner tests: `npm test`

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

