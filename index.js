var fs = require('fs'),
    HAML = require('hamljs');

// TO DO: rewrite using async file access
function preprocessFile(source, dest) {
  var sourcePath = process.cwd() + '/' + source,
      destPath   = process.cwd() + '/' + dest,
      input;

  if (fs.existsSync(sourcePath)) {
    input = fs.readFileSync(sourcePath, { encoding: 'utf8' });
    fs.writeFileSync(destPath, preprocess(input));
  }
}

// process multiline document
function preprocess(csspec) {
  var lines = csspec.split("\n"),
      processed,
      output = [];
  while (lines.length) {
    if (processed = processHAML(lines)) {
      output.push(processed.sass);
      lines = lines.slice(processed.linesConsumed);
    } else {
      output.push(preprocessLine(lines.shift()));
    }
  }
  return output.join("\n");
}

// extract HAML (if exists) from top of given lines
function processHAML(lines) {
  var firstLine = lines[0],
      m = firstLine.match(/^(.*)=\s*$/),
      content, lineCount;
  if (!m) return null;
  content = m[1];
  hamlLines = extractHAML(lines);
  haml = HAML.render(hamlLines.join("\n"))
             .replace(/\n/g, ' ').replace(/'/g, "\\'").trim();
  return {
    sass: content + ": '" + haml + "'",
    linesConsumed: hamlLines.length + 1
  }
}

// compile lines to HAML
function extractHAML(lines) {
  var sassIndent = lines[0].match(/^\s*/)[0],
      hamlIndent, 
      re, 
      i = 1, 
      matches,
      haml = [];

  if (lines.length === 1) return null; // should trigger an error state
  if (lines[1].indexOf(sassIndent) !== 0) return null;

  hamlIndent = lines[1].match(/^\s*/)[0];
  re = new RegExp("^" + hamlIndent + "(.*)$");

  while (lines[i] && (matches = lines[i].match(re))) { // restrict to lines with matching indent
    haml.push(matches[1]);
    i++;
  }
  return haml;
}

// process single (non-HAML) line
function preprocessLine(line) {
  var m = line.match(/^(\s*)(describe|when|it)\b(.*)$/i),
      prefix, description, pair, selector = '';

  if (!m) return line;

  indent = m[1];
  prefix = m[2].toLowerCase();
  description = m[3].trim();

  if (prefix === 'when') {
    if (pair = hashPair(description)) {
      description = pair[0];
      selector = pair[1];
    } else if (isSelector(description)) {
      selector = description;
      description = paraphraseSelector(description);
    }
  }

  return indent + scopeClass(prefix, description) + selector;
}

// check for -> syntax and return array [firstObj, secondObj]
function hashPair(text) {
  var pair = text.match(/^(.*)\->(.*)$/);
  return pair ? [pair[1].trim(), pair[2].trim()] : null;
}

// boolean test
function isSelector(description) {
  return /^(\.|\#|\:)\S+$/.test(description);
}

// turn space-delimited descriptor into SASS class defining test scope
function scopeClass(prefix, description) {
  return '&.-' + prefix + '-' + description.split(/\s+/).join('-');
}

// a descriptive scope name for when clauses that provide just a selector
function paraphraseSelector(description) {
  var m = description.match(/^([.#:])(\S+)$/);
  switch (m && m[1]) {
    case '.':
      return 'has class ' + m[2];
    case '#':
      return 'has id ' + m[2];
    default:
      return null;
  }
}

module.exports = function(grunt) {
  grunt.registerMultiTask('csspec', 'Preprocess CSSpec to SASS', function() {
    var files = grunt.config('csspec').dev.files;
    for(dest in files) {
      preprocessFile(files[dest], dest);
    }
  });

  this.preprocessFile = preprocessFile;
  this.preprocess = preprocess;
  this.preprocessLine = preprocessLine;
}


