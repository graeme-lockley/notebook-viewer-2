const logger = {
    info(msg: string) {
        // console.log(`Runtime: Info: ${msg}`);
    },

    error(msg: string) {
        console.log(`Runtime: Error: ${msg}`);
    }
};

const ITERATION_SLEEP = 100;

export interface Observer {
    fulfilled(cell: Cell, value: any): void;
    pending(cell: Cell): void;
    rejected(cell: Cell, value?: any): void;
};

export class Runtime {
    builtins: Module | undefined;

    modules: Array<Module>;
    observer: Observer;

    constructor() {
        this.modules = [];
        this.observer = runtimeObserver(this);
    }

    module() {
        const module = new Module(this);
        this.modules.push(module);

        return module;
    }

    registerBuiltins(builtins: Module | undefined) {
        this.builtins = builtins;
    }
}

const updateModuleDependencies = (module: Module, name: string) => {
    for (const dependentCell of Object.values(module.cells)) {
        if (dependentCell.dependencies.includes(name))
            dependentCell.updateBindingsAndVerify();
    }
}

const updateDependencies = (runtime: Runtime, cell: Cell) => {
    const name = cell.name;

    if (name !== undefined) {
        if (cell.module === runtime.builtins)
            runtime.modules.forEach(module => {
                if (!module.has(name))
                    updateModuleDependencies(module, name);
            });
        else
            updateModuleDependencies(cell.module, name);
    }
}

const runtimeObserver = (runtime: Runtime) => ({
    fulfilled(cell: Cell, value: any): void {
        updateDependencies(runtime, cell);
    },

    pending(cell: Cell): void {
        updateDependencies(runtime, cell);
    },

    rejected(cell: Cell, value?: any): void {
        updateDependencies(runtime, cell);
    }
});

export enum CalculationPolicy {
    Dormant,
    Dependent,
    Always
}

enum CellStatus {
    Okay,
    DuplicateName,
    DependencyCycle,
    UndefinedName
}

export class Module {
    runtime: Runtime;
    bindings: { [key: string]: Cell };
    cells: { [key: number]: Cell };
    cellID: number;

    constructor(runtime: Runtime) {
        this.runtime = runtime;
        this.bindings = {};
        this.cells = {};
        this.cellID = 0;
    }

    private newCellID(): number {
        const cellID = this.cellID;
        this.cellID += 1;
        return cellID;
    }

    cell(name?: string | undefined, policy?: CalculationPolicy): Cell {
        const cellID = this.newCellID();
        const cell = new Cell(cellID, this, policy);

        this.cells[cellID] = cell;
        if (name !== undefined)
            cell.changeName(name);

        cell.includeObserver(this.runtime.observer);

        return cell;
    }

    removeCell(cell: Cell): void {
        delete this.cells[cell.id];
        this.cellRenamed();
    }

    cellRenamed() {
        // verify that names are:
        //   - unique
        //   - no cycles

        const duplicates = new Set<string>();
        const dependencies = new Map<string, Set<string>>();

        this.bindings = {};

        for (const cell of Object.values(this.cells))
            if (cell.name !== undefined)
                if (this.bindings[cell.name] === undefined) {
                    this.bindings[cell.name] = cell;
                    dependencies.set(cell.name, new Set(cell.dependencies));
                }
                else
                    duplicates.add(cell.name);

        let anyChanges = true;
        while (anyChanges) {
            anyChanges = false;

            dependencies.forEach((value, key) => {
                let result = value;

                value.forEach((e) => {
                    const newDependencies = dependencies.get(e);

                    if (newDependencies !== undefined)
                        result = union(result, newDependencies);
                })

                if (result.size !== value.size) {
                    anyChanges = true;
                    dependencies.set(key, result);
                }
            });
        }

        // logger.info("Dependencies:");
        // for (const [key, value] of dependencies.entries()) {
        //     logger.info(`  ${key}: ${[...value]}`);
        // }        

        for (const cell of Object.values(this.cells)) {
            const name = cell.name;

            if (name === undefined)
                cell.setStatus(CellStatus.Okay);
            else if (duplicates.has(name))
                cell.setStatus(CellStatus.DuplicateName, 'Duplicate name');
            else {
                const deps = dependencies.get(name);

                if (deps !== undefined && deps.has(name))
                    cell.setStatus(CellStatus.DependencyCycle, 'Dependency cycle');
                else
                    cell.setStatus(CellStatus.Okay);
            }
        }

        this.resetDependentPolicies();
    }

    resetDependentPolicies() {
        const resetPolicies = (module: Module | undefined) => {
            if (module !== undefined) {
                for (const cell of Object.values(this.cells)) {
                    if (cell.policy === CalculationPolicy.Dependent)
                        cell.policy = CalculationPolicy.Dormant;
                }

                const definedCells = (cellNames: Array<string>): Array<Cell> =>
                    cellNames
                        .map((dep) => this.find(dep))
                        .filter((c) => c !== undefined) as Array<Cell>;

                const setDependentPolicies = (cell: Cell): void => {
                    if (cell.policy === CalculationPolicy.Dormant) {
                        cell.policy = CalculationPolicy.Dependent;
                        definedCells(cell.dependencies).forEach(setDependentPolicies);
                    }
                }

                for (const cell of Object.values(this.cells)) {
                    if (cell.policy === CalculationPolicy.Always)
                        definedCells(cell.dependencies).forEach(setDependentPolicies);
                }
            }
        };

        const updateBindingsAndVerify = (module: Module | undefined) => {
            if (module !== undefined) {
                for (const cell of Object.values(module.cells)) {
                    cell.updateBindingsAndVerify();
                }
            }
        }

        resetPolicies(this.runtime.builtins);
        resetPolicies(this);
        updateBindingsAndVerify(this.runtime.builtins);
        updateBindingsAndVerify(this);
    }

    find(id: number | string): Cell | undefined {
        const result = typeof id === "string"
            ? this.bindings[id]
            : this.cells[id];

        return (result !== undefined)
            ? result
            : this.runtime.builtins !== undefined && this !== this.runtime.builtins
                ? this.runtime.builtins.find(id)
                : undefined;
    }

    has(id: number | string): boolean {
        const result = typeof id === "string"
            ? this.bindings[id]
            : this.cells[id];

        return (result !== undefined);
    }
}

enum ResultType {
    Error = 'ERROR',
    Dormant = 'DORMANT',
    Pending = 'PENDING',
    Done = 'DONE'
}

interface Result {
    type: ResultType;
    value: any;
}

export class Cell {
    id: number;
    name: string | undefined;
    module: Module;
    dependencies: Array<string>;
    value: any;
    observers: Array<Observer>;
    bindings: { [key: string]: Cell };
    sequence: number;
    status: CellStatus;
    policy: CalculationPolicy;
    result: Result;

    constructor(id: number, module: Module, policy?: CalculationPolicy) {
        this.module = module;
        this.id = id;
        this.dependencies = [];
        this.value = undefined;
        this.observers = [];
        this.bindings = {};
        this.sequence = 0;
        this.status = CellStatus.Okay;
        this.policy = policy === undefined ? CalculationPolicy.Always : policy;
        this.result = { type: ResultType.Pending, value: undefined };

        this.updateBindingsAndVerify();
    }

    redefine(name: string, dependencies: Array<string>, value: any): void {
        this.dependencies = dependencies;
        this.value = value;

        if (this.name !== name)
            this.name = name;

        this.module.cellRenamed();
    }

    changeName(name: string): void {
        if (this.name !== name) {
            this.name = name;
            this.module.cellRenamed();
        }
    }

    define(dependencies: Array<string>, value: any): void {
        this.dependencies = dependencies;
        this.value = value;
        this.module.cellRenamed();
    }

    remove(): void {
        this.module.removeCell(this);
        this.dependencies = [];
        this.value = undefined;
        this.observers = [];
        this.bindings = {};
    }

    setStatus(status: CellStatus, reason?: string | undefined): void {
        const oldStatus = this.status;

        this.status = status;
        if (status !== CellStatus.Okay)
            this.result = { type: ResultType.Error, value: reason };

        if (status === CellStatus.Okay && oldStatus !== CellStatus.Okay)
            this.updateBindingsAndVerify();
        else if (status !== CellStatus.Okay && oldStatus === CellStatus.Okay)
            this.notify();
    }

