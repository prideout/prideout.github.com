---
layout: page
title: The Little Grasshopper
---
<ul class="posts" style="list-style-type:none;">
  <style type="text/css">
    a:hover {text-decoration: none}
    div.content {padding: 0px}
  </style>
  {% for post in site.posts %}
  <li id="{{ post.id | remove:'/' }}" style="padding-top:20px;padding-bottom:20px">
    <style type="text/css">
      li#{{ post.id | remove:'/' }}:hover { background-color: #fff }
    </style>
    <a href="{{ BASE_PATH }}{{ post.url }}" >
      <div class="row">
        <div class="span3">
          <img src="{{ BASE_PATH }}/assets/thumbnails/{{ post.thumbnail }}" alt="thumbnail"/>
        </div>
        
        <div class="span9">
          <strong class="PostTitle" style="font-size:22px" >{{ post.title }}</strong>
          <p class="PostDesc" style="font-size:18px;color:#0a0a0a;margin-top:2px">
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
    </a>
  </li>
  {% endfor %}
</ul>
