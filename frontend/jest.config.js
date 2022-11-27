module.exports = {
  verbose: true,
  preset: "@vue/cli-plugin-unit-jest/presets/no-babel",
  moduleFileExtensions: ["js", "json", "vue", "ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.vue$": "vue-jest",
    "^.+\\.(js|jsx)?$": "babel-jest",
    "^.+\\.(ts|tsx)?$": "ts-jest",
  },
  globals: {
    "vue-jest": {
      pug: {
        doctype: "html",
      },
    },
  },
};
