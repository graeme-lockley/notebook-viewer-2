<script lang="ts">
    // import { CalculationPolicy, Runtime } from "./Runtime";
    import { parseInfoString } from "./Parser";

    import { marked } from "marked";
    import hljs from "highlight.js/lib/core";
    import javascript_highlighter from "highlight.js/lib/languages/javascript";
    import plaintext_highlighter from "highlight.js/lib/languages/plaintext";
    import "highlight.js/styles/base16/papercolor-light.css";
    import { AbstractFile } from "@observablehq/stdlib";
    import { Library, Runtime } from "@observablehq/runtime";

    import { javascript } from "./plugins/Javascript";
    import { javascriptX } from "./plugins/JavascriptX";
    import { javascriptXAssert } from "./plugins/JavascriptXAssert";
    import { javascriptXView } from "./plugins/JavascriptXView";
    import { renderCode } from "./plugins/Helpers";
    import type { Options, Plugin, Plugins } from "./plugins/Plugin";

    hljs.registerLanguage("javascript", javascript_highlighter);
    hljs.registerLanguage("js", javascript_highlighter);
    hljs.registerLanguage("plaintext", plaintext_highlighter);

    const runtime = new Runtime(Object.assign(new Library, {load: () => (url:string) => new FA(url)}));

    const bindings = new Map([["hljs", hljs]]);
    const plugins = [
        javascriptXAssert,
        javascriptXView,
        javascriptX,
        javascript,
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

    const module = runtime.module();

    window.module = module;

    const renderer = {
        code(code: string, infostring: string, escaped: boolean | undefined) {
            const findResponse = find(plugins, infostring);

            if (findResponse === undefined) {
                console.log("Unknown infostring:", infostring);
                return renderCode(hljs, "plaintext", code);
            } else {
                const [plugin, is] = findResponse;

                return plugin.render(module, code, is);
            }
        },
    };

    marked.use({ renderer });

    function find(
        plugins: Plugins,
        infostring: string
    ): [Plugin, Options] | undefined {
        return findMap(plugins, (plugin: Plugin) => {
            const match = infostring.match(plugin.pattern);

            if (match == null) return undefined;
            else
                return [
                    plugin,
                    parseInfoString(
                        plugin.name + " " + infostring.slice(match[0].length)
                    ),
                ];
        });
    }

    function findMap<X, Y>(
        items: Array<X>,
        p: (x: X) => Y | undefined
    ): Y | undefined {
        let idx = 0;

        while (idx < items.length) {
            const r = p(items[idx]);

            if (r !== undefined) return r;

            idx += 1;
        }

        return undefined;
    }

    export let sourceURL: string;

    const onDestroy = () => {
        console.log('Destryoing runtime');
        runtime.dispose();
    }
</script>

{#await fetch(sourceURL).then((r) => r.text()) then text}
    {@html marked.parse(text)}
{/await}
