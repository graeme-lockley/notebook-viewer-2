import { parse } from "../Parser";
import type { NewObserver } from "../Runtime";
import { renderCode, valueUpdater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";

interface JavascriptXView extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

let javascriptXView_count = 0;

export const javascriptXView: JavascriptXView = {
    name: 'js-x-view',
    pattern: /^(js|javascript)\s+x\s+view\s*/,

    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module, body: string, options: Options): string | Node {
        const pr = parse(body);

        const viewCellID = `js-x-view-${javascriptXView_count++}`;
        const viewID = viewCellID + '-view';
        const codeID = viewCellID + '-code';

        const renderer: Renderer =
            () => renderCode(this.hljs, 'javascript', body);

        const cellObserver: NewObserver =
            observer(viewID, codeID, pr.name, options.has('pin'), renderer)

        const viewCell =
            module.variable(cellObserver);

        if (pr.name === undefined) {
            viewCell.define(pr.name, pr.dependencies, pr.result);
        } else {
            const viewCellName = `${pr.name}$$`;
            const valueCell = module.variable();
            viewCell.define(viewCellName, pr.dependencies, pr.result);
            valueCell.define(pr.name, [viewCellName], eval(`(${viewCellName}) => Generators.input(${viewCellName})`));
        }

        return `<div id='${viewCellID}' class='nbv-js-x-view'><div id='${viewID}'></div><div id='${codeID}'></div></div>`;
    }
};

const observer = (viewElementID: string, codeElementID: string, name: string, pin: boolean, renderer: Renderer): NewObserver => {
    const viewControl = valueUpdater(viewElementID);
    const codeControl = valueUpdater(codeElementID);

    return {
        fulfilled: function (value: any): void {
            viewControl(value);
            codeControl(pin ? renderer() : '');
        },
        pending: function (): void {
            viewControl('');
            codeControl(pin ? renderer() : '');
        },
        rejected: function (value?: any): void {
            viewControl(value);
            codeControl(renderer());
        }
    };
}
