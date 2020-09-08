var redis = require("redis");
const { promisify } = require("util");
const { serialize, deserialize } = require("./serialize");

export default function (moduleOptions) {
    const client = redis.createClient(
        moduleOptions.redis.port,
        moduleOptions.redis.host,
        {
            password: moduleOptions.redis.password,
        }
    );

    client.on("error", function (err) {
        console.log("Error " + err);
    });

    const getAsync = promisify(client.get).bind(client);

    this.nuxt.hook("render:before", (renderer, options) => {
        const renderRoute = renderer.renderRoute.bind(renderer);

        // 重写renderer.renderRoute
        renderer.renderRoute = async function (route, context) {
            // 有token，直接渲染
            if (
                context.req.headers.cookie &&
                context.req.headers.cookie.indexOf("token") > -1
            ) {
                return renderRoute(route, context);
            }

            // 没有匹配的情况下,直接渲染
            if (!isCacheFriendly(route, moduleOptions.matches)) {
                return renderRoute(route, context);
            }

            // 返回值
            let value;
            try {
                value = await getAsync(
                    "npcwr/route::" + route + this.options.version
                );
            } catch (err) {
                // 出错了重新渲染
                console.log(err);
                return renderRoute(route, context);
            }

            if (!value) {
                // 没有找到值,重新渲染
                return renderRoute(route, context);
            } else {
                // 标记命中
                context.req.hitCache = true;

                // 从cache中获取,封装成Promise
                console.log("return from cache");
                return new Promise(function (resolve, reject) {
                    resolve(deserialize(value));
                });
            }
        };
    });

    // add cache hit header
    this.nuxt.hook("render:route", (url, result, context) => {
        console.log(url);
        // 标记相应头
        if (context.req.hitCache) {
            context.res.setHeader("x-page-cache", "hit");
        } else if (isCacheFriendly(url, moduleOptions.matches)) {
            client.set(
                "npcwr/route::" + url + this.options.version,
                serialize(result),
                "EX",
                moduleOptions.expireTime ? moduleOptions.expireTime : 1000
            );
        }
    });
}

// 判断是否为缓存对象.
function isCacheFriendly(path, matches) {
    if (!matches) {
        return false;
    }

    return matches.some((pat) =>
        pat instanceof RegExp ? pat.test(path) : path.startsWith(pat)
    );
}
