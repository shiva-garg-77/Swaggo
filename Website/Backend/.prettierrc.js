module.exports = {
  // Basic formatting options
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  
  // JavaScript specific options
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  
  // Advanced formatting options
  embeddedLanguageFormatting: 'auto',
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'preserve',
  rangeStart: 0,
  rangeEnd: Infinity,
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.yml',
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },
    {
      files: '*.yaml',
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },
  ],
};