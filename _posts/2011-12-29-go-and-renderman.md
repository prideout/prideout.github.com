---
layout: post
tags : [golang, renderman]
description : "RenderMan bindings for Google's new language <b>go</b>."
thumbnail : GoLang-masked.png
---
{% include JB/setup %}

The new staticly-typed language from Google called **Go** might displace C99 as my favorite compiled language.  It's so pretty, and so fast, that I'm even considering it in lieu of Python for common scripting tasks.

Minimalism is a core tenant of Go's design, so it doesn't take long to learn.  It uses "channels" as a central concurrency primitive, which is a nifty way to write multithreaded code.  As the language designers like to say: *Don't communicate by sharing memory; share memory by communicating.* 

To try it out, I ported some of my old L-system code to Go, and created Go bindings for a subset of Pixar's RenderMan interface.  Here's one of the first images I created:

![L-System in Go]({{ ASSET_PATH }}/thumbnails/GoLangBig-masked.png)

I've thrown up my new L-system code in [this github project](https://github.com/prideout/lsystem/tree/master/Go), and the Renderman bindings [here](https://github.com/prideout/gorman).

* This will become a table of contents (this text will be scraped).
{:toc}

{% comment %}
There MUST be a way to do this in liquid and/or Maruku...
<a href="#lsystem">link</a>
<a href="#xml">link</a>
{% endcomment %}

## L-System

In my demo, a description of a l-system consists of a maximum recursion depth, a list of rules, and a cache of transformation matrices.  Here's my first stab:

{% highlight go %}
import ( "vmath" )

type LSystem struct {
    MaxDepth int
    Rules    []Rule
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

Parsing the [XML description](http://prideout.net/blog/?p=44#rules) described in my previous posts was a pleasure because the `encoders/xml` package uses reflection to discover how to unmarshal the data.  Go has a kind of metadata that you can add called **tags**, which are specified with strings in your field declarations.  Here's the same struct again, this time with tags:

{% highlight go %}
type LSystem struct {
    MaxDepth int    `xml:"max_depth,attr"`
    Rules    []Rule `xml:"rule"`
    Matrices MatrixCache
}
{% endhighlight %}

I didn't add a tag to `MatrixCache` because it's specified programmatically rather than in XML.

Tags are just string literals and don't need to be delimited with backticks; I only used backticks here because I needed double quotes inside my string.  Backticks tell the Go compiler not to honor backslash escapes.

Assuming a struct has been properly annotated with tags, you can unmarshal it like this:

{% highlight go %}
var lsys LSystem
if err := xml.Unmarshal(bytes, &lsys); err != nil {
    fmt.Println("Error parsing XML file:", err)
    return
}
{% endhighlight %}

## UTF-8

Some of the same people who designed Go also designed UTF-8.  When they that say Go identifiers must start with a "letter", they really mean any character in the following Unicode categories: Lu, Ll, Lt, Lm, and Lo.  This is especially nifty for us graphics developers, since we love Greek letters:

{% highlight go %}
// this is just for fun; there's a math.Pi that you can use
π := math.Atan(1) * 4 
ε := 0.0001
{% endhighlight %}

After discovering this feature in Go, I've become quite adept at using `M-x ucs-insert` in my emacs editor.

## Renderman Bindings

Calling C functions from Go is relatively easy (going the other way around is a bit of a hassle).  go lets you embed the inclusion of C headers like this:

{% highlight go %}
package rman

// #cgo CFLAGS: -I/opt/pixar/RenderManProServer-16.4/include
// #cgo LDFLAGS: -L/opt/pixar/RenderManProServer-16.4/lib -lprman -Wl,-rpath /opt/pixar/RenderManProServer-16.4/lib
// #include <stdlib.h>
// #include "ri.h"
import "C"

import (
    "fmt"
    "unsafe"
)
{% endhighlight %}

## Conclusion

So far I'm loving Go.  I have a couple small gripes.  For example, enumerations aren't totally type-safe since they can be freely exchanged with `int`.  (They do, however, have a cute feature called "iota" -- look it up.)

More importantly, the built-in math package assumes that you want to use 64-bit floats, which isn't ideal when interfacing with graphics API's like OpenGL and RenderMan.  Ideally, a math library could be written using generics, which is another missing feature in Go.

However, I understand that simplicity comes at a price; personally, I'm willing to pay!
