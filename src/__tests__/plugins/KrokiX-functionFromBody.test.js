import { functionFromBody } from "../../plugins/KrokiX";

test("empty string returns () => ``", () => {
    expect(functionFromBody("")).toEqual("() => ``");
});

test("an arbitrary string returns thunk mapping onto the string", () => {
    expect(functionFromBody("hello world")).toEqual("() => `hello world`");
});

test("an arbitrary string with ${} expressions with no free variables returns thunk mapping onto the string with embedded expressions", () => {
    expect(functionFromBody("hello ${1 + 2} ${'this' + ' ' + 'works'} world"))
        .toEqual("() => `hello ${1 + 2} ${'this' + ' ' + 'works'} world`");
});

test("an arbitrary string with ${} expressions with free variables returns a function with the free variables passed as arguments", () => {
    expect(functionFromBody("hello ${a + b} ${b + c} world"))
        .toEqual("(a, b, c) => `hello ${a + b} ${b + c} world`");
});

test("an arbitrary string with an parse error in a ${} expression", () => {
    expect(functionFromBody("hello ${a + } world"))
        .toEqual("() => `hello {SyntaxError: Unexpected end of input (1:4)} world`");
});