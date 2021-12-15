import { renderCode, valueUpdater } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";
import * as pikchr from "../pikchr"

interface PikchrX extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

const pikchrRenderer = pikchr.fred;

let pikchrX_count = 0;

export const pikchrX: PikchrX = {
    name: 'pikchr x',
    pattern: /^pikchr\s+x\s*/,

    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module, body: string, options: Options): string | Node {
        const id = `pikchr-x-${pikchrX_count++}`;
        const observerID = id + '-value';
        const codeID = id + '-code';

        const pin = options.has("pin");

        const observerUpdated = valueUpdater(observerID);

        const renderer: Renderer =
            () => renderCode(this.hljs, 'plaintext', body);

        pikchrRenderer.then(pik => {
            const svg = pik(body, "pikchr", 0, 1, 1);
            const m = svg.match(/viewBox=\"([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+)\"/)
            
            const svgp = svg.replace('"pikchr"', '"pikchr" width="100%" height="100%"');
            observerUpdated(m === null ? svg : svg.replace(`"pikchr"', '"pikchr" width="${m[3]}" height="${m[4]}"`));
        });

        return `<div id='${id}' class='nbv-pikchr-x'><div id='${observerID}'></div>${pin ? `<div id='${codeID}'>${renderer()}</div>` : ''}</div>`;
    }
};
