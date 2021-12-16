import { renderCode, valueUpdater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";

interface KrokiX extends Plugin {
    hljs: any | undefined;
}

const supportedDiagramTypes = new Set([
    "blockdiag",
    "bytefield",
    "seqdiag",
    "actdiag",
    "c4plantuml",
    "nwdiag",
    "packetdiag",
    "rackdiag",
    "erd",
    "excalidraw",
    "graphviz",
    "mermaid",
    "nomnoml",
    "pikchr",
    "plantuml",
    "vega",
    "vegalite",
    "wavedrom",
]);

type Renderer = () => string;

let krokiX_count = 0;

export const krokiX: KrokiX = {
    name: 'kroki-x',
    pattern: /^kroki\s+x\s*/,

    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module, body: string, options: Options): string | Node {
        const id = `kroki-x-${krokiX_count++}`;
        const observerID = id + '-value';
        const codeID = id + '-code';

        const pin = options.has("pin");
        const type = options.get(this.name);

        if (supportedDiagramTypes.has(type)) {
            const observerUpdated = valueUpdater(observerID);

            /* render based on type */
            const renderer: Renderer =
                () => renderCode(this.hljs, 'plaintext', body);

            try {
                fetch(`https://kroki.io/${type}/svg`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body
                })
                    .then(response => response.text())
                    .then(content => observerUpdated(content))
                    .catch(error => observerUpdated(`Kroki Error: ${error}`));
            } catch (e) {
                observerUpdated(`Kroki Error: ${e}`);
            }

            return `<div id='${id}' class='nbv-kroki-x'><div id='${observerID}'></div>${pin ? `<div id='${codeID}'>${renderer()}</div>` : ''}</div>`;
        } else {
            return `<div class='nbv-kroki-x'><p>Kroki Error: Unknown Type: ${type}<p><ul>${[...supportedDiagramTypes].map(i => `<li>${i}</li>`).join("")}</ul></div>`;
        }
    }
};
