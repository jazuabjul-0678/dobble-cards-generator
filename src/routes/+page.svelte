<script lang="ts">
    import { symbolsData } from "$lib/store";
    import { get } from "svelte/store";

    let { n, s, symbols } = get(symbolsData) as any;
    let prevOpt: any, nextOpt: any, possible: boolean;

    const readFileAsDataURL = (f: File) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = () => {
                reject;
            }

            reader.readAsDataURL(f);
        });
    };

    const isImage = (f: File) => {
        return f.type.includes("image");
    };

    const processSymbols = async (files: FileList) => {
        const errorMsgs: string[] = [];
        for (const f of files) {
            if (!isImage(f)) {
                errorMsgs.push(`Die Datei '${f.name}' ist kein Bild.`);
                continue;
            }
            try {
                const data = await readFileAsDataURL(f);
                symbols = [...symbols, {
                    name: f.name,
                    src: data
                }];
                generateCards();
            } catch (error) {
                console.log(`Fehler: ${error}`);
                continue;
            }
        }

        if (errorMsgs.length > 0) {
            for (const msg of errorMsgs) {
                alert(msg);
            }
        }
    };

    const dragoverHandler = (ev: DragEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
    };

    const dropHandler = (ev: DragEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.dataTransfer!.items !== null) {
            if (ev.dataTransfer!.files.length > 0) {
                processSymbols(ev.dataTransfer!.files);
            }
        }
    };

    const changeHandler = (ev: Event) => {
        const target = ev.target as HTMLInputElement;
        if (target && target.files && target.files.length > 0) {
            processSymbols(target.files);
        }
    };

    const imgClickHandler = (ev: Event) => {
        const dragDropArea = document.querySelector("#drag-and-drop-symbols");
        const { target } = ev;
        
        const index = Array.prototype.indexOf.call(dragDropArea?.children, target);
        console.log(index);

        symbols.splice(index, 1);
        symbols = symbols;

        generateCards();
    };

    const generateCards = () => {
        n = symbols.length;
        s = (1 + Math.sqrt(4 * n - 3)) / 2;

        if (n < 7) {
            const next_n = 7;
            const next_s = 3;
            nextOpt = {
                n: next_n,
                s: next_s,
                required: Math.abs(next_n - n)
            };
        } else {
            possible = Number.isInteger(s);
            if (!possible) {
                const prev_s = Math.floor(s);
                const prev_n = prev_s * prev_s - prev_s + 1;
                prevOpt = {
                    n: prev_n,
                    s: prev_s,
                    unnecessary: Math.abs(n - prev_n)
                };
                const next_s = Math.ceil(s);
                const next_n = next_s * next_s - next_s + 1;
                nextOpt = {
                    n: next_n,
                    s: next_s,
                    required: Math.abs(next_n - n)
                };
            }
        }

        symbolsData.set({
            symbols,
            n,
            s
        });
    };

    generateCards();
</script>

<h2>Symbole</h2>

<p>
    Unterstützt werden alle Bild-Datei-Formate.
</p>

<div id="drag-and-drop-symbols" on:drop={dropHandler} on:dragover={dragoverHandler} aria-hidden="true">
    {#if n === 0} 
        <span><i>drag und drop für Symbole hier...</i></span>
    {:else}
        {#each symbols as symbol}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <img 
                src="{symbol.src}" 
                alt="{symbol.name}" 
                height="100" 
                on:click={imgClickHandler}
            >
        {/each}
    {/if}
</div>

<p>Anzahl an Symbolen: <b>{n}</b></p>

<label class="input-file" for="input-file-symbols">Symbole hochladen</label>
<input id="input-file-symbols" multiple type="file" on:change={changeHandler}>

<br>

<h2>Karten erstellen</h2>

<div id="possible-sets">
    {#if n < 7}
        <p>
            Noch {nextOpt.required} Symbol(e) gebraucht, um {nextOpt.n} Karten mit {nextOpt.s} Symbolen pro Karte zu erstellen.
        </p>
    {:else}
        {#if possible}
            <button id="button-generate-pdf">
                PDF erstellen
            </button>

            <p>
                mit {n} Karten und {s} Symbolen pro Karte.
            </p>
        {:else}
            <button id="button-generate-pdf">
                PDF erstellen
            </button>
        
            
            <p>
                Wichtig: Die letzte(n) {prevOpt.unnecessary} Karte(n) werden ignoriert, um {prevOpt.n} Karten mit {prevOpt.s} Symbolen pro Karte zu erstellen!
            </p>
           
            <br>

            <div class="separator">ODER</div>

            <p>
                Noch {nextOpt.required} Symbol(e) hinzufügen für {nextOpt.n} Karten mit {nextOpt.s} Symbolen pro Karte.
            </p>
        {/if}
    {/if}
</div>

<style>
    #drag-and-drop-symbols {
        background: rgb(230, 230, 230);
        border: 3px dashed black; 

        width: 100%;
        height: 25rem;
        padding: .7rem;
        overflow-y: scroll;
    }
    #drag-and-drop-symbols img {
        border: 1px solid rgb(66, 117, 194);
        
        margin: .5rem;
    }

    #possible-sets {
        background: rgb(230, 230, 230);
        border-radius: 5px;

        padding: .5rem;
    }
    #possible-sets p {
        text-align: center;
    }

    #button-generate-pdf {
        width: 100%;
    }
</style>
