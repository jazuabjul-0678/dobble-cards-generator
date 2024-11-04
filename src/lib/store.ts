import { writable } from "svelte/store";

export let symbolsData = writable({
    symbols: [],
    n: 0,
    s: 0
});
export let pdfChildren: any = writable([]);
export let settings: any = writable({
    zoom: 1,
    doRotate: true,
    doScale: true
});
