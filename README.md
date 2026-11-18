# dsh-web-hub

一个 DeepSeek Harness（DSH）插件：把各个搜索 / 抓取服务**自有的工具**挂进来，用一块面板统一管理——选哪个来源、开哪些工具、密钥填在哪。

- **不做抽象层**：每个 provider 自己拥有工具的名字、描述、JSON Schema 和实现；hub 只负责注册、注销和开关
- **单一来源生效**：同一时刻只有一个 provider 被挂载，避免两套搜索并存、互相抢调用
- **两级开关**：来源开关 + 逐个工具开关
- **密钥可选**：多数服务允许匿名调用；key 缺失时自动走匿名，配了就用更高的限额
- **不碰内置工具**：可选隐藏 DSH 内置的 `web_search` / `web_fetch`，卸载即恢复

## 安装

在 Plugins 页 **Add plugin** 里粘贴：

```
github:Shingwha/dsh-web-hub
```

或者本地打包后安装 tarball 的绝对路径（**不要**直接用本地目录安装：pnpm 会创建 `link:`，导致依赖解析失败）。

```sh
npm pack
# 然后在 Plugins → Add plugin 里选 dsh-web-hub-0.1.0.tgz 的绝对路径
```

## 配置

面板位于 **Plugins → 网页来源**。所有字段即时生效（保存会重建工具集）。

```yaml
active: anysearch          # 当前来源；空字符串 = 全部关闭
hideBuiltinWeb: true       # 隐藏内置 web_search / web_fetch
providers:
  anysearch:
    baseURL: https://api.anysearch.com/mcp
    keyRef: ANYSEARCH_API_KEY   # 凭据库里的名字，不是密钥本身
    maxResults: 8
    timeoutMs: 30000
tools:                     # 逐工具开关，键是公开工具名
  anysearch_search: true
  anysearch_extract: true
  anysearch_get_sub_domains: false
  anysearch_batch_search: false
  anysearch_score: false
```

密钥只存入本机凭据库（`~/.dsh/.credentials.yaml` 的 `refs`），配置文件里永远只有引用名。

## 工具

工具名统一前缀 provider id，跨来源绝不重名，会话历史与权限规则不会因为换源而失效。

| 工具 | 说明 | 默认 |
|---|---|---|
| `anysearch_search` | 网页 / 垂直检索，返回标题与来源 URL | ✅ |
| `anysearch_extract` | 抓取网页并转 Markdown | ✅ |
| `anysearch_get_sub_domains` | 列出垂直领域目录与参数定义 | ⬜ |
| `anysearch_batch_search` | 并行 1–5 条查询 | ⬜ |
| `anysearch_score` | 提交检索质量反馈 | ⬜ |

关掉的工具不会进入模型上下文，也就没有 token 成本。

## 新增一个来源

在 `src/adapters/` 里加一个文件，声明自己的工具，然后在 `src/adapters/index.js` 登记一行——**核心、面板、配置结构都不用改**。

```js
export default {
  id: 'acme',
  title: 'Acme Search',
  keyRequired: true,              // 没有 key 就不能用
  tools: {
    search: {
      defaultOn: true,
      description: 'Search Acme and return cited results.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        // 返回纯文本即可，hub 会渲染成一条 text block
      },
    },
  },
}
```

## 卸载与回退

停用或卸载本插件会注销它全部工具、解除对内置工具的隐藏，恢复出厂行为，不需要改其它配置。

## 已知边界

- 同一时刻只挂载一个 provider（多来源并存需要给工具名再做一层空间，当前未启用）
- 内置 `web_search` / `web_fetch` 属于 Agent preset，无法被卸载，只能按 agent 屏蔽
- provider 的 `score` 之类"回传类"工具默认关闭，避免模型每轮多调一次

## License

MIT
