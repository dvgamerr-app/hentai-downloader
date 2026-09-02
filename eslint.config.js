const electronToolkit = require('@electron-toolkit/eslint-config')
const electronToolkitPrettier = require('@electron-toolkit/eslint-config-prettier')
const svelte = require('eslint-plugin-svelte')

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: ['node_modules', 'dist', 'out', '.gitignore']
  },
  electronToolkit,
  ...svelte.configs.recommended,
  {
    rules: {
      'svelte/no-unused-svelte-ignore': 'off'
    }
  },
  electronToolkitPrettier
]
