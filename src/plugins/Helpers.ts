import type { Cell } from "../Runtime";
import { Inspector } from "@observablehq/inspector";

export const divID = (cell: Cell, suffix?: string): string => `cell-${cell.id}${suffix === undefined ? "" : `-${suffix}`}`;

export const updater = (elementID: string) => {
    let last = Date.now();

    const updateDiv = (moment: number, content: () => string | Node) => {
        const element = document.getElementById(elementID);

        if (element === null) return false;
        else if (last === moment) {
            const c = content();

            if (c instanceof Node) {
                element.childNodes.forEach((child) =>
                    element.removeChild(child)
                );

                element.appendChild(c);
            }
            else
                element.innerHTML = c;
            return true;
        } else return true;
    };

    const updateDivLoop = (moment: number, content: () => string | Node) => {
        Promise.resolve(updateDiv(moment, content)).then((r) => {
            if (!r) delay(100).then(() => updateDivLoop(moment, content));
        });
    }

    const snapshot = (): number => {
        const moment = Date.now();
        last = moment;
        return moment;
    };


    return {
        update: (content: () => string | Node) => {
            updateDivLoop(snapshot(), content)
        }
    }
};

export const inspectorUpdater = (elementID: string) => {
    let last = Date.now();
    let inspector = undefined;

    const updateDiv = (moment: number, gen: (inspector: Inspector) => void) => {
        const element = document.getElementById(elementID);

        if (element === null) return false;
        else if (last === moment) {
            if (inspector === undefined)
                inspector = new Inspector(element);
            gen(inspector);
            return true;
        } else return true;
    };

    const updateDivLoop = (moment: number, gen: (inspector: Inspector) => void) => {
        Promise.resolve(updateDiv(moment, gen)).then((r) => {
            if (!r) delay(100).then(() => updateDivLoop(moment, gen));
        });
    }

    const snapshot = (): number => {
        const moment = Date.now();
        last = moment;
        return moment;
    };


    return {
        update: (gen: (inspector: Inspector) => void) => {
            updateDivLoop(snapshot(), gen)
        }
    }
};

const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const renderCode = (hljs, language: string, body: string): string =>
    hljs === undefined
        ? `<pre class='nbv-unstyled-code-block'><code>${body}</code></pre>`
        : `<pre class='nbv-styled-code-block'><code class="hljs language-${language}">${hljs.highlight(body, { language }).value
        }</pre></code>`;
