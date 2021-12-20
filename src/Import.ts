import { AbstractFile } from "@observablehq/stdlib";

// import { Runtime } from "@observablehq/runtime";

// export const load = (name: string) => {

// };

class FA extends AbstractFile {
    name: string;

    constructor(name: string) {
        super(name, name);
    }

    url() {
        return this.name;
    }
}

export const loadSource = (url: string): FA =>
    new FA(url);