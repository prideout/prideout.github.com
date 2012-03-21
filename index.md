---
layout: page
title: The Little Grasshopper
---
<ul class="posts" style="list-style-type:none;" >
  {% for post in site.posts %}
  <li>
    <a href="{{ BASE_PATH }}{{ post.url }}" class="clicktile">
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
    <hr/>
  </li>
  {% endfor %}
</ul>
