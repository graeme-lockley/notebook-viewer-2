<script lang="ts">
    import hljs from "highlight.js/lib/core";
    import javascript_highlighter from "highlight.js/lib/languages/javascript";
    import plaintext_highlighter from "highlight.js/lib/languages/plaintext";
    import "highlight.js/styles/base16/papercolor-light.css";
    import { AbstractFile } from "@observablehq/stdlib";
    import { Library, Runtime } from "@observablehq/runtime";

    import { markedParser } from "./MarkedTemplateParser";

    hljs.registerLanguage("javascript", javascript_highlighter);
    hljs.registerLanguage("js", javascript_highlighter);
    hljs.registerLanguage("plaintext", plaintext_highlighter);

    const library = Object.assign(new Library(), {
        load: () => (url: string) => new FA(url),
    });

    const runtime = new Runtime(library);

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

    export let sourceURL: string;

    const onDestroy = () => {
        console.log("Destryoing runtime");
        runtime.dispose();
    };
</script>

{#await fetch(sourceURL).then((r) => r.text()) then text}
    {@html markedParser(text)}
{/await}



