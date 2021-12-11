import type { Cell, Module } from "./Runtime";
import { parseCell } from "@observablehq/parser/src/parse.js"


export type Block = Assignment | View | AssignmentView;

export interface Assignment {
    type: 'Assignment';
    name?: string;
    cell: Cell;
    code: string;
}

export interface View {
    type: 'View';
    viewCell: Cell;
    code: string;
}

export interface AssignmentView {
    type: 'AssignmentView';
    name: string;
    viewCell: Cell;
    valueCell: Cell;
    code: string;
}

class BlockFactory {
    private module: Module;
    private idCount: number = 0;

    constructor(module: Module) {
        this.module = module;
    }

    block(code: string, is: Map<string, string>): Block {
        const ast = parseCell(code);

        console.log("AST: ", ast);

        const name = ast.id !== null && ast.id.type === "Identifier" ? ast.id.name : undefined;
        const referencedNames = ast.references.map((dep: { name: string }) => dep.name);
        const dependencies = uniqueElementsInStringArray(referencedNames);
        const body = code.slice(ast.body.start, ast.body.end);

        const fullBody = `(${dependencies.join(", ")}) => ${body}`;

        // eslint-disable-next-line
        const result = eval(fullBody);

        if (is.has('view')) {
            const viewCell = this.module.cell();

            if (name === undefined) {
                viewCell.redefine(name, dependencies, result);

                return { type: 'View', viewCell, code };
            } else {
                viewCell.redefine(name + "$$", dependencies, result);

                const valueCell = this.module.cell();
                valueCell.redefine(name, [name + "$$"], eval(`(${name}$$) => Generators.input(${name}$$)`));
                return { type: 'AssignmentView', viewCell, valueCell, name, code };
            }
        } else {
            const cell = this.module.cell();

            cell.redefine(name, dependencies, result);

            return { type: 'Assignment', cell, name, code };
        }
    }
}

const uniqueElementsInStringArray = (inp: Array<string>): Array<string> =>
    Array.from(new Set(inp))

export const parseInfoString = (infostring: string): Map<string, string> => {
    return new Map(infostring.split("|").map(s => s.trim()).map(s => {
        const i = s.indexOf(' ');

        return i == -1 ? [s, ''] : [s.slice(0, i), s.slice(i + 1).trim()];
    }));
}

export const mkFactory = (module: Module): BlockFactory =>
    new BlockFactory(module);