import {createContext} from 'svelte';

// Shared between SortableTable and the SortableColumn headers inside it.
export const [getSortContext, setSortContext] = createContext();
