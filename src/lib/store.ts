import { writable } from "svelte/store";

export let symbolsData = writable({
    symbols: [],
    n: 0,
    s: 0
});