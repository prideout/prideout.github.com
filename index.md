---
layout: page
title: The Little Grasshopper
---
<ul class="posts">
  {% for post in site.posts %}
  <li>
    <span>
      {{ post.date | date_to_string }}
    </span>
    &raquo;
    <a href="{{ BASE_PATH }}{{ post.url }}">
      {{ post.title }}
    </a>
    <hr/>
  </li>
  {% endfor %}
</ul>
