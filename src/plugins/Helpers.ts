import type { Cell } from "../Runtime";

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

const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

