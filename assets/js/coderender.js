/**
 * 代码渲染器 - 用于在新窗口中渲染HTML、XML和SVG代码
 */

/**
 * 下载SVG文件
 * @param {HTMLElement} target - SVG元素
 * @param {Event} ev - 事件对象
 */
const downloadSVGFile = (target, ev) => {
    if (ev.target !== target) {
        let blob = new Blob([target.innerHTML], { type: "image/svg+xml" });
        downBlob(blob, "mermaid-" + target.children[0].getAttribute("aria-roledescription") + ".svg")
    }
}

// Helper function to escape content for safe embedding
const escapeContentForWrite = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\\/g, '\\\\') // Escape backslashes first
              .replace(/`/g, '\\`')    // Escape backticks
              .replace(/<\/script>/gi, '<\\/script>'); // Escape closing script tags
};

/**
 * 在新窗口中渲染代码
 * @param {string} content - 要渲染的代码内容
 * @param {string} type - 代码类型：html, xml, svg
 */
const renderCode = (content, type) => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return; // 如果弹窗被阻止
    
    // Escape content for JSON embedding and prepare data
    const renderData = JSON.stringify({ content: content, type: type });

    if (type === 'html') {
        // For HTML, write a basic structure and inject content via script
        win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>HTML 渲染</title>
            <style>
                body { margin: 0; padding: 0; font-family: sans-serif; }
                .controls { position: fixed; top: 0; right: 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 0 0 0 10px; z-index: 9999; }
                .controls button { margin: 0 5px; padding: 5px 10px; border: none; background: #fff; cursor: pointer; border-radius: 3px; }
                .controls button:hover { background: #eee; }
                .download-btn { background: #4CAF50 !important; color: white; }
                .download-btn:hover { background: #45a049 !important; }
                #console-container { display:none; position:fixed; bottom:0; left:0; right:0; height:200px; background:black; color:white; overflow:auto; padding:10px; font-family:monospace; z-index:9998; }
                #console-container .close-btn { position:absolute; top:0; right:0; padding:5px; cursor:pointer; }
                .console-log { color: white; }
                .console-error { color: red; }
                .console-warn { color: yellow; }
                .console-info { color: lightblue; }
            </style>
            <script id="render-data" type="application/json">${renderData.replace(/</g, '\\u003c')}</script>
        </head>
        <body>
            <div class="controls">
                <button id="toggle-console-btn">控制台</button>
                <button id="reset-btn">重置</button>
                <button id="download-btn" class="download-btn">下载 HTML</button>
            </div>
            <div id="content-container"></div>
            <div id="console-container">
                <div class="close-btn" id="close-console-btn">关闭</div>
                <div id="console-output"></div>
            </div>

            <script id="init-script">
                document.addEventListener('DOMContentLoaded', () => {
                    let originalContent = '';
                    let currentType = 'html';
                    const contentContainer = document.getElementById('content-container');
                    const consoleContainer = document.getElementById('console-container');
                    const consoleOutput = document.getElementById('console-output');
                    
                    // --- Data Loading ---
                    try {
                        const dataScript = document.getElementById('render-data');
                        const parsedData = JSON.parse(dataScript.textContent);
                        originalContent = parsedData.content;
                        currentType = parsedData.type;
                        contentContainer.innerHTML = originalContent;
                    } catch (e) {
                        console.error("Failed to load render data:", e);
                        contentContainer.innerHTML = "<p style='color:red'>无法加载渲染内容。</p>";
                        return;
                    }

                    // --- Console Functionality ---
                    const originalConsole = {
                        log: console.log,
                        error: console.error,
                        warn: console.warn,
                        info: console.info
                    };

                    function captureConsole(type, args) {
                        if (!consoleOutput) return;
                        const logItem = document.createElement('div');
                        logItem.className = 'console-' + type;
                        let message = '';
                        for (let i = 0; i < args.length; i++) {
                             try {
                                 message += (typeof args[i] === 'object' ? JSON.stringify(args[i]) : args[i]) + ' ';
                             } catch (e) {
                                 message += args[i] + ' '; // Handle potential stringification errors
                             }
                        }
                        logItem.textContent = message;
                        consoleOutput.appendChild(logItem);
                        consoleOutput.scrollTop = consoleOutput.scrollHeight;
                    }

                    function setupConsole() {
                         if (!consoleOutput) return;
                         console.log = function() { captureConsole('log', arguments); originalConsole.log.apply(console, arguments); };
                         console.error = function() { captureConsole('error', arguments); originalConsole.error.apply(console, arguments); };
                         console.warn = function() { captureConsole('warn', arguments); originalConsole.warn.apply(console, arguments); };
                         console.info = function() { captureConsole('info', arguments); originalConsole.info.apply(console, arguments); };
                    }
                    
                    function toggleConsole() {
                        if (!consoleContainer) return;
                        consoleContainer.style.display = (consoleContainer.style.display === 'none') ? 'block' : 'none';
                    }

                    // --- Content Management ---
                    function resetContent() {
                        contentContainer.innerHTML = originalContent;
                        setupConsole(); // Re-setup console in case content scripts modified it
                    }
                    
                    // --- Download Functionality (Defined directly here) ---
                    function downloadContent() {
                        let mimeType = 'text/plain';
                        let fileExtension = '.txt';
                        let fileName = 'download-content';
                        
                        if (currentType === 'html') {
                            mimeType = 'text/html';
                            fileExtension = '.html';
                            fileName = 'document';
                        } else if (currentType === 'xml' || currentType === 'svg') {
                             // Simplified check for SVG within the original content string
                             if (originalContent.includes('<svg') && 
                                 (originalContent.includes('xmlns="http://www.w3.org/2000/svg"') || 
                                  originalContent.includes("xmlns='http://www.w3.org/2000/svg'"))) {
                                 mimeType = 'image/svg+xml';
                                 fileExtension = '.svg';
                                 fileName = 'image';
                             } else {
                                 mimeType = 'application/xml';
                                 fileExtension = '.xml';
                                 fileName = 'document';
                             }
                        }
                        
                        const blob = new Blob([originalContent], { type: mimeType });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName + fileExtension;
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }, 0);
                    }

                    // --- Event Listener Setup ---
                    document.getElementById('toggle-console-btn').onclick = toggleConsole;
                    document.getElementById('close-console-btn').onclick = toggleConsole; 
                    document.getElementById('reset-btn').onclick = resetContent;
                    document.getElementById('download-btn').onclick = downloadContent;

                    // --- Initial Setup ---
                    setupConsole();
                });
            </script>
        </body>
        </html>
        `);
    } else {
        // Keep XML/SVG handling the same for now, but use the safer write escaping
        const escapedContentForWrite = escapeContentForWrite(content);
        const escapedContentForDownload = content.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
        const downloadFunction = ` function downloadContent() { /* ... download logic using escapedContentForDownload ... */ } `;
         // NOTE: Re-implementing the full download function string here for brevity in example
         // The actual implementation should still generate the correct download logic based on type and content
        const actualDownloadFunctionString = `
        function downloadContent() {
            const originalContent = \`${escapedContentForDownload}\`;
            let mimeType = 'text/plain'; let fileExtension = '.txt'; let fileName = 'download-content';
            const type = '${type}'; // Get type
            if (type === 'xml' || type === 'svg') {
                if (originalContent.includes('<svg') && (originalContent.includes('xmlns="http://www.w3.org/2000/svg"') || originalContent.includes("xmlns='http://www.w3.org/2000/svg'"))) {
                    mimeType = 'image/svg+xml'; fileExtension = '.svg'; fileName = 'image';
                } else {
                    mimeType = 'application/xml'; fileExtension = '.xml'; fileName = 'document';
                }
            }
            const blob = new Blob([originalContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = fileName + fileExtension;
            document.body.appendChild(a); a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
        }
        `;

        let displayType = type.toUpperCase();
        let isSvgDetected = false;
        if (type === 'xml' && content.includes('<svg') && 
            (content.includes('xmlns="http://www.w3.org/2000/svg"') || 
             content.includes("xmlns='http://www.w3.org/2000/svg'"))) {
            displayType = 'SVG';
            isSvgDetected = true;
        }
        
        win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${displayType} 渲染</title>
            <style>
                body { margin: 0; padding: 20px; font-family: sans-serif; }
                .content { width: 100%; height: 100%; border: none; }
                .controls { position: fixed; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 5px; z-index: 9999; }
                .controls button { margin: 0 5px; padding: 5px 10px; border: none; background: #fff; cursor: pointer; border-radius: 3px; }
                .download-btn { background: #4CAF50 !important; color: white; }
                .download-btn:hover { background: #45a049 !important; }
            </style>
            <script>
                ${actualDownloadFunctionString}
                
                // Update button text on load
                window.onload = function() {
                    const downloadBtn = document.querySelector('.download-btn');
                    if (${isSvgDetected}) {
                        downloadBtn.textContent = '下载 SVG';
                    } else {
                        downloadBtn.textContent = '下载 ${displayType}';
                    }
                }
            </script>
        </head>
        <body>
            <div class="controls">
                <button onclick="downloadContent()" class="download-btn">下载 ${displayType}</button> 
            </div>
            ${escapedContentForWrite} 
        </body>
        </html>
        `);
    }
    
    win.document.close();
}

// 配置markdown-it渲染器前，先移除页面上已有的按钮
document.addEventListener('DOMContentLoaded', function() {
    // 移除页面上已有的渲染按钮
    document.querySelectorAll('.u-mdic-render-btn').forEach(btn => btn.remove());
});

/**
 * 清理重复的mermaid图表元素
 */
function cleanupMermaidDuplicates() {
    // 获取所有的mermaid容器
    const mermaidDivs = document.querySelectorAll('div.mermaid[id]');
    
    // 创建一个用于跟踪已处理ID的Set
    const processedIds = new Set();
    
    // 遍历所有mermaid容器
    mermaidDivs.forEach(div => {
        const id = div.id;
        
        // 如果这个ID已经处理过，删除当前元素
        if (processedIds.has(id)) {
            // 确保只删除onclick="downloadSVG(this')的元素，保留onclick="downloadSVGFile"的元素
            if (div.getAttribute('onclick')?.includes('downloadSVG(this') && !div.getAttribute('onclick')?.includes('downloadSVGFile')) {
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            }
        } else {
            // 如果这是第一次遇到这个ID，把它加入已处理集合
            processedIds.add(id);
            
            // 确保使用正确的下载函数
            if (div.getAttribute('onclick')?.includes('downloadSVG(this') && !div.getAttribute('onclick')?.includes('downloadSVGFile')) {
                div.setAttribute('onclick', 'downloadSVGFile(this, event)');
            }
        }
    });
}

// 使用MutationObserver监听DOM变化，确保在markdown完全渲染后添加渲染按钮
document.addEventListener('DOMContentLoaded', function() {
    // 延迟一点时间执行初始检查，确保所有初始元素已加载
    setTimeout(() => {
        // 处理所有代码块，清理重复包装器并添加渲染按钮
        cleanupAndEnhanceCodeBlocks();
        // 清理重复的mermaid图表
        cleanupMermaidDuplicates();
    }, 500);
    
    // 清理重复的包装器，每个代码块只保留一个包装器
    function cleanupAndEnhanceCodeBlocks() {
        // 查找所有代码块
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach(codeBlock => {
            const pre = codeBlock.parentElement;
            if (!pre) return;
            
            // 查找该pre元素内的所有包装器
            const wrappers = pre.querySelectorAll('.m-mdic-copy-wrapper');
            
            // 如果有多个包装器，仅保留第一个
            if (wrappers.length > 1) {
                // 保留第一个包装器
                const firstWrapper = wrappers[0];
                
                // 删除其他所有包装器
                for (let i = 1; i < wrappers.length; i++) {
                    wrappers[i].remove();
                }
                
                // 确保第一个包装器中没有多余的按钮
                const renderBtns = firstWrapper.querySelectorAll('.u-mdic-render-btn');
                if (renderBtns.length > 1) {
                    for (let i = 1; i < renderBtns.length; i++) {
                        renderBtns[i].remove();
                    }
                }
            }
            
            // 处理代码块的渲染按钮
            addRenderButtonToCodeBlock(codeBlock);
        });
    }
    
    // 辅助函数：为代码块添加渲染按钮
    function addRenderButtonToCodeBlock(codeBlock) {
        const pre = codeBlock.parentElement;
        if (!pre) return;
        
        // 获取代码语言
        const codeClass = codeBlock.className;
        let codeLang = '';
        if (codeClass.includes('language-')) {
            codeLang = codeClass.split('language-')[1].split(' ')[0];
        }
        
        // 只为HTML、XML和SVG代码添加渲染按钮
        if (codeLang === 'html' || codeLang === 'xml' || codeLang === 'svg') {
            // 查找复制按钮的包装器（应当只剩一个）
            const copyWrapper = pre.querySelector('.m-mdic-copy-wrapper');
            if (copyWrapper) {
                // 检查是否已有渲染按钮
                const existingBtn = copyWrapper.querySelector('.u-mdic-render-btn');
                if (existingBtn) return; // 已有按钮，不再添加
                
                // 创建渲染按钮
                let renderBtnText = '渲染';
                let renderTitle = '在新窗口中渲染';
                
                if (codeLang === 'html') {
                    renderTitle = '在新窗口中执行HTML代码';
                } else if (codeLang === 'svg') {
                    renderTitle = '在新窗口中查看SVG图像';
                } else if (codeLang === 'xml') {
                    renderTitle = '在新窗口中查看XML';
                }
                
                const renderBtn = document.createElement('button');
                renderBtn.className = 'u-mdic-render-btn';
                renderBtn.setAttribute('onclick', `renderCode(this.parentElement.parentElement.querySelector('code').textContent, '${codeLang}')`);
                renderBtn.setAttribute('title', renderTitle);
                renderBtn.textContent = renderBtnText;
                
                // 添加到复制按钮的包装器
                copyWrapper.appendChild(renderBtn);
            }
        }
    }
    
    // 添加MutationObserver以监听DOM变化
    const observer = new MutationObserver((mutations) => {
        let hasRelevantChanges = false;
        let hasMermaidChanges = false;
        
        // 检查是否有相关变化
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // 元素节点
                        // 如果添加了代码块或其容器，标记为有相关变化
                        if (node.querySelector('pre code') || 
                            (node.tagName === 'PRE' && node.querySelector('code')) || 
                            node.tagName === 'CODE') {
                            hasRelevantChanges = true;
                        }
                        
                        // 检查是否添加了mermaid图表
                        if (node.querySelector('div.mermaid') || node.classList?.contains('mermaid')) {
                            hasMermaidChanges = true;
                        }
                    }
                });
            }
        });
        
        // 如果有相关变化，进行清理和增强
        if (hasRelevantChanges || hasMermaidChanges) {
            // 使用setTimeout避免在DOM正在变化时进行操作
            setTimeout(() => {
                if (hasRelevantChanges) {
                    cleanupAndEnhanceCodeBlocks();
                }
                if (hasMermaidChanges) {
                    cleanupMermaidDuplicates();
                }
            }, 100);
        }
    });
    
    // 配置观察选项
    const observerConfig = {
        childList: true,
        subtree: true
    };
    
    // 开始观察
    observer.observe(document.body, observerConfig);
});

/**
 * 增强markdown-it代码渲染器，添加复制和渲染按钮
 */
// 保存原始的markdown-it渲染器规则
const originalCodeBlock = md.renderer.rules.code_block;
const originalFence = md.renderer.rules.fence;

/**
 * 创建用于代码渲染的增强器函数
 */
const createCodeRenderEnhancer = (render, options = {}) => (...args) => {
    const {
        btnText = translations[locale]["copyCode"], // 复制按钮文本
        successText = translations[locale]["copySuccess"], // 复制成功文本
        successTextDelay = 2000, // 成功提示显示时间（毫秒）
        showCodeLanguage = true, // 是否显示代码语言
    } = options;
    
    const [tokens = [], idx = 0] = args;
    const originResult = render.apply(this, args);
    const langFrag = showCodeLanguage ? getCodeLangFragment(originResult) : "";
    
    // 构建复制按钮和其他UI元素 - 不再在此处添加渲染按钮，由MutationObserver处理
    const tpls = [
        '<div class="m-mdic-copy-wrapper">',
        `${langFrag}`,
        `<div class="u-mdic-copy-notify" style="display:none;" text="${successText}"></div>`,
        `<button class="u-mdic-copy-btn j-mdic-copy-btn" text="${btnText}" data-mdic-notify-delay="${successTextDelay}" onclick="copyClickCode(this)"></button>`,
    ];
    
    tpls.push('</div>');
    
    // 处理特殊的mermaid图表
    if (tokens[idx].type === "fence" && langFrag.indexOf(`text="mermaid"`) !== -1) {
        // 创建唯一hash值
        let hash = "mermaid" + createSHA1().update(tokens[idx].content).digest("hex");
        
        // 在创建新的mermaid图表前，确保不存在重复的图表
        setTimeout(() => {
            // 检查是否有重复的mermaid图表
            const mermaidDivs = document.querySelectorAll(`div.mermaid[id="${hash}"]`);
            if (mermaidDivs.length > 1) {
                // 保留第一个，删除其他重复的
                for (let i = 1; i < mermaidDivs.length; i++) {
                    if (mermaidDivs[i].parentNode) {
                        mermaidDivs[i].parentNode.removeChild(mermaidDivs[i]);
                    }
                }
            }
        }, 100);
        
        // 确保使用正确的下载函数
        if (mermaidMap[hash]) return originResult.replace("<pre>", `<pre>${tpls.join("")}`).replace("<pre>", `<div class="mermaid" id="${hash}" onclick="downloadSVGFile(this, event)">${mermaidMap[hash]}</div><pre>`);
        loadRunMermaid(hash, tokens[idx].content, tokens.length - 1 > idx);
        return originResult.replace("<pre>", `<pre>${tpls.join("")}`).replace("<pre>", `<div class="mermaid" id="${hash}" onclick="downloadSVGFile(this, event)"></div><pre>`)
    } else {
        return originResult.replace("<pre>", `<pre>${tpls.join("")}`);
    }
};

// 将我们的增强器应用到markdown-it渲染器
md.renderer.rules.code_block = createCodeRenderEnhancer(originalCodeBlock);
md.renderer.rules.fence = createCodeRenderEnhancer(originalFence); 