---
layout: page
tags : [opengl]
description : "How to cheat your vertex shader into doing a more precise transform."
thumbnail : DoublePrecision-masked.png
---
{% include JB/setup %}

Hello world.

<br>

<canvas id="canvas_low" style="border:solid 2px black">
</canvas>

<canvas id="canvas_high" style="border:solid 2px black">
</canvas>

<br>

- https://www.thasler.com/blog/blog/glsl-part2-emu
- http://blog.hvidtfeldts.net/index.php/2012/07/double-precision-in-opengl-and-webgl/
- https://github.com/virtualglobebook/OpenGlobe/tree/master/Source/Examples/Chapter05/Jitter
- http://crd-legacy.lbl.gov/~dhbailey/mpdist/index.html

<script src="{{ ASSET_PATH }}/scripts/jquery-1.11.2.min.js"></script>
<script src="{{ ASSET_PATH }}/scripts/marina.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var lowapp = new PargApp('#canvas_low', 'low');
    var highapp = new PargApp('#canvas_high', 'high');
    lowapp.linked_module = highapp.module;
    highapp.linked_module = lowapp.module;
</script>
