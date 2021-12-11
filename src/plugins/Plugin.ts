import type { Module } from "../Runtime";
export type Options = Map<string, string>;

export interface Plugin {
    name: string;
    code: string;
    render: (module: Module, body: string, options: Options) => string | Node
}