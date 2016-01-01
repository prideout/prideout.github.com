---
layout: page
tags : [opengl, graphics]
description : "GPU-Driven Particles with WebGL 1.0."
thumbnail : Orbits-masked.png
title: GPU Particles
---
{% include JB/setup %}

## Simple GPU Physics with WebGL 1.0

Here's a particle demo that performs Verlet integration in the fragment shader and avoids any transfers to the GPU.

There are two passes:

- The **physics** pass samples from one floating-point FBO and writes to another.  Draws one big quad.
- The **graphics** pass samples the FBO in the vertex shader to determine position.  Draws point sprites.

There will be smarter ways of doing this in WebGL 2.0 so I thought I'd post this before it becomes passé.  It smoothly handles a quarter-million particles with the lackluster Intel Iris GPU that's in my 13" MacBook.

<i>Unfortunately this fails to run correctly on my iPhone -- maybe vertex textures aren't working?</i>

<div style="width:256px;height:256px;border:solid 2px black;position:relative;display:inline-block">
    <div style="z-index:0;bottom:0;left:0;position:absolute;width:100%;padding:20px;font-weight:bold">
        Loading...
    </div>
    <canvas style="z-index:2;bottom:0;left:0;position:absolute;width:400px;height:300px" id="mycanvas" >
    </canvas>
</div>

<div style="width:100px;height:260px;position:relative;display:inline-block">
    <div style="z-index:0;top:0;left:0;position:absolute;width:100%;font-weight:bold">
        <button id="toggle" class="appbtn">Pause</button>
        <button id="256" class="szbtn appbtn">65536</button>
        <button id="512" class="szbtn appbtn selected">262144</button>
        <button id="1024" class="szbtn appbtn">1048576</button>
    </div>
</div>

There are three gravity sources, and each particle is randomly assigned to only one of the gravity sources.  So it's a bit unrealistic, but could easily be extended.

Here's the sketch I made before coding this up:

<a href="{{ ASSET_PATH }}/figures/OrbitsDiagram.jpg">
<img src="{{ ASSET_PATH }}/figures/OrbitsDiagram.jpg"
     class="nice-image"
     style="width:300px">
</a>

Here's the source:

- [orbits.c](https://github.com/prideout/parg/blob/master/demos/orbits.c)
- [orbits.glsl](https://github.com/prideout/parg/blob/master/demos/orbits.glsl)

Incidentally, the following astrodynamics libraries look cool.  They are quite different from typical physics engines, and might be fun to use for accurate simulation of orbital mechanics on the CPU.

- [GAL](http://www.amsat-bda.org/GAL_Home.html)
- [Tudat](https://github.com/Tudat)

---

<i style="font-size:10px">Simplicity is a great virtue but it requires hard work to achieve it and education to appreciate it. And to make matters worse: complexity sells better. -- Dijkstra</i>

<script src="{{ ASSET_PATH }}/scripts/jquery-1.11.2.min.js"></script>
<script src="{{ ASSET_PATH }}/scripts/orbits.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var baseurl = '{{ ASSET_PATH }}/';
    var app = new PargApp('#mycanvas', 'play', baseurl, true, {
        alpha: false,
        antialias: false
    });
    $('#toggle').click(function() {
        if ($('#toggle').text() == 'Start') {
            app.module.Window.message('play');
            $('#toggle').text('Pause');
        } else {
            app.module.Window.message('pause');
            $('#toggle').text('Start');
        }
    });
    $('.szbtn').click(function() {
        $('.szbtn').removeClass('selected');
        $(this).addClass('selected');
        app.module.Window.message(this.id);
    });
    $('#interactive').click(function() {
        $('#interactive').toggleClass('selected');
        app.block_interaction = !app.block_interaction;
    });
</script>

