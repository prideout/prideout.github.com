---
layout: page
tags : [webgl]
description : "Tessellation of concave polygons (with holes) in Javascript, using a simple ear clipping algorithm."
thumbnail : PolygonJs-masked.png
special_url : https://prideout.net/polygon.js
---
{% include JB/setup %}

Here's a little WebGL app that lets you draw a closed path.  The app uses an ear clipping algorithm to figure out how to fill the path with triangles, assuming the vertices are ordered counter-clockwise.

**[https://prideout.net/polygon.js](https://prideout.net/polygon.js)**

---

You can browse the CoffeeScript source here:

[polygon.coffee](https://github.com/prideout/polygon.js/blob/master/src/polygon.coffee)
