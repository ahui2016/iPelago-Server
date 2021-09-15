# iPelago Server

一个简单的独立微博客程序，有点像早期的 twitter/饭否/微博，但不是一个平台，而是一个单用户微博客程序。

## 保卫表达欲

(本小节参考: https://sspai.com/post/60024)

- 点赞、评论机制使人产生兴奋、期待，这些情绪会干扰后续表达，或带来社交压力。
- 在社交平台频繁发布消息（刷屏/灌水）会担心打扰关注者。
- 为避免引战、被攻击以及各种原因需要进行较严格的自我审查。
- 一方面经常有很多想法不吐不快，不加以记录十分可惜，另一方面也希望公开这些想法，而不是记录到日记本里。

因此，简单的独立微博客(microblog)正好切合这种表达需求，并且可以完全掌握自己的数据。

## 功能特色

- 后端代码采用 Go 语言，代码简单，消耗资源少。
- 可创建和管理多个频道（在本软件中，一个频道称为一个 "小岛"）。
- 每个频道可单独设置为公开或隐私，隐私小岛必须用管理员密码登入后才能访问。
- 有站内搜索功能。

## 在线试用

https://demo.ipelago.org/ (密码abc)

## 安装运行

- 使用本软件需要拥有服务器（比如 VPS），需要建站的基础知识。
- 先正确安装 git 和 Go 语言环境（https://golang.google.cn/doc/install）。

```
$ cd ~
$ git clone https://github.com/ahui2016/iPelago-Server.git
$ cd iPelago-Server
$ go build
$ ./iPelago-Server
```

可使用参数 `-addr` 更改端口，比如:

```
$ ./iPelago-Server -addr 0.0.0.0:955
```

成功建站后，需要用管理员密码（初始密码是 abc）登入才能新建频道（小岛）和发布消息，可在 Config 页面更改密码。

### 前端采用 TypeScript 和 mj.js

- mj.js 是一个受 Mithril.js 启发的基于 jQuery 实现的极简框架，对于曾经用过 jQuery 的人来说，学习成本接近零。详见 https://github.com/ahui2016/mj.js

- 如果需要修改本软件的前端代码，请直接修改 public/ts/src 文件夹内的 ts 文件，修改后在 public/ts/ 文件夹内执行 tsc 命令即可自动重新生成必要的 js 文件。如果只是简单修改，也可以直接修改 public/ts/dist 里的 js 文件。

- 另外，本质上是前后端分离的，懂前端的朋友可以在完全不改动后端的情况下彻底改写前端。如果需要增加后端 api 又不想自己动手，可以发 issue, 工作量不大的话我可以增加一些 api。目前提供的全部 api 详见本页底部。

## iPelago beta 本地版

- 本软件(github.com/ahui2016/iPelago-Server) 可单独使用，也可当作 [iPelago](https://ipelago.org) 的工具来使用，成功搭建网站后可非常方便地发布消息（不需要利用第三方平台），但没有订阅小岛的功能。

- 另外还有一个 iPelago beta 本地版(github.com/ahui2016/ipelago), 不需要服务器不需要搭建网站，可创建小岛（单账号）、批量订阅小岛，但对外发布消息时需要利用第三方平台。

## 为什么不提供RSS？

用本程序搭建的独立微博客不提供 RSS, 但通过 [iPelago](https://ipelago.org) 来提供类似 RSS 的订阅服务，因为：

- RSS feed 的生成、客户端的编程比较复杂，与之相比, iPelago 采用结构简单到极致的 json 文件，因此即使是刚入门的编程初学者都能轻松写出生成相关 json 文件的程序，就算编写一个客户端，工作量也非常少（有完整的客户端代码供参考）。

- RSS 不关心资源消耗, XML 本身也比 json 更臃肿，尤其是对于微博客 (microblog) 这种文章内容比较短的情况, XML 很可能标签占用的字符就比正文更多。与之相比, iPelago 的协议从设计上就开始考虑节约资源。

## 注意事项

- 隐私小岛只是不能简单地通过网络访问，但没有加密，因此如果数据库泄漏就会泄露隐私小岛的内容。这与绝大多数网站的隐私处理是一样的，都只是隐藏而不是加密。

## 前后端分离

本程序是前后端分离的，可以在完全不改动后端的情况下彻底改写前端。目前，前端可以使用的 api 如下所示。

- 其中以 /admin 开头的必须在登入后才能使用，以 /api 开头的则不登入也能使用
- 访问 "/" 会跳转到 "/public/index.html"
- 下面用 => 表示成功时服务器返回的数据

### 查询是否已登入

- GET: /api/login-status => boolean

### 登入

- POST: /api/login {"password": string}

### 登出

- GET: /api/logout

### 获取消息

- 获取公开消息 POST: /api/more-public-messages {"time", string} => Message[]

- 获取公开及隐藏消息 POST: /admin/more-all-messages {"time", string} => Message[]

- "time" 是一个时间戳（精确到秒）的字符串形式，比如 "1630510203"

- Message[] 是指一个Message数组, Message 的结构是 (注意首字母大写):

  ```
  {
    ID:       string;
    IslandID: string;
    Time:     number;
    Body:     string;
  }
  ```

### 获取首页标题

- GET: /api/get-titles => {"title": string, "subtitle": string}

### 获取小岛属性

- 未登入时 POST: /api/get-island {"id": string} => Island
- 已登入后 POST: /admin/get-island {"id": string} => Island
- "id" 是指 Message.IslandID (请参考”获取消息“)
- Island 的结构详见源码中的 public/ts/src/util.ts

### 更改首页标题

- POST: /admin/update-titles {"title": string, "subtitle": string}

### 更改密码

- POST: /admin/change-password {"old-pwd": string, "new-pwd": string}

### 获取小岛列表

- GET: /admin/all-islands => Island[]
- Island[] 是指一个Island数组, Island 的结构详见源码中的 public/ts/src/util.ts

### 创建/更新小岛

- 创建 POST: /admin/create-island => {"message": string} （返回值是小岛ID）
- 更新 POST: /admin/update-island
- 发送时应包含的项目详见源码 public/ts/src/island-info.ts 中的函数 newIslandForm()

### 发布消息

- POST: /admin/post-message {"msg-body", "island-id", "hide"} => Message
- "msg-body", "island-id", "hide" 都是字符串，其中 "hide" 只能是 "public" 或 "private"
- Message 的结构请参考上文 "获取消息"

### 获取指定小岛的消息

- 未登入时 POST: /api/more-island-messages {"id": string, "time", string} => Message[]
- 已登入后 POST: /admin/more-island-messages {"id": string, "time", string} => Message[]
- 关于 "time" 与 Message[] 请参考上文 "获取消息"

### 删除消息

- POST: /admin/delete-message {"message-id": string, "island-id": string}

### 删除小岛

- POST: /admin/delete-island {"id": string}

### 站内搜索

- POST: /admin/search-messages => Message[]
- 关于 Message[] 请参考上文 "获取消息"

### 下载数据库文件

- GET: /admin/download-db
