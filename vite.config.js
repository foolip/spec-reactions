import {svelte} from '@sveltejs/vite-plugin-svelte';

export default {
  base: './',
  plugins: [svelte()],
  define: {
    __UPDATED__: JSON.stringify(new Date().toISOString().split('T')[0]),
  },
};
