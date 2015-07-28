var fs = require('fs'),
    HAML = require('hamljs');

// TO DO: rewrite using async file access
function preprocessFile(sourcePath, destPath) {
  var input;

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

function processJS(content) {
  var m = content.match(/^(\s*)([\w\-]+)\s*\-\>\s*(.*)$/i);
  return m ? (m[1] + '-fn-' + m[2] + ': "' + m[3].replace(/"/g, '\\"') + '"') : null;
}

function processExpectation(content) {
  var m = content.match(/^(\s*)((\&?\[?[\w\-]+\]?)(\s*)(\:|\>|\<|\>\=|\<\=|\=\=|\!\=)(\s*)(.*))$/i),
          s1, s2, s3, attribute, operator, expression, simpleAttr;
console.log(m && 'MATCHED')
  if (!m) return null;

  s1 = m[1];
  fullExpression = m[2];
  attribute = m[3];
  s2 = m[4];
  operator = m[5];
  s3 = m[6];
  expected = m[7];
// console.log(s1.length, attribute, s2.length, operator, s3.length, expected, fullExpression)
  simpleAttr = attribute.match(/^\&?(\[([\w\-]+)\]|([\w\-]+))$/);
// console.log('simple:' , simpleAttr)
  if (!simpleAttr || operator != ':') {
    return s1 + '-expect: ' + doubleQuote(fullExpression);
  } else if (isExpression(expected)) {
    return s1 + (simpleAttr[2] || simpleAttr[3]) + s2 + ':' + s3 + doubleQuote(expected);
  } else {
    return null;
  }

}

function doubleQuote(string) {
  return '"' + string.replace(/\"/, '\\"').replace(/\\/, '\\\\') + '"';
}

// simplified good-enough test: just look for an [attr] declaration.
function isExpression(text) {
  return /(\[[\w\-]+\]|\+|\-|\*|\/)/.test(text);
}

function processScope(content) {
  var m, prefix, description, pair, selectors, addSelectors = '';

  m = content.match(/^(\s*)(describe|when|it)\b(.*)$/i);
  if (!m) return null;

  indent = m[1];
  prefix = m[2].toLowerCase();
  description = m[3].trim();

  if (prefix === 'when') {
    if (pair = hashPair(description)) { // e.g. 'when description -> .class1.class2'
      description = pair[0] + '-'; // trailing hyphen to associate with following selector
      selectors = toSelectors(pair[1]);
    } else if (selectors = toSelectors(description)) { // e.g. 'when #id'
      description = '';
    } else {
      selectors = []; // else description only e.g. 'when previously viewed'
    }
    addSelectors = selectors.join('.-when-');
  }

  return indent + scopeClass(prefix, description, !!indent) + addSelectors;
}

// process single (non-HAML) line
function preprocessLine(line) {
  var m, content, comment, js, prefix, description, pair, selectors, addSelectors = '';

  // separate out trailing spaces and comments
  m = line.match(/^(.*[^\s\/])(\s*\/\/.*)$/i);
  content = m ? m[1] : line;
  comment = m ? m[2] : '';

  return ( processJS(content) 
            || processExpectation(content)
            || processScope(content)       
                || content) + comment;
}

// check for -> syntax and return array [firstObj, secondObj]
function hashPair(text) {
  var pair = text.match(/^(.*)\->(.*)$/);
  return pair ? [pair[1].trim(), pair[2].trim()] : null;
}

// boolean test
function toSelectors(description) {
  return description.match(/(\.|\#|\:)[\w-_]+/g);
}

// turn space-delimited descriptor into SASS class defining test scope
function scopeClass(prefix, description, extendParent) {
  return (extendParent ? '&' : '')
          + '.-' + prefix 
          + '-' + description.split(/\s+/).join('-');
}

// expose public methods
module.exports = {
  preprocess: preprocess,
  preprocessFile: preprocessFile
};

// expose private methods for unit tests
if (process.env.NODE_ENV === 'test') {
  module.exports._private = {
    preprocessLine: preprocessLine
  }
}



