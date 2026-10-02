import {render} from 'svelte/server';
import App from './App.svelte';

// Entry point for the server build used by render.js.
export default function renderBody() {
  return render(App).body;
}
