import type { Module } from "../Runtime";

export type Bindings = Map<string, any>;
export type Options = Map<string, string>;

export interface Plugin {
    name: string;
    code: string;
    setup?: (bindings: Bindings) => void,
    render: (module: Module, body: string, options: Options) => string | Node
}

export type Plugins = Array<Plugin>;