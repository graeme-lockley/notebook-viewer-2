import { parse } from "../Parser";
import type { NewObserver } from "../Runtime";
import { renderCode, valueUpdater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";

interface JavascriptXAssert extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

let javascriptXAssert_count = 0;


export const javascriptXAssert: JavascriptXAssert = {
    name: 'js-x-assert',
    pattern: /^(js|javascript)\s+x\s+assert\s*/,

    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module, body: string, options: Options): string | Node {
        const pr =
            parse(body);

        const id =
            `js-x-assert-${javascriptXAssert_count++}`;

        const renderer: Renderer =
            () => renderCode(this.hljs, 'javascript', body);

        const cellObserver: NewObserver =
            observer(id, options.get('js-x-assert'), options.has('pin'), renderer);

        const cell =
            module.variable(cellObserver);

        cell.define(pr.name, pr.dependencies, pr.result);

        return `<div id='${id}' class='nbv-js-x-assert'>Nothing to show</div>`;
    }
};

const observer = (elementID: string, name: string | undefined, pin: boolean, renderer: Renderer): NewObserver => {
    const update = valueUpdater(elementID);

    return {
        fulfilled: function (value: any): void {
            update(value
                ? `<div class='nbv-passed'>${name}</div>${pin ? renderer() : ``}`
                : `<div class='nbv-failed'>${name}</div>${renderer()}`
            );
        },
        pending: function (): void {
            update(`<div class='nbv-pending'>${name}</div>${pin ? renderer() : ``}`);
        },
        rejected: function (value?: any): void {
            update(`<div class='nbv-error-title'>${name}</div><div class='nbv-error-body'>${value}</div>${renderer()}`);
        }
    };
}
