# Platform Components

This notebook contains a collection of SVG based platform components.  A couple of points about this notebook:

- The intention of this notebook it to create components that can be used in other notebooks,
- This notebook has embedded a number of examples to show how each of the different components can be used,
- Reusable components are exposed as functions, and
- Each function updates `height`, `width` and `viewBox` attributes attached to `svg` making sure that the component is visible.

## Application

``` js x
widthOfApplication = (application, options) =>
    application.width || options.applicationWidth;
```

``` js x
widthOfApplications = (applications, options) =>
    applications.length === 0 
        ? options.applicationWidth 
        : Math.max(...(applications.map(application => widthOfApplication(application, options))))
```

``` js x
applicationInto = (svg, x, y, application, options = {}) => {
    options = Object.assign({}, defaultOptions, options);

    const name = application.name || options.applicationName;
    const applicationWidth = widthOfApplication(application, options);
    const applicationHeight = application.height || options.applicationHeight;
    const applicationFill = application.fill || options.applicationFill;
    const applicationRadius = application.radius || options.applicationRadius;
    const applicationFont = application.nameFont || options.applicationNameFont;

    svg.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", applicationWidth)
        .attr("height", applicationHeight)
        .attr("rx", applicationRadius)
        .attr("ry", applicationRadius)
        .attr("fill", applicationFill);

    svg.append("text")
        .attr("x", x + applicationWidth / 2)
        .attr("y", y + applicationHeight / 2)
        .attr("font-size", applicationFont)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .text(name);

    const vb = [x, y, x + applicationWidth, y + applicationHeight];
    mergeViewBoxInto(svg, vb);
    return vb;
}
```

So here are a few application examples with the code exposed:

``` js x | pin
{
    const svg = d3.create("svg");

    applicationInto(svg, 0, 0, {name: "Application", fill: "lightgreen"});
    applicationInto(svg, 105, 0, {name: "Other Application"});
    applicationInto(svg, 210, 0, {name: "Yet Another Application With Long Name", width: 250});

    return svg.node();
}
```

## Platform

``` js x
platformInto = (svg, x, y, platform, options = {}) => {
    options = Object.assign({}, defaultOptions, options);

    const applications = platform.applications || [];
    const platformDepth = platform.depth || options.platformDepth;
    const numberOfColumns = Math.floor((applications.length + platformDepth - 1) / platformDepth);

    const name = platform.name || options.platformName;
    const padding = platform.padding || options.platformPadding;
    const applicationWidth = widthOfApplications(applications, options);
    const platformWidth = Math.max(platform.width || options.platformWidth, numberOfColumns * (applicationWidth + padding) - padding);
    const platformHeight = platform.height || options.platformHeight;
    const platformFill = platform.fill || options.platformFill;
    const platformRadius = platform.radius || options.platformRadius;
    const platformFont = platform.nameFont || options.platformNameFont;

    svg.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("width", platformWidth)
        .attr("height", platformHeight)
        .attr("rx", platformRadius)
        .attr("ry", platformRadius)
        .attr("fill", platformFill);

    svg.append("text")
        .attr("x", x + platformWidth / 2)
        .attr("y", y + platformHeight / 2)
        .attr("font-size", platformFont)
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .text(name);

    let vb = [x, y, x + platformWidth, y + platformHeight]   
    mergeViewBoxInto(svg, vb);

    let ax = x;
    let ayTop = vb[3] + padding;
    let ay = ayTop;
    applications.forEach((application, index) => {
        const v = applicationInto(svg, ax, ay, application, options);
        vb = combineViewBox(vb, v);
        ay = v[3] + padding;

        if ((index - platformDepth + 1) % platformDepth === 0) {
            ay = ayTop;
            ax = ax + applicationWidth + padding;
        }
    });

    return vb;
}
```

So here are a few application examples with the code exposed:

``` js x | pin
{
    const svg = d3.create("svg");

    const applications = () => Array(Math.floor(Math.random() * 15)).fill(0).map((_, i) => ({name: `Application ${i}`}));

    const things = [ 
        (x, y) => platformInto(svg, x, y, {name: "Platform", fill: "lightgreen", applications: applications()}),
        (x, y) => platformInto(svg, x, y, {name: "Other Platform", applications: applications()}),
        (x, y) => platformInto(svg, x, y, {name: "Yet Another Platform With Long Name", width: 250, applications: applications()}),
        (x, y) => platformInto(svg, x, y, {name: "Complex Platform", applications: applications()})
    ];

    let vb = [0, 0, 0, 0];
    things.forEach(thing => {
        vb = thing(vb[2] + 5, vb[1]);
    })

    return svg.node();
}
```

## Helpers

``` js x
defaultOptions = {
    return {
        applicationWidth: 100,
        applicationHeight: 50,
        applicationName: 'Application',
        applicationFill: 'lightgrey',
        applicationNameFont: '12px',
        applicationRadius: '10',

        platformWidth: 100,
        platformHeight: 50,
        platformName: 'Platform',
        platformFill: 'lightgrey',
        platformNameFont: '12px',
        platformRadius: 0,
        platformPadding: 5,
        platformDepth: 6
    }
}
```

``` js x
combineViewBox = (vb1, vb2) =>
    [ Math.min(vb1[0], vb2[0])
    , Math.min(vb1[1], vb2[1])
    , Math.max(vb1[2], vb2[2])
    , Math.max(vb1[3], vb2[3])
    ];
```

``` js x
mergeViewBoxInto = (svg, viewbox) => {
    const vb = svg.attr("viewBox");

    const attachViewBox = (viewbox) =>
        svg
            .attr("viewBox", viewbox)
            .attr("width", viewbox[2] - viewbox[0] + 1)
            .attr("height", viewbox[3] - viewbox[1] + 1);

    const parseViewBox = (vb) =>
        vb.split(",").map(t => parseInt(t));

    if (vb)
        attachViewBox(combineViewBox(parseViewBox(vb), viewbox));
    else
        attachViewBox(viewbox);
}
```
