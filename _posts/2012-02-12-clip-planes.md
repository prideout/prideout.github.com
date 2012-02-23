---
layout: post
tags : [opengl]
description : "How to use clip planes in modern OpenGL."
thumbnail : ClipPlanes-masked.png
---
{% include JB/setup %}

Here's a torus with two-sided lighting and a custom clipping plane:

![Clip Plane]({{ ASSET_PATH }}/thumbnails/ClipPlanesBig-masked.png)

The code for this OpenGL demo is on github:

{% assign GITHUB_PATH = 'https://github.com/prideout/recipes/blob/master' %}

*   [ClipPlanes.c]({{GITHUB_PATH}}/demo-ClipPlanes.c)
*   [ClipPlanes.glsl]({{GITHUB_PATH}}/demo-ClipPlanes.glsl)

In olden times of yore, we used fixed-function commands like `glClipPlane`.  Nowadays a plane equation is simply an arbitrary `vec4 uniform`, and you perform a dot-product test explictly in your vertex shader, sending the result to a special output.

You still need a small amount of setup on the C/C++ side of things:

{% highlight cpp %}
glEnable(GL_CLIP_DISTANCE0);
float PlaneEquation = {0, 1, 0, 7};
glUniform4fv(u("ClipPlane"), 1, &PlaneEquation[0]);
{% endhighlight %}

One word of caution: I've heard that some drivers ignore the enable/disable state of `GL_CLIP_DISTANCE0`.

As a reminder, here's the implicit equation for a plane:

**A**x + **B**y + **C**z + **D** = 0

I define my half-space using a unitized normal vector in (**A**,**B**,**C**) and a distance-from-origin in **D**.

Clip planes are usually defined in world space, so your vertex shader should simply `dot` your vertex position in world space with the plane equation, then push it to the built-in `gl_ClipDistance` array.  Here's an example vertex shader:

{% highlight glsl %}
in vec4 Position;
out float gl_ClipDistance[1];

uniform mat4 Projection;
uniform mat4 Modelview;
uniform mat4 ModelMatrix;
uniform vec4 ClipPlane;

void main()
{
    gl_Position = Projection * Modelview * Position;
    gl_ClipDistance[0] = dot(ModelMatrix * Position, ClipPlane);
}
{% endhighlight %}

Enjoy!