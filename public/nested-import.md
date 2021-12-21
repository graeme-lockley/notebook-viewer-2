# Nested Import

This page illustrates and validates the importing of a notebook where that notebook itself has imports in it.

The basic import flow is

``` kroki x blockdiag
blockdiag {
  "nested-import.md" -> "simple.md" -> "basic.md";
} 
```

``` js x | pin
import { arbList, createList, listLength } from "./simple.md"
```

``` js x | pin
arbList
```

``` js x | pin
listLength
```

``` js x | pin
createList(5)
```

``` js x | pin
{
    return {arbList, createList, listLength};
}
```