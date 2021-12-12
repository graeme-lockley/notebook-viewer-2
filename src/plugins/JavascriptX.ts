import { parse } from "../Parser";
import type { Cell, Module, Observer } from "../Runtime";
import { divID, valueUpdater, inspectorUpdater, renderCode } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";
import type { Inspector } from "@observablehq/inspector";

interface JavascriptX extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

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
        const observerID = divID(cell, 'observer');
        const codeID = divID(cell, 'code');

        const renderer: Renderer =
            () => renderCode(this.hljs, 'javascript', body);

        cell.includeObserver(observer(observerID, codeID, pr.name, options.has('pin'), renderer));

        return `<div id='${id}' class='nbv-js-x'><div id='${observerID}'></div><div id='${codeID}'></div></div>`;
    }
};

const observer = (inspectorElementID: string, codeElementID: string, name: string, pin: boolean, renderer: Renderer): Observer => {
    const inspectorControl = inspectorUpdater(inspectorElementID);
    const codeControl = valueUpdater(codeElementID);

    return {
        fulfilled: function (cell: Cell, value: any): void {
            inspectorControl((inspector: Inspector) => inspector.fulfilled(value, name));
            codeControl(pin ? renderer() : '');
        },
        pending: function (cell: Cell): void {
            inspectorControl((inspector: Inspector) => inspector.pending());
            codeControl(pin ? renderer() : '');
        },
        rejected: function (cell: Cell, value?: any): void {
            inspectorControl((inspector: Inspector) => inspector.rejected(value));
            codeControl(renderer());
        }
    };
}
