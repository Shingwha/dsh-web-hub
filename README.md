# dsh-web-hub

给模型挂上搜索与抓取工具：**用哪个服务**、**开哪些工具**、**密钥填哪**，一块面板管完。

## 安装

Plugins → Add plugin，粘贴：

```
github:Shingwha/dsh-web-hub
```

本地打包的话，装 `.tgz` 的绝对路径（不要直接装目录）。

## 配置

打开 **Plugins → dsh-web-hub**，三步：

1. **当前来源** — 用哪个服务。选「关闭」就一个工具都不下发。
2. **工具开关** — 默认开 `search` 和 `extract`，其余按需勾选。
3. **API Key（可选）** — 留空即匿名调用（限额低），填了用更高限额。

保存后立即生效。

## 三个开关做什么

| 开关 | 效果 |
|---|---|
| 当前来源 | 挂载该服务的工具，模型马上能调用 |
| 工具开关 | 没勾的工具不会出现在模型工具列表里，也不占 token |
| 隐藏内置网页工具 | 关掉 DSH 自带的 `web_search` / `web_fetch`，避免两套搜索打架 |

工具名带来源前缀：`anysearch_search`、`anysearch_extract`。

## 卸载

停用或卸载插件即注销全部工具、恢复内置工具，不用改其它配置。

## 代码结构

```
index.js              装配：挂内置屏蔽、挂工具
src/config.js         配置 schema 与实时读取
src/registry.js       注册表 → 工具定义、命名、准入
src/builtin.js        屏蔽内置 web_search / web_fetch
src/adapters/         每个搜索服务一个文件（唯一扩展点）
client.js             Plugins 页面板
```

## 加一个来源

在 `src/adapters/` 里加一个文件，再到 `src/adapters/index.js` 登记一行。见 [docs/DETAIL.md](docs/DETAIL.md)。

## License

MIT
