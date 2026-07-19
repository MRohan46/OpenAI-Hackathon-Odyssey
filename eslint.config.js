const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      '.expo/**',
      '.vercel/**',
      '.codex/**',
      '.agents/**',
      'supabase/functions/**',
      'node_modules/**',
      'qa/**',
    ],
  },
  expoConfig,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['src/world/LivingShoreScene.*.tsx'],
    rules: {
      // React Three Fiber intrinsic elements intentionally use Three.js props.
      'react/no-unknown-property': 'off',
    },
  },
]);
