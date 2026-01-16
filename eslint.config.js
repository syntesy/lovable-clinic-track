import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // PROCEDURE-LOCKED GUARD: Block forbidden patterns in Próximo Passo/Impressão
      // This rule flags direct usage of LLM-generated next_steps in procedure-locked contexts
      "no-restricted-syntax": [
        "error",
        {
          "selector": "MemberExpression[property.name='what_to_do_now']",
          "message": "🚫 PROCEDURE-LOCKED: Use generateOrthoBioPlan() instead of what_to_do_now. See docs/release-guards-attendance-upload.md"
        },
      ],
    },
  },
  // Additional rule for specific procedure-locked files
  {
    files: [
      "src/components/orthobio/**/*.{ts,tsx}",
      "src/pages/TriagemBiologica.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "MemberExpression[object.property.name='next_steps'][property.name='what_to_do_now']",
          "message": "🚫 PROCEDURE-LOCKED: Direct access to next_steps.what_to_do_now is forbidden. Use generateOrthoBioPlan() from @/domain/orthoBioProcedures"
        },
        {
          "selector": "MemberExpression[property.name='what_to_do_now']",
          "message": "🚫 PROCEDURE-LOCKED: Use generateOrthoBioPlan() instead of what_to_do_now. See docs/release-guards-attendance-upload.md"
        },
      ],
    },
  },
);
