module.exports = {
  "presets": [
    ["@babel/preset-env", {
      "targets": {
        "browsers": ["> 0.5%, last 2 versions, Firefox ESR, not dead"]
      }
    }],
    "@babel/preset-typescript",
    "@babel/react"
  ],
  "env": {
    "test": {
      "plugins": ["transform-es2015-modules-commonjs"]
    }
  }
}
