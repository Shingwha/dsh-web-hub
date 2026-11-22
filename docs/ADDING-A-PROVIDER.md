# 加一个来源

一个来源只需要两个文件动一次：自己的模块，和注册表里的一行。

## 1. 声明工具

新建 `src/providers/<id>.js`：

```js
import { fetchResult, searchResult, sources } from '../sources.js'
import { bearer, requestHeaders } from '../transport.js'

export default {
  id: 'example',                 // 工具名前缀，也是面板里的来源 id
  title: 'Example',              // 面板显示名
  host: 'example.com',           // 图标兜底用的站点
  keyRequired: false,            // true 时没 key 直接报错；false 时由工具自己失败
  defaults: {
    baseURL: 'https://mcp.example.com/mcp',
    keyRef: 'EXAMPLE_API_KEY',   // 面板里的凭据槽位名
    consoleURL: 'https://example.com/keys',
  },
  headers: key => requestHeaders('example', bearer(key)),
  tools: {
    search: {
      mcp: 'search',             // 远端 MCP 工具名
      card: 'search',            // 可选：'search' 或 'fetch'，不写就不挂卡片
      description: '…',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      args: (args, cfg) => ({ query: args.query }),  // 可选：参数映射
      parse: text => searchResult({ items: sources(JSON.parse(text).results), raw: text }), // 可选
    },
  },
}
```

约定：

- `mcp` 是远端工具名，`card` 决定会话里的卡片类型，`needsKey: true` 让面板在未配置时标 `需 API Key`。
- `args` 缺省就原样透传；`parse` 缺省就返回 `{ text }`（模型看到原文，卡片退回纯文本）。
- 不要替调用方补默认值：条数之类的参数，用户没配（`cfg.maxResults` 为 0）就不传，让服务商用自己默认。
- 搜索类一律用 `searchResult`，抓取类一律用 `fetchResult`；不要在适配器里拼文本或拼卡片数据。

## 2. 登记

`src/providers/index.js` 加一行 import 和一行注册。

## 3. 同步客户端

```bash
npm run sync
```

把卡片类型、需 key 标记和来源站点写进 `client.js` 的生成区段。生成区段不要手改。

## 4. 补测试

- `test/fixtures/<id>-search.*`：一份真实响应
- `test/parsers.test.mjs`：断言 `parse` 产出的 `sources` / `meta`
- 卡片相关不用额外测：`test/client.test.mjs` 会自动覆盖新注册的工具

```bash
npm run check
```

## 5. 图标（可选）

在 `client.js` 的 `PROVIDER_ICONS` 里加一条 32×32 的 PNG data URI；不做的话会退回该来源站点的 favicon，再退回字母块。
