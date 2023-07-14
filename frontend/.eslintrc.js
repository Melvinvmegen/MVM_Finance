module.exports = {
  root: true,
  parser: "vue-eslint-parser",
  plugins: ["pug"],
  extends: ["plugin:vue/vue3-essential", "eslint:recommended", "@vue/eslint-config-prettier/skip-formatting"],
  rules: {
    "no-unused-vars": ["warn", { ignoreRestSiblings: true, varsIgnorePattern: "Types|Models" }],
    "vue/no-unused-components": "warn",
    "vue/multi-word-component-names": "off",
    "no-undef": "off",
    "vue/no-v-text-v-html-on-component": "off",
    "vue/valid-v-slot": [
      "error",
      {
        allowModifiers: true,
      },
    ],
  },
};
