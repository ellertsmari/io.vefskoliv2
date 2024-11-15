module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  ignore: [/node_modules\/(?!react-session-hooks)/], // Ignore all node_modules except react-session-hooks

  plugins: ["@babel/plugin-transform-modules-commonjs"],

  overrides: [
    {
      test: /node_modules\/react-session-hooks/, // Transform only react-session-hooks
      presets: ["@babel/preset-env"],
      plugins: ["@babel/plugin-transform-modules-commonjs"],
    },
  ],
};
