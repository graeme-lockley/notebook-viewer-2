import { parse } from "../Parser";
import type { Cell, Module, Observer } from "../Runtime";
import { divID, updater, inspectorUpdater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";
import type { Inspector } from "@observablehq/inspector";

interface JavascriptX extends Plugin {
    hljs: any | undefined;
}

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
        const observerID = id + '-observer';
        const codeID = id + '-code';

        const renderedCode =
            this.hljs === undefined
                ? `<pre class='nbv-unstyled-code-block'><code>${body}</code></pre>`
                : `<pre class='nbv-styled-code-block'><code class="hljs language-javascript">${this.hljs.highlight(body, { language: "js" }).value
                }</pre></code>`;

        cell.includeObserver(observer(observerID, codeID, pr.name, options.has('pin'), renderedCode));

        return `<div id='${id}' class='nbv-js-x'><div id='${observerID}'></div><div id='${codeID}'></div></div>`;
    }
};

const observer = (inspectorElementID: string, codeElementID: string, name: string, pin: boolean, renderedCode: string): Observer => {
    const inspectorControl = inspectorUpdater(inspectorElementID);
    const codeControl = updater(codeElementID);

    return {
        fulfilled: function (cell: Cell, value: any): void {
            inspectorControl.update((inspector: Inspector) => inspector.fulfilled(value, name));
            codeControl.update(() => pin ? renderedCode : "");
        },
        pending: function (cell: Cell): void {
            inspectorControl.update((inspector: Inspector) => inspector.pending());
            codeControl.update(() => pin ? renderedCode : "");
        },
        rejected: function (cell: Cell, value?: any): void {
            inspectorControl.update((inspector: Inspector) => inspector.rejected(value));
            codeControl.update(() => renderedCode);
        }
    };
}

