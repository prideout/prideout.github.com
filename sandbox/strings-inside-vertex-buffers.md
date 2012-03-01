---
layout: post
tags : [opengl]
description : "Stupid OpenGL trick: embed a raw C string in a vertex buffer."
thumbnail : TinyText-masked.png
---
{% include JB/setup %}

TBD

![SimpleText Screenshot]({{ BASE_PATH }}/assets/thumbnails/SimpleText-halved.png)

TBD

{% highlight cpp %}
glEnable(GL_CLIP_DISTANCE0);
float PlaneEquation = {0, 1, 0, 7};
glUniform4fv(u("ClipPlane"), 1, &PlaneEquation[0]);
{% endhighlight %}

TBD

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

### OpenGL Demo

My demo code is posted on github for your enjoyment:

{% assign GITHUB_PATH = 'https://github.com/prideout/recipes/blob/master' %}

*   [SimpleText.c]({{GITHUB_PATH}}/demo-SimpleText.c)
*   [SimpleText.glsl]({{GITHUB_PATH}}/demo-SimpleText.glsl)

I used a glyph map created by a cool former colleague from my 3Dlabs days:

*   [verasansmono.png]({{GITHUB_PATH}}/verasansmono.png)
*   [Mike's old 'drawtext' page](http://mew.cx/drawtext/drawtext.html)
