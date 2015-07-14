CSSpec
======

CSSpec is a supersyntax of SASS which compiles to SASS/CSS and implements nested descriptions and test cases for CSS client-side unit and integration tests. CSSpec is syntatic sugar and all features of CSSpec test runners can coded in SASS, SCSS, or CSS directly.

To populate client-side test fixtures, HAML templates can be included inline or assigned to SASS variables.

This current preprocessor implementation is intended for development-build, server-side use in a NodeJS/Grunt project.

Syntax
------

Define what element(s) you are querying with SASS nested structure. Group tests with `describe`, and group expectations with `it ...`. Force the application or removal of classes, ids, and psuedo-states with `when`. Create fixture markup with a line-terminating equal sign followed by HAML (which can also include inline HTML).

    #csspec-fixture
      content =
        .feature test

    describe my feature
      .feature
        when not activated
          it should not be displayed by default
            display: none
        when activated -> .active
          it should be displayed
            display: block

This compiles to:

    #csspec-fixture
      content: '<div class"feature">test</div>'

    &.-describe-my-feature
      .feature
        &.-when-not-activated
          &.-it-should-not-be-displayed
            display: none
        &.-when-activated.active
          &.-it-should-be-displayed
            display: block

Usage
-----

    npm install csspec --save-dev

Exposed methods: 

`preprocess(csspec)` parses CSSpec into its SASS equivalent.

`preprocessFile(source, dest)` does the same for files with fully-qualified pathnames.

For Grunt-enabled package use:

    npm install grunt-csspec --save-dev

See that project's docs for Gruntfile configuration.

Note that SASS compilation is not currently bundled into the preprocessor and so needs to be run after the CSSpec preprocessing.

License
-------

The MIT License (MIT)

Copyright (c) 2015 Christopher Kula

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

