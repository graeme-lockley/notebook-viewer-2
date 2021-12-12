<script lang="ts">
    import { CalculationPolicy, Runtime } from "./Runtime";
    import { parseInfoString } from "./Parser";

    import { marked } from "marked";
    import hljs from "highlight.js/lib/core";
    import javascript_highlighter from "highlight.js/lib/languages/javascript";
    import plaintext_highlighter from "highlight.js/lib/languages/plaintext";
    import "highlight.js/styles/base16/papercolor-light.css";
    import { AbstractFile, Library } from "@observablehq/stdlib";
    import observe from "@observablehq/stdlib/src/generators/observe.js";


    import { javascript } from "./plugins/Javascript";
    import { javascriptX } from "./plugins/JavascriptX";
    import { javascriptXAssert } from "./plugins/JavascriptXAssert";
    import { javascriptXView } from "./plugins/JavascriptXView";
    import { renderCode } from "./plugins/Helpers";

    hljs.registerLanguage("javascript", javascript_highlighter);
    hljs.registerLanguage("js", javascript_highlighter);
    hljs.registerLanguage("plaintext", plaintext_highlighter);

    const library = new Library();

    const runtime = new Runtime();

    const builtins = runtime.module();

    const bindings = new Map([["hljs", hljs]]);
    const plugins = [
        javascriptX,
        javascript,
        javascriptXAssert,
        javascriptXView,
    ];
    plugins.filter((p) => p.setup !== undefined).map((p) => p.setup(bindings));

    class FA extends AbstractFile {
        constructor(name: string) {
            super(name, name);
        }

        url() {
            return this.name;
        }
    }

    function width() {
        return observe(function (change) {
            var width = change(document.body.clientWidth);
            function resized() {
                var w = document.body.clientWidth;
                if (w !== width) change((width = w));
            }
            window.addEventListener("resize", resized);
            return function () {
                window.removeEventListener("resize", resized);
            };
        });
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
    builtins.cell("width", CalculationPolicy.Dormant).define([], () => width());
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

            if (plugin === undefined) {
                console.log("Unknown infostring:", infostring);
                return renderCode(hljs, "plaintext", code);
            } else return plugin.render(module, code, is);
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
