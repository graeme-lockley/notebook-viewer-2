import type { Cell } from "../Runtime";
import { Inspector } from "@observablehq/inspector";

export const divID = (cell: Cell, suffix?: string): string => `cell-${cell.id}${suffix === undefined ? "" : `-${suffix}`}`;

export const updater = (elementID: string) => {
    let last = Date.now();

    const updateDiv = (moment: number, content: () => string) => {
        const element = document.getElementById(elementID);

        if (element === null) return false;
        else if (last === moment) {
            element.innerHTML = content();
            return true;
        } else return true;
    };

    const updateDivLoop = (moment: number, content: () => string) => {
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
        update: (content: () => string) => {
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

