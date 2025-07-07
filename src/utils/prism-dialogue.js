import Prism from 'prismjs';

Prism.languages.dialogue = {
  'tab-indent': {
    pattern: /^\t+/m,
    alias: 'operator'
  },
  'response-option': {
    pattern: /^(\t*)-\s.*$/m,
    alias: 'function'  // or another Prism class you like
  },
  'curly-tag': {
    pattern: /{[^}]+}/,
    alias: 'constant'
  },
  'command': {
    pattern: /\\[a-zA-Z]+(?:\([^)]*\))?/,
    inside: {
      'function-name': {
        pattern: /\\[a-zA-Z]+/,
        alias: 'keyword'
      },
      'params': {
        pattern: /\(([^)]*)\)/,
        inside: {
          'string': /"(?:\\.|[^"\\])*"/,
          'number': /\b\d+(\.\d+)?\b/,
          'variable': /\b[a-zA-Z_][a-zA-Z0-9_]*\b/
        }
      }
    }
  },
  'plain-dialogue': {
    pattern: /^[^\n\\\-\{\}][^\n]*/m,
    alias: 'string'
  }
};
