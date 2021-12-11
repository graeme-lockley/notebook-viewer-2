# String Calculator Kata

I have enjoyed this kata and seen many implementations from junior to experienced engineers.  I love it when peeps perform this kata as a live coding experience; if you have not attempted this as a live coding experience then give it a go.  You will be surprised how doing so tends to cause your brain to turn to mush and you quickly become self conscious with respect to your typing skills.

This version of the kata will be a little different in that I am showing off a single implementation written as this note.  As I have developed this note I have constantly gone back and refactored the note so that it can be read once as a coherent narrative.

This implementation has a number of features that make it quite cool:

- The tests are written as generative tests - in other words these tests generate data and validate that `add` returns the expected results based on generated data.
- The tests are reactive meaning that variables can be changed and the entire test suite is automatically re-run.

## `add`

This section is the actual `add` function and the function under test.  Rather than squashing all of the code into a single function this code is split out into multiple functions.  This splitting out has the benefit of allowing me to add some narrative around each of the embedded functions and attaching simple tests to verify and demonstrate their behavior.

``` js x | pin | export
add = (input) => {
    const tokens = input.startsWith("//") 
        ? split(input.slice(4), input[2])
        : split(input, /[,\n]/);

    const numbers = tokens.map(t => parseInt(t));

    if (numbers.some(isNegative))
        throw numbers.filter(isNegative).join(", ")
    else
        return sum(numbers);
}
```

``` js x | pin
split = (input, separators) => 
    input === "" 
        ? []
        : input.split(separators)
```

``` js x | pin
isNegative = (n) => n < 0;
```

``` js x | pin
sum = (ns) =>
	ns.reduce((x, y) => x + y, 0)
```

``` js-x-assert Sum over an empty lists returns 0
sum([]) === 0
```

``` js-x-assert Sum over a single element list returns that value
sum([1]) === 1
```

``` js-x-assert Sum over a multiple elements within a list returns their sum
sum([1, 2, 3]) === 6
```

## Test Scenarios

Before we layout the individual tests we need a handful of generators.

### Generators

Firstly we need a generator to give us an endless supply of numbers:

``` js x
NUMBERS = () => integerInRange(-10000, 10000)
```

``` js x
INTEGERS = () => integerInRange(-10000, 10000)
```

``` js x
POSITIVE_INTEGERS = () => integerInRange(0, 10000)
```

The second generator is used to create valid single character separators.

``` js x | pin
SEPARATORS = filter(map(() => integerInRange(32, 127), c => String.fromCharCode(c)), c => "0123456789-".indexOf(c) === -1)
```

To give it a feel here is a collection of separators produced using this generator.

``` js x
Array(50).fill(0).map(SEPARATORS)
```

``` js x
LIST_OF_INTEGERS_WITH_ONE_NEGATIVE =
    filter(listOf(INTEGERS), ns => ns.filter(isNegative).length > 0)
```

### Scenarios

The first scenario is a comma or newline separated string of numbers returning their sum. It is worth noting that, because `listOf` will return an empty list as well as lists that contain a single element, the scenarios of the empty string and a single value are encapsulated within this scenario.

``` js-x-assert Comma or newline separated string of numbers will return the sum
forall(listOf(POSITIVE_INTEGERS), (ns) =>
    add(joinString(ns, [",", "\n"])) === sum(ns)
)
```

The second scenario is a user selected character separates numbers.

