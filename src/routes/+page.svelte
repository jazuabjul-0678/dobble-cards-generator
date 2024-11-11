<script lang="ts">
    import { pdfChildren, symbolsData, settings } from "$lib/store";
    import { get } from "svelte/store";
    import { deg_to_rad, generateSet, scaleImageToFitCircle } from "$lib/lib";

    let { n, s, symbols } = get(symbolsData) as any;
    let prevOpt: any, nextOpt: any, possible: boolean;
    let set: number[][];

    let pdfPromise: any = null, pdfShowHTML = false;
    let uniqueID = 0;

    let { doRotate, doScale } = get(settings) as any;

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
                                position: "relative",
                                display: "inline-block",
                                width: "calc((210mm - 2 * 10mm - 5mm / 4) / 2)",
                                height: "calc((210mm - 2 * 10mm - 5mm / 4) / 2)",
                                borderRadius: "50%",
                                transform: ""
                            },
                            content: ""
                        };

                        if (i % 2 === 0) {
                            console.log("2");
                            card.styles.transform = "translateX(2mm)";
                        } else {
                            console.log("1");
                            card.styles.transform = "translateX(-2mm)";
                        }

                        let angle = 0;
                        c.forEach((index, i) => {
                            const circle = document.createElement("div");
                            circle.style.borderRadius = "50%";
                            circle.style.position = "absolute";
                            circle.style.top = "50%";
                            circle.style.left = "50%";
                            circle.style.display = "flex";
                            circle.style.justifyContent = "center";
                            circle.style.alignItems = "center";
                            circle.style.transformOrigin = "50% 50%";
                            circle.style.width = "100px";
                            circle.style.height = "100px";

                            const scale = (doScale) ? 0.8 + Math.random() * (2 / 10) : 1.0;

                            const image = new Image();
                            image.src = symbols[index].src;
                            const { width, height } = image;
                            const { newWidth, newHeight } = scaleImageToFitCircle(width, height, 75 * scale);

                            const img = document.createElement("img");
                            img.width = newWidth;
                            img.height = newHeight;
                            img.src = image.src;

                            const distance = 120 - (20 * (6 / (s)));
                            const x = Math.sin(deg_to_rad(angle)) * distance;
                            const y = Math.cos(deg_to_rad(angle)) * distance;

                            circle.style.transform = `translateX(calc(-50% + ${x}px)) translateY(calc(-50% + ${-y}px)) scale(${scale})`;

                            if (doRotate) {
                                const rotation = 360 * Math.random();
                                circle.style.transform = circle.style.transform + ` rotateZ(${rotation}deg)`;
                            }

                            circle.appendChild(img);

                            card.content = card.content + `
                                <img src=\"${symbols[index].src}\" style=\"opacity: 0\" height=\"50px\">
                            ` + circle.outerHTML;

                            angle = (i + 1) * (360 / s);
                        });

                        pdfChildren.update((current: any) => [...current, card]);

                        if (i % 6 === 0) {
                            let gap = {
                                id: uniqueID ++,
                                styles: {
                                    border: "",
                                    position: "",
                                    display: "block",
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
                                    position: "",
                                    display: "block",
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

                    // window.location.reload();
                } catch (error) {
                    console.log(`Fehler: ${error}`);
                }
            } catch (error) {
                console.log(`Fehler: ${error}`);
            }
            
            pdfChildren.set(["a"]);

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
    Unterstützt werden alle Bild-Datei-Formate, außer .svg.
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

<p>Anzahl an Symbolen: <b>{n}</b><br><b>Maximal: 57</b></p>

<label class="input-file" for="input-file-symbols">Symbole hochladen</label>
<input id="input-file-symbols" multiple type="file" on:change={changeHandler}>

<br><br>

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
            <div style="border: {child.styles.border}; border-radius: {child.styles.borderRadius}; display: {child.styles.display}; position: {child.styles.position}; width: {child.styles.width}; height: {child.styles.height}; borderRadius: {child.styles.borderRadius}; transform: {child.styles.transform}">
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
        cursor: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEZSURBVEhL7dbNDYJAEAVgurAGLWNDaIIKOFMITWHAAvSqHjxzNNEYnUd2EgPsH8zKxZdMDOvOfMSLk/yzapo03VLtG6U2+ig46KUZdavUTh/ZA7TNsu6U50/6vM7B0XPIsoue0WGm/mo6jN7K8nWvqve5KB6hOKPoxQzMcuIt/bxHeks0cIXgQ5QLMzFbXxsHjUCGjT64CfV+cRuOwVMDFqOcEFwM5fjg4ijHNhjnUVCODY+Gckz4d4mjHBseDUVWgW0olzhuQvE8dSaC21AAKHHcheJ7lCjug+qr/V0TjhneeAjKWYzPQTmLcPqzrrGuDBtdKMf04v0KRLP1tXGwmBEivvrQc+dc+qSXPS+UA5zqt+vtP3GSJB8dMjDEDq+o8wAAAABJRU5ErkJggg==), auto;
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
