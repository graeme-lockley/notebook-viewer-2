import { parse } from "../Parser";
import type { Cell, Module, Observer } from "../Runtime";
import { divID, updater } from "./Helpers";
import type { Options, Plugin } from "./Plugin";

export const javascriptXAssert: Plugin = {
    name: 'js-x-assert',
    code: 'js-x-assert',

    render: (module: Module, body: string, options: Options): string | Node => {
        const pr = parse(body);

        const cell = module.cell();
        cell.redefine(pr.name, pr.dependencies, pr.result);

        const id = divID(cell);
        cell.includeObserver(observer(id, options.get('js-x-assert'), options.has('pin'), body));

        return `<div id='${id}' class='nbv-js-x-assert'>Nothing to show</div>`;
    }
};

const observer = (elementID: string, name: string | undefined, pin: boolean, body: string): Observer => {
    const update = updater(elementID);

    return {
        fulfilled: function (cell: Cell, value: any): void {
            update.update(() =>
                value ? `<div>Green: ${name}</div>${pin ? `<div>${body}</div>` : ``}` : `<div>Red: ${name}</div><div>${body}</div>`
            );
        },
        pending: function (cell: Cell): void {
            update.update(() =>
                `<div>Amber: ${name}</div>${pin ? `<div>${body}</div>` : ``}`
            );
        },
        rejected: function (cell: Cell, value?: any): void {
            update.update(() =>
                `<div>Error: ${name}</div><div>${value}</div><div>${body}</div>`
            );
        }
    };
}

