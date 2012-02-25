---
layout: post
tags : [golang, renderman]
description : "RenderMan bindings for Google's new language <b>go</b>."
thumbnail : GoLang-masked.png
---
{% include JB/setup %}

The new staticly-typed language from Google called **Go** might displace C99 as my favorite compiled language.  It's so pretty, and so fast, that I'm even considering it in lieu of Python for common scripting tasks.

Minimalism is a core tenant of Go's design, so it doesn't take long to learn.  It uses "channels" as a central concurrency primitive, which is a nifty way to write multithreaded code.

{% comment %}
As the language designers like to say: *Don't communicate by sharing memory; share memory by communicating.* 
{% endcomment %}

To try it out, I ported some of my old L-system code to Go, and created Go bindings for a subset of Pixar's RenderMan interface.  Here's one of the first images I created:

[![L-System in Go]({{ ASSET_PATH }}/thumbnails/GoLangBig-masked.png)]({{ ASSET_PATH }}/thumbnails/GoLangHuge.png)

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

A few things to notice:

*   The `vmath` package is my own (woefully incomplete) attempt at a vector math library in Go.  It's on github [here](https://github.com/prideout/govmath), but I'm not sure where I'm going with it.  We'll see.
*   Go's type declaration ordering can be a jolt but don't let it scare you.  It feels like a reverse-polish calculator at first, but you'll grow to love it. Rob Pike gave this a lot of thought; he discusses it [here](http://blog.golang.org/2010/07/gos-declaration-syntax.html).
*   Note that I define the `MatrixCache` type *after* its use in the `LSystem` type.  Go lets you order things how you like, despite having a ridiculously efficient compiler.
*   See how the types in the struct are all nicely aligned with whitespace?  That's not my doing; that's taken care of by `gofmt`, the code formatting tool that's included in the Go distribution.

## XML

Parsing the XML description described in my previous posts ([link](http://prideout.net/blog/?p=44#rules)) was a pleasure because the `encoders/xml` package uses reflection to discover how to unmarshal the data.  Go has a kind of metadata that you can add called **tags**, which are specified with strings in your field declarations.  Here's the same struct again, this time with tags:

{% highlight go %}
type LSystem struct {
    MaxDepth int    `xml:"max_depth,attr"`
    Rules    []Rule `xml:"rule"`
    Matrices MatrixCache
}
{% endhighlight %}

Tags are just string literals and don't need to be delimited with backticks.  I used backticks here because I needed double quotes inside my string.  Backticks tell the Go compiler not to honor backslash escapes.

Assuming a struct has been properly annotated with tags, you can unmarshal it like this:

{% highlight go %}
var lsys LSystem
if err := xml.Unmarshal(bytes, &lsys); err != nil {
    fmt.Println("Error parsing XML file:", err)
    return
}
{% endhighlight %}

Note that the official XML package is one of the areas undergoing churn.  JSON is probably more appropriate for this kind of marshaling.  Go [gobs](http://blog.golang.org/2011/03/gobs-of-data.html) are interesting too, although not human readable.

## UTF-8

Some of the same people who designed Go also designed UTF-8.  When they that say Go identifiers must start with a "letter", they really mean any character in the Unicode categories Lu, Ll, Lt, Lm, and Lo.  This is especially nifty for us graphics developers, since we love Greek letters:

{% highlight go %}
// this is just for fun; there's a math.Pi that you can use
π := math.Atan(1) * 4 
ε := 0.0001
{% endhighlight %}

After discovering this feature in Go, I've become quite adept at using `M-x ucs-insert` in my emacs editor.

## Renderman Bindings

Calling C functions from Go is relatively easy (going the other way around is a bit of a hassle).  Go lets you embed the inclusion of C headers like this:

{% highlight go %}
package rman

// #cgo CFLAGS: -I/opt/pixar/RenderManProServer-16.4/include
// #cgo LDFLAGS: -L/opt/pixar/RenderManProServer-16.4/lib
// #include <stdlib.h>
// #include "ri.h"
import "C"

import (
    "fmt"
    "unsafe"
)
{% endhighlight %}

Since Go is a system-level language, mapping its types to C types is a fairly simple process.  Here's how I wrapped RenderMan's `RiBegin` call:

{% highlight go %}
func Begin(name string) {
    if name == "" {
        C.RiBegin(nil)
        return
    }
    pName := C.CString(name)
    defer C.free(unsafe.Pointer(pName))
    C.RiBegin(pName)
}
{% endhighlight %}

I suppose I didn't need to use `defer` here, but it seems like a good habit when working with explictly-allocated memory. The defer keyword is an interesting alternative to the RAII paradigm that grew out of languages with exception handling.  Go doesn't have exceptions, which I'm quite happy about.  The language designers added features that do more than enough to compensate.

## KISS

So far I'm loving Go.  My only quibble is that the built-in math package currently assumes you want to use 64-bit floats, which isn't ideal when interfacing with graphics API's like OpenGL and RenderMan.
