import { parse } from "../Parser";
import type { Cell, Module, Observer } from "../Runtime";
import { divID, renderCode, updater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";

interface JavascriptXView extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

export const javascriptXView: JavascriptXView = {
    name: 'js-x-view',
    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module: Module, body: string, options: Options): string | Node {
        const pr = parse(body);

        const viewCell = module.cell();
        if (pr.name === undefined) {
            viewCell.redefine(pr.name, pr.dependencies, pr.result);
        } else {
            const viewCellName = `${pr.name}$$`;
            const valueCell = module.cell();
            viewCell.redefine(viewCellName, pr.dependencies, pr.result);
            valueCell.redefine(pr.name, [viewCellName], eval(`(${viewCellName}) => Generators.input(${viewCellName})`));
        }

        const viewCellID = divID(viewCell);
        const viewID = viewCellID + '-view';
        const codeID = viewCellID + '-code';

        const renderer: Renderer =
            () => renderCode(this.hljs, 'javascript', body);

        viewCell.includeObserver(observer(viewID, codeID, pr.name, options.has('pin'), renderer));

        return `<div id='${viewCellID}' class='nbv-js-x-view'><div id='${viewID}'></div><div id='${codeID}'></div></div>`;
    }
};

const observer = (viewElementID: string, codeElementID: string, name: string, pin: boolean, renderer: Renderer): Observer => {
    const inspectorControl = updater(viewElementID);
    const codeControl = updater(codeElementID);

    return {
        fulfilled: function (cell: Cell, value: any): void {
            inspectorControl.update(() => value);
            codeControl.update(() => pin ? renderer() : "");
        },
        pending: function (cell: Cell): void {
            inspectorControl.update(() => '');
            codeControl.update(() => pin ? renderer() : "");
        },
        rejected: function (cell: Cell, value?: any): void {
            inspectorControl.update(() => value);
            codeControl.update(renderer);
        }
    };
}
