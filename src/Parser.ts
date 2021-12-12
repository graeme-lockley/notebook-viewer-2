import { parseCell } from "@observablehq/parser/src/parse.js"

export interface ParseResult {
    name?: string;
    dependencies: Array<string>;
    body: string;
    fullBody: string;
    result: () => any
}

export const parse = (code: string): ParseResult => {
    const ast = parseCell(code);

    // console.log("AST: ", ast);

    const name = ast.id !== null && ast.id.type === "Identifier" ? ast.id.name : undefined;
    const referencedNames = ast.references.map((dep: { name: string }) => dep.name);
    const dependencies = uniqueElementsInStringArray(referencedNames);
    const body = code.slice(ast.body.start, ast.body.end);

    const fullBody = `(${dependencies.join(", ")}) => ${body}`;

    // eslint-disable-next-line
    const result = eval(fullBody);

    return { name, dependencies, body, fullBody, result };
}

const uniqueElementsInStringArray = (inp: Array<string>): Array<string> =>
    Array.from(new Set<string>(inp))

export const parseInfoString = (infostring: string): Map<string, string> => {
    return new Map(infostring.split("|").map(s => s.trim()).map(s => {
        const i = s.indexOf(' ');

        return i == -1 ? [s, ''] : [s.slice(0, i), s.slice(i + 1).trim()];
    }));
}
