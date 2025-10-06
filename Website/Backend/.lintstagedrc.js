module.exports = {
  // JavaScript files
  '*.{js,mjs}': [
    'eslint --fix',
    'prettier --write',
    'git add',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
    'git add',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
    'git add',
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
    'git add',
  ],
  
  // Configuration files
  '*.config.{js,mjs}': [
    'eslint --fix',
    'prettier --write',
    'git add',
  ],
  
  // Package.json
  'package.json': [
    'prettier --write',
    'git add',
  ],
  
  // Run tests on JavaScript changes (optional, can be slow)
  // '*.{js,mjs}': ['npm run test:related --passWithNoTests'],
};