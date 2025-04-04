# ChatGPT Web

本项目是一个基于 ChatGPT Web 界面二次开发的版本，主要目标是分离 API 调用，并增加一些额外的功能。

## 主要特性

1.  **URL 参数配置**:
    *   支持通过 URL 查询参数直接传入 API 地址、密钥和模型名称。
    *   示例：`/?url=https://apiurl.com&urlkey=sk-your_api_key&model=deepseek-v3`
        *   `url`: 指定 API 的基础 URL。
        *   `urlkey`: 指定 API 密钥。
        *   `model`: 指定使用的模型名称。

2.  **语音输入输出**:
    *   集成了免费的 Edge TTS API，支持语音输入和语音输出功能。
    *   **注意**: 语音输出功能需要将网页部署在 HTTPS 环境下才能正常工作。

3  **代码框独立渲染**:
    *   针对HTML、SVG、XML等格式，支持独立渲染显示。

4.  **配置本地化**:
    *   所有应用配置项已分离，并保存在本地浏览器缓存中，方便用户自定义和持久化设置。

5.  **Tauri 客户端**:
    *   提供了 Tauri 打包的桌面客户端版本，方便在不同操作系统上使用。

## 如何使用

1.  **将文件直接存放到Web服务**:仅需支持HTML
2.  **本地安装exe客户端**

## Future
由于是web请求，针对CORS仍然无法很好的支持，如果使用nodejs或者py，则对web环境有一定要求。
后期考虑在Tauri中加入独立请求，模拟Chatbox等软件的请求方式来绕过CORS.

## 贡献

欢迎提交 Issue 或 Pull Request。
