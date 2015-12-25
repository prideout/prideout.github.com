---
layout: page
tags : [opengl, graphics]
description : "GPU-Driven Particles with WebGL 1.0."
thumbnail : Orbits-masked.png
---
{% include JB/setup %}

## GPU Particles with WebGL 1.0

Here's a particle demo that does Verlet integration and avoids sending data to the GPU on a per-frame basis.

There are two passes: a physics pass that samples from one floating-point FBO and writes to another, and a graphics pass that samples the FBO from the vertex shader.  Easy!

There will be smarter ways of doing this in WebGL 2.0 so I thought I'd put this out before it's hopelesslly passé.  It seems to handle a million particles just fine with the Intel Iris GPU in my 13" MacBook.

<div style="width:256px;height:256px;border:solid 2px black;position:relative;display:inline-block">
    <div style="z-index:0;bottom:0;left:0;position:absolute;width:100%;padding:20px;font-weight:bold">
        Loading...
    </div>
    <canvas style="z-index:2;bottom:0;left:0;position:absolute;width:400px;height:300px" id="mycanvas" >
    </canvas>
</div>

<div style="width:100px;height:260px;position:relative;display:inline-block">
    <div style="z-index:0;top:0;left:0;position:absolute;width:100%;font-weight:bold">
        <button id="toggle" class="appbtn">Start</button>
        <button id="256" class="szbtn appbtn">65536</button>
        <button id="512" class="szbtn appbtn selected">262144</button>
        <button id="1024" class="szbtn appbtn">1048576</button>
    </div>
</div>

Here's the sketch I made before coding this up:

<a href="{{ ASSET_PATH }}/figures/OrbitsDiagram.jpg">
<img src="{{ ASSET_PATH }}/figures/OrbitsDiagram.jpg" class="nice-image med-image">
</a>

- [ztex.c](https://github.com/prideout/parg/blob/master/demos/ztex.c)
- [ztex.glsl](https://github.com/prideout/parg/blob/master/demos/ztex.glsl)

<script src="{{ ASSET_PATH }}/scripts/jquery-1.11.2.min.js"></script>
<script src="{{ ASSET_PATH }}/scripts/orbits.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var baseurl = '{{ ASSET_PATH }}/';
    var app = new PargApp('#mycanvas', 'pause', baseurl, true, {
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

