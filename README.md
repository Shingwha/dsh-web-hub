# dsh-web-hub

[中文](README.md) | [English](README.en.md)

给模型挂上搜索与抓取工具：**用哪个服务、开哪些工具、密钥填哪**，一块面板管完。

每个服务保留自己的工具、参数和说明，插件只负责把它们挂上去，并按开关决定模型能不能看到。

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

装好后 Plugins 列表里会出现 **dsh-web-hub**，状态为「运行中」。

### 方式二：本地打包安装（开发用）

```sh
npm pack
```

把生成的 `dsh-web-hub-<版本>.tgz` 的**绝对路径**填进 Add plugin。

不要直接选插件目录：pnpm 会把目录装成 `link:`，`@deepseek-ai/*` 依赖解析会失败。

## 装好之后

插件默认立即生效：

- 模型多出 `anysearch_search`、`anysearch_extract` 两个工具
- DSH 自带的 `web_search` / `web_fetch` **被隐藏**，避免两套搜索并存

不想隐藏内置工具，打开 **Plugins → dsh-web-hub**，关掉「隐藏官方插件提供的 web_search / web_fetch」即可。

验证：新开一个会话，让模型搜点东西，它应该调用 `anysearch_search` 而不是 `web_search`。

## 配置

打开 **Plugins → dsh-web-hub**：

1. **来源** — 选一个服务；选「关闭」则不下发任何工具。
2. **工具** — 默认开 `search` 和 `extract`，其余按需勾选。
3. **密钥（可选）** — 留空按匿名调用（限额较低），点「获取 API Key」直达申请页。

开关和来源点一下立即生效；密钥填完点「保存」。

## 支持的来源

| 来源 | 搜索 | 抓取 | 免 key 可用 |
|---|---|---|---|
| **AnySearch** | ✅ | ✅ | ✅ 匿名，限额较低 |
| **Exa** | ✅ | ✅ | ✅ |
| **Tavily** | ✅ | ✅ | ✅ 有每日额度，用尽后需 key |
| **Firecrawl** | ⚠️ 搜索需 key | ✅ | 抓取免 key |

同一时刻只有一个来源生效，切换后模型下一步就看到新的工具集。

## 三个开关分别做什么

| 开关 | 效果 |
|---|---|
| 来源 | 挂载该服务的工具，模型下一步就能调用 |
| 工具开关 | 没勾的工具不进入模型上下文，也不占 token |
| 隐藏内置网页工具 | 屏蔽官方插件提供的 `web_search` / `web_fetch` |

## 卸载

在 Plugins 里停用或移除 **dsh-web-hub**：

- 它挂载的工具全部消失
- 被隐藏的内置网页工具自动恢复
- 不需要改其它配置

## 加一个来源

在 `src/adapters/` 里加一个文件，声明它自己的工具，再到 `src/adapters/index.js` 登记一行；核心与面板都不用改。详见 [docs/DETAIL.md](docs/DETAIL.md)。

## License

MIT
