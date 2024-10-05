import {nodeResolve} from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import webWorkerLoader from '@colingm/rollup-plugin-web-worker-loader';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
import esbuild from 'rollup-plugin-esbuild'

export default {
  input: 'src/main.ts',
  output: {
    dir: './dist/obsidian-tts',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian', 'electron'],
  plugins: [
    nodeResolve({browser: true}),
    commonjs(),
	esbuild({ target: 'es2018', minify: false }),
	json(),
	webWorkerLoader({ targetPlatform: 'browser' }),
	copy({
		targets: [{
			src: 'node_modules/@soundtouchjs/audio-worklet/dist/soundtouch-worklet.js',
			dest: 'src'
		},
        { src: ['manifest.json'], dest: './dist/obsidian-tts' }
		],
		hook: 'buildStart'
	}),
	del({
		targets: 'src/soundtouch-worklet.js',
		hook: 'buildEnd'
	})
  ],
  onwarn: function(warning, warner) {
	if (warning.id && /node_modules/.test(warning.id)) return;
	if (warning.ids && warning.ids.every((id) => /node_modules/.test(id)))
		return;

	warner(warning);
  }
};
