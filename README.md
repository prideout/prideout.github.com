# Installation

To try it out:

    rm -rf _site
    jekyll --server --pygments

Also might need to do this:

    easy_install pygments
    pygmentize -f html -S default -a .highlight > assets/css/syntax.css
    echo "code { background: #f8f8f8; background-color: #f8f8f8; }" >> assets/css/syntax.css

# Reference

This is where the top-level HTML lives, with the favicon declaration, topbar, mainbody container, and footer:

    _includes/default.html

This has the loop over posts to show a summary on the portal:

    blog-skeleton/index.md

Learn about the CSS here:

http://twitter.github.com/bootstrap/scaffolding.html
