---
layout: page
title: The Little Grasshopper
---
<ul class="posts" style="list-style-type:none">
  {% for post in site.posts %}
  <li>
    <div class="row">

      <div class="span3">
        <a href="{{ BASE_PATH }}{{ post.url }}">
          <img src="{{ BASE_PATH }}/assets/thumbnails/{{ post.thumbnail }}" alt="thumbnail"/>
        </a>
      </div>

      <div class="span9">
        <a style="font-size:150%" href="{{ BASE_PATH }}{{ post.url }}">
          <strong class="PostTitle nuvo">{{ post.title }}</strong>
        </a>
        <p style="font-size:125%">
          {{ post.description }}
        </p>
        <span>
          {{ post.date | date: "%Y-%m-%d" }} |
          {% for tag in post.tags %}
              {{ tag }}
          {% endfor %}
        </span>
      </div>

    </div> <!-- end the row -->

    <hr/>
  </li>
  {% endfor %}
</ul>
