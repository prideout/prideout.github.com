---
layout: page
tags : [opengl, graphics]
description : "Texture experiments with highly zoomable content."
thumbnail : Zoomable-masked.png
---
{% include JB/setup %}

## Zoomable Texturing

When performing "deep zoom" into simple textured geometry (no fancy proceduralism or raymarching), it doesn't take long before seeing big fat blurry texels.  This post presents some thoughts on simple tileable texturing, inspired by slippy maps.

First, a demo.  Press the zoom button to zoom to the east coast of Corsica in this quick-and-dirty map of Europe.  This is _not_ a slippy map.  It's just a simple WebGL app with two draw calls: one for the landmass mesh, and one for the water.

<div style="width:400px;height:300px;border:solid 2px black;position:relative;display:inline-block">
    <div style="z-index:0;bottom:0;left:0;position:absolute;width:100%;padding:20px;font-weight:bold">
        Loading...
    </div>
    <canvas style="z-index:2;bottom:0;left:0;position:absolute;width:400px;height:300px" id="mycanvas" >
    </canvas>
</div>

<div style="width:100px;height:304px;position:relative;display:inline-block">
    <div style="z-index:0;top:0;left:0;position:absolute;width:100%;font-weight:bold">
        <button id="zoom" class="appbtn">Zoom</button>
        <button id="grid" class="appbtn">Grid</button>
        <button id="fragcoord" class="appbtn selected">FragCoord</button>
        <button id="interactive" class="appbtn">Interactive</button>
    </div>
</div>

The demo draws inspiration from slippy maps to figure out how to scale and translate the texture coordinates.  The shader that applies that water texture doubles the frequency of the texture coordinates every time the zoom level crosses a new integer threshold.  Most of the math is done on the CPU, so the fragment shader is really simple:

{% highlight glsl %}
varying vec2 v_texcoord;
uniform vec4 u_slippybox;

void main()
{
    vec2 tex_offset = v_texcoord - u_slippybox.xy;
    vec2 uv = tex_offset * u_slippybox.zw;
    gl_FragColor = sample(uv);
}
{% endhighlight %}

The landmass shader works similarly, except that it cross-fades between two texture frequencies, thus avoiding the noticeable pop seen with the water texture:

{% highlight glsl %}
uniform vec4 u_slippybox;
uniform float u_slippyfract;

void main()
{
    vec2 tex_offset = gl_FragCoord.xy - u_slippybox.xy;
    vec2 uv = tex_offset * u_slippybox.zw;
    vec4 texel0 = sample(uv);
    vec4 texel1 = sample(uv * 2.0);
    gl_FragColor = mix(texel0, texel1, u_slippyfract);
}
{% endhighlight %}

When the demo is done zooming, you might see some precision problems with the water texture, but the landmass looks fine.  That's because the landmass shader uses `gl_FragCoord` rather than baked-in mesh coordinates.  Try toggling the FragCoord button to see the difference.

This demo was created with emscripten, and the source code can be found below.  Apologies if it's a bit funky; it uses one of my tiny graphics engines that are forever works in progress.

- [ztex.c](https://github.com/prideout/parg/blob/master/demos/ztex.c)
- [ztex.glsl](https://github.com/prideout/parg/blob/master/demos/ztex.glsl)

<script src="{{ ASSET_PATH }}/scripts/jquery-1.11.2.min.js"></script>
<script src="{{ ASSET_PATH }}/scripts/ztex.js"></script>
<script src="{{ ASSET_PATH }}/scripts/parg.js"></script>
<script>
    var baseurl = '{{ ASSET_PATH }}/';
    var app = new PargApp('#mycanvas', 'high', baseurl, true);
    $('#zoom').click(function() {
        app.module.Window.message('demo');
    });
    $('#grid').click(function() {
        $('#grid').toggleClass('selected');
        app.module.Window.message('grid');
    });
    $('#fragcoord').click(function() {
        $('#fragcoord').toggleClass('selected');
        app.module.Window.message('precision');
    });
    $('#interactive').click(function() {
        $('#interactive').toggleClass('selected');
        app.block_interaction = !app.block_interaction;
    });
</script>
