import { Runtime } from "@observablehq/runtime";
import { importContent } from "../Import";

test("Empty content results in an empty module", () => {
    const content = '';

    const runtime = new Runtime();
    const module = runtime.module();
    importContent(content, module);

    expect(module._scope.size).toEqual(0);
});

test("Content without any bindings results in an empty module", () => {
    const content = `# Heading

Some text
`;

    const runtime = new Runtime();
    const module = runtime.module();
    importContent(content, module);

    expect(module._scope.size).toEqual(0);
});

test("A non-executable code block is not added to the module", () => {
    const content = `# Heading

Some text

\`\`\` js
x = 10
\`\`\`

\`\`\` kroki x svg
\`\`\`
`;

    const runtime = new Runtime();
    const module = runtime.module();
    importContent(content, module);

    expect(module._scope.size).toEqual(0);
});