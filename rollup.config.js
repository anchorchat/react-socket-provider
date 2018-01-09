import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';

const env = process.env.NODE_ENV;

const config = {
  format: 'umd',
  moduleName: 'ReactSocketProvider',
  plugins: [
    babel({
      exclude: '**/node_modules/**'
    }),
    commonjs(),
    nodeResolve(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    })
  ]
};

if (env === 'production') {
  config.plugins.push(uglify({
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      warnings: false
    }
  }));
}

export default config;
