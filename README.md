# 将大部分远程文件加载到本地了，经测试不支持dall-e，所以去掉了

# chatgpt-web
Pure Javascript ChatGPT demo based on OpenAI API 

纯JS实现的ChatGPT项目，基于OpenAI API

部署一个HTML文件即可使用。

支持复制，刷新，语音输入，朗读等功能，以及众多[自定义选项](#自定义选项)。

参考项目: 
[markdown-it](https://github.com/markdown-it/markdown-it), 
[highlight.js](https://github.com/highlightjs/highlight.js), 
[github-markdown-css](https://github.com/sindresorhus/github-markdown-css), 
[chatgpt-html](https://github.com/slippersheepig/chatgpt-html), 
[markdown-it-copy](https://github.com/ReAlign/markdown-it-copy), 
[markdown-it-texmath](https://github.com/goessner/markdown-it-texmath), 
[awesome-chatgpt-prompts-zh](https://github.com/PlexPt/awesome-chatgpt-prompts-zh)

![示例](https://raw.githubusercontent.com/xqdoo00o/chatgpt-web/main/example.png)

## Demo

[在线预览](https://suwubee.github.io/chatgpt-web/) （使用需配置自定义API key和自定义接口）

## 自定义选项

- 可选GPT模型，默认gpt-3.5，当前使用gpt-4模型需通过openai的表单申请。

- 可选自定义接口地址，使用nginx或caddy部署反代后可以不设置。

- 可选API key，默认不设置，**如需网页设置自定义API key使用，反代接口最好配置https，公网以http方式明文传输API key极易被中间人截获。**

- 可选系统角色，默认不开启，有四个预设角色，并动态加载[awesome-chatgpt-prompts-zh](https://github.com/PlexPt/awesome-chatgpt-prompts-zh)中的角色。
- 可选角色性格，默认灵活创新，对应接口文档的top_p参数。

- 可选回答质量，默认平衡，对应接口文档的temperature参数。

- 修改打字机速度，默认较快，值越大速度越快。

- 允许连续对话，默认开启，对话中包含上下文信息，会导致api费用增加。

- 允许长回复，默认关闭，**开启后可能导致api费用增加，并丢失大部分上下文，对于一些要发送`继续`才完整的回复，不用发`继续`了。**

- 选择语音，默认Bing语音，支持Azure语音和系统语音，可分开设置提问语音和回答语音。

- 音量，默认最大。

- 语速，默认正常。

- 音调，默认正常。

- 允许连续朗读，默认开启，连续郎读到所有对话结束。

- 允许自动朗读，默认关闭，自动朗读新的回答。**（iOS需打开设置-自动播放视频预览，Mac上Safari需打开此网站的设置-允许全部自动播放）**

- 支持语音输入，默认识别为普通话，可长按语音按钮修改识别选项。**语音识别必需条件：使用chrome内核系浏览器 + https网页或本地网页。** 如点击语音按钮没反应，可能是未授予麦克风权限或者没安装麦克风设备。

- 左边栏支持功能，新建会话，重命名，删除会话。导出所有会话，导入会话文件，清空所有会话。
