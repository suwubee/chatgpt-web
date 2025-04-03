// 从URL参数中读取配置
const urlParams = new URLSearchParams(window.location.search);

// OpenAI API配置
envAPIEndpoint = urlParams.get("url") || "";
envAPIKey = urlParams.get("urlkey") || "";
envAPIModel = urlParams.get("model") || "";

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

// 强制设置模型显示 (在DOM加载后执行)
function forceModelDisplayFromURL() {
    if (envAPIModel) {
        try {
            const modelVerSpan = document.getElementById('modelVer');
            const modelInput = document.getElementById('modelInput');
            const customGPTDOM = document.getElementById('customGPTDOM');

            // 1. 直接更新 modelVer 显示
            if (modelVerSpan) {
                modelVerSpan.textContent = envAPIModel; 
                console.log("已直接设置 modelVer 为: " + envAPIModel);
            }

            // 2. 更新模型输入框的值
            if (modelInput) {
                modelInput.value = envAPIModel;
                console.log("已设置 modelInput 为: " + envAPIModel);
                // 可能需要触发 'input' 或 'change' 事件，但要小心覆盖
                // const inputEvent = new Event('input', { bubbles: true });
                // modelInput.dispatchEvent(inputEvent);
            }

            // 3. 更新自定义模型元素的数据
            if (customGPTDOM) {
                customGPTDOM.classList.remove("hide");
                customGPTDOM.dataset.value = envAPIModel;
                customGPTDOM.dataset.ver = envAPIModel; // 确保 data-ver 也是完整的
                if (customGPTDOM.lastElementChild) {
                    customGPTDOM.lastElementChild.textContent = envAPIModel;
                }
                console.log("已更新 customGPTDOM 数据");
            }
            
            // 4. 更新全局 modelVersion 变量 (如果后续代码依赖它)
            // 注意: 这可能需要根据 index.html 中 modelVersion 的实际作用域来调整
            if (typeof modelVersion !== 'undefined') {
                 modelVersion = envAPIModel;
                 console.log("已尝试更新全局 modelVersion 变量");
            } else {
                // 如果 modelVersion 还未定义，可能需要等待或使用其他方式
                console.warn("无法在此时更新全局 modelVersion 变量");
            }

        } catch (error) {
            console.error("强制设置模型显示出错：", error);
        }
    }
}

// 确保在DOM完全加载并且可能执行了其他初始化脚本后，再强制更新
if (document.readyState === 'loading') { // 初始加载时
    document.addEventListener('DOMContentLoaded', forceModelDisplayFromURL);
} else { // 如果DOM已经加载完成
    // 稍微延迟执行，给其他脚本一点时间
    setTimeout(forceModelDisplayFromURL, 100); 
}

// 调试信息
console.log("环境变量已从URL参数加载");
if (envAPIEndpoint) console.log("检测到OpenAI配置");
if (envDeepSeekAPIEndpoint) console.log("检测到DeepSeek配置");
if (envAzureAIAPIEndpoint) console.log("检测到Azure配置");
if (envGeminiAPIEndpoint) console.log("检测到Gemini配置");
if (envClaudeAPIEndpoint) console.log("检测到Claude配置"); 
if (envClaudeAPIEndpoint) console.log("检测到Claude配置"); 