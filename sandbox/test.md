---
layout: page
tags : [opengl]
description : "Playing with barrel distortion."
thumbnail : Distortion-masked.png
---
{% include JB/setup %}

### Fisheye Lens

The OpenGL code used to generate these screenshots lives in [this github project](http://github.com/prideout/distortion) for your enjoyment.

Barrel distortion simulates a fisheye lens by changing the magnification factor according to polar distance.  Often the magnification is proportional to the squared distance.  Here's a GLSL snippet that performs barrel distortion:

{% highlight glsl %}
uniform float BarrelPower;

// Given a vec2 in [-1,+1], generate a texture coord in [0,+1]
vec2 Distort(vec2 p)
{
    float theta  = atan(p.y, p.x);
    float radius = length(p);
    radius = pow(radius, BarrelPower);
    p.x = radius * cos(theta);
    p.y = radius * sin(theta);
    return 0.5 * (p + 1.0);
}
{% endhighlight %}

This function transforms the input into polar coordinates, tweaks the radius, then converts it back to texture space.

In olden times before shaders, barrel distortion could be achieved by simply rendering the scene into a texture, then applying the texture to a 2D grid of vertices.  The grid would look something like this after the pushing around the verts:

[![Screenshot]({{ ASSET_PATH }}/thumbnails/Distortion2.png)](https://github.com/prideout/distortion/raw/master/media/UniformResult.png)

Here's the original image:

[![Screenshot]({{ ASSET_PATH }}/thumbnails/Distortion1.png)](https://github.com/prideout/distortion/raw/master/media/OriginalScene.png)

One issue with this approach is poor sampling at high magnification, resulting in fuzziness towards the center.  The same problem crops up when performing distortion in the fragment shader.

One solution is performing distortion in the vertex shader.  This gives a clean result, although coarsely-tessellated models will have straight edges, and they'll suffer from snapping artifacts during animation.  Here's a test of vertex shader distortion:

[![Screenshot]({{ ASSET_PATH }}/thumbnails/Distortion3.png)](https://github.com/prideout/distortion/raw/master/media/VertexWarpingResult.png)

On a modern GPU we can employ a simple tessellation shader, performing distortion in the subdivided mesh.  This allows for curved edges:

[![Screenshot]({{ ASSET_PATH }}/thumbnails/Distortion4.png)](https://github.com/prideout/distortion/raw/master/media/TessWarpingResult.png)

If you're stuck with a texture-based approach and you need to fix poor sampling, one idea is performing a custom high-quality filter (e.g., Gaussian) in your fragment shader, instead of relying on the crude bilinear filtering that the hardware provides.

Another idea is to use tiled rendering; each tile would have the same resolution, but the viewport sizes would vary according to distance-from-center:

[![Screenshot]({{ ASSET_PATH }}/thumbnails/Distortion5.png)](https://github.com/prideout/distortion/raw/master/media/NonuniformGrid.png)

This would give you more samples in the center of the image, where you need them.  You can perform clipping in the projection matrix:

TBD

Rendering each tile would...
