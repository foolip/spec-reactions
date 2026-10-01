import adapter from '@sveltejs/adapter-static';
import {sveltekit} from '@sveltejs/kit/vite';

export default {
  plugins: [
    sveltekit({
      adapter: adapter({pages: 'dist'}),
      // Inline all CSS so that nothing blocks the first render.
      inlineStyleThreshold: Infinity,
    }),
  ],
};
