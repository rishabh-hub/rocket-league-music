module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'next/core-web-vitals',
    'prettier',
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:tailwindcss/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['simple-import-sort', 'prettier', '@typescript-eslint', 'jsx-a11y'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',

    // Disable rules for import sorting
    'simple-import-sort/imports': 'off',

    // Disable case declarations rule
    'no-case-declarations': 'off',

    // Disable Tailwind class order warnings if needed
    'tailwindcss/classnames-order': 'off',
    'tailwindcss/enforces-shorthand': 'off',
    'tailwindcss/no-unnecessary-arbitrary-value': 'off',

    // Other React specific rules
    'react-hooks/rules-of-hooks': 'error', // This is important but changed to a warning for now
    'jsx-a11y/label-has-associated-control': 'off',

    // Prettier rules
    'prettier/prettier': 'warn',
    // 'prettier/prettier': [
    //   'error',
    //   {
    //     endOfLine: 'auto',
    //   },
    // ],
    'sort-imports': 'off',
    'tailwindcss/no-custom-classname': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    // 'simple-import-sort/imports': [
    //   2,
    //   {
    //     groups: [
    //       ['^.+\\.s?css$'],
    //       [
    //         `^(${require('module').builtinModules.join('|')})(/|$)`,
    //         '^react',
    //         '^@?\\w',
    //       ],
    //       ['^components(/.*|$)'],
    //       ['^lib(/.*|$)', '^hooks(/.*|$)'],
    //       ['^\\.'],
    //     ],
    //   },
    // ],
  },
  settings: {
    tailwindcss: {
      callees: ['cn'],
      config: 'tailwind.config.js',
    },
  },
};
