To try it out:

    rm -rf _site
    jekyll --server --pygments

Also might need to do this:

    easy_install pygments
    pygmentize -f html -S default -a .highlight > assets/css/syntax.css
    echo ".cpp  { background: #f8f8f8; background-color: #f8f8f8; }" >> assets/css/syntax.css
    echo ".glsl  { background: #f8f8f8; background-color: #f8f8f8; }" >> assets/css/syntax.css
    echo ".c  { background: #f8f8f8; background-color: #f8f8f8; }" >> assets/css/syntax.css
