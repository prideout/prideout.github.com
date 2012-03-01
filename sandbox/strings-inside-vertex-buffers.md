---
layout: post
tags : [opengl]
description : "Stupid OpenGL trick: embed a raw C string in a vertex buffer."
thumbnail : TinyText-masked.png
---
{% include JB/setup %}

### Pass a C string into your draw call

This has got to be the stupidest OpenGL trick ever.  Imagine passing a C-style string directly into a POINTS draw call. No quads, no vertex positions, no texture coordinates; just raw ASCII.  For example:

{% highlight cpp %}
const char* text = "Hello world.";
glVertexAttribIPointer(CharAttrib, 1, GL_UNSIGNED_BYTE, 1, text);
glDrawArrays(GL_POINTS, 0, strlen(text));
{% endhighlight %}

This is legal.  It's important to use the `IPointer` suffix for `glVertexAttrib`, otherwise GL will try to normalize your values instead of passing them straight through.

I did something similar render text on my Toon shading demo:

![SimpleText Screenshot]({{ BASE_PATH }}/assets/thumbnails/SimpleText-halved.png)

The vertex shader simply passes `gl_VertexID` and the character to the geometry shader:

{% highlight glsl %}
-- Vertex Shader

in int Character;
out int vCharacter;
out int vPosition;

void main()
{
    vCharacter = Character;
    vPosition = gl_VertexID;
    gl_Position = vec4(0, 0, 0, 1);
}
{% endhighlight %}

Most of the logic lives in the geometry shader; it expands the points into quads and computes the correct texture coordinates.  It assumes you're using a monospace font arranged into an atlas with 16 rows and 16 columns.  The first character in the atlas is a space character (ASCII code 32).

{% highlight glsl %}
-- Geometry Shader

layout(points) in;
layout(triangle_strip, max_vertices = 4) out;

in int vCharacter[1];
in int vPosition[1];
out vec2 gTexCoord;
uniform sampler2D Sampler;

uniform vec2 CellSize;
uniform vec2 RenderSize;
uniform vec2 RenderOrigin;

void main()
{
    // Determine the final quad's position and size:
    float x = RenderOrigin.x + float(vPosition[0]) * RenderSize.x;
    float y = RenderOrigin.y;
    vec4 P = vec4(x, y, 0, 1);
    vec4 U = vec4(0.5, 0, 0, 0) * RenderSize.x;
    vec4 V = vec4(0, 0.5, 0, 0) * RenderSize.y;

    // Determine the texture coordinates:
    int letter = vCharacter[0] - 32;
    int row = letter / 16;
    int col = letter % 16;
    float S0 = CellSize.x * col;
    float T0 = CellSize.y * row;
    float S1 = S0 + CellSize.x;
    float T1 = T0 + CellSize.y;

    // Output the quad's vertices:
    gTexCoord = vec2(S0, T1); gl_Position = P-U-V; EmitVertex();
    gTexCoord = vec2(S1, T1); gl_Position = P+U-V; EmitVertex();
    gTexCoord = vec2(S0, T0); gl_Position = P-U+V; EmitVertex();
    gTexCoord = vec2(S1, T0); gl_Position = P+U+V; EmitVertex();
    EndPrimitive();
}
{% endhighlight %}

I think something similar could be done to support non-monospace fonts, although it would be less simple.  The characters would need to go into random access memory (eg, a uniform array) instead directly in a vertex buffer.

### OpenGL Demo

I posted the demo code for the Toon-shaded knot with text overlay on github:

{% assign GITHUB_PATH = 'https://github.com/prideout/recipes/blob/master' %}

*   [SimpleText.c]({{GITHUB_PATH}}/demo-SimpleText.c)
*   [SimpleText.glsl]({{GITHUB_PATH}}/demo-SimpleText.glsl)

I used a glyph map created by a former colleague from my 3Dlabs days:

*   [verasansmono.png]({{GITHUB_PATH}}/verasansmono.png)
*   [Mike's old 'drawtext' page](http://mew.cx/drawtext/drawtext.html)
