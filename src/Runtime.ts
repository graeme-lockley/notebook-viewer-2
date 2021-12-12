export interface NewObserver {
    fulfilled(value: any): void;
    pending(): void;
    rejected(value?: any): void;
};
