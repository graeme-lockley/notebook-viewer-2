<script lang="ts">
    import type { Cell } from "./Runtime";
    import { CalculationPolicy, Runtime } from "./Runtime";
    import { mkFactory, parseInfoString } from "./BlockFactory";
    import type { Block } from "./BlockFactory";

    import { marked } from "marked";
    import hljs from "highlight.js/lib/core";
    import javascript from "highlight.js/lib/languages/javascript";
    import plaintext from "highlight.js/lib/languages/plaintext";
    import "highlight.js/styles/base16/papercolor-light.css";
    import { AbstractFile, Library } from "@observablehq/stdlib";
    import { javascriptXAssert } from "./plugins/JavascriptXAssert";

    hljs.registerLanguage("javascript", javascript);
    hljs.registerLanguage("js", javascript);
    hljs.registerLanguage("plaintext", plaintext);

    const library = new Library();

    const runtime = new Runtime();

    const builtins = runtime.module();

    const bindings = new Map([["hljs", hljs]]);
    const plugins = [javascriptXAssert];
    plugins.filter((p) => p.setup !== undefined).map((p) => p.setup(bindings));

    class FA extends AbstractFile {
        constructor(name: string) {
            super(name, name);
        }

        url() {
            return this.name;
        }
    }

    builtins
        .cell("FileAttachment", CalculationPolicy.Dormant)
        .define([], () => library.FileAttachment());
    builtins
        .cell("load", CalculationPolicy.Dormant)
        .define([], () => (url: string) => new FA(url));
    builtins
        .cell("Arrow", CalculationPolicy.Dormant)
        .define([], () => library.Arrow());
    builtins
        .cell("Inputs", CalculationPolicy.Dormant)
        .define([], () => library.Inputs());
    builtins
        .cell("Mutable", CalculationPolicy.Dormant)
        .define([], () => library.Mutable());
    builtins
        .cell("Plot", CalculationPolicy.Dormant)
        .define([], () => library.Plot());
    builtins
        .cell("SQLite", CalculationPolicy.Dormant)
        .define([], () => library.SQLite());
    builtins
        .cell("SQLiteDatabaseClient", CalculationPolicy.Dormant)
        .define([], () => library.SQLiteDatabaseClient());
    builtins.cell("_", CalculationPolicy.Dormant).define([], () => library._());
    builtins
        .cell("aq", CalculationPolicy.Dormant)
        .define([], () => library.aq());
    builtins
        .cell("d3", CalculationPolicy.Dormant)
        .define([], () => library.d3());
    builtins
        .cell("dot", CalculationPolicy.Dormant)
        .define([], () => library.dot());
    builtins
        .cell("htl", CalculationPolicy.Dormant)
        .define([], () => library.htl());
    builtins
        .cell("html", CalculationPolicy.Dormant)
        .define([], () => library.html());
    builtins
        .cell("md", CalculationPolicy.Dormant)
        .define([], () => library.md());
    builtins
        .cell("require", CalculationPolicy.Dormant)
        .define([], () => library.require());
    builtins
        .cell("resolve", CalculationPolicy.Dormant)
        .define([], () => library.resolve());
    builtins
        .cell("svg", CalculationPolicy.Dormant)
        .define([], () => library.svg());
    builtins
        .cell("tex", CalculationPolicy.Dormant)
        .define([], () => library.tex());
    builtins
        .cell("topojson", CalculationPolicy.Dormant)
        .define([], () => library.topojson());
    builtins
        .cell("vl", CalculationPolicy.Dormant)
        .define([], () => library.vl());
    builtins
        .cell("DOM", CalculationPolicy.Dormant)
        .define([], () => library.DOM);
    builtins
        .cell("Files", CalculationPolicy.Dormant)
        .define([], () => library.Files);
    builtins
        .cell("Generators", CalculationPolicy.Dormant)
        .define([], () => library.Generators);
    builtins.cell("now", CalculationPolicy.Dormant).define([], () => now());
    builtins
        .cell("Promises", CalculationPolicy.Dormant)
        .define([], () => library.Promises);

    runtime.registerBuiltins(builtins);

    const module = runtime.module();
    const factory = mkFactory(module);

    window.module = module;

    const divID = (cell: Cell): string => `cell-${cell.id}`;

    const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const cellValueObserver = () => {
        let mostRecent = Date.now();

        const updateDivAsync = (moment: number, cell: Cell, value: string) => {
            const id = divID(cell);

            const updateDiv = () => {
                const element = document.getElementById(id);

                if (element === null) return false;
                else if (mostRecent === moment) {
                    element.innerHTML = value;
                    return true;
                } else return true;
            };

            const updateDivLoop = () => {
                Promise.resolve(updateDiv()).then((r) => {
                    if (!r) delay(100).then(() => updateDivLoop());
                });
            };

            updateDivLoop();
        };

        const snapshot = (): number => {
            const moment = Date.now();
            mostRecent = moment;
            return moment;
        };

        return {
            fulfilled: (cell: Cell, value: any): void => {
                updateDivAsync(snapshot(), cell, value.toString());
            },
            pending: (cell: Cell): void => {
                updateDivAsync(snapshot(), cell, "Pending");
            },
            rejected: (cell: Cell, value?: any): void => {
                updateDivAsync(
                    snapshot(),
                    cell,
                    `Error: ${value === undefined ? "" : value.toString()}`
                );
            },
        };
    };

    const updateViewDivAsync = (cell: Cell, value: any) => {
        const id = divID(cell);

        const updateDiv = () => {
            const element = document.getElementById(id);

            if (element === null) return false;
            else {
                if (value instanceof Node) {
                    element.childNodes.forEach((child) =>
                        element.removeChild(child)
                    );
                    element.appendChild(value);
                    return true;
                } else if (value !== undefined) {
                    element.childNodes.forEach((child) =>
                        element.removeChild(child)
                    );
                    element.innerHTML = value.toString();
                    return true;
                } else {
                    return true;
                }
            }
        };

        const updateDivLoop = () => {
            Promise.resolve(updateDiv()).then((r) => {
                if (!r) delay(100).then(() => updateDivLoop());
            });
        };

        updateDivLoop();
    };

    const cellViewObserver = () => ({
        fulfilled(cell: Cell, value: any): void {
            console.log("cellViewObserver: fulfilled: ", value);
            updateViewDivAsync(cell, value);
        },
        pending(cell: Cell): void {
            console.log("cellViewObserver: pending");
            updateViewDivAsync(cell, undefined);
        },
        rejected(cell: Cell, value?: any): void {
            console.log("cellViewObserver: rejected: ", value);
            updateViewDivAsync(cell, value);
        },
    });

    const renderResult = (block: Block, is: Map<string, string>) => {
        const resultHTML = `<p>${
            is.has("view") || is.has("assert") || block.name === undefined
                ? ""
                : `<code>${block.name}</code> = `
        } <span id="${divID(block.cell)}"></span></p>`;

        return is.has("pin")
            ? `${resultHTML}<pre><code class="hljs language-javascript">${
                  hljs.highlight(block.code, { language: "js" }).value
              }</pre></code>`
            : resultHTML;
    };

    const renderer = {
        code(code: string, infostring: string, escaped: boolean | undefined) {
            const is = parseInfoString(infostring);
            const firstInfoStringWord = firstWord(infostring);

            const plugin = plugins.find((p) => p.name === firstInfoStringWord);

            if (plugin !== undefined) {
                return plugin.render(module, code, is);
            } else if (is.get("js") == "")
                return `<pre><code class="hljs language-javascript">${
                    hljs.highlight(code, { language: "js" }).value
                }</pre></code>`;
            else if (is.get("js") === "x") {
                const block = factory.block(code, is);

                switch (block.type) {
                    case "Assignment": {
                        block.cell.includeObserver(cellValueObserver());
                        return renderResult(block, is);
                    }
                    case "View": {
                        block.viewCell.includeObserver(cellViewObserver());

                        const resultHTML = `<span id="${divID(
                            block.viewCell
                        )}"></span></p>`;

                        return is.has("pin")
                            ? `${resultHTML}<pre><code class="hljs language-javascript">${
                                  hljs.highlight(block.code, { language: "js" })
                                      .value
                              }</pre></code>`
                            : resultHTML;
                    }
                    case "AssignmentView": {
                        block.viewCell.includeObserver(cellViewObserver());

                        const resultHTML = `<span id="${divID(
                            block.viewCell
                        )}"></span></p>`;

                        return is.has("pin")
                            ? `${resultHTML}<pre><code class="hljs language-javascript">${
                                  hljs.highlight(block.code, { language: "js" })
                                      .value
                              }</pre></code>`
                            : resultHTML;
                    }
                }
            } else console.log("Unknown infostring:", infostring);

            return `<pre><code class="hljs">${
                hljs.highlight(code, { language: "plaintext" }).value
            }</pre></code>`;
        },
    };

    marked.use({ renderer });

    const firstWord = (text: string): string => {
        const indexOfSpace = text.indexOf(" ");

        return indexOfSpace === -1 ? text : text.slice(0, indexOfSpace);
    };

    export let sourceURL: string;
</script>

{#await fetch(sourceURL).then((r) => r.text()) then text}
    {@html marked.parse(text)}
{/await}
