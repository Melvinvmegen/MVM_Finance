module.exports = {
  env: {
    node: true,
    // Allow defineProps && defineEmits to be injected on compile
    'vue/setup-compiler-macros': true
  },
  root: true,
  parser: "vue-eslint-parser",
  parserOptions: { parser: "@typescript-eslint/parser" },
  plugins: ["@typescript-eslint", "pug"],
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/base",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/consistent-type-imports": "error",
    'vue/script-setup-uses-vars': 'off',
    'vue/require-default-prop': 'off',
  },
};
