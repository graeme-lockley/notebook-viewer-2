import { parse } from "../Parser";
import type { Observer } from "../Runtime";
import { valueUpdater, inspectorUpdater, renderCode } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";
import type { Inspector } from "@observablehq/inspector";

interface JavascriptX extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

let javascriptX_count = 0;

export const javascriptX: JavascriptX = {
    name: 'js-x',
    pattern: /^(js|javascript)\s+x\s*/,

    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module, body: string, options: Options): string | Node {
        const pr = parse(body);

        const id = `js-x-${javascriptX_count++}`;
        const observerID = id + '-observer';
        const codeID = id + '-code';

        const renderer: Renderer =
            () => renderCode(this.hljs, 'javascript', body);

        const variableObserver =
            observer(observerID, codeID, pr.name, options.has('pin'), renderer);

        module
            .variable(variableObserver)
            .define(pr.name, pr.dependencies, pr.result);

        return `<div id='${id}' class='nbv-js-x'><div id='${observerID}'></div><div id='${codeID}'></div></div>`;
    }
};

const observer = (inspectorElementID: string, codeElementID: string, name: string, pin: boolean, renderer: Renderer): Observer => {
    const inspectorControl = inspectorUpdater(inspectorElementID);
    const codeControl = valueUpdater(codeElementID);

    return {
        fulfilled: function (value: any): void {
            inspectorControl((inspector: Inspector) => inspector.fulfilled(value, name));
            codeControl(pin ? renderer() : '');
        },
        pending: function (): void {
            inspectorControl((inspector: Inspector) => inspector.pending());
            codeControl(pin ? renderer() : '');
        },
        rejected: function (value?: any): void {
            inspectorControl((inspector: Inspector) => inspector.rejected(value));
            codeControl(renderer());
        }
    };
}
