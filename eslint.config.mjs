import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
    // JS
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: "module",
        },
        rules: {
            // force the use of braces for all control structures (if, else, for, while, etc.)
            curly: ["error", "all"],
            // spaces for indentation
            "brace-style": ["error", "1tbs", { allowSingleLine: false }],
            // 4 spaces for indentation
            indent: ["error", 4],
        },
    },

    // TS
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2023,
            sourceType: "module",
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            curly: ["error", "all"],
            "brace-style": ["error", "1tbs", { allowSingleLine: false }],
            indent: ["error", 4],
            "@typescript-eslint/no-unused-vars": ["warn"],
            "@typescript-eslint/explicit-function-return-type": "off",
        },
    },
];