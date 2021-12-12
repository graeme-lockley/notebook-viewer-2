import type { Module } from "../Runtime";
import { renderCode } from "./Helpers";
import type { Bindings, Options, Plugin } from "./Plugin";

interface Javascript extends Plugin {
    hljs: any | undefined;
}

type Renderer = () => string;

export const javascript: Javascript = {
    name: 'js',
    hljs: undefined,

    setup: function (bindings: Bindings) {
        this.hljs = bindings.get('hljs');
    },

    render: function (module: Module, body: string, options: Options): string | Node {
        return renderCode(this.hljs, 'javascript', body);
    }
};