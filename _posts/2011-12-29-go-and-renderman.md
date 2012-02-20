---
layout: post
tags : [golang, renderman]
description : "RenderMan bindings for Google's new language <b>go</b>."
thumbnail : GoLang-masked.png
---
{% include JB/setup %}

The new staticly-typed language from Google called **Go** might displace C99 as my favorite compiled language.  It has such a pretty syntax, and it's so fast to build stuff, that I'm even considering it in lieu of Python for common scripting tasks.

Minimalism is a core tenant of Go's design, so it doesn't take long to learn.  It uses "channels" as a central concurrency primitive, which is a nifty way to write multithreaded code.  As the language designers like to say: *Don't communicate by sharing memory; share memory by communicating.* 

To try it out, I decided to port some of my old l-system code to Go, and to create Go bindings for a subset of Pixar's RenderMan interface.  Here's one of the first images I created:

![L-System in Go]({{ ASSET_PATH }}/thumbnails/GoLangBig-masked.png)

## L-System

In my demo, a description of a l-system consists of a maximum recursion depth, a list of rules, and a cache of transformation matrices.  Here's my first stab:

{% highlight go %}
import ( "vmath" )

type LSystem struct {
    MaxDepth int    `xml:"max_depth,attr"`
    Rules    []Rule `xml:"rule"`
    Matrices MatrixCache
}

type MatrixCache map[string]vmath.M4
{% endhighlight %}

I won't show the type definition for the `Rule` type here, but you always look at my [code](https://github.com/prideout/lsystem/blob/master/Go/lsystem.go) on github.

A few things to notice:

*   The `vmath` package is my own (woefully incomplete) attempt at a vector math library in Go.  It's on github [here](https://github.com/prideout/govmath), but I'm not sure where I'm going with it.  We'll see.
*   Go's type declaration ordering can be a jolt but don't let it scare you.  It's like a reverse-polish calculator; it irks you at first but you grow to love it. Rob Pike gave this a lot of thought; he discusses it [here](http://blog.golang.org/2010/07/gos-declaration-syntax.html).
*   Note that I define the `MatrixCache` type *after* its use in the `LSystem` type.  Go lets you order things how you like, despite having a ridiculously efficient compiler.
*   See how the types in the struct are all nicely aligned with whitespace?  That's not my doing; that's taken care of by `gofmt`, the code formatting tool that's included in the Go distribution.

## XML

Parsing the [XML description](http://_) described in my previous posts was a pleasure because the `encoders/xml` package uses reflection to discover how to unmarshal the data.

{% highlight go %}
type LSystem struct {
    MaxDepth int    `xml:"max_depth,attr"`
    Rules    []Rule `xml:"rule"`
    Matrices MatrixCache
}
{% endhighlight %}

## Next Steps

Please take a look at [{{ site.categories.api.first.title }}]({{ BASE_PATH }}{{ site.categories.api.first.url }}) 
or jump right into [Usage]({{ BASE_PATH }}{{ site.categories.usage.first.url }}) if you'd like.