const importPlugin = await import('eslint-plugin-import');
const tsParser = await import('@typescript-eslint/parser');
const tsPlugin = await import('@typescript-eslint/eslint-plugin');
const boundariesPlugin = await import('eslint-plugin-boundaries');


export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser.default,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        React: 'writable',
        JSX: 'readonly',
      },
    },
    plugins: {
      import: importPlugin.default ?? importPlugin,
      '@typescript-eslint': tsPlugin.default,
      'boundaries': boundariesPlugin.default,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // FSD boundaries
      'boundaries/element-types': [ 'error', {
        default: 'disallow',
        rules: [
          { from: 'shared', allow: ['shared'] },
          { from: 'entities', allow: ['shared'] },
          { from: 'features', allow: ['entities', 'shared'] },
          { from: 'widgets', allow: ['features', 'entities', 'shared'] },
          { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared'] },
          { from: 'app', allow: ['pages', 'widgets', 'features', 'entities', 'shared'] }
        ]
      }],
    },
    settings: {
      'import/resolver': {
        typescript: {},
        alias: {
          map: [
            ['@app', './src/app'],
            ['@entities', './src/entities'],
            ['@features', './src/features'],
            ['@widgets', './src/widgets'],
            ['@pages', './src/pages'],
            ['@shared', './src/shared'],
            ['@processes', './src/processes'],
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'shared', pattern: 'src/shared/**/*' },
        { type: 'entities', pattern: 'src/entities/**/*' },
        { type: 'features', pattern: 'src/features/**/*' },
        { type: 'widgets', pattern: 'src/widgets/**/*' },
        { type: 'pages', pattern: 'src/pages/**/*' },
        { type: 'processes', pattern: 'src/processes/**/*' },
      ],
    },
  },
];
