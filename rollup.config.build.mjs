import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from "@rollup/plugin-terser";
import json from '@rollup/plugin-json';
import webWorkerLoader from '@colingm/rollup-plugin-web-worker-loader';

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian', 'electron'],
  plugins: [
    typescript({ tsconfig: './tsconfig.json', exclude: ['**/*.d.ts'] }),
    nodeResolve({browser: true}),
    commonjs(),
    // terser(),
	json(),
	webWorkerLoader({ targetPlatform: 'browser' })
  ],
  onwarn: function(warning, warner) {
    if (warning.code === 'CIRCULAR_DEPENDENCY'){
        if(warning.importer && warning.importer.startsWith('node_modules')){
            return;
        }
    }
    warner(warning);
  }
};
