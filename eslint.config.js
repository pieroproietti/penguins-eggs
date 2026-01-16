
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import oclifConfig from 'eslint-config-oclif';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

// Handle CJS/ESM interop for eslint-config-oclif
const oclifFlat = Array.isArray(oclifConfig) ? oclifConfig : oclifConfig.default;

export default [
    // Ignores must be in their own object or part of the global config.
    {
        ignores: [
            "dist/**",
            "perribrewery/working/**",
            "testing/**",
            "AppDir/**",
            "**/*.d.ts"
        ]
    },

    // Oclif Config (Flat)
    ...oclifFlat,

    // Prettier Config (Legacy -> Flat)
    ...compat.extends("prettier"),

    // Custom Rules
    {
        files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.mocha
            }
        },
        rules: {
            "@typescript-eslint/no-empty-function": "off",
            "node/no-extraneous-import": "off",
            "unicorn/consistent-destructuring": "off",
            "unicorn/consistent-function-scoping": "off",
            "unicorn/import-style": "off",
            "unicorn/prefer-array-some": "off",
            "unicorn/prefer-module": "off",
            "unicorn/prefer-node-protocol": "off",
            "unicorn/prefer-spread": "off",
            "unicorn/prefer-ternary": "off"
        }
    }
];
