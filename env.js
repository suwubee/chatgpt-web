// 从URL参数中读取配置
const urlParams = new URLSearchParams(window.location.search);

// 控制是否使用默认配置的开关
const useDefaultConfig = true; // 设置为true时使用默认配置，false时仅使用URL参数

// 默认配置值
const defaultAPIEndpoint = "https://apistudy.mycache.cn"; // 默认API端点
const defaultAPIKey = "sk-H8fx8ob4X9LtT0Ah6a1852A98b9e472391F4D24eC48e357d"; // 默认API密钥
const defaultAPIModel = "deepseek-v3"; // 默认模型 - 使用OpenAI API格式请求此模型

// OpenAI API配置
envAPIEndpoint = urlParams.get("url") || (useDefaultConfig ? defaultAPIEndpoint : "");
envAPIKey = urlParams.get("urlkey") || (useDefaultConfig ? defaultAPIKey : "");
envAPIModel = urlParams.get("model") || (useDefaultConfig ? defaultAPIModel : "");

// DeepSeek API配置
envDeepSeekAPIEndpoint = urlParams.get("deepseekurl") || "";
envDeepSeekAPIKey = urlParams.get("deepseekkey") || "";
envDeepSeekAPIModel = urlParams.get("deepseekmodel") || "";

// Azure API配置
envAzureAIAPIEndpoint = urlParams.get("azureurl") || "";
envAzureAIAPIKey = urlParams.get("azurekey") || "";
envAzureAIAPIModel = urlParams.get("azuremodel") || "";

// Gemini API配置
envGeminiAPIEndpoint = urlParams.get("geminiurl") || "";
envGeminiAPIKey = urlParams.get("geminikey") || "";
envGeminiAPIModel = urlParams.get("geminimodel") || "";

// Claude API配置
envClaudeAPIEndpoint = urlParams.get("claudeurl") || "";
envClaudeAPIKey = urlParams.get("claudekey") || "";
envClaudeAPIModel = urlParams.get("claudemodel") || "";

// 调试信息
console.log("环境变量已从URL参数加载");
if (useDefaultConfig) {
    console.log("默认配置开关已启用，使用内置默认API配置");
} else {
    console.log("默认配置开关已禁用，仅使用URL参数");
}
if (envAPIEndpoint) console.log("检测到OpenAI配置");
if (envDeepSeekAPIEndpoint) console.log("检测到DeepSeek配置");
if (envAzureAIAPIEndpoint) console.log("检测到Azure配置");
if (envGeminiAPIEndpoint) console.log("检测到Gemini配置");
if (envClaudeAPIEndpoint) console.log("检测到Claude配置"); 