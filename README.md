# dsh-web-hub

[中文](README.md) | [English](README.en.md)

给 DeepSeek Harness 提供搜索与抓取工具：**一个开关表决定模型能看到什么**，来源只是工具的分组。

一家提供搜索、另一家提供抓取，甚至和内置的官方工具混用，都可以任意组合。

## 环境要求

- DeepSeek Harness `>= 0.2.2-rc.3`（带 Web GUI 的版本）
- 无需额外运行时；API Key 可选

## 安装

### 方式一：从 GitHub 安装（推荐）

1. 打开 DSH 左侧栏的 **Plugins**。
2. 点 **Add plugin**。
3. 输入下面这行，确认：

   ```
   github:Shingwha/dsh-web-hub
   ```

4. 等待安装完成（首次会拉取依赖，约几秒）。
5. **刷新一次页面**，让浏览器加载面板代码。

### 方式二：本地打包安装（开发用）

```sh
npm pack
```

把生成的 `dsh-web-hub-<版本>.tgz` 的**绝对路径**填进 Add plugin。

不要直接选插件目录：pnpm 会把目录装成 `link:`，`@deepseek-ai/*` 依赖解析会失败。

## 装好之后

- 模型多出 7 个工具：`anysearch_search`、`anysearch_extract`、`exa_search`、`exa_extract`、`tavily_search`、`tavily_extract`、`firecrawl_extract`
- DSH 自带的 `web_search` / `web_fetch` 默认**关闭**，避免两套搜索并存

不想要哪些就关掉哪些，全都关掉也不会出错。

## 配置

打开 **Plugins → dsh-web-hub**，界面按来源分组：

```
工具                                       7/13
内置
  web_search      [ ]    web_fetch      [ ]
AnySearch        已配置密钥
  anysearch_search [✓]   anysearch_extract [✓]
  密钥 ANYSEARCH_API_KEY · 已配置   获取 API Key  [清除]
Exa              未配置密钥
  exa_search      [✓]    exa_extract   [✓]
  密钥 EXA_API_KEY · 未配置        获取 API Key  [____] [保存]
…
```

- **开关**：打开 = 模型下一步就能调用；关闭 = 从工具列表移除，且不占 token
- **密钥**：在每个来源的组内，可选。留空按匿名/免 key 调用，点击「获取 API Key」直达申请页
- 密钥只写入本机凭据库，配置文件里仅保存引用名

## 支持的来源

| 来源 | 搜索 | 抓取 | 免 key 可用 |
|---|---|---|---|
| **AnySearch** | ✅ | ✅ | ✅ 匿名，限额较低 |
| **Exa** | ✅ | ✅ | ✅ |
| **Tavily** | ✅ | ✅ | ✅ 有每日额度，用尽后需 key |
| **Firecrawl** | ⚠️ 搜索需 key | ✅ | 抓取免 key |

## 卸载

在 Plugins 里停用或移除 **dsh-web-hub**：

- 它挂载的工具全部消失
- 被关闭的内置网页工具自动恢复
- 不需要改其它配置

## 加一个来源

在 `src/adapters/` 里加一个文件，声明它自己的工具，再到 `src/adapters/index.js` 登记一行；核心与面板都不用改。详见 [docs/DETAIL.md](docs/DETAIL.md)。

## License

MIT
