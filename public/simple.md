# Simple Reactive Components

This section contains basic reactive elements.

This is just a formatted piece of code rendered verbatim without an calculation.

``` js
centuary = 100
```

This is a piece of code that is executed so you will see the value however it isn't pinned meaning you will be unable to see the calculation.

``` js x
value = {
    const items = [1, 2, 3, 4, 5];
    const double = (x) => x + x;

    return items.map(double);
}
```

This code is evaluated, the result displayed and the code is made visible directly below.  What's cool is this value is reactive and dependent on `value`.

``` js x | pin
{
    const square = (x) => x * x;

    return value.map(square);
}
```

We can also add some assertions - a simple way of adding tests into notebooks.  Let's create the artificial function `add`:

``` js x | pin
add = (a, b) => {
    if (a < 0 || b < 0)
        throw new Error("Precondition failed");

    return a + b;
}
```

Now let's add some test code.  The first test hides the code whilst the following will both show the code.

``` js x | assert Given positive values then we get the sum of both values back
add(1, 2) === 3
```

``` js x | pin | assert Given a negative argument then all hell breaks loose
add(-1, 2) === 1
```

``` js x | pin | assert Given a silly mistake this test should fail
add(1, 2) === 2
```

Now let's start to do something else that it is quite cool - let's input a range using a visual control from Observablehq's Input library:

``` js x | view
start = Inputs.date({label: "Start date", value: "1982-03-06T02:30"})
```

``` js x | view
TestIterations = Inputs.range([0, 100], {value: 20, step: 1, label: "Test Iterations"})
```

I can now link the number of random numbers in a list using the value above:

``` js x
Array(TestIterations).fill(0).map(() => (Math.random() * 100 | 0) / 100)
```


We can also load some data:

``` js x
athletes = load("athletes.csv").csv({typed: true});
```

``` js x | view
Inputs.table(athletes.filter(d => d.nationality === 'RSA'))
```

Then some more text just to separate it all out...