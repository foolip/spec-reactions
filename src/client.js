import {hydrate, mount} from 'svelte';
import App from './App.svelte';

// The production page is prerendered by render.js, but the dev server
// serves the empty template.
const start = import.meta.env.DEV ? mount : hydrate;
start(App, {target: document.body});
