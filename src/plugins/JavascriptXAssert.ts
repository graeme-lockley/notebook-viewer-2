import { parse } from "../Parser";
import type { Cell, Module, Observer } from "../Runtime";
import { divID, renderCode, updater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";

interface JavascriptXAssert extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

export const javascriptXAssert: JavascriptXAssert = {
    name: 'js-x-assert',
    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module: Module, body: string, options: Options): string | Node {
        const pr = parse(body);

        const cell = module.cell();
        cell.redefine(pr.name, pr.dependencies, pr.result);

        const id = divID(cell);
        const renderer: Renderer =
            () => renderCode(this.hljs, 'javascript', body);

        cell.includeObserver(observer(id, options.get('js-x-assert'), options.has('pin'), renderer));

        return `<div id='${id}' class='nbv-js-x-assert'>Nothing to show</div>`;
    }
};

const observer = (elementID: string, name: string | undefined, pin: boolean, renderer: Renderer): Observer => {
    const update = updater(elementID);

    return {
        fulfilled: function (cell: Cell, value: any): void {
            update.update(() =>
                value
                    ? `<div class='nbv-passed'>${name}</div>${pin ? renderer() : ``}`
                    : `<div class='nbv-failed'>${name}</div>${renderer()}`
            );
        },
        pending: function (cell: Cell): void {
            update.update(() =>
                `<div class='nbv-pending'>${name}</div>${pin ? renderer() : ``}`
            );
        },
        rejected: function (cell: Cell, value?: any): void {
            update.update(() =>
                `<div class='nbv-error-title'>${name}</div><div class='nbv-error-body'>${value}</div>${renderer()}`
            );
        }
    };
}
