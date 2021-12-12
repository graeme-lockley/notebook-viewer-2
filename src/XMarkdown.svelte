<script lang="ts">
    import { CalculationPolicy, Runtime } from "./Runtime";
    import { parseInfoString } from "./Parser";

    import { marked } from "marked";
    import hljs from "highlight.js/lib/core";
    import javascript from "highlight.js/lib/languages/javascript";
    import plaintext from "highlight.js/lib/languages/plaintext";
    import "highlight.js/styles/base16/papercolor-light.css";
    import { AbstractFile, Library } from "@observablehq/stdlib";
    
    import { javascriptX } from "./plugins/JavascriptX";
    import { javascriptXAssert } from "./plugins/JavascriptXAssert";
    import { javascriptXView } from "./plugins/JavascriptXView";

    hljs.registerLanguage("javascript", javascript);
    hljs.registerLanguage("js", javascript);
    hljs.registerLanguage("plaintext", plaintext);

    const library = new Library();

    const runtime = new Runtime();

    const builtins = runtime.module();

    const bindings = new Map([["hljs", hljs]]);
    const plugins = [javascriptX, javascriptXAssert, javascriptXView];
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

    window.module = module;

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
            else console.log("Unknown infostring:", infostring);

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
