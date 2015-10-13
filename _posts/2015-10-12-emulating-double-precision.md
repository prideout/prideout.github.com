---
layout: page
tags : [opengl]
description : "How to cheat your vertex shader into doing a more precise transform."
thumbnail : DoublePrecision-masked.png
---
{% include JB/setup %}

## Improving precision in your vertex transform

WebGL and OpenGL ES do not support 64-bit math, but you can emulate it with some extra footwork in the vertex shader.

First of all, if you're interested in this post, then you might be interested [3D Engine Design for Virtual Globes](http://www.amazon.com/3D-Engine-Design-Virtual-Globes/dp/1568817118), a really neat book from Patrick Cozzi and Kevin Ring.  It has an entire chapter about precision, and much more.

After some map imagery loads in, you should see two WebGL canvases below.  The blue crosshairs are located at a lookout point in César Chávez park, just north of the Berkeley Marina.  This happens to be the favorite spot of my two kids, whom you can see if you zoom in far enough.  Try zooming and panning as you would with Google Maps.

<canvas id="canvas_low" style="width:400px;height:300px;border:solid 2px black">
</canvas>

<canvas id="canvas_high" style="width:400px;height:300px;border:solid 2px black">
</canvas>

After zooming in, you might notice that the left canvas has jittery crosshairs, but the right one doesn't.  The left canvas uses a "traditional" model-view-projection matrix, while the right canvas pretends that the camera is at **(0,0,0)** when computing the MVP, then performs translation manually in the vertex shader.  The GLSL for this is shown below.

    attribute vec3 a_position;
    uniform mat4 u_mvp;
    uniform vec3 u_eyepos;
    uniform vec3 u_eyepos_lowpart;

    void main()
    {
        vec3 p = a_position - u_eyepos;
        p -= u_eyepos_lowpart;
        gl_Position = u_mvp * vec4(p, 1.0);
    }

On the CPU side, the eye position is stored with 64-bit precision.  We're sending it to the GPU using two uniforms: a high part and a low part.  The following CPU-side code can be used to extract these two parts:

    void split_double(double input, float* hipart, float* lopart)
    {
        *hipart = (float) input;
        double delta = input - ((double) *hipart);
        *lopart = (float) delta;
    }

#### 64-bit Vertices

We've described how to handle a 64-bit camera position, but what about 64-bit vertices?  Again, we can split each double into two floats.  This time it's more costly though, since your VBO will grow by 2x.

I haven't fully tested this, but here's a GLSL port of the "double-single" routines used in the DSFUN90, an old math precision library based on the work of none other than Donald Knuth!

    attribute vec3 a_position;
    attribute vec3 a_position_lowpart;
    uniform mat4 u_mvp;
    uniform vec3 u_eyepos;
    uniform vec3 u_eyepos_lowpart;

    void main()
    {
        vec3 t1 = a_position_lowpart - u_eyepos_lowpart;
        vec3 e = t1 - a_position_lowpart;
        vec3 t2 = ((-u_eyepos_lowpart - e) + (a_position_lowpart - (t1 - e))) + a_position - u_eyepos;
        vec3 high_delta = t1 + t2;
        vec3 low_delta = t2 - (high_delta - t1);
        vec3 p = high_delta + low_delta;
        gl_Position = u_mvp * vec4(p, 1.0);
    }


### Some Footnotes

The map demo on this page was built using a small C99 library that I've been working on, running it through Emscripten with the flags `MODULARIZE=1` and `PRECISE_F32=1`.

For creating the map "tiles" (not slippy map tiles, just a bunch of overlaid quads anchored to Berkeley), I used the really awesome [Static maps API](https://www.mapbox.com/developers/api/static/) from [mapbox.com](mapbox.com).

### References

- [Henry Thasler's posts on heavy computing with GLSL](https://www.thasler.com/blog/blog/glsl-part2-emu)
- [Mikael Hvidtfeldt Christensen's post on double precision in WebGL]( http://blog.hvidtfeldts.net/index.php/2012/07/double-precision-in-opengl-and-webgl/)
- [_3D Engine Design for Virtual Globes_ by Cozzi and Ring](http://www.amazon.com/3D-Engine-Design-Virtual-Globes/dp/1568817118)

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
