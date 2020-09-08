# nuxt-page-cache-with-redis

A module of Nuxt.js, which can cache page that rended in server with redis.

this module can cache the rendered pages and return them directly when the routes match again, so as to reduce the resource consumption of the rendering server.

## Setup

```
npm i nuxt-page-cache-with-redis --save
```

## Usage

In `nuxt.config.js`:

```js
version: "0.0.1",
modules: [
        [
            "nuxt-page-cache-with-redis",
            {
                expireTime: 60 * 60,
                redis: {
                    host: "127.0.0.1",
                    port: 6379,
                    password: "",
                },
                matches: ["/case/", "/cases/", "/product/", "/products/", "/brand/", "/barnds/", "/shop/", "/scenegraph/", "/ichnograph/"],
            },
        ],
    ],
```

version is the key of published app, if you publish a new version of app, you have to change the version of the nuxt app.

matches is a array, contains keyword of router.
"/case/" will match all router begin with this,like "/case/1","/case/100","/case/any"

## Taged

Page which is return from redis, has a HTTP RESPONSE header "x-page-cache", that valued "hit" .
