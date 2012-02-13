---
layout: page
title: The Little Grasshopper
---
<ul class="posts" style="list-style-type:none">
  {% for post in site.posts %}
  <li>
    <span>
      <div>
        <img src="{{ post.thumbnail }}" alt="thumbnail"/>
      </div>
      <span>
        {{ post.date | date_to_string }}
      </span>
      &raquo;
      <a href="{{ BASE_PATH }}{{ post.url }}">
        {{ post.title }}
      </a>
      <p>
        <i>{{ post.description }}</i>
      </p>
    </span>
    <hr/>
  </li>
  {% endfor %}
</ul>
