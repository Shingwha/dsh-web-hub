# dsh-web-hub

给模型挂上搜索与抓取工具：一个开关表决定模型能看到什么，来源只是分组。

## 配置

**Plugins → dsh-web-hub**：

1. **工具开关** — 打开即模型可调用；关闭则从工具列表移除，不占 token
2. **密钥** — 每组末尾一行摘要（`已配置 · 更换 · 清除`），点「设置/更换」原地展开输入框；未配置的来源在组标题旁标出

开关即点即生效；密钥点“保存”立即写入，不需要整页保存。

同一时刻可以混用不同来源的工具：用 A 的搜索、B 的抓取，或把内置的官方工具也打开。

## 行为

- 默认值：内置的 `web_search` / `web_fetch` **开启**，各来源工具**关闭**——安装不会拿走你原有的能力
- 工具名是 `来源_工具`，例如 `exa_search`、`firecrawl_extract`
- 关闭的工具不进模型上下文，也不占 token
- 停用或卸载插件，工具与内置网页工具都自动恢复

## 工具清单

每个来源接入其 MCP 服务 `tools/list` 返回的全部工具，名字为 `来源_工具`（如 `tavily_crawl`、`exa_search`）。

唯一的例外是 Firecrawl 的 `firecrawl_parse`：托管端点要求两阶段文件上传（先取上传指令、本地 PUT、再用 `uploadRef` 调用），我们的单次 `tools/call` 传输无法完成，因此不暴露。

Tavily 的 `crawl` / `map` / `research` 需要 API key（免 key 只覆盖 search 与 extract）；面板在 key 未配置时给这些工具标 `需 API Key`。

## 工具结果的两条投影

每个工具返回 `{ text, meta }`：

- `text` 是模型读到的全部内容，格式与内置网页工具一致（`Sources:` + 链接 + 摘要）
- `meta` 是结构化卡片数据，经 `output.presentationMeta` 持久化进会话日志；会话回放从它重建卡片，不解析文本

`meta` 形状对齐内置 `web_search`：搜索是 `{ truncated, sources: [{ url, title?, snippet?, publishedAt? }], answer? }`，抓取是 `{ truncated, url, statusCode }`。

会话卡片由 `client.js` 注册到 `tool.call.toolview`（按 wire 工具名索引），覆盖四个来源的 search / extract 以及 Tavily 的 crawl / map：搜索卡展开是来源列表，抓取卡是单行链接。`meta` 缺失或畸形时退回纯文本，卡片自身抛错也不会白屏。

## 加来源

`src/providers/` 新增一个模块，声明自己的工具，再到 `src/providers/index.js` 登记一行，跑 `npm run sync`；核心与面板不用改。

需要凭据的来源在 `defaults` 里写 `keyRef`，密钥只进凭据库，配置只存引用名。
