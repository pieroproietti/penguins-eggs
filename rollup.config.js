// new rollup.config.js
import shebang from "rollup-plugin-shebang";
import json from "rollup-plugin-json";
//import resolve from 'rollup-plugin-node-resolve';
//import commonjs from 'rollup-plugin-commonjs';

export default {
  input: "./src/index.js",
  output: {
    file: "./build/index.js",
    format: "cjs",
    name: "eggs",
    sourcemap: true
  },
  plugins: [
    shebang(),
    json()/*,
    resolve(),
    commonjs() */
  ]
};