``` js-x-assert numbers separated with a custom single character separator returns the sum
forall2(listOf(POSITIVE_INTEGERS), SEPARATORS, (ns, sep) =>
    add(`//${sep}\n${joinString(ns, [sep])}`) === sum(ns)
)
```

The third scenario is, if there are any negative integers, then an exception must be thrown containing all of the negatives.

``` js-x-assert numbers with at least one negative should throw an exception listing all of the negatives
forall(LIST_OF_INTEGERS_WITH_ONE_NEGATIVE, (ns) =>
    catchException(() => add(ns.join(","))) === ns.filter(n => n < 0).join(", ")
)
```

The function `joinString` is a useful helper accepting a list of values (`ns`) and a list of separators (`seps`) returning a string composed by joining all of the values together whilst randomly choosing an element from the separators and placing it between every two elements

``` js x
joinString = (ns, seps) =>
	ns.length === 0 ? ""
	: ns.length === 1 ? ns[0].toString()
    : ns[0].toString() + ns.slice(1).map(v => seps[integerInRange(0, seps.length - 1)] + v.toString()).join("")
```

## Generative Testing Framework

The following are the functions that collectively make up the generative testing framework.  A generator is a [thunk](https://en.wikipedia.org/wiki/Thunk) which, when invoked, will return a value.  Using the function `integerInRange` we can create a thunk called `numbers` which, when called, will return a value in the range 0 to 1000 inclusive:

``` js x | pin
numbers = () => integerInRange(0, 1000)
```

To show how this can work we can call this generator 20 times and get a list of random numbers:

``` js x | pin
Array(20).fill(0).map(numbers)
```

Returning to `integerInRange` it returns a random number in the range (inclusive) of the two passed arguments.

``` js x | pin
integerInRange = (min, max) =>
	Math.floor(Math.random() * (max - min + 1)) + min
```

From that we can define the `forall` function which accepts a generator and a predicate.  This function produces ${TEST_ITERATIONS} value(s) using `gen` and then applies this value to the predicate `p`.  If this application returns `false` then an exception is thrown otherwise this function returns `true`.

``` js x | pin
forall = (gen, p) => {
  let lp = 0;
  while (lp < TEST_ITERATIONS) {
    const v = gen();
    if (!p(v))
      throw new Error(v);
    
    lp += 1;
  }
  
  return true;
}
```

``` js x | pin
forall2 = (gen1, gen2, p) => {
  let lp = 0;
  while (lp < TEST_ITERATIONS) {
    const v1 = gen1();
    const v2 = gen2();
    if (!p(v1, v2))
      throw new Error([v1, v2]);
    
    lp += 1;
  }
  
  return true;
}
```

### Composition Functions

We are now able to produce a collection of generator composition functions.

Given a generator, `listOf` will return a generator which, when applied, will return a list consisting of 0 to ${DEFAULT_LIST_LENGTH} elements.  Each element is created using the passed generator.

``` js x | viewof
// DEFAULT_LIST_LENGTH = Inputs.range([1, 10000], {value: 10, step: 1, label: "List Length"})
DEFAULT_LIST_LENGTH = 10
```

``` js x | pin
listOf = (gen) =>
	() => {
    const length = integerInRange(0, DEFAULT_LIST_LENGTH);
    return Array(length).fill(0).map(gen);
  }
```

Given a generator and a mapping function, `map` will transform each generated value using the mapping function.

``` js x | pin
map = (gen, f) =>
  () => f(gen())
```

Given a generator and a predicate, `filter` will produce values from the generator which return true when applied to the predicate.

``` js x | pin
filter = (gen, p) => () => {
  let lp = 0;
  while (true) {
    const result = gen();
    if (p(result))
      return result;

    lp += 1;
    if (lp > 100) {
      throw new Error("Filter failed: too many iterations");
    }
  }
}
```

### Helper Functions

Given a thunk, `catchException` will call the thunk, catch any exceptions that the thunk raises and returns the exception.  It has the added feature that if the thunk did not raise an exception then it'll raise it's owns exception.

``` js x
catchException = (thunk) => {
    try {
        thunk();
        throw new Error("No exception raised in catchException");
    } catch (e) {
        return e;
    }
}
```

``` js x | viewof
// TEST_ITERATIONS = Inputs.range([1, 100000], {value: 1000, step: 1, label: "Test Iterations"})
TEST_ITERATIONS = 1000
```

