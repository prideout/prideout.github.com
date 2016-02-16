---
layout: page
tags : [webgl]
description : "Interactive gallery of the prime knots through 9 crossings."
thumbnail : KnotGallery-masked.png
special_url : http://prideout.net/knotgl
---
{% include JB/setup %}

Here's a fun little WebGL app I put together that lets you explore prime knots through 9 crossings, and some multi-component links through 8 crossings.  My layout of the Rolfsen table was inspired by Robert Scharein's <i>Knot Zoo</i>.

**[http://prideout.net/knotgl](http://prideout.net/knotgl)**

The notation in the lower-right corner is the Alexander-Briggs name for the knot.  Click any of the knots along the top to swap the current knot.  The bottom link swipes the page over to the full gallery.

The first time you select a particular row, it tessellates the knots in a web worker thread.  It never deletes VBOs, so it won't re-tessellate if you come back to a row.

It's designed to be fun to use with the mouse, but there are keyboard shortcuts for everything:

* **Spacebar** swipes between the two pages
* **Arrow keys** change the knot selection
* **S** key takes a screenshot

---

You can browse the CoffeeScript source here:

[http://github.com/prideout/knotgl](http://github.com/prideout/knotgl)
