import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    ignores: ['src/**/vendor/**', '**/node_modules/**', '**/bootstrap.bundle.min.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        CustomEvent: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        navigator: 'readonly',
        prompt: 'readonly',
        HTMLMediaElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        Node: 'readonly',
        ShadowRoot: 'readonly',
        CSS: 'readonly',
        getComputedStyle: 'readonly',
        IntersectionObserver: 'readonly',
        crypto: 'readonly',
        // Node.js globals (for backend files)
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Testing globals
        fs: 'readonly',
        // Third-party globals
        bootstrap: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        'vars': 'all',
        'args': 'after-used',
        'ignoreRestSiblings': false,
        'varsIgnorePattern': '^_',
        'argsIgnorePattern': '^_'
      }],
      'no-unreachable': 'warn',
      'no-undef': 'warn'
    }
  }
];