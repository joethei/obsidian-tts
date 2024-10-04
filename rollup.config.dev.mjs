import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy'

export default {
  input: 'src/main.ts',
  output: {
    dir: 'examples/.obsidian/plugins/obsidian-tracker',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian'],
  plugins: [
    typescript({ tsconfig: './tsconfig.json', exclude: ['**/*.d.ts'] }),
    nodeResolve({browser: true}),
    commonjs(),
	json(),
    copy({
      targets: [
        { src: ['styles.css', 'manifest.json'], dest: 'examples/.obsidian/plugins/obsidian-tracker' }
      ]
    })
  ],
  onwarn: function(warning, warner){
    if (warning.code === 'CIRCULAR_DEPENDENCY'){
        if(warning.importer && warning.importer.startsWith('node_modules')){
            return;
        }
    }
    warner(warning);
  }
};