    setPolicy(policy: CalculationPolicy): void {
        if (this.policy !== policy) {
            this.policy = policy;
            this.module.resetDependentPolicies();
        }
    }

    updateBindingsAndVerify() {
        this.bindings = {};

        for (const dependency of this.dependencies) {
            const cell = this.module.find(dependency);

            if (cell !== undefined && cell.result.type === ResultType.Done)
                this.bindings[dependency] = cell.result.value;
        }

        this.verifyBindings();
    }

    includeObserver(observer: Observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
            this.notifyObserver(observer);
        }
    }

    removeObserver(observer: Observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1)
            this.observers.splice(index, 1);
    }

    private verifyBindings() {
        if (this.status === CellStatus.Okay) {
            this.sequence += 1;
            const currentSequence = this.sequence;

            const updateResult = (type: ResultType, value: any) => {
                if (this.result.type !== type || this.result.value !== value) {
                    this.result = { type, value };
                    this.notify()
                }
            };

            const verifyGeneratorValue = (value: any) => {
                const nextValue = value.next();

                const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

                const nextValueValue = isPromise(nextValue.value)
                    ? nextValue.value
                    : delay(ITERATION_SLEEP).then(_ => Promise.resolve(nextValue.value));

                nextValueValue.then((val: any) => {
                    if (currentSequence === this.sequence && val !== undefined) {
                        verifyValue(val);
                        if (!nextValue.done)
                            verifyGeneratorValue(value);
                    }
                }).catch((err: any) => {
                    if (this.sequence === currentSequence)
                        updateResult(ResultType.Error, err);
                });
            }

            const verifyValue = (value: any) => {
                if (value === undefined)
                    updateResult(ResultType.Done, value);
                else if (value.next !== undefined)
                    verifyGeneratorValue(value,)
                else if (isPromise(value)) {
                    updateResult(ResultType.Pending, value);
                    value.then((actual: any) => {
                        if (this.sequence === currentSequence)
                            updateResult(ResultType.Done, actual);
                        else
                            logger.info(`Dropping promise: ${this.name}: ${actual}`);
                    }).catch((err: any) => {
                        if (this.sequence === currentSequence)
                            updateResult(ResultType.Error, err);
                        else
                            logger.info(`Dropping error promise: ${this.name}: ${err}`);
                    });
                } else
                    updateResult(ResultType.Done, value);
            };

            if (this.policy === CalculationPolicy.Dormant)
                updateResult(ResultType.Dormant, undefined);
            else if (this.dependencies.length === 0 && typeof this.value !== "function")
                verifyValue(this.value);
            else if (this.dependencies.length === objectSize(this.bindings)) {
                try {
                    verifyValue(this.value.apply(null, this.dependencies.map(n => this.bindings[n])));
                } catch (e) {
                    updateResult(ResultType.Error, e);
                }
            } else {
                const unknownNames = [];

                for (const dependency of this.dependencies) {
                    const cell = this.module.find(dependency);

                    if (cell === undefined)
                        unknownNames.push(dependency)
                }

                if (unknownNames.length === 0)
                    updateResult(ResultType.Pending, this.value);
                else
                    updateResult(ResultType.Error, `Undefined name: ${unknownNames.join(", ")}`);
            }
        }
    }

    private notify() {
        this.observers.forEach(observer => this.notifyObserver(observer));
    }

    private notifyObserver(observer: Observer) {
        try {
            if (this.result.type === ResultType.Done)
                observer.fulfilled(this, this.result.value);
            else if (this.result.type === ResultType.Pending)
                observer.pending(this);
            else
                observer.rejected(this, this.result.value);
        } catch (e) {
            logger.error(`notifyObserver: Error: ${this.name}: ${observer}: ${e}`);
        }
    }
}

const objectSize = (obj: any) => {
    let size = 0;

    for (const key in obj) {
        if (obj.hasOwnProperty(key))
            size += 1;
    }

    return size;
};

const isPromise = (value: any) =>
    value && typeof value.then === "function";

const union = <A>(setA: Set<A>, setB: Set<A>): Set<A> => {
    const _union = new Set<A>(setA)

    setB.forEach((elem) => {
        _union.add(elem);
    })

    return _union
}