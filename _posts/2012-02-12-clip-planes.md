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

{% highlight cpp %}
glEnable(GL_CLIP_DISTANCE0);
float PlaneEquation = {0, 1, 0, 7};
glUniform4fv(u("ClipPlane"), 1, &PlaneEquation[0]);
{% endhighlight %}

The implicit equation for a plane:

Ax + By + Cz + D = 0

{% math %}
\[\begin{aligned}
\dot{x} &amp; = \sigma(y-x) \\
\dot{y} &amp; = \rho x - y - xz \\
\dot{z} &amp; = -\beta z + xy
\end{aligned} \]
{% endmath %}

{% math %}
\begin{aligned}
\dot{x} &amp; = \sigma(y-x) \\
\dot{y} &amp; = \rho x - y - xz \\
\dot{z} &amp; = -\beta z + xy
\end{aligned}
{% endmath %}

I find it easier to think of it as a half space defined by a unitized normal vector (A, B, C) and distance from origin (D).

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
