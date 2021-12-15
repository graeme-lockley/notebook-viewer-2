"use strict";

import * as PC from "./pikchr.mjs";

export const fred = PC.default().then((module) => (markup, svgClass, flags, height, width) => {
    const cstring = module.ccall(
      "pikchr",
      "string",
      ["string", "string", "number", "number", "number"],
      [markup, svgClass, flags, height, width]
    );
    const result = JSON.parse(JSON.stringify(cstring)); // ensure a deep copy is made from the returned string
    module._free(cstring); // free returned string before returning copy to user
    return result;
  });
