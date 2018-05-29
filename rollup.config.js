// Rollup plugins
/*
//import globals from 'rollup-plugin-node-globals';
//import builtins from "rollup-plugin-node-builtins";
import json from "rollup-plugin-json";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import shebang from "rollup-plugin-shebang";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "./dist/node/index.js",
  output: {
    file: "./dist/bundle/index.js",
    format: "cjs",
    sourcemap: true,
    name: 'eggs'
  },
  plugins: [
    json(),
    resolve({
      module: true, // Default: true
      jsnext: true, // Default: false
      browser: false, // Default: false
      extensions: ['.mjs', '.js', '.jsx', '.json'], // Default: [ '.mjs', '.js', '.json', '.node' ]
      preferBuiltins: true, // Default: true
    }),
    commonjs({
        include: 'node_modules/**',  // Default: undefined
        exclude: [ 'node_modules/exclude1/**', 'node_modules/exclude2/**' ],  // Default: undefined
        extensions: [ '.js', '.coffee' ],  // Default: [ '.js' ]
        ignoreGlobal: false,  // Default: false
        sourceMap: true  // Default: true
    }), 
    //builtins(),
    //globals(),
    (process.env.NODE_ENV === 'production' && uglify()),
    shebang()
  ]
}*/