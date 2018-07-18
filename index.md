---
layout: index
---
<ul class="index">
    {% for post in site.posts %}
    <li id="{{ post.id | remove:'/' }}">

        {% if post.special_url != nil %}
        <a class="row" href="{{ post.special_url }}" >
        {% else %}
        <a class="row" href="{{ BASE_PATH }}{{ post.url }}" >
        {% endif %}

            <div class="col-sm-3 col-md-2">
                {% if post.thumbnail != nil %}
                    <img
                        src="{{ BASE_PATH }}/assets/thumbnails/{{ post.thumbnail }}"
                        alt="thumbnail"/>
                {% else %}
                    <img class="post_icon" src="{{ post.icon_url }}" alt="icon"/>
                {% endif %}
            </div>

            <div class="description col-sm-6">
                <strong>{{ post.title }}</strong>
                <p>
                    {{ post.description }}
                </p>
                <span>
                    {{ post.date | date: "%Y-%m-%d" }} |
                    {% for tag in post.tags %}
                    {{ tag }}
                    {% endfor %}
                </span>
            </div>

        </a>
    </li>
    {% endfor %}
</ul>
