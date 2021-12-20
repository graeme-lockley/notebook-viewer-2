import { Runtime } from "@observablehq/runtime";
import { importContent } from "../Import";

test("Empty content results in an empty module", () => {
    const content = '';

    const runtime = new Runtime();
    const module = runtime.module();
    importContent(content, module);

    expect(module._scope.size).toEqual(0);
});

