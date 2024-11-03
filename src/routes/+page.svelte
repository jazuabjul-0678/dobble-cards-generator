<script lang="ts">
    import { pdfChildren, symbolsData } from "$lib/store";
    import { get } from "svelte/store";
    import { generateSet } from "$lib/lib";

    let { n, s, symbols } = get(symbolsData) as any;
    let prevOpt: any, nextOpt: any, possible: boolean;
    let set: number[][];

    let pdfPromise: any = null, pdfShowHTML = false;
    let uniqueID = 0;

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
                determineOptions();
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

        symbols.splice(index, 1);
        symbols = symbols;

        determineOptions();
    };

    const btnClickHandler = async (ev: Event) => {
        pdfShowHTML = true;

        await new Promise((resolve) => setTimeout(resolve, 0));

        if (prevOpt) {
            set = generateSet(prevOpt.n, prevOpt.s);
        } else {
            console.log(n, s);
            set = generateSet(n, s);
        }

        pdfPromise = new Promise(async (resolve) => {
            try {
                const { jspdf, html2canvas } = window as any;
                const { jsPDF } = jspdf;

                const element = document.querySelector("#pdf-content");
                {
                    set.forEach(async (c, i) => {
                        i ++;
                        let card = {
                            id: uniqueID ++,
                            styles: {
                                border: "1px solid black",
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "calc((210mm - 2 * 10mm - 5mm / 4) / 2)",
                                height: "calc((210mm - 2 * 10mm - 5mm / 4) / 2)",
                                borderRadius: "50%"
                            },
                            content: ""
                        };

                        c.forEach((index) => {
                            card.content = card.content + `
                                <img src=\"${symbols[index].src}\" height=\"50px\">
                            `;
                        });

                        pdfChildren.update((current: any) => [...current, card]);

                        if (i % 6 === 0) {
                            let gap = {
                                id: uniqueID ++,
                                styles: {
                                    border: "",
                                    display: "block",
                                    justifyContent: "",
                                    alignItems: "",
                                    width: "100%",
                                    height: "calc(297mm - 3 * ((210mm - 2 * 10mm - 5mm / 4) / 2) - 2 * 5mm)",
                                    borderRadius: ""
                                },
                                content: ""
                            };

                            pdfChildren.update((current: any) => [...current, gap]);
                        } else if (i % 2 === 0) {
                            let gap = {
                                id: uniqueID ++,
                                styles: {
                                    border: "",
                                    display: "block",
                                    justifyContent: "",
                                    alignItems: "",
                                    width: "100%",
                                    height: "5mm",
                                    borderRadius: ""
                                },
                                content: ""
                            };

                            pdfChildren.update((current: any) => [...current, gap]);
                        }
                    });
                }

                const a4Width = 210;
                const a4Height = 297;
                const pdf = new jsPDF('p', 'mm', 'a4');

                await new Promise((resolve) => setTimeout(resolve, 0));

                try {
                    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, logging: true });
                    pdfShowHTML = false;
                    element!.innerHTML = "";
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = a4Width;
                    const imgHeight = (canvas.height * a4Width) / canvas.width;
                
                    let yPosition = 0;
                    const pageHeight = a4Height;
                
                    while (yPosition < imgHeight) {
                        pdf.addImage(imgData, 'PNG', 0, -yPosition, imgWidth, imgHeight);
                        yPosition += pageHeight;
                        if (yPosition < imgHeight) {
                            pdf.addPage();
                        }
                    }

                    pdf.save('document.pdf');
                } catch (error) {
                    console.log(`Fehler: ${error}`);
                }
            } catch (error) {
                console.log(`Fehler: ${error}`);
            }
            
            resolve("");
        });
    };

    const determineOptions = () => {
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
            } else {
                prevOpt = null;
            }
        }

        symbolsData.set({
            symbols,
            n,
            s
        });
    };

    determineOptions();
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
        <button id="button-generate-pdf" on:click={btnClickHandler}>
            {#if pdfPromise}
                {#await pdfPromise}
                    Wird erstellt ...
                {:then _} 
                    PDF erstellen
                {/await}
            {:else}
                PDF erstellen
            {/if}
        </button>
        {#if possible}

            <p>
                mit {n} Karten und {s} Symbolen pro Karte.
            </p>
        {:else}
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

{#if pdfShowHTML}
    <div id="pdf-content">
        {#each $pdfChildren as child (child.id)}
            <div style="border: {child.styles.border}; border-radius: {child.styles.borderRadius}; display: {child.styles.display}; justify-content: {child.styles.justifyContent}; align-items: {child.styles.alignItems}; width: {child.styles.width}; height: {child.styles.height}; borderRadius: {child.styles.borderRadius}">
                {@html child.content}
            </div>
        {/each}
    </div>
{/if}

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

    #pdf-content {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 210mm;
        padding: calc((297mm - 3 * calc((210mm - 2 * 10mm - 5mm / 4) / 2) - 2 * 5mm) / 2) 10mm;
        z-index: -2;
    }
</style>
