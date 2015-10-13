---
layout: page
tags : [opengl]
description : "How to cheat your vertex shader into doing a more precise transform."
thumbnail : DoublePrecision-masked.png
---
{% include JB/setup %}

## Improving precision in your vertex transform

First of all, if you're interested in this post, then you might be interested [3D Engine Design for Virtual Globes](http://www.amazon.com/3D-Engine-Design-Virtual-Globes/dp/1568817118), a really neat book from Patrick Cozzi and Kevin Ring.  It has an entire chapter about precision, and much more.

After some map imagery loads in, you should see two WebGL canvases below.  The blue crosshairs are located at a lookout point in César Chávez park, just north of the Berkeley Marina.  This happens to be the favorite spot of my two kids, whom you can see if you zoom in far enough.  Try zooming and panning as you would with Google Maps.

<canvas id="canvas_low" style="width:400px;height:300px;border:solid 2px black">
</canvas>

<canvas id="canvas_high" style="width:400px;height:300px;border:solid 2px black">
</canvas>

After zooming in, you might notice that the left canvas has jittery crosshairs on the right doesn't.  The left uses a traditional MVP matrix....

### Some Footnotes

mapbox

MODULARIZE=1 and PRECISE_F32=1

### References

- [Henry Thasler's posts on heavy computing with GLSL](https://www.thasler.com/blog/blog/glsl-part2-emu)
- [Mikael Hvidtfeldt Christensen's post on double precision in WebGL]( http://blog.hvidtfeldts.net/index.php/2012/07/double-precision-in-opengl-and-webgl/)
- [3D Engine Design for Virtual Globes](http://www.amazon.com/3D-Engine-Design-Virtual-Globes/dp/1568817118)

<!-- https://github.com/virtualglobebook/OpenGlobe/tree/master/Source/Examples/Chapter05/Jitter -->

<!-- http://crd-legacy.lbl.gov/~dhbailey/mpdist/index.html-->

<script src="{{ ASSET_PATH }}/scripts/jquery-1.11.2.min.js"></script>
<script src="{{ ASSET_PATH }}/scripts/marina.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var baseurl = '{{ ASSET_PATH }}/';
    var lowapp = new PargApp('#canvas_low', 'low', baseurl);
    var highapp = new PargApp('#canvas_high', 'high', baseurl);
    lowapp.linked_module = highapp.module;
    highapp.linked_module = lowapp.module;
</script>
