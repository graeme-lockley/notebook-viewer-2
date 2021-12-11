import { parse } from "../Parser";
import type { Cell, Module, Observer } from "../Runtime";
import { divID, updater, superUpdater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";
import { Inspector } from "@observablehq/inspector";

interface JavascriptX extends Plugin {
    hljs: any | undefined;
}

type CodeRenderer = (code: string) => string;

export const javascriptX: JavascriptX = {
    name: 'js-x',
    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module: Module, body: string, options: Options): string | Node {
        const pr = parse(body);

        const cell = module.cell();
        cell.redefine(pr.name, pr.dependencies, pr.result);

        const id = divID(cell);

        const codeRenderer: CodeRenderer =
            this.hljs === undefined
                ? (code: string) => `<pre class='nbv-unstyled-code-block'><code>${code}</code></pre>`
                : (code: string) => `<pre class='nbv-styled-code-block'><code class="hljs language-javascript">${this.hljs.highlight(code, { language: "js" }).value
                    }</pre></code>`;

        cell.includeObserver(observer(id, options.has('pin'), body, codeRenderer));

        return `<div id='${id}' class='nbv-js-x'>Nothing to show</div>`;
    }
};

const observer = (elementID: string, pin: boolean, body: string, codeRenderer: CodeRenderer): Observer => {
    const update = superUpdater(elementID);

    return {
        fulfilled: function (cell: Cell, value: any): void {
            update.update((inspector: Inspector) => inspector.fulfilled(value));
        },
        pending: function (cell: Cell): void {
            update.update((inspector: Inspector) => inspector.pending());
        },
        rejected: function (cell: Cell, value?: any): void {
            update.update((inspector: Inspector) => inspector.rejected(value));
        }
    };
}

