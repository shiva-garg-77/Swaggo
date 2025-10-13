# Pre-commit Hooks Implementation Guide

## Overview

This document describes the pre-commit hooks implementation for the Swaggo application. Pre-commit hooks help maintain code quality by automatically running linting, formatting, and testing before code is committed.

## Pre-commit Hook Setup

### Installation

The pre-commit hooks are automatically set up when you run:

```bash
npm run prepare
```

This command initializes husky and creates the necessary hook files.

### Hook Configuration

The pre-commit hook configuration is defined in `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
npx lint-staged
```

### Lint-staged Configuration

The lint-staged configuration is defined in `.lintstagedrc.js`:

```javascript
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
};
```

## Hook Execution Flow

1. **File Staging**: Developer stages files with `git add`
2. **Hook Trigger**: Pre-commit hook runs automatically
3. **Lint-staged Execution**: Lint-staged processes staged files
4. **ESLint Fix**: JavaScript files are linted and fixed
5. **Prettier Format**: All files are formatted according to style guide
6. **Git Add**: Formatted files are automatically re-added
7. **Commit Proceed**: If all steps pass, commit proceeds

## Benefits

1. **Consistent Code Style**: Automatic formatting ensures consistent style
2. **Error Prevention**: Linting catches common errors before commit
3. **Quality Assurance**: Code quality is maintained automatically
4. **Developer Experience**: No manual formatting or linting required
5. **Team Consistency**: All team members follow the same standards

## Customization

### Adding New File Types

To add support for new file types, update `.lintstagedrc.js`:

```javascript
module.exports = {
  // Existing configurations...
  
  // New file type
  '*.newext': [
    'prettier --write',
    'git add',
  ],
};
```

### Custom Linting Rules

To add custom linting for specific files:

```javascript
module.exports = {
  // Custom linting for test files
  '*.{test,spec}.js': [
    'eslint --fix --env jest',
    'prettier --write',
    'git add',
  ],
};
```

## Troubleshooting

### Hook Failures

If a pre-commit hook fails:

1. Check the error message for specific issues
2. Fix the identified problems
3. Re-stage the files with `git add`
4. Try committing again

### Skipping Hooks

To temporarily skip hooks (not recommended):

```bash
git commit --no-verify -m "commit message"
```

### Performance Issues

For large commits, you can:

1. Commit in smaller batches
2. Use `--no-verify` temporarily (remember to fix issues later)
3. Optimize lint-staged configuration for specific patterns

## Best Practices

1. **Keep Hooks Fast**: Optimize hook execution time
2. **Clear Error Messages**: Provide helpful error information
3. **Consistent Configuration**: Maintain consistent linting rules
4. **Regular Updates**: Keep linting tools updated
5. **Team Communication**: Document any custom configurations

## Integration with CI/CD

The pre-commit hooks complement CI/CD pipeline checks:

1. **Local Validation**: Catch issues before pushing
2. **Pipeline Efficiency**: Reduce CI failures
3. **Consistent Standards**: Same rules locally and in CI
4. **Faster Feedback**: Immediate feedback to developers

## Monitoring

The pre-commit hook system can be monitored through:

1. **Git Hook Logs**: Track hook execution
2. **Commit Statistics**: Monitor commit success rates
3. **Developer Feedback**: Collect user experience reports
4. **Performance Metrics**: Measure hook execution time