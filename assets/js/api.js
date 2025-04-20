const API_URL = "v1/chat/completions";
const DeepSeek_API_URL = "chat/completions";
const Gemini_API_URL = "v1/models/";
const Claude_API_URL = "v1/messages";
let loading = false;
let presetRoleData = {
    "default": translations[locale]["defaultText"],
    "normal": translations[locale]["assistantText"],
    "cat": translations[locale]["catText"],
    "emoji": translations[locale]["emojiText"],
    "image": translations[locale]["imageText"]
};
let modelVersion; // 模型版本
let modelType; // 1:ChatGPT，2:DeepSeek， 3，Azure，4:Gemini，5:Claude
let apiHost; // api反代地址
let deepseekApiHost;
let azureAIApiHost;
let geminiApiHost;
let claudeApiHost;
let apiSelects = []; // api地址列表
let deepseekApiSelects = [];
let azureAIApiSelects = [];
let geminiApiSelects = [];
let claudeApiSelects = [];
let customAPIKey; // 自定义apiKey
let deepseekAPIKey;
let azureAIAPIKey;
let geminiAPIKey;
let claudeAPIKey;
let customAPIModel; // 自定义apiModel
let deepseekAPIModel;
let azureAIAPIModel;
let geminiAPIModel;
let claudeAPIModel;
let systemRole; // 自定义系统角色
let roleNature; // 角色性格
let roleTemp; // 回答质量
let convWidth = []; // 会话宽度，0:窗口宽度，1:全屏宽度
let textSpeed; // 打字机速度，越小越快
let contLen; // 连续会话长度，默认25，对话包含25条上下文信息。设置为0即关闭连续会话
let enableCOT; // 是否输出思维链，默认开启。
let enableLongReply; // 是否开启长回复，默认关闭，开启可能导致api费用增加。
let longReplyFlag;
let voiceIns; // Audio or SpeechSynthesisUtterance
const isFirefox = !!navigator.userAgent.match(/firefox/i);
const supportMSE = !!window.MediaSource && !isFirefox; // 是否支持MSE（除了ios应该都支持）
const voiceMIME = "audio/mpeg";
const voiceFormat = "audio-24khz-48kbitrate-mono-mp3";
const voicePreLen = 130;
const voiceSuffix = ".mp3";
const openAIVoiceSuffix = ".aac";
let userAvatar; // 用户头像
let customDarkOut;
let isCaseSearch; // 搜索是否区分大小写
let controller;
let controllerId;
const findOffsetTop = (ele, target) => { // target is positioned ancestor element
    if (ele.offsetParent !== target) return ele.offsetTop + findOffsetTop(ele.offsetParent, target);
    else return ele.offsetTop;
}
const findResEle = (ele) => {
    if (!ele.classList.contains("response")) return findResEle(ele.parentElement);
    else return ele;
}
const isContentBottom = (ele) => {
    if (refreshIdx !== void 0) {
        return currentResEle.clientHeight + currentResEle.offsetTop > messagesEle.scrollTop + messagesEle.clientHeight
    } else {
        return messagesEle.scrollHeight - messagesEle.scrollTop - messagesEle.clientHeight < 128;
    }
}
const isEleBottom = (ele) => {
    return ele.clientHeight + findOffsetTop(ele, messagesEle) > messagesEle.scrollTop + messagesEle.clientHeight;
}
const outOfMsgWindow = (ele) => {
    return ele.offsetTop > messagesEle.scrollTop + messagesEle.clientHeight || ele.offsetTop + ele.clientHeight < messagesEle.scrollTop
}
const scrollToBottom = () => {
    if (isContentBottom()) {
        if (refreshIdx !== void 0) {
            messagesEle.scrollTo(0, currentResEle.clientHeight + currentResEle.offsetTop - messagesEle.clientHeight + 10)
        } else {
            messagesEle.scrollTo(0, messagesEle.scrollHeight)
        }
    }
}
const scrollToBottomLoad = (ele) => {
    if (!controller || !ele.offsetParent) return;
    if (isEleBottom(ele)) {
        let resEle = findResEle(ele)
        messagesEle.scrollTo(0, resEle.clientHeight + resEle.offsetTop - messagesEle.clientHeight + 10)
    }
}
const forceRepaint = (ele) => {
    ele.style.display = "none";
    ele.offsetHeight;
    ele.style.display = null;
}
const parser = new DOMParser();
const getUnescape = html => {
    return parser.parseFromString(html, 'text/html').body.textContent;
}
const escapeRegexExp = (str) => { // from vscode src/vs/base/common/strings.ts escapeRegExpCharacters
    return str.replace(/[\\\{\}\*\+\?\|\^\$\.\[\]\(\)]/g, '\\$&');
}
const checkStorage = () => {
    let used = 0;
    for (let key in localStorage) {
        localStorage.hasOwnProperty(key) && (used += localStorage[key].length)
    }
    let remain = 5242880 - used;
    usedStorageBar.style.width = (used / 5242880 * 100).toFixed(2) + "%";
    let usedMBs = used / 1048576;
    usedStorage.textContent = (usedMBs < 1 ? usedMBs.toPrecision(2) : usedMBs.toFixed(2)) + "MB";
    availableStorage.textContent = Math.floor(remain / 1048576 * 100) / 100 + "MB";
};
const UNESCAPE_RE = /\\([ \\!"#$%&'()*+,.\/:;<=>?@[\]^_`{|}~-])/g;
const superscript = (state, silent) => {
    let found,
        content,
        token,
        max = state.posMax,
        start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5E/* ^ */) { return false; }
    if (silent) { return false; } // don't run any pairs in validation mode
    if (start + 2 >= max) { return false; }
    state.pos = start + 1;
    while (state.pos < max) {
        if (state.src.charCodeAt(state.pos) === 0x5E/* ^ */) {
            found = true;
            break;
        }
        state.md.inline.skipToken(state);
    }
    if (!found || start + 1 === state.pos) {
        state.pos = start;
        return false;
    }
    content = state.src.slice(start + 1, state.pos);
    // don't allow unescaped spaces/newlines inside
    if (content.match(/(^|[^\\])(\\\\)*\s/)) {
        state.pos = start;
        return false;
    }
    // found!
    state.posMax = state.pos;
    state.pos = start + 1;
    // Earlier we checked !silent, but this implementation does not need it
    token = state.push('sup_open', 'sup', 1);
    token.markup = '^';
    token = state.push('text', '', 0);
    token.content = content.replace(UNESCAPE_RE, '$1');
    token = state.push('sup_close', 'sup', -1);
    token.markup = '^';
    state.pos = state.posMax + 1;
    state.posMax = max;
    return true;
}
const subscript = (state, silent) => {
    let found,
        content,
        token,
        max = state.posMax,
        start = state.pos;
    if (state.src.charCodeAt(start) !== 0x7E/* ~ */) { return false; }
    if (silent) { return false; } // don't run any pairs in validation mode
    if (start + 2 >= max) { return false; }
    state.pos = start + 1;
    while (state.pos < max) {
        if (state.src.charCodeAt(state.pos) === 0x7E/* ~ */) {
            found = true;
            break;
        }
        state.md.inline.skipToken(state);
    }
    if (!found || start + 1 === state.pos) {
        state.pos = start;
        return false;
    }
    content = state.src.slice(start + 1, state.pos);
    // don't allow unescaped spaces/newlines inside
    if (content.match(/(^|[^\\])(\\\\)*\s/)) {
        state.pos = start;
        return false;
    }
    // found!
    state.posMax = state.pos;
    state.pos = start + 1;
    // Earlier we checked !silent, but this implementation does not need it
    token = state.push('sub_open', 'sub', 1);
    token.markup = '~';
    token = state.push('text', '', 0);
    token.content = content.replace(UNESCAPE_RE, '$1');
    token = state.push('sub_close', 'sub', -1);
    token.markup = '~';
    state.pos = state.posMax + 1;
    state.posMax = max;
    return true;
}
const mermaidMap = {};
const mermaidQuene = new Map();
let mermaidTimeout;
let loadingMermaid = false;
const loadMermaidQuene = () => {
    mermaidQuene.forEach((content, id) => { loadSingleMermaid(id, content) });
    mermaidQuene.clear();
};
const loadSingleMermaid = async (id, content) => {
    let contianer = document.querySelector("#" + id);
    if (!contianer || contianer.children.length) return;
    let result;
    try {
        let { svg } = await mermaid.render(mermaid.detectType(content), content, contianer);
        result = svg;
    } catch (error) {
        return;
    }
    result = result.replace(/(<svg[^>]*?)\sstyle="[^"]*"/i, '$1');
    mermaidMap[id] = result;
    document.querySelectorAll('#' + id).forEach(item => { item.innerHTML = result });
};
const loadRunMermaid = (id, content, bounce = false) => {
    if (typeof mermaid === 'undefined') {
        if (!loadingMermaid) {
            loadingMermaid = true;
            let script = document.createElement("script");
            script.crossOrigin = "anonymous";
            script.src = "assets/js/mermaid.min.js";
            script.onload = async () => {
                loadingMermaid = false;
                mermaid.mermaidAPI.initialize({
                    startOnLoad: false
                });
                loadMermaidQuene();
            }
            document.body.appendChild(script);
        }
        if (loading && !bounce) {
            clearTimeout(mermaidTimeout);
            mermaidTimeout = setTimeout(() => {
                mermaidQuene.set(id, content);
                if (typeof mermaid !== 'undefined') loadMermaidQuene();
            }, 600)
        } else {
            mermaidQuene.set(id, content);
        }
    } else {
        if (loading && !bounce) {
            clearTimeout(mermaidTimeout);
            mermaidTimeout = setTimeout(() => { loadSingleMermaid(id, content) }, 600)
        } else {
            setTimeout(() => { loadSingleMermaid(id, content) });
        }
    }
};
const md = markdownit({
    breaks: true,
    linkify: true,
    highlight: function (str, lang) {
        try {
            return hljs.highlightAuto(str).value;
        } catch (e) { }
        return "";
    }
});
md.inline.ruler.after("emphasis", "sup", superscript);
md.inline.ruler.after("emphasis", "sub", subscript);
md.use(texmath, { engine: katex, delimiters: ["brackets", "dollars"] });
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    let aIndex = tokens[idx].attrIndex("target");
    if (tokens[idx + 1] && tokens[idx + 1].type === "image") tokens[idx].attrPush(["download", ""]);
    else if (aIndex < 0) tokens[idx].attrPush(["target", "_blank"]);
    else tokens[idx].attrs[aIndex][1] = "_blank";
    return self.renderToken(tokens, idx, options);
};
const codeUtils = {
    getCodeLang(str = "") {
        const res = str.match(/ class="language-(.*?)"/);
        return (res && res[1]) || "";
    },
    getFragment(str = "") {
        return str ? `<span class="u-mdic-copy-code_lang" text="${str}"></span>` : "";
    },
};
const getCodeLangFragment = (oriStr = "") => {
    return codeUtils.getFragment(codeUtils.getCodeLang(oriStr));
};
const copyClickCode = (ele) => {
    const input = document.createElement("textarea");
    input.value = ele.parentElement.nextElementSibling.textContent;
    const nDom = ele.previousElementSibling;
    const nDelay = ele.dataset.mdicNotifyDelay;
    const cDom = nDom.previousElementSibling;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, input.value.length);
    document.execCommand("copy");
    document.body.removeChild(input);
    if (nDom.style.display === "none") {
        nDom.style.display = "block";
        cDom && (cDom.style.display = "none");
        setTimeout(() => {
            nDom.style.display = "none";
            cDom && (cDom.style.display = "block");
        }, nDelay);
    }
};
const copyClickMd = (idx) => {
    const input = document.createElement("textarea");
    input.value = data[idx].content;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, input.value.length);
    document.execCommand("copy");
    document.body.removeChild(input);
}
const downloadSVG = (target, ev) => {
    if (ev.target !== target) {
        let blob = new Blob([target.innerHTML], { type: "image/svg+xml" });
        downBlob(blob, "mermaid-" + target.children[0].getAttribute("aria-roledescription") + ".svg")
    }
}
const enhanceCode = (render, options = {}) => (...args) => {
    const {
        btnText = translations[locale]["copyCode"], // button text
        successText = translations[locale]["copySuccess"], // copy-success text
        successTextDelay = 2000, // successText show time [ms]
        showCodeLanguage = true, // false | show code language
    } = options;
    const [tokens = [], idx = 0] = args;
    const originResult = render.apply(this, args);
    const langFrag = showCodeLanguage ? getCodeLangFragment(originResult) : "";
    const tpls = [
        '<div class="m-mdic-copy-wrapper">',
        `${langFrag}`,
        `<div class="u-mdic-copy-notify" style="display:none;" text="${successText}"></div>`,
        `<button class="u-mdic-copy-btn j-mdic-copy-btn" text="${btnText}" data-mdic-notify-delay="${successTextDelay}" onclick="copyClickCode(this)"></button>`,
        '</div>',
    ];
    if (tokens[idx].type === "fence" && langFrag.indexOf(`text="mermaid"`) !== -1) {
        let hash = "mermaid" + createSHA1().update(tokens[idx].content).digest("hex");
        if (mermaidMap[hash]) return originResult.replace("<pre>", `<pre>${tpls.join("")}`).replace("<pre>", `<div class="mermaid" id="${hash}" onclick="downloadSVG(this, event)">${mermaidMap[hash]}</div><pre>`);
        loadRunMermaid(hash, tokens[idx].content, tokens.length - 1 > idx);
        return originResult.replace("<pre>", `<pre>${tpls.join("")}`).replace("<pre>", `<div class="mermaid" id="${hash}" onclick="downloadSVG(this, event)"></div><pre>`)
    } else {
        return originResult.replace("<pre>", `<pre>${tpls.join("")}`);
    }
};
md.renderer.rules.code_block = enhanceCode(md.renderer.rules.code_block);
md.renderer.rules.fence = enhanceCode(md.renderer.rules.fence);
md.renderer.rules.image = function (tokens, idx, options, env, self) {
    let token = tokens[idx];
    token.attrs[token.attrIndex("alt")][1] = self.renderInlineAsText(token.children, options, env);
    token.attrSet("onload", "scrollToBottomLoad(this);this.removeAttribute('onload');this.removeAttribute('onerror')");
    token.attrSet("onerror", "scrollToBottomLoad(this);this.removeAttribute('onload');this.removeAttribute('onerror')");
    token.attrPush(["decoding", "async"]);
    token.attrPush(["loading", "lazy"]);
    return self.renderToken(tokens, idx, options)
}
let currentVoiceIdx;
let editingIdx;
let originText;
const resumeSend = () => {
    if (editingIdx !== void 0) {
        chatlog.children[systemRole ? editingIdx - 1 : editingIdx].classList.remove("showEditReq");
    }
    sendBtnEle.children[0].textContent = translations[locale]["send"];
    inputAreaEle.value = originText;
    clearEle.title = translations[locale]["clearChat"];
    clearEle.classList.remove("closeConv");
    originText = void 0;
    editingIdx = void 0;
}
const mdOptionEvent = function (ev) {
    let id = ev.target.dataset.id;
    if (id) {
        let parent = ev.target.parentElement;
        let idxEle = parent.parentElement;
        let idx = Array.prototype.indexOf.call(chatlog.children, this.parentElement);
        if (id === "voiceBtn" || id === "speechMd" || id === "pauseMd" || id === "resumeMd") {
            let classList = parent.dataset.id === "voiceBtn" ? parent.classList : ev.target.classList;
            if (classList.contains("readyVoice")) {
                if (chatlog.children[idx].dataset.loading !== "true") {
                    idx = systemRole ? idx + 1 : idx;
                    speechEvent(idx);
                }
            } else if (classList.contains("pauseVoice")) {
                if (voiceIns) {
                    if (voiceIns instanceof Audio) voiceIns.pause();
                    else {
                        if (supportSpe) speechSynthesis.pause();
                        classList.remove("readyVoice");
                        classList.remove("pauseVoice");
                        classList.add("resumeVoice");
                    }
                }
            } else {
                if (voiceIns) {
                    if (voiceIns instanceof Audio) voiceIns.play();
                    else {
                        if (supportSpe) speechSynthesis.resume();
                        classList.remove("readyVoice");
                        classList.remove("resumeVoice");
                        classList.add("pauseVoice");
                    }
                }
            }
        } else if (id === "editMd") {
            let reqEle = chatlog.children[idx];
            idx = systemRole ? idx + 1 : idx;
            if (editingIdx === idx) return;
            if (editingIdx !== void 0) {
                chatListEle.children[systemRole ? editingIdx - 1 : editingIdx].classList.remove("showEditReq");
            }
            reqEle.classList.add("showEditReq");
            editingIdx = idx;
            originText = inputAreaEle.value;
            inputAreaEle.value = data[idx].content;
            inputAreaEle.dispatchEvent(new Event("input"));
            inputAreaEle.focus();
            sendBtnEle.children[0].textContent = translations[locale]["update"];
            clearEle.title = translations[locale]["cancel"];
            clearEle.classList.add("closeConv");
        } else if (id === "refreshMd") {
            if (noLoading()) {
                formatAvatarEle(chatlog.children[idx].children[0], modelVersion);
                if (ev.target.classList.contains("refreshReq")) {
                    chatlog.children[idx].children[1].innerHTML = "<p class='cursorCls'><br /></p>";
                    chatlog.children[idx].dataset.loading = true;
                    idx = systemRole ? idx + 1 : idx;
                    data[idx].content = "";
                    if (idx === data.findIndex(item => { return item.role === "assistant" })) activeChatEle.children[1].children[1].textContent = "";
                    if (idx === currentVoiceIdx) endSpeak();
                    loadAction(true);
                    refreshIdx = idx;
                    streamGen();
                } else {
                    chatlog.children[idx].dataset.loading = true;
                    idx = systemRole ? idx + 1 : idx;
                    progressData = data[idx].content;
                    loadAction(true);
                    refreshIdx = idx;
                    streamGen(true);
                }
            }
        } else if (id === "copyMd") {
            idx = systemRole ? idx + 1 : idx;
            copyClickMd(idx);
            notyf.success(translations[locale]["copySuccess"]);
        } else if (id === "delMd") {
            if (noLoading()) {
                if (confirmAction(translations[locale]["delMsgTip"])) {
                    chatlog.removeChild(chatlog.children[idx]);
                    idx = systemRole ? idx + 1 : idx;
                    let firstIdx = data.findIndex(item => { return item.role === "assistant" });
                    if (currentVoiceIdx !== void 0) {
                        if (currentVoiceIdx === idx) { endSpeak() }
                        else if (currentVoiceIdx > idx) { currentVoiceIdx-- }
                    }
                    if (editingIdx !== void 0) {
                        if (editingIdx === idx) { resumeSend() }
                        else if (editingIdx > idx) { editingIdx-- }
                    }
                    data.splice(idx, 1);
                    if (firstIdx === idx) updateChatPre();
                    updateChats();
                }
            }
        } else if (id === "downAudioMd") {
            if (chatlog.children[idx].dataset.loading !== "true") {
                idx = systemRole ? idx + 1 : idx;
                downloadAudio(idx);
            }
        }
    }
}
const formatAvatarEle = (ele, model) => {
    ele.className = "chatAvatar";
    if (ele.parentElement.className === "request") {
        ele.innerHTML = `<img src="${userAvatar}" />`;
    } else {
        if (model.startsWith("gpt") || model.startsWith("o") || model === "deepseek-v3") {
            ele.classList.add("gptAvatar")
            ele.innerHTML = `<svg width="24" height="24"><use xlink:href="#aiIcon"></use></svg>`;
        } else if (model.startsWith("deepseek|")) {
            ele.innerHTML = `<svg width="30" height="30"><use xlink:href="#deepseekIcon"></use></svg>`;
        } else if (model.startsWith("azure")) {
            ele.innerHTML = `<svg width="30" height="30"><use xlink:href="#azureAIIcon"></use></svg>`;
        } else if (model.startsWith("gemini")) {
            ele.innerHTML = `<svg width="30" height="30"><use xlink:href="#geminiIcon"></use></svg>`;
        } else {
            ele.innerHTML = `<svg width="30" height="30"><use xlink:href="#claudeIcon"></use></svg>`;
        }
    }
}
const formatMdEle = (ele, model) => {
    let avatar = document.createElement("div");
    ele.appendChild(avatar);
    formatAvatarEle(avatar, model);
    let realMd = document.createElement("div");
    realMd.className = ele.className === "request" ? "requestBody" : "responseBody markdown-body";
    ele.appendChild(realMd);
    let mdOption = document.createElement("div");
    mdOption.className = "mdOption";
    ele.appendChild(mdOption);
    let optionWidth = existVoice >= 2 ? 140 : 105;
    mdOption.innerHTML += `<div class="optionItems" style="width:${optionWidth}px;left:-${optionWidth - 10}px">`
        + (ele.className === "request" ? `<div data-id="editMd" class="optionItem" title="${translations[locale]["edit"]}">
        <svg width="18" height="18"><use xlink:href="#chatEditIcon" /></svg>
        </div>` : `<div data-id="refreshMd" class="refreshReq optionItem" title="${translations[locale]["refresh"]}">
        <svg width="18" height="18" ><use xlink:href="#refreshIcon" /></svg>
        <svg width="18" height="18" ><use xlink:href="#halfRefIcon" /></svg>
        </div>`) +
        `<div data-id="copyMd" class="optionItem" title="${translations[locale]["copy"]}">
        <svg width="20" height="20"><use xlink:href="#copyIcon" /></svg>
    </div>
    <div data-id="delMd" class="optionItem" title="${translations[locale]["del"]}">
        <svg width="20" height="20"><use xlink:href="#delIcon" /></svg>
    </div>` + (existVoice >= 2 ? `<div data-id="downAudioMd" class="optionItem" title="${translations[locale]["downAudio"]}">
        <svg width="20" height="20"><use xlink:href="#downAudioIcon" /></svg>
    </div>` : "") + `</div>`;
    if (existVoice) {
        mdOption.innerHTML += `<div class="voiceCls readyVoice" data-id="voiceBtn">
        <svg width="20" height="20" role="img" data-id="speechMd"><title>${translations[locale]["speech"]}</title><use xlink:href="#readyVoiceIcon" /></svg>
        <svg width="20" height="20" role="img" data-id="pauseMd"><title>${translations[locale]["pause"]}</title><use xlink:href="#pauseVoiceIcon" /></svg>
        <svg width="20" height="20" role="img" data-id="resumeMd"><title>${translations[locale]["resume"]}</title><use xlink:href="#resumeVoiceIcon" /></svg>
        </div>`
    }
    mdOption.onclick = mdOptionEvent;
}
let allListEle = chatListEle.parentElement;
let folderData = [];
let chatsData = [];
let chatIdxs = [];
let searchIdxs = [];
let activeChatIdx = 0;
let activeChatEle;
let operateChatIdx, operateFolderIdx;
let dragLi, dragType, dragIdx;
let mobileDragOut;
const mobileDragStartEV = function (ev) {
    if (mobileDragOut !== void 0) {
        clearTimeout(mobileDragOut);
        mobileDragOut = void 0;
    }
    mobileDragOut = setTimeout(() => {
        this.setAttribute("draggable", "true");
        this.dispatchEvent(ev);
    }, 200);
};
if (isMobile) {
    let stopDragOut = () => {
        if (mobileDragOut !== void 0) {
            clearTimeout(mobileDragOut);
            mobileDragOut = void 0;
        }
    };
    let stopDrag = () => {
        stopDragOut();
        document.querySelectorAll("[draggable=true]").forEach(ele => {
            ele.setAttribute("draggable", "false");
        })
    };
    document.body.addEventListener("touchmove", stopDragOut);
    document.body.addEventListener("touchend", stopDrag);
    document.body.addEventListener("touchcancel", stopDrag);
};
const delDragIdx = () => {
    let chatIdx = chatIdxs.indexOf(dragIdx);
    if (chatIdx !== -1) {
        chatIdxs.splice(chatIdx, 1);
    } else {
        folderData.forEach((item, i) => {
            let inIdx = item.idxs.indexOf(dragIdx);
            if (inIdx !== -1) {
                item.idxs.splice(inIdx, 1);
                updateFolder(i);
            }
        })
    }
}
const updateFolder = (idx) => {
    let folderEle = folderListEle.children[idx];
    let childLen = folderData[idx].idxs.length;
    folderEle.children[0].children[1].children[1].textContent = childLen + translations[locale]["chats"];
    folderEle.classList.toggle("expandFolder", childLen);
}
folderListEle.ondragenter = chatListEle.ondragenter = function (ev) {
    ev.preventDefault();
    if (ev.target === dragLi) return;
    allListEle.querySelectorAll(".dragingChat").forEach(ele => {
        ele.classList.remove("dragingChat");
    })
    if (dragType === "chat") {
        if (this === chatListEle) {
            this.classList.add("dragingChat");
            let dragindex = Array.prototype.indexOf.call(chatListEle.children, dragLi);
            let targetindex = Array.prototype.indexOf.call(chatListEle.children, ev.target);
            delDragIdx();
            if (targetindex !== -1) {
                chatIdxs.splice(targetindex, 0, dragIdx);
                if (dragindex === -1 || dragindex >= targetindex) {
                    chatListEle.insertBefore(dragLi, ev.target);
                } else {
                    chatListEle.insertBefore(dragLi, ev.target.nextElementSibling);
                }
            } else {
                chatIdxs.push(dragIdx);
                chatListEle.appendChild(dragLi);
            }
        } else if (this === folderListEle) {
            let folderIdx;
            if (ev.target.classList.contains("headLi")) {
                ev.target.parentElement.classList.add("dragingChat");
                ev.target.nextElementSibling.appendChild(dragLi);
                delDragIdx();
                folderIdx = Array.prototype.indexOf.call(folderListEle.children, ev.target.parentElement);
                folderData[folderIdx].idxs.push(dragIdx);
                updateFolder(folderIdx);
            } else if (ev.target.classList.contains("chatLi")) {
                ev.target.parentElement.parentElement.classList.add("dragingChat");
                let parent = ev.target.parentElement;
                delDragIdx();
                folderIdx = Array.prototype.indexOf.call(folderListEle.children, parent.parentElement);
                let dragindex = Array.prototype.indexOf.call(parent.children, dragLi);
                let targetindex = Array.prototype.indexOf.call(parent.children, ev.target);
                if (dragindex !== -1) {
                    folderData[folderIdx].idxs.splice(targetindex, 0, dragIdx);
                    if (dragindex < targetindex) {
                        parent.insertBefore(dragLi, ev.target.nextElementSibling);
                    } else {
                        parent.insertBefore(dragLi, ev.target);
                    }
                } else {
                    folderData[folderIdx].idxs.push(dragIdx);
                    parent.appendChild(dragLi);
                }
                updateFolder(folderIdx);
            }
        }
        updateChatIdxs();
    } else if (dragType === "folder") {
        if (this === folderListEle) {
            let dragindex = Array.prototype.indexOf.call(folderListEle.children, dragLi);
            let folderIdx = Array.prototype.findIndex.call(folderListEle.children, (item) => {
                return item.contains(ev.target);
            })
            folderListEle.children[folderIdx].classList.remove("expandFolder");
            let folderEle = folderListEle.children[folderIdx];
            let data = folderData.splice(dragindex, 1)[0];
            folderData.splice(folderIdx, 0, data);
            if (dragindex === -1 || dragindex >= folderIdx) {
                folderListEle.insertBefore(dragLi, folderEle);
            } else {
                folderListEle.insertBefore(dragLi, folderEle.nextElementSibling);
            }
            updateChatIdxs();
        }
    }
}
folderListEle.ondragover = chatListEle.ondragover = (ev) => {
    ev.preventDefault();
}
folderListEle.ondragend = chatListEle.ondragend = (ev) => {
    document.getElementsByClassName("dragingLi")[0].classList.remove("dragingLi");
    allListEle.querySelectorAll(".dragingChat").forEach(ele => {
        ele.classList.remove("dragingChat");
    })
    dragType = dragIdx = dragLi = void 0;
}
const chatDragStartEv = function (ev) {
    ev.stopPropagation();
    dragLi = this;
    dragLi.classList.add("dragingLi");
    dragType = "chat";
    if (chatListEle.contains(this)) {
        let idx = Array.prototype.indexOf.call(chatListEle.children, this);
        dragIdx = chatIdxs[idx];
    } else if (folderListEle.contains(this)) {
        let folderIdx = Array.prototype.indexOf.call(folderListEle.children, this.parentElement.parentElement);
        let inFolderIdx = Array.prototype.indexOf.call(this.parentElement.children, this);
        dragIdx = folderData[folderIdx].idxs[inFolderIdx];
    }
}
const extraFolderActive = (folderIdx) => {
    let folderNewIdx = -1;
    for (let i = folderIdx - 1; i >= 0; i--) {
        if (folderData[i].idxs.length) {
            folderNewIdx = i;
        }
    }
    if (folderNewIdx === -1) {
        for (let i = folderIdx + 1; i < folderData.length; i++) {
            if (folderData[i].idxs.length) folderNewIdx = i;
        }
    }
    if (folderNewIdx !== -1) {
        activeChatIdx = folderData[folderNewIdx].idxs[0];
    } else if (chatIdxs.length) {
        activeChatIdx = chatIdxs[0];
    } else {
        activeChatIdx = -1;
    }
}
const delFolder = (folderIdx, ele) => {
    if (confirmAction(translations[locale]["delFolderTip"])) {
        let delData = folderData[folderIdx];
        let idxs = delData.idxs.sort();
        ele.parentElement.remove();
        if (idxs.indexOf(activeChatIdx) !== -1) {
            endAll();
            extraFolderActive(folderIdx);
        }
        folderData.splice(folderIdx, 1);
        for (let i = idxs.length - 1; i >= 0; i--) {
            chatsData.splice(idxs[i], 1);
        }
        folderData.forEach(item => {
            if (item.idxs.length) {
                item.idxs.forEach((i, ix) => {
                    let len = idxs.filter(j => { return i > j }).length;
                    if (len) {
                        item.idxs[ix] = i - len;
                    }
                })
            }
        })
        chatIdxs.forEach((item, ix) => {
            let len = idxs.filter(j => { return item > j }).length;
            if (len) chatIdxs[ix] = item - len;
        })
        let len = idxs.filter(j => { return activeChatIdx > j }).length;
        if (len) activeChatIdx -= len;
        if (activeChatIdx === -1) {
            addNewChat();
            activeChatIdx = 0;
            chatEleAdd(activeChatIdx);
        }
        updateChats();
        activeChat();
    }
}
const folderAddChat = (folderIdx, headEle) => {
    endAll();
    let chat = { name: translations[locale]["newChatName"], data: [] };
    chatsData.push(chat);
    activeChatIdx = chatsData.length - 1;
    folderData[folderIdx].idxs.push(activeChatIdx);
    let ele = chatEleAdd(activeChatIdx, false)
    headEle.nextElementSibling.appendChild(ele);
    updateFolder(folderIdx);
    updateChats();
    activeChat(ele);
}
const folderEleEvent = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let parent = this.parentElement;
    let idx = Array.prototype.indexOf.call(folderListEle.children, parent);
    if (ev.target.className === "headLi") {
        let isExpanded = parent.classList.toggle("expandFolder");
        if (folderData[idx].idxs.indexOf(activeChatIdx) !== -1) {
            parent.classList.toggle("activeFolder", !isExpanded);
        }
    } else if (ev.target.dataset.type === "folderAddChat") {
        folderAddChat(idx, this);
    } else if (ev.target.dataset.type === "folderEdit") {
        toEditName(idx, this, 0);
    } else if (ev.target.dataset.type === "folderDel") {
        delFolder(idx, this);
    }
}
const folderDragStartEv = function (ev) {
    dragLi = this;
    dragLi.classList.add("dragingLi");
    dragType = "folder";
    dragIdx = Array.prototype.indexOf.call(folderListEle.children, this);
}
const folderEleAdd = (idx, push = true) => {
    let folder = folderData[idx];
    let folderEle = document.createElement("div");
    folderEle.className = "folderLi";
    if (!isMobile) folderEle.setAttribute("draggable", "true");
    else folderEle.ontouchstart = mobileDragStartEV;
    let headEle = document.createElement("div");
    headEle.className = "headLi";
    headEle.innerHTML = `<svg width="24" height="24"><use xlink:href="#expandFolderIcon" /></svg>
        <div class="folderInfo">
            <div class="folderName"></div>
            <div class="folderNum"></div>
        </div>
        <div class="folderOption">
            <svg data-type="folderAddChat" width="24" height="24" role="img"><title>${translations[locale]["newChat"]}</title><use xlink:href="#addIcon" /></svg>
            <svg data-type="folderEdit" width="24" height="24" role="img"><title>${translations[locale]["edit"]}</title><use xlink:href="#chatEditIcon" /></svg>
            <svg data-type="folderDel" width="24" height="24" role="img"><title>${translations[locale]["del"]}</title><use xlink:href="#delIcon" /></svg>
        </div>`
    headEle.children[1].children[0].textContent = folder.name;
    headEle.children[1].children[1].textContent = folder.idxs.length + translations[locale]["chats"];
    folderEle.appendChild(headEle);
    folderEle.ondragstart = folderDragStartEv;
    headEle.onclick = folderEleEvent;
    let chatsEle = document.createElement("div");
    chatsEle.className = "chatsInFolder";
    for (let i = 0; i < folder.idxs.length; i++) {
        chatsEle.appendChild(chatEleAdd(folder.idxs[i], false));
    }
    folderEle.appendChild(chatsEle);
    if (push) { folderListEle.appendChild(folderEle) }
    else { folderListEle.insertBefore(folderEle, folderListEle.firstChild) }
}
document.getElementById("newFolder").onclick = function () {
    folderData.unshift({ name: translations[locale]["newFolderName"], idxs: [] });
    folderEleAdd(0, false);
    updateChatIdxs();
    folderListEle.parentElement.scrollTop = 0;
};
const initChatEle = (index, chatEle) => {
    chatEle.children[1].children[0].textContent = chatsData[index].name;
    let chatPreview = "";
    if (chatsData[index].data && chatsData[index].data.length) {
        let first = chatsData[index].data.find(item => { return item.role === "assistant" });
        if (first) { chatPreview = first.content.slice(0, 30) }
    }
    chatEle.children[1].children[1].textContent = chatPreview;
};
const chatEleAdd = (idx, appendChat = true) => {
    let chat = chatsData[idx];
    let chatEle = document.createElement("div");
    chatEle.className = "chatLi";
    if (!isMobile) chatEle.setAttribute("draggable", "true");
    else chatEle.ontouchstart = mobileDragStartEV;
    chatEle.ondragstart = chatDragStartEv;
    chatEle.innerHTML = `<svg width="24" height="24"><use xlink:href="#chatIcon" /></svg>
        <div class="chatInfo">
            <div class="chatName"></div>
            <div class="chatPre"></div>
        </div>
        <div class="chatOption"><svg data-type="chatEdit" width="24" height="24" role="img"><title>${translations[locale]["edit"]}</title><use xlink:href="#chatEditIcon" /></svg>
        <svg data-type="chatDel" width="24" height="24" role="img"><title>${translations[locale]["del"]}</title><use xlink:href="#delIcon" /></svg></div>`
    if (appendChat) chatListEle.appendChild(chatEle);
    initChatEle(idx, chatEle);
    chatEle.onclick = chatEleEvent;
    return chatEle;
};
const addNewChat = () => {
    let chat = { name: translations[locale]["newChatName"], data: [] };
    if (presetRoleData.default) chat.data.unshift({ role: "system", content: presetRoleData.default });
    preEle.selectedIndex = 0;
    chatsData.push(chat);
    chatIdxs.push(chatsData.length - 1);
    updateChats();
};
const delChat = (idx, ele, folderIdx, inFolderIdx) => {
    if (confirmAction(translations[locale]["delChatTip"])) {
        if (idx === activeChatIdx) endAll();
        if (folderIdx !== void 0) {
            let folder = folderData[folderIdx];
            folder.idxs.splice(inFolderIdx, 1);
            updateFolder(folderIdx);
            if (idx === activeChatIdx) {
                if (inFolderIdx - 1 >= 0) {
                    activeChatIdx = folder.idxs[inFolderIdx - 1];
                } else if (folder.idxs.length) {
                    activeChatIdx = folder.idxs[0];
                } else {
                    extraFolderActive(folderIdx);
                }
            }
        } else {
            let chatIdx = chatIdxs.indexOf(idx);
            chatIdxs.splice(chatIdx, 1);
            if (idx === activeChatIdx) {
                if (chatIdx - 1 >= 0) {
                    activeChatIdx = chatIdxs[chatIdx - 1];
                } else if (chatIdxs.length) {
                    activeChatIdx = chatIdxs[0];
                } else {
                    let folderNewIdx = -1;
                    for (let i = folderData.length - 1; i >= 0; i--) {
                        if (folderData[i].idxs.length) folderNewIdx = i;
                    }
                    if (folderNewIdx !== -1) {
                        activeChatIdx = folderData[folderNewIdx].idxs[0];
                    } else {
                        activeChatIdx = -1;
                    }
                }
            }
        }
        if (activeChatIdx > idx) activeChatIdx--;
        chatsData.splice(idx, 1);
        ele.remove();
        folderData.forEach(item => {
            if (item.idxs.length) {
                item.idxs.forEach((i, ix) => {
                    if (i > idx) item.idxs[ix] = i - 1;
                })
            }
        })
        chatIdxs.forEach((item, ix) => {
            if (item > idx) chatIdxs[ix] = item - 1;
        })
        if (activeChatIdx === -1) {
            addNewChat();
            activeChatIdx = 0;
            chatEleAdd(activeChatIdx);
        }
        updateChats();
        activeChat();
    }
};
const endEditEvent = (ev) => {
    if (!document.getElementById("activeChatEdit").contains(ev.target)) {
        endEditChat();
    }
};
const preventDrag = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
}
const endEditChat = () => {
    if (operateChatIdx !== void 0) {
        let ele = getChatEle(operateChatIdx);
        chatsData[operateChatIdx].name = ele.children[1].children[0].textContent = document.getElementById("activeChatEdit").value;
        ele.lastElementChild.remove();
    } else if (operateFolderIdx !== void 0) {
        let ele = folderListEle.children[operateFolderIdx].children[0];
        folderData[operateFolderIdx].name = ele.children[1].children[0].textContent = document.getElementById("activeChatEdit").value;
        ele.lastElementChild.remove();
    }
    updateChats();
    operateChatIdx = operateFolderIdx = void 0;
    document.body.removeEventListener("mousedown", endEditEvent, true);
}
const toEditName = (idx, ele, type) => {
    let inputEle = document.createElement("input");
    inputEle.id = "activeChatEdit";
    inputEle.setAttribute("draggable", "true");
    inputEle.ondragstart = preventDrag;
    ele.appendChild(inputEle);
    if (type) {
        inputEle.value = chatsData[idx].name;
        operateChatIdx = idx;
    } else {
        inputEle.value = folderData[idx].name;
        operateFolderIdx = idx;
    }
    inputEle.setSelectionRange(0, 0);
    inputEle.focus();
    inputEle.onkeydown = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
            endEditChat();
        }
    };
    document.body.addEventListener("mousedown", endEditEvent, true);
    return inputEle;
};
const chatEleEvent = function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let idx, folderIdx, inFolderIdx;
    if (chatListEle.contains(this)) {
        idx = Array.prototype.indexOf.call(chatListEle.children, this);
        idx = chatIdxs[idx];
    } else if (folderListEle.contains(this)) {
        folderIdx = Array.prototype.indexOf.call(folderListEle.children, this.parentElement.parentElement);
        inFolderIdx = Array.prototype.indexOf.call(this.parentElement.children, this);
        idx = folderData[folderIdx].idxs[inFolderIdx];
    }
    if (ev.target.classList.contains("chatLi")) {
        if (searchChatEle.value || activeChatIdx !== idx) {
            endAll();
            activeChatIdx = idx;
            activeChat(this);
        }
        if (window.innerWidth <= 800) {
            document.body.classList.remove("show-nav");
        }
    } else if (ev.target.dataset.type === "chatEdit") {
        toEditName(idx, this, 1);
    } else if (ev.target.dataset.type === "chatDel") {
        delChat(idx, this, folderIdx, inFolderIdx);
    }
};
const updateChats = () => {
    localStorage.setItem("chats", JSON.stringify(chatsData));
    updateChatIdxs();
};
const updateChatIdxs = () => {
    localStorage.setItem("chatIdxs", JSON.stringify(chatIdxs));
    localStorage.setItem("folders", JSON.stringify(folderData));
}
const createConvEle = (className, append = true, model) => {
    let div = document.createElement("div");
    div.className = className;
    formatMdEle(div, model);
    if (append) chatlog.appendChild(div);
    return div;
}
const getChatEle = (idx) => {
    let chatIdx = chatIdxs.indexOf(idx);
    if (chatIdx !== -1) {
        return chatListEle.children[chatIdx];
    } else {
        let inFolderIdx;
        let folderIdx = folderData.findIndex(item => {
            inFolderIdx = item.idxs.indexOf(idx);
            return inFolderIdx !== -1;
        })
        if (folderIdx !== -1) {
            return folderListEle.children[folderIdx].children[1].children[inFolderIdx];
        }
    }
}
const renderData = (dat) => {
    let contentHTML = md.render(dat.content) || "<br />";
    if (dat.reasoning_content) return `<div><div class="cotBtn endCot" data-i18n-key="thinked" onclick="toggleCot(this, event)">${translations[locale]["thinked"]}</div><div class="cotContent">${md.render(dat.reasoning_content)}</div></div><div class="markdown-body">${contentHTML}</div>`;
    else return contentHTML;
}
const activeChat = (ele) => {
    data = chatsData[activeChatIdx]["data"];
    allListEle.querySelectorAll(".activeChatLi").forEach(ele => {
        ele.classList.remove("activeChatLi");
    })
    allListEle.querySelectorAll(".activeFolder").forEach(ele => {
        ele.classList.remove("activeFolder")
    })
    if (!ele) ele = getChatEle(activeChatIdx);
    ele.classList.add("activeChatLi");
    activeChatEle = ele;
    if (chatIdxs.indexOf(activeChatIdx) === -1) {
        if (!ele.parentElement.parentElement.classList.contains("expandFolder")) {
            ele.parentElement.parentElement.classList.add("activeFolder");
        }
    }
    if (data[0] && data[0].role === "system") {
        systemRole = data[0].content;
        systemEle.value = systemRole;
    } else {
        systemRole = void 0;
        systemEle.value = "";
    }
    chatlog.innerHTML = "";
    if (systemRole ? data.length - 1 : data.length) {
        let firstIdx = systemRole ? 1 : 0;
        for (let i = firstIdx; i < data.length; i++) {
            if (data[i].role === "user") {
                createConvEle("request").children[1].textContent = data[i].content;
            } else {
                createConvEle("response", true, data[i].model).children[1].innerHTML = renderData(data[i]);
            }
        }
    }
    let top = ele.offsetTop + ele.offsetHeight - allListEle.clientHeight;
    if (allListEle.scrollTop < top) allListEle.scrollTop = top;
    localStorage.setItem("activeChatIdx", activeChatIdx);
    if (searchIdxs[activeChatIdx] !== void 0) {
        let dataIdx = searchIdxs[activeChatIdx];
        if (dataIdx !== -1) {
            let currChatEle = chatlog.children[systemRole ? dataIdx - 1 : dataIdx];
            let childs = currChatEle.children[1].getElementsByTagName("*");
            if (childs.length) {
                for (let i = childs.length - 1; i >= 0; i--) {
                    if (childs[i].textContent && childs[i].textContent.indexOf(searchChatEle.value) !== -1) {
                        let offTop = findOffsetTop(childs[i], messagesEle);
                        messagesEle.scrollTop = offTop + childs[i].offsetHeight - messagesEle.clientHeight * 0.15;
                        break;
                    }
                }
            } else messagesEle.scrollTop = currChatEle.offsetTop;
        } else messagesEle.scrollTop = 0;
    }
};
newChatEle.onclick = () => {
    endAll();
    addNewChat();
    activeChatIdx = chatsData.length - 1;
    chatEleAdd(activeChatIdx);
    activeChat(chatListEle.lastElementChild);
};
const initChats = () => {
    let localChats = localStorage.getItem("chats");
    let localFolders = localStorage.getItem("folders");
    let localChatIdxs = localStorage.getItem("chatIdxs")
    let localChatIdx = localStorage.getItem("activeChatIdx");
    activeChatIdx = (localChatIdx && parseInt(localChatIdx)) || 0;
    if (localChats) {
        if (isCompressedChats) localChats = new TextDecoder().decode(inflateSync(stringToUint(localChats)));
        chatsData = JSON.parse(localChats);
        let folderIdxs = [];
        if (localFolders) {
            folderData = JSON.parse(localFolders);
            for (let i = 0; i < folderData.length; i++) {
                folderEleAdd(i);
                folderIdxs.push(...folderData[i].idxs);
            }
        }
        if (localChatIdxs) {
            chatIdxs = JSON.parse(localChatIdxs);
            for (let i = 0; i < chatIdxs.length; i++) {
                chatEleAdd(chatIdxs[i]);
            }
        } else {
            for (let i = 0; i < chatsData.length; i++) {
                if (folderIdxs.indexOf(i) === -1) {
                    chatIdxs.push(i);
                    chatEleAdd(i);
                }
            }
            updateChatIdxs();
        }
    } else {
        addNewChat();
        chatEleAdd(activeChatIdx);
    }
};
const initExpanded = () => {
    let folderIdx = folderData.findIndex(item => {
        return item.idxs.indexOf(activeChatIdx) !== -1;
    })
    if (folderIdx !== -1) {
        folderListEle.children[folderIdx].classList.add("expandFolder");
    }
}
initChats();
initExpanded();
activeChat();
document.getElementById("clearSearch").onclick = () => {
    searchChatEle.value = "";
    searchChatEle.dispatchEvent(new Event("input"));
    searchChatEle.focus();
}
const toSearchChats = () => {
    searchIdxs.length = 0;
    for (let i = 0; i < chatsData.length; i++) {
        let chatEle = getChatEle(i);
        chatEle.style.display = null;
        let flags = isCaseSearch ? "" : "i";
        let pattern = escapeRegexExp(searchChatEle.value);
        let regex = new RegExp(pattern, flags);
        let nameData = chatsData[i].name.match(regex);
        let nameIdx = nameData ? nameData.index : -1;
        let matchContent;
        let dataIdx = chatsData[i].data.findIndex(item => {
            return item.role !== "system" && (matchContent = item.content.match(regex))
        })
        if (nameIdx !== -1 || dataIdx !== -1) {
            let ele = chatEle.children[1];
            if (dataIdx !== -1) {
                let data = chatsData[i].data[dataIdx];
                let idx = matchContent.index;
                let endIdx = idx + matchContent[0].length;
                ele.children[1].textContent = (idx > 8 ? "..." : "") + data.content.slice(idx > 8 ? idx - 5 : 0, idx);
                ele.children[1].appendChild(document.createElement("span"));
                ele.children[1].lastChild.textContent = data.content.slice(idx, endIdx);
                ele.children[1].appendChild(document.createTextNode(data.content.slice(endIdx)))
            } else {
                initChatEle(i, chatEle);
            }
            if (nameIdx !== -1) {
                let endIdx = nameIdx + nameData[0].length;
                ele.children[0].textContent = (nameIdx > 5 ? "..." : "") + chatsData[i].name.slice(nameIdx > 5 ? nameIdx - 3 : 0, nameIdx);
                ele.children[0].appendChild(document.createElement("span"));
                ele.children[0].lastChild.textContent = chatsData[i].name.slice(nameIdx, endIdx);
                ele.children[0].appendChild(document.createTextNode(chatsData[i].name.slice(endIdx)))
            } else {
                ele.children[0].textContent = chatsData[i].name;
            }
            searchIdxs[i] = dataIdx;
        } else {
            chatEle.style.display = "none";
            initChatEle(i, chatEle);
        }
    }
    for (let i = 0; i < folderListEle.children.length; i++) {
        let folderChatEle = folderListEle.children[i].children[1];
        if (!folderChatEle.children.length || Array.prototype.filter.call(folderChatEle.children, (ele) => {
            return ele.style.display !== "none"
        }).length === 0) {
            folderListEle.children[i].style.display = "none";
        }
    }
}
searchChatEle.oninput = (ev) => {
    if (searchChatEle.value.length) {
        toSearchChats();
    } else {
        searchIdxs.length = 0;
        for (let i = 0; i < chatsData.length; i++) {
            let chatEle = getChatEle(i);
            chatEle.style.display = null;
            initChatEle(i, chatEle);
        }
        for (let i = 0; i < folderListEle.children.length; i++) {
            folderListEle.children[i].style.display = null;
        }
    }
};
document.getElementById("resetHotKey").onclick = () => {
    localStorage.removeItem("hotKeys");
    initHotKey();
    notyf.success(translations[locale]["resetSetSuccTip"]);
};
const blobToText = (blob) => {
    return new Promise((res, rej) => {
        let reader = new FileReader();
        reader.readAsText(blob);
        reader.onload = () => {
            res(reader.result);
        }
        reader.onerror = (error) => {
            rej(error);
        }
    })
};
document.getElementById("exportChat").onclick = () => {
    if (loading) stopLoading();
    let data = {
        chatsData: chatsData,
        folderData: folderData,
        chatIdxs: chatIdxs
    }
    let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let date = new Date();
    let fileName = "chats-" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + ".json";
    downBlob(blob, fileName);
    notyf.success(translations[locale]["exportSuccTip"]);
};
document.getElementById("importChatInput").onchange = function () {
    let file = this.files[0];
    blobToText(file).then(text => {
        try {
            let json = JSON.parse(text);
            let checked = json.chatsData && json.folderData && json.chatIdxs && json.chatsData.every(item => {
                return item.name !== void 0 && item.data !== void 0;
            });
            if (checked) {
                let preFolder = folderData.length;
                let preLen = chatsData.length;
                if (json.chatsData) {
                    chatsData = chatsData.concat(json.chatsData);
                }
                if (json.folderData) {
                    for (let i = 0; i < json.folderData.length; i++) {
                        json.folderData[i].idxs = json.folderData[i].idxs.map(item => {
                            return item + preLen;
                        })
                        folderData.push(json.folderData[i]);
                        folderEleAdd(i + preFolder);
                    }
                }
                if (json.chatIdxs) {
                    for (let i = 0; i < json.chatIdxs.length; i++) {
                        let newIdx = json.chatIdxs[i] + preLen;
                        chatIdxs.push(newIdx)
                        chatEleAdd(newIdx);
                    }
                }
                updateChats();
                checkStorage();
                notyf.success(translations[locale]["importSuccTip"]);
            } else {
                throw new Error("fmt error");
            }
        } catch (e) {
            notyf.error(translations[locale]["importFailTip"]);
        }
        this.value = "";
    })
};
clearChatSet.onclick = clearChat.onclick = () => {
    if (confirmAction(translations[locale]["clearAllTip"])) {
        chatsData.length = 0;
        chatIdxs.length = 0;
        folderData.length = 0;
        folderListEle.innerHTML = "";
        chatListEle.innerHTML = "";
        endAll();
        addNewChat();
        activeChatIdx = 0;
        chatEleAdd(activeChatIdx);
        localStorage.removeItem("compressedChats");
        isCompressedChats = false;
        updateChats();
        checkStorage();
        activeChat(chatListEle.firstElementChild);
        notyf.success(translations[locale]["clearChatSuccTip"]);
    }
};
let localSetKeys = ['modelVersion', 'APISelect', 'DeepSeekAPISelect', 'AzureAIAPISelect', 'GeminiAPISelect', 'ClaudeAPISelect', 'APIHost', 'DeepSeekAPIHost', 'AzureAIAPIHost', 'GeminiAPIHost', 'ClaudeAPIHost', 'APIKey', 'DeepSeekAPIKey', 'AzureAIAPIKey', 'GeminiAPIKey', 'ClaudeAPIKey', 'APIModel', 'DeepSeekAPIModel', 'AzureAIAPIModel', 'GeminiAPIModel', 'ClaudeAPIModel', 'hotKeys', 'userAvatar', 'system', 'temp', 'top_p', 'convWidth0', 'convWidth1', 'textSpeed', 'contLen', 'enableCOT', 'enableLongReply', 'existVoice', 'voiceTestText', 'azureRegion', 'azureKey', 'enableContVoice', 'enableAutoVoice', 'existRec', 'azureRecRegion', 'azureRecKey', 'voiceRecLang', 'autoVoiceSendWord', 'autoVoiceStopWord', 'autoVoiceSendOut', 'keepListenMic', 'fullWindow', 'themeMode', 'autoThemeMode', 'customDarkTime', 'UILang', 'pinNav', 'voice0', 'voicePitch0', 'voiceVolume0', 'voiceRate0', 'azureRole0', 'azureStyle0', 'voice1', 'voicePitch1', 'voiceVolume1', 'voiceRate1', 'azureRole1', 'azureStyle1', 'searchFlag'];
document.getElementById("exportSet").onclick = () => {
    let data = {}
    for (let i = 0; i < localSetKeys.length; i++) {
        let key = localSetKeys[i];
        let val = localStorage.getItem(key);
        if (val != void 0) data[key] = val;
    }
    let blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    let date = new Date();
    let fileName = "settings-" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + ".json";
    downBlob(blob, fileName);
    notyf.success(translations[locale]["exportSuccTip"]);
};
document.getElementById("importSetInput").onchange = function () {
    let file = this.files[0];
    blobToText(file).then(text => {
        try {
            let json = JSON.parse(text);
            let keys = Object.keys(json);
            for (let i = 0; i < localSetKeys.length; i++) {
                let key = localSetKeys[i];
                let val = json[key];
                if (val !== void 0) localStorage.setItem(key, val);
                else localStorage.removeItem(key);
            }
            initSetting();
            initVoiceVal();
            speechServiceEle.dispatchEvent(new Event("change"));
            initRecSetting();
            initHotKey();
            initLang();
            checkStorage();
            notyf.success(translations[locale]["importSuccTip"]);
        } catch (e) {
            notyf.error(translations[locale]["importFailTip"]);
        }
        this.value = "";
    })
};
document.getElementById("resetSet").onclick = () => {
    if (confirmAction(translations[locale]["resetSetTip"])) {
        endAll();
        if (existVoice === 3) localStorage.removeItem(azureRegion + "VoiceData");
        if (existRec === 2) localStorage.removeItem(azureRecRegion + "RecData");
        let data = {};
        for (let i = 0; i < localSetKeys.length; i++) {
            let key = localSetKeys[i];
            let val = localStorage.removeItem(key);
        }
        initSetting();
        initVoiceVal();
        speechServiceEle.dispatchEvent(new Event("change"));
        initRecSetting();
        initHotKey();
        initLang();
        checkStorage();
        notyf.success(translations[locale]["resetSetSuccTip"]);
    }
}
const endAll = () => {
    endSpeak();
    if (editingIdx !== void 0) resumeSend();
    if (loading) stopLoading();
};
const processIdx = (plus) => {
    if (currentVoiceIdx !== void 0) currentVoiceIdx += plus;
    if (editingIdx !== void 0) editingIdx += plus;
}
const hotKeyVals = {};
const ctrlHotKeyEv = (ev) => {
    if (ev.ctrlKey || ev.metaKey) {
        switch (ev.key.toLowerCase()) {
            case hotKeyVals["Nav"]:
                ev.preventDefault();
                toggleNavEv();
                return false;
            case hotKeyVals["Search"]:
                ev.preventDefault();
                searchChatEle.focus();
                return false;
            case hotKeyVals["Input"]:
                ev.preventDefault();
                inputAreaEle.focus();
                return false;
            case hotKeyVals["NewChat"]:
                ev.preventDefault();
                newChatEle.dispatchEvent(new MouseEvent("click"));
                return false;
            case hotKeyVals["ClearChat"]:
                ev.preventDefault();
                clearEle.dispatchEvent(new MouseEvent("click"));
                return false;
            case hotKeyVals["VoiceRec"]:
                if (supportRec) {
                    ev.preventDefault();
                    toggleRecEv();
                }
                return false;
            case hotKeyVals["VoiceSpeak"]:
                ev.preventDefault();
                speechEvent(systemRole ? 1 : 0);
                return false;
        }
    }
}
const ctrlAltHotKeyEv = (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.altKey) {
        switch (ev.key.toLowerCase()) {
            case hotKeyVals["Window"]:
                ev.preventDefault();
                toggleFull.dispatchEvent(new Event("click"));
                return false;
            case hotKeyVals["Theme"]:
                ev.preventDefault();
                lightEle.dispatchEvent(new Event("click"));
                return false;
            case hotKeyVals["Lang"]:
                ev.preventDefault();
                let idx = localeList.indexOf(locale) + 1;
                if (idx === localeList.length) idx = 0;
                locale = localeList[idx];
                setLang();
                changeLocale();
                return false;
        }
    }
}
const listKey = ['Nav', 'Search', 'Input', 'NewChat', 'ClearChat', 'VoiceRec', 'VoiceSpeak', 'Window', 'Theme', 'Lang'];
const ctrlKeyIdx = 7;
const defKeyVal = ['b', 'k', 'i', 'e', 'r', 'q', 's', 'u', 't', 'l'];
const initHotKey = () => {
    let localKeysObj = {};
    let localKeys = localStorage.getItem("hotKeys");
    if (localKeys) {
        try {
            localKeysObj = JSON.parse(localKeys);
        } catch (e) { }
    }
    let pre1 = isApple ? "⌘ + " : "Ctrl + ";
    let pre2 = isApple ? "⌘ + ⌥ + " : "Ctrl + Alt + ";
    for (let i = 0; i < listKey.length; i++) {
        let key = listKey[i];
        if (key === "VoiceRec" && !supportRec) continue;
        let ele = window["hotKey" + key];
        for (let j = 0; j < 26; j++) {
            // top-level hotkey, can't overwrite
            if (i < ctrlKeyIdx && (j === 13 || j === 19 || j === 22)) continue;
            let val = String.fromCharCode(j + 97);
            ele.options.add(new Option((i < ctrlKeyIdx ? pre1 : pre2) + val.toUpperCase(), val));
        }
        hotKeyVals[key] = ele.value = localKeysObj[key] || defKeyVal[i];
        ele.onchange = () => {
            if (hotKeyVals[key] === ele.value) return;
            let exist = listKey.find((item, idx) => {
                return (i < ctrlKeyIdx ? idx < ctrlKeyIdx : idx >= ctrlKeyIdx) && hotKeyVals[item] === ele.value;
            })
            if (exist) {
                ele.value = hotKeyVals[key];
                notyf.error(translations[locale]["hotkeyConflict"])
                return;
            }
            hotKeyVals[key] = ele.value;
            localStorage.setItem("hotKeys", JSON.stringify(hotKeyVals));
        }
    }
};
initHotKey();
document.addEventListener("keydown", ctrlHotKeyEv);
document.addEventListener("keydown", ctrlAltHotKeyEv);
const initSetting = () => {
    const apiHostEle = document.getElementById("apiHostInput");
    const deepseekHostEle = document.getElementById("deepseekApiHostInput");
    const azureAIHostEle = document.getElementById("azureAIApiHostInput");
    const geminiHostEle = document.getElementById("geminiApiHostInput");
    const claudeHostEle = document.getElementById("claudeApiHostInput");
    const apiSelectEle = document.getElementById("apiSelect");
    let localApiSelect = localStorage.getItem("APISelect");
    if (localApiSelect) {
        try {
            apiSelects = JSON.parse(localApiSelect);
        } catch (e) {
            apiSelects.length = 0;
        }
    } else {
        apiSelects.length = 0;
    }
    let localDeepSeekApiSelect = localStorage.getItem("DeepSeekAPISelect");
    if (localDeepSeekApiSelect) {
        try {
            deepseekApiSelects = JSON.parse(localDeepSeekApiSelect);
        } catch (e) {
            deepseekApiSelects.length = 0;
        }
    } else {
        deepseekApiSelects.length = 0;
    }
    let localAzureAIApiSelect = localStorage.getItem("AzureAIAPISelect");
    if (localAzureAIApiSelect) {
        try {
            azureAIApiSelects = JSON.parse(localAzureAIApiSelect);
        } catch (e) {
            azureAIApiSelects.length = 0;
        }
    } else {
        azureAIApiSelects.length = 0;
    }
    let localGeminiApiSelect = localStorage.getItem("GeminiAPISelect");
    if (localGeminiApiSelect) {
        try {
            geminiApiSelects = JSON.parse(localGeminiApiSelect);
        } catch (e) {
            geminiApiSelects.length = 0;
        }
    } else {
        geminiApiSelects.length = 0;
    }
    let localClaudeApiSelect = localStorage.getItem("ClaudeAPISelect");
    if (localClaudeApiSelect) {
        try {
            claudeApiSelects = JSON.parse(localClaudeApiSelect);
        } catch (e) {
            claudeApiSelects.length = 0;
        }
    } else {
        claudeApiSelects.length = 0;
    }
    let selApiSelects = apiSelects;
    let selApiKey = "APISelect";
    let selApiEle = apiHostEle;
    const delApiOption = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        let index = Array.prototype.indexOf.call(apiSelectEle.children, this.parentElement);
        selApiSelects.splice(index, 1);
        this.parentElement.remove();
        localStorage.setItem(selApiKey, JSON.stringify(selApiSelects));
        if (!selApiSelects.includes(selApiEle.value)) {
            selApiEle.value = selApiSelects[0] || "";
            selApiEle.dispatchEvent(new Event("change"));
        }
        if (!selApiSelects.length) apiSelectEle.style.display = "none";
    }
    const appendApiOption = () => {
        apiSelects.push(apiHost);
        initApiOption(apiHost);
        localStorage.setItem("APISelect", JSON.stringify(apiSelects));
    }
    const appendDeepSeekApiOption = () => {
        deepseekApiSelects.push(deepseekApiHost);
        initApiOption(deepseekApiHost);
        localStorage.setItem("DeepSeekAPISelect", JSON.stringify(deepseekApiSelects));
    }
    const appendAzureAIApiOption = () => {
        azureAIApiSelects.push(azureAIApiHost);
        initApiOption(azureAIApiHost);
        localStorage.setItem("AzureAIAPISelect", JSON.stringify(azureAIApiSelects));
    }
    const appendGeminiApiOption = () => {
        geminiApiSelects.push(geminiApiHost);
        initApiOption(geminiApiHost);
        localStorage.setItem("GeminiAPISelect", JSON.stringify(geminiApiSelects));
    }
    const appendClaudeApiOption = () => {
        claudeApiSelects.push(claudeApiHost);
        initApiOption(claudeApiHost);
        localStorage.setItem("ClaudeAPISelect", JSON.stringify(claudeApiSelects));
    }
    const selApiOption = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        apiSelectEle.style.display = "none";
        let index = Array.prototype.indexOf.call(apiSelectEle.children, this);
        selApiEle.value = selApiSelects[index];
        selApiEle.dispatchEvent(new Event("change"));
    }
    const initApiOption = (api) => {
        let optionEle = document.createElement("div");
        optionEle.onclick = selApiOption;
        let textEle = document.createElement("span");
        textEle.textContent = api;
        optionEle.appendChild(textEle);
        let delEle = document.createElement("div");
        delEle.className = "delApiOption";
        delEle.onmousedown = delApiOption;
        delEle.innerHTML = `<svg width="24" height="24"><use xlink:href="#closeIcon" /></svg>`;
        optionEle.appendChild(delEle);
        apiSelectEle.appendChild(optionEle);
    }
    const initApiSelectEle = () => {
        apiSelectEle.innerHTML = "";
        for (let i = 0; i < selApiSelects.length; i++) {
            initApiOption(selApiSelects[i]);
        }
    }
    apiHostEle.onfocus = deepseekHostEle.onfocus = azureAIHostEle.onfocus = geminiHostEle.onfocus = claudeHostEle.onfocus = () => {
        let type = document.querySelector(".modelSwitch").querySelector(".activeSwitch").dataset.id;
        if (type === "gptOption") {
            selApiSelects = apiSelects;
            selApiKey = "APISelect"
            selApiEle = apiHostEle;
        } else if (type === "deepseekOption") {
            selApiSelects = deepseekApiSelects;
            selApiKey = "DeepSeekAPISelect";
            selApiEle = deepseekHostEle;
        } else if (type === "azureAIOption") {
            selApiSelects = azureAIApiSelects;
            selApiKey = "AzureAIAPISelect";
            selApiEle = azureAIHostEle;
        } else if (type === "geminiOption") {
            selApiSelects = geminiApiSelects;
            selApiKey = "GeminiAPISelect";
            selApiEle = geminiHostEle;
        } else {
            selApiSelects = claudeApiSelects;
            selApiKey = "ClaudeAPISelect";
            selApiEle = claudeHostEle;
        }
        initApiSelectEle();
        if (selApiSelects.length) apiSelectEle.style.display = "block";
    }
    apiHostEle.onblur = deepseekHostEle.onblur = azureAIHostEle.onblur = geminiHostEle.onblur = claudeHostEle.onblur = (ev) => {
        if (!(ev.relatedTarget && apiSelectEle.contains(ev.relatedTarget))) apiSelectEle.style.display = "none";
    }
    let localApiHost = localStorage.getItem("APIHost");
    apiHost = apiHostEle.value = envAPIEndpoint || localApiHost || apiHostEle.getAttribute("value") || "";
    apiHostEle.onchange = () => {
        apiHost = apiHostEle.value;
        if (apiHost && apiSelects.indexOf(apiHost) === -1) appendApiOption();
        localStorage.setItem("APIHost", apiHost);
    }
    apiHostEle.dispatchEvent(new Event("change"));
    const keyEle = document.getElementById("keyInput");
    let localKey = localStorage.getItem("APIKey");
    customAPIKey = keyEle.value = envAPIKey || localKey || keyEle.getAttribute("value") || "";
    keyEle.onchange = () => {
        customAPIKey = keyEle.value;
        localStorage.setItem("APIKey", customAPIKey);
    }
    keyEle.dispatchEvent(new Event("change"));
    const modelEle = document.getElementById("modelInput");
    let localModel = localStorage.getItem("APIModel");
    customAPIModel = envAPIModel || localModel || modelEle.getAttribute("value") || "";
    modelEle.value = customAPIModel.slice(4);
    modelEle.onchange = () => {
        customAPIModel = modelEle.value != "" ? "gpt|" + modelEle.value : "";
        if (modelEle.value !== "") {
            customGPTDOM.classList.remove("hide");
            customGPTDOM.dataset.ver = customGPTDOM.lastElementChild.textContent = modelEle.value;
            customGPTDOM.dataset.value = customAPIModel;
        } else {
            customGPTDOM.classList.add("hide");
        }
        localStorage.setItem("APIModel", customAPIModel);
    }
    modelEle.dispatchEvent(new Event("change"));

    let localDeepSeekApiHost = localStorage.getItem("DeepSeekAPIHost");
    deepseekApiHost = deepseekHostEle.value = envDeepSeekAPIEndpoint || localDeepSeekApiHost || deepseekHostEle.getAttribute("value") || "";
    deepseekHostEle.onchange = () => {
        deepseekApiHost = deepseekHostEle.value;
        if (deepseekApiHost && deepseekApiSelects.indexOf(deepseekApiHost) === -1) appendDeepSeekApiOption();
        localStorage.setItem("DeepSeekAPIHost", deepseekApiHost);
    }
    deepseekHostEle.dispatchEvent(new Event("change"));
    const deepseekKeyEle = document.getElementById("deepseekKeyInput");
    let localDeepSeekKey = localStorage.getItem("DeepSeekAPIKey");
    deepseekAPIKey = deepseekKeyEle.value = envDeepSeekAPIKey || localDeepSeekKey || deepseekKeyEle.getAttribute("value") || "";
    deepseekKeyEle.onchange = () => {
        deepseekAPIKey = deepseekKeyEle.value;
        localStorage.setItem("DeepSeekAPIKey", deepseekAPIKey);
    }
    deepseekKeyEle.dispatchEvent(new Event("change"));
    const deepseekModelEle = document.getElementById("deepseekModelInput");
    let localDeepSeekModel = localStorage.getItem("DeepSeekAPIModel");
    deepseekAPIModel = envDeepSeekAPIModel || localDeepSeekModel || deepseekModelEle.getAttribute("value") || "";
    deepseekModelEle.value = deepseekAPIModel.slice(9);
    deepseekModelEle.onchange = () => {
        deepseekAPIModel = deepseekModelEle.value != "" ? "deepseek|" + deepseekModelEle.value : "";
        if (deepseekModelEle.value !== "") {
            customDeepSeekDOM.classList.remove("hide");
            customDeepSeekDOM.dataset.ver = customDeepSeekDOM.lastElementChild.textContent = deepseekModelEle.value;
            customDeepSeekDOM.dataset.value = deepseekAPIModel;
        } else {
            customDeepSeekDOM.classList.add("hide");
        }
        localStorage.setItem("DeepSeekAPIModel", deepseekAPIModel);
    }
    deepseekModelEle.dispatchEvent(new Event("change"));

    let localAzureAIApiHost = localStorage.getItem("AzureAIAPIHost");
    azureAIApiHost = azureAIHostEle.value = envAzureAIAPIEndpoint || localAzureAIApiHost || azureAIHostEle.getAttribute("value") || "";
    azureAIHostEle.onchange = () => {
        azureAIApiHost = azureAIHostEle.value;
        if (azureAIApiHost && azureAIApiSelects.indexOf(azureAIApiHost) === -1) appendAzureAIApiOption();
        localStorage.setItem("AzureAIAPIHost", azureAIApiHost);
    }
    azureAIHostEle.dispatchEvent(new Event("change"));
    const azureAIKeyEle = document.getElementById("azureAIKeyInput");
    let localAzureAIKey = localStorage.getItem("AzureAIAPIKey");
    azureAIAPIKey = azureAIKeyEle.value = envAzureAIAPIKey || localAzureAIKey || azureAIKeyEle.getAttribute("value") || "";
    azureAIKeyEle.onchange = () => {
        azureAIAPIKey = azureAIKeyEle.value;
        localStorage.setItem("AzureAIAPIKey", azureAIAPIKey);
    }
    azureAIKeyEle.dispatchEvent(new Event("change"));
    const azureAIModelEle = document.getElementById("azureAIModelInput");
    let localAzureAIModel = localStorage.getItem("AzureAIAPIModel");
    azureAIAPIModel = envAzureAIAPIModel || localAzureAIModel || azureAIModelEle.getAttribute("value") || "";
    azureAIModelEle.value = azureAIAPIModel.slice(6);
    azureAIModelEle.onchange = () => {
        azureAIAPIModel = azureAIModelEle.value != "" ? "azure|" + azureAIModelEle.value : "";
        if (azureAIModelEle.value !== "") {
            customAzureAIDOM.classList.remove("hide");
            customAzureAIDOM.lastElementChild.textContent = "Azure " + azureAIModelEle.value;
            customAzureAIDOM.dataset.ver = azureAIModelEle.value;
            customAzureAIDOM.dataset.value = azureAIAPIModel;
        } else {
            customAzureAIDOM.classList.add("hide");
        }
        localStorage.setItem("AzureAIAPIModel", azureAIAPIModel);
    }
    azureAIModelEle.dispatchEvent(new Event("change"));

    let localGeminiApiHost = localStorage.getItem("GeminiAPIHost");
    geminiApiHost = geminiHostEle.value = envGeminiAPIEndpoint || localGeminiApiHost || geminiHostEle.getAttribute("value") || "";
    geminiHostEle.onchange = () => {
        geminiApiHost = geminiHostEle.value;
        if (geminiApiHost && geminiApiSelects.indexOf(geminiApiHost) === -1) appendGeminiApiOption();
        localStorage.setItem("GeminiAPIHost", geminiApiHost);
    }
    geminiHostEle.dispatchEvent(new Event("change"));
    const geminiKeyEle = document.getElementById("geminiKeyInput");
    let localGeminiKey = localStorage.getItem("GeminiAPIKey");
    geminiAPIKey = geminiKeyEle.value = envGeminiAPIKey || localGeminiKey || geminiKeyEle.getAttribute("value") || "";
    geminiKeyEle.onchange = () => {
        geminiAPIKey = geminiKeyEle.value;
        localStorage.setItem("GeminiAPIKey", geminiAPIKey);
    }
    geminiKeyEle.dispatchEvent(new Event("change"));
    const geminiModelEle = document.getElementById("geminiModelInput");
    let localGeminiModel = localStorage.getItem("GeminiAPIModel");
    geminiAPIModel = envGeminiAPIModel || localGeminiModel || geminiModelEle.getAttribute("value") || "";
    geminiModelEle.value = geminiAPIModel.slice(7);
    geminiModelEle.onchange = () => {
        geminiAPIModel = geminiModelEle.value != "" ? "gemini|" + geminiModelEle.value : "";
        if (geminiModelEle.value !== "") {
            customGeminiDOM.classList.remove("hide");
            customGeminiDOM.dataset.ver = customGeminiDOM.lastElementChild.textContent = geminiModelEle.value;
            customGeminiDOM.dataset.value = geminiAPIModel;
        } else {
            customGeminiDOM.classList.add("hide");
        }
        localStorage.setItem("GeminiAPIModel", geminiAPIModel);
    }
    geminiModelEle.dispatchEvent(new Event("change"));

    let localClaudeApiHost = localStorage.getItem("ClaudeAPIHost");
    claudeApiHost = claudeHostEle.value = envClaudeAPIEndpoint || localClaudeApiHost || claudeHostEle.getAttribute("value") || "";
    claudeHostEle.onchange = () => {
        claudeApiHost = claudeHostEle.value;
        if (claudeApiHost && claudeApiSelects.indexOf(claudeApiHost) === -1) appendClaudeApiOption();
        localStorage.setItem("ClaudeAPIHost", claudeApiHost);
    }
    claudeHostEle.dispatchEvent(new Event("change"));
    const claudeKeyEle = document.getElementById("claudeKeyInput");
    let localClaudeKey = localStorage.getItem("ClaudeAPIKey");
    claudeAPIKey = claudeKeyEle.value = envClaudeAPIKey || localClaudeKey || claudeKeyEle.getAttribute("value") || "";
    claudeKeyEle.onchange = () => {
        claudeAPIKey = claudeKeyEle.value;
        localStorage.setItem("ClaudeAPIKey", claudeAPIKey);
    }
    claudeKeyEle.dispatchEvent(new Event("change"));
    const claudeModelEle = document.getElementById("claudeModelInput");
    let localClaudeModel = localStorage.getItem("ClaudeAPIModel");
    claudeAPIModel = envClaudeAPIModel || localClaudeModel || claudeModelEle.getAttribute("value") || "";
    claudeModelEle.value = claudeAPIModel.slice(7);
    claudeModelEle.onchange = () => {
        claudeAPIModel = claudeModelEle.value != "" ? "claude|" + claudeModelEle.value : "";
        if (claudeModelEle.value !== "") {
            customClaudeDOM.classList.remove("hide");
            customClaudeDOM.dataset.ver = customClaudeDOM.lastElementChild.textContent = claudeModelEle.value;
            customClaudeDOM.dataset.value = claudeAPIModel;
        } else {
            customClaudeDOM.classList.add("hide");
        }
        localStorage.setItem("ClaudeAPIModel", claudeAPIModel);
    }
    claudeModelEle.dispatchEvent(new Event("change"));

    const modelsEle = Array.from(modelSetEle.children);
    let localModelName = localStorage.getItem("modelVersion");
    let isVailModel = modelsEle.some(item => item.dataset.value === localModelName)
    
    // 优先使用环境变量中的模型（如从URL参数获取的）
    if (typeof envAPIModel !== 'undefined' && envAPIModel) {
        modelVersion = envAPIModel;
        console.log("使用环境变量中指定的模型:", modelVersion);
    } else {
        modelVersion = isVailModel ? localModelName : "gpt-4o";
    }
    
    const applyModelVersion = () => {
        let activedEle = modelSetEle.querySelector(".activeModel");
        if (activedEle) activedEle.classList.remove("activeModel");
        
        // 尝试查找预设模型
        activedEle = modelSetEle.querySelector(`[data-value="${modelVersion}"]`);
        
        if (activedEle) { // 如果找到了预设的模型元素
        activedEle.classList.add("activeModel");
            modelVer.textContent = activedEle.dataset.ver; // 使用预设的 data-ver
        modelType = parseInt(activedEle.dataset.type);
        modelIcon.children[0].setAttributeNS("http://www.w3.org/1999/xlink", "href", (modelType == 1 ? "#aiIcon" : modelType == 2 ? "#deepseekIcon" : modelType == 3 ? "#azureAIIcon" : modelType == 4 ? "#geminiIcon" : "#claudeIcon"));
            console.log("已激活预设模型:", modelVersion, "显示为:", activedEle.dataset.ver);
        } else { 
            // 如果没找到预设模型，处理自定义模型的情况
            console.warn("未找到预设模型，尝试处理自定义模型:", modelVersion);
            modelVer.textContent = modelVersion; // **直接设置 modelVer 为完整的自定义模型名称**
            
            // 尝试更新并激活对应的自定义DOM元素
            let customDOM;
            let inferredType = 1; // 默认为GPT
            let iconHref = "#aiIcon";

            // 根据模型名称前缀推断类型 (可以扩展)
            // 注意：这里的判断逻辑需要根据您实际支持的自定义模型命名规则调整
            if (modelVersion.startsWith("deepseek|")) {
                customDOM = document.getElementById('customDeepSeekDOM');
                inferredType = 2;
                iconHref = "#deepseekIcon";
            } else if (modelVersion.startsWith("azure")) { // 假设Azure自定义模型以"azure"开头
                customDOM = document.getElementById('customAzureAIDOM');
                inferredType = 3;
                iconHref = "#azureAIIcon";
            } else if (modelVersion.startsWith("gemini")) {
                customDOM = document.getElementById('customGeminiDOM');
                inferredType = 4;
                iconHref = "#geminiIcon";
            } else if (modelVersion.startsWith("claude")) {
                customDOM = document.getElementById('customClaudeDOM');
                inferredType = 5;
                iconHref = "#claudeIcon";
            } else { // 默认为GPT或未知类型，尝试激活GPT自定义区域
                customDOM = document.getElementById('customGPTDOM');
                inferredType = 1;
                iconHref = "#aiIcon";
            }

            modelType = inferredType;
            modelIcon.children[0].setAttributeNS("http://www.w3.org/1999/xlink", "href", iconHref);

            if (customDOM) {
                customDOM.classList.remove('hide');
                customDOM.classList.add('activeModel');
                customDOM.dataset.value = modelVersion;
                customDOM.dataset.ver = modelVersion; // 确保 data-ver 也是完整的
                if (customDOM.lastElementChild) {
                    customDOM.lastElementChild.textContent = modelVersion;
                }
                console.log(`已激活自定义模型 (${inferredType}) DOM:`, modelVersion);
                
                // 同时更新对应设置区域的输入框的值
                let inputId = '';
                if(inferredType === 1) inputId = 'modelInput';
                else if(inferredType === 2) inputId = 'deepseekModelInput';
                else if(inferredType === 3) inputId = 'azureAIModelInput';
                else if(inferredType === 4) inputId = 'geminiModelInput';
                else if(inferredType === 5) inputId = 'claudeModelInput';
                
                const relevantInput = document.getElementById(inputId);
                if(relevantInput) {
                    relevantInput.value = modelVersion;
                    console.log(`已更新输入框 ${inputId} 的值为:`, modelVersion);
                }

            } else {
                console.error("无法找到对应的自定义模型DOM元素来激活");
                // 可以考虑添加一个通用的自定义模型显示区域，或者显示错误
            }
        }
    };
    applyModelVersion();
    modelSetEle.onclick = (ev) => {
        if (ev.target.classList.contains("modelSingle")) {
            modelVersion = ev.target.dataset.value;
            localStorage.setItem("modelVersion", modelVersion);
            applyModelVersion();
            modelSetEle.style.display = "none";
            selectorEle.classList.remove("showModels");
        }
    }

    const updateAvatar = () => {
        setAvatarPre.src = userAvatar;
        chatlog.querySelectorAll(".request>.chatAvatar").forEach(ele => {
            ele.children[0].src = userAvatar;
        })
    }
    let localAvatar = localStorage.getItem("userAvatar");
    userAvatar = setAvatarPre.src = setAvatar.value = localAvatar || setAvatar.getAttribute("value") || "assets/images/avatar.jpg";
    setAvatar.onchange = () => {
        userAvatar = setAvatar.value;
        localStorage.setItem("userAvatar", userAvatar);
        updateAvatar();
    }
    setAvatar.dispatchEvent(new Event("change"));
    let localSystem = localStorage.getItem("system");
    systemEle.onchange = () => {
        systemRole = systemEle.value;
        localStorage.setItem("system", systemRole);
        if (systemRole) {
            if (data[0] && data[0].role === "system") {
                data[0].content = systemRole;
            } else {
                data.unshift({ role: "system", content: systemRole });
                processIdx(1);
            }
        } else if (data[0] && data[0].role === "system") {
            data.shift();
            processIdx(-1);
        }
        updateChats();
    }
    if (systemRole === void 0) {
        systemRole = systemEle.value = localSystem || presetRoleData.default || "";
        if (systemRole) {
            data.unshift({ role: "system", content: systemRole });
            processIdx(1);
            updateChats();
        }
    }
    preEle.onchange = () => {
        let val = preEle.value;
        if (val && presetRoleData[val]) {
            systemEle.value = presetRoleData[val];
        } else {
            systemEle.value = "";
        }
        systemEle.dispatchEvent(new Event("change"));
        systemEle.focus();
    }
    const topEle = document.getElementById("top_p");
    let localTop = localStorage.getItem("top_p");
    topEle.value = roleNature = parseFloat(localTop || topEle.getAttribute("value"));
    topEle.oninput = () => {
        topEle.style.backgroundSize = (topEle.value - topEle.min) * 100 / (topEle.max - topEle.min) + "% 100%";
        roleNature = parseFloat(topEle.value);
        localStorage.setItem("top_p", topEle.value);
    }
    topEle.dispatchEvent(new Event("input"));
    const tempEle = document.getElementById("temp");
    let localTemp = localStorage.getItem("temp");
    tempEle.value = roleTemp = parseFloat(localTemp || tempEle.getAttribute("value"));
    tempEle.oninput = () => {
        tempEle.style.backgroundSize = (tempEle.value - tempEle.min) * 100 / (tempEle.max - tempEle.min) + "% 100%";
        roleTemp = parseFloat(tempEle.value);
        localStorage.setItem("temp", tempEle.value);
    }
    tempEle.dispatchEvent(new Event("input"));
    const convWEle = document.getElementById("convWidth");
    const styleSheet = document.styleSheets[0];
    convWEle.oninput = () => {
        let type = isFull ? 1 : 0;
        convWEle.style.backgroundSize = (convWEle.value - convWEle.min) * 100 / (convWEle.max - convWEle.min) + "% 100%";
        convWidth[type] = parseInt(convWEle.value);
        localStorage.setItem("convWidth" + type, convWEle.value);
        styleSheet.deleteRule(0);
        styleSheet.deleteRule(0);
        styleSheet.insertRule(`.bottom_wrapper{max-width:${convWidth[type]}%;}`, 0);
        styleSheet.insertRule(`.requestBody,.response .responseBody{max-width:calc(${convWidth[type]}% - 84px);}`, 0);
    }
    const setConvValue = () => {
        let type = isFull ? 1 : 0;
        let localConv = localStorage.getItem("convWidth" + type);
        convWEle.value = parseInt(localConv || (type ? "60" : "100"));
        convWEle.dispatchEvent(new Event("input"));
    }
    const fullFunc = () => {
        isFull = windowEle.classList.contains("full_window");
        localStorage.setItem("fullWindow", isFull);
        setConvValue();
        toggleFull.title = isFull ? translations[locale]["winedWin"] : translations[locale]["fullWin"];
        toggleFull.children[0].children[0].setAttributeNS("http://www.w3.org/1999/xlink", "href", isFull ? "#collapseFullIcon" : "#expandFullIcon");
    }
    toggleFull.onclick = () => {
        windowEle.classList.toggle("full_window");
        fullFunc();
    }
    let localFull = localStorage.getItem("fullWindow");
    if (localFull && localFull === "true") {
        if (!windowEle.classList.contains("full_window")) {
            windowEle.classList.add("full_window");
            fullFunc();
        }
    } else if (windowEle.classList.contains("full_window")) {
        windowEle.classList.remove("full_window");
        fullFunc();
    } else {
        setConvValue();
    }
    const speedEle = document.getElementById("textSpeed");
    let localSpeed = localStorage.getItem("textSpeed");
    speedEle.value = localSpeed || speedEle.getAttribute("value");
    textSpeed = parseFloat(speedEle.min) + (speedEle.max - speedEle.value);
    speedEle.oninput = () => {
        speedEle.style.backgroundSize = (speedEle.value - speedEle.min) * 100 / (speedEle.max - speedEle.min) + "% 100%";
        textSpeed = parseFloat(speedEle.min) + (speedEle.max - speedEle.value);
        localStorage.setItem("textSpeed", speedEle.value);
    }
    speedEle.dispatchEvent(new Event("input"));
    if (localStorage.getItem("enableCont") != null) { // fallback old cont
        if (localStorage.getItem("enableCont") === "false") localStorage.setItem("contLength", 0);
        localStorage.removeItem("enableCont");
    }
    const contLenEle = document.getElementById("contLength");
    let localContLen = localStorage.getItem("contLength");
    contLenEle.value = contLen = parseInt(localContLen || contLenEle.getAttribute("value"));
    contLenEle.oninput = () => {
        contLenEle.style.backgroundSize = (contLenEle.value - contLenEle.min) * 100 / (contLenEle.max - contLenEle.min) + "% 100%";
        contLen = parseInt(contLenEle.value);
        contLenWrap.textContent = contLen;
        localStorage.setItem("contLength", contLenEle.value);
    }
    contLenEle.dispatchEvent(new Event("input"));
    const cotEle = document.getElementById("enableCOT");
    let localCOT = localStorage.getItem("enableCOT");
    cotEle.checked = enableCOT = (localCOT || cotEle.getAttribute("checked")) === "true";
    cotEle.onchange = () => {
        enableCOT = cotEle.checked;
        localStorage.setItem("enableCOT", enableCOT);
    }
    cotEle.dispatchEvent(new Event("change"));
    const longEle = document.getElementById("enableLongReply");
    let localLong = localStorage.getItem("enableLongReply");
    longEle.checked = enableLongReply = (localLong || longEle.getAttribute("checked")) === "true";
    longEle.onchange = () => {
        enableLongReply = longEle.checked;
        localStorage.setItem("enableLongReply", enableLongReply);
    }
    longEle.dispatchEvent(new Event("change"));
    let localPin = localStorage.getItem("pinNav");
    if (window.innerWidth > 800 && !(localPin && localPin === "false")) {
        document.body.classList.add("show-nav");
    };
    const setDarkTheme = (is) => {
        let cssEle = document.body.getElementsByTagName("link")[0];
        cssEle.href = cssEle.href.replace(is ? "light" : "dark", is ? "dark" : "light");
        let hlCssEle = document.body.getElementsByTagName("link")[1];
        hlCssEle.href = hlCssEle.href.replace(is ? "github" : "github-dark", is ? "github-dark" : "github");
        justDarkTheme(is);
    }
    const handleAutoMode = (ele) => {
        if (ele.checked) {
            autoThemeMode = parseInt(ele.value);
            localStorage.setItem("autoThemeMode", autoThemeMode);
            initAutoTime();
            if (autoThemeMode) {
                if (customDarkOut !== void 0) {
                    clearTimeout(customDarkOut);
                    customDarkOut = void 0;
                }
                setDarkTheme(darkMedia.matches);
            } else {
                checkCustomTheme();
            }
        }
    }
    autoTheme0.onchange = autoTheme1.onchange = function () { handleAutoMode(this) };
    const handleAutoTime = (ele, idx) => {
        let otherIdx = 1 - idx;
        if (ele.value !== customDarkTime[otherIdx]) {
            customDarkTime[idx] = ele.value;
            localStorage.setItem("customDarkTime", JSON.stringify(customDarkTime));
            checkCustomTheme();
        } else {
            ele.value = customDarkTime[idx];
            notyf.error(translations[locale]["customDarkTip"]);
        }
    }
    customStart.onchange = function () { handleAutoTime(this, 0) };
    customEnd.onchange = function () { handleAutoTime(this, 1) };
    const initAutoTime = () => {
        customAutoSet.style.display = autoThemeMode === 0 ? "block" : "none";
        if (autoThemeMode === 0) {
            customStart.value = customDarkTime[0];
            customEnd.value = customDarkTime[1];
        }
    }
    const initAutoThemeEle = () => {
        autoThemeEle.querySelector("#autoTheme" + autoThemeMode).checked = true;
        initAutoTime();
    }
    const checkCustomTheme = () => {
        if (customDarkOut !== void 0) clearTimeout(customDarkOut);
        let date = new Date();
        let nowTime = date.getTime();
        let start = customDarkTime[0].split(":");
        let startTime = new Date().setHours(start[0], start[1], 0, 0);
        let end = customDarkTime[1].split(":");
        let endTime = new Date().setHours(end[0], end[1], 0, 0);
        let order = endTime > startTime;
        let isDark = order ? (nowTime > startTime && endTime > nowTime) : !(nowTime > endTime && startTime > nowTime);
        let nextChange = isDark ? endTime - nowTime : startTime - nowTime;
        if (nextChange < 0) nextChange += dayMs;
        setDarkTheme(isDark);
        customDarkOut = setTimeout(() => {
            checkCustomTheme();
        }, nextChange);
    }
    const setDarkMode = () => {
        if (customDarkOut !== void 0) {
            clearTimeout(customDarkOut);
            customDarkOut = void 0;
        }
        autoThemeEle.style.display = "none";
        let themeClass, title;
        if (themeMode === 2) {
            autoThemeEle.style.display = "block";
            if (autoThemeMode) {
                setDarkTheme(darkMedia.matches);
            } else {
                checkCustomTheme();
                initAutoThemeEle();
            }
            themeClass = "autoTheme";
            title = translations[locale]["autoWord"];
        } else if (themeMode === 1) {
            setDarkTheme(false);
            themeClass = "lightTheme";
            title = translations[locale]["lightTheme"];
        } else {
            setDarkTheme(true);
            themeClass = "darkTheme";
            title = translations[locale]["darkTheme"];
        }
        localStorage.setItem("themeMode", themeMode);
        setLightEle.className = "setDetail themeDetail " + themeClass;
        lightEle.children[0].children[0].setAttributeNS("http://www.w3.org/1999/xlink", "href", "#" + themeClass + "Icon");
        lightEle.title = title;
    }
    lightEle.onclick = () => {
        themeMode = themeMode - 1;
        if (themeMode === -1) themeMode = 2;
        setDarkMode();
    }
    setLightEle.onclick = (ev) => {
        let idx = Array.prototype.indexOf.call(setLightEle.children, ev.target);
        if (themeMode !== idx) {
            themeMode = idx;
            setDarkMode();
        }
    }
    let localTheme = localStorage.getItem("themeMode");
    themeMode = parseInt(localTheme || "1");
    let localAutoTheme = localStorage.getItem("autoThemeMode");
    autoThemeMode = parseInt(localAutoTheme || "1");
    let localCustomDark = localStorage.getItem("customDarkTime");
    customDarkTime = JSON.parse(localCustomDark || '["21:00", "07:00"]');
    setDarkMode();
    darkMedia.onchange = e => {
        if (themeMode === 2 && autoThemeMode) setDarkTheme(e.matches);
    };
    const caseSearchEle = document.getElementById("matchCaseSearch");
    let localSearchFlag = localStorage.getItem("searchFlag") || "0";
    isCaseSearch = Boolean(localSearchFlag & 1);
    caseSearchEle.classList.toggle("seledSearch", isCaseSearch);
    caseSearchEle.onclick = () => {
        isCaseSearch = caseSearchEle.classList.toggle("seledSearch");
        localStorage.setItem("searchFlag", ~~isCaseSearch);
        if (searchChatEle.value.length) toSearchChats();
    }
};
initSetting();
document.getElementById("loadMask").style.display = "none";
const closeEvent = (ev) => {
    if (settingEle.contains(ev.target)) return;
    if (!dialogEle.contains(ev.target)) {
        dialogEle.style.display = "none";
        document.removeEventListener("mousedown", closeEvent, true);
        settingEle.classList.remove("showSetting");
        stopTestVoice();
    }
}
settingEle.onmousedown = () => {
    dialogEle.style.display = dialogEle.style.display === "block" ? "none" : "block";
    if (dialogEle.style.display === "block") {
        document.addEventListener("mousedown", closeEvent, true);
        settingEle.classList.add("showSetting");
    } else {
        document.removeEventListener("mousedown", closeEvent, true);
        settingEle.classList.remove("showSetting");
    }
}
const modelCloseEvent = (ev) => {
    if (selectorEle.contains(ev.target)) return;
    if (!modelSetEle.contains(ev.target)) {
        document.removeEventListener("mousedown", modelCloseEvent, true);
        modelSetEle.style.display = "none";
        selectorEle.classList.remove("showModels");
    }
}
selectorEle.onmousedown = () => {
    modelSetEle.style.display = modelSetEle.style.display === "block" ? "none" : "block";
    if (modelSetEle.style.display === "block") {
        document.addEventListener("mousedown", modelCloseEvent, true);
        selectorEle.classList.add("showModels");
    } else {
        document.removeEventListener("mousedown", modelCloseEvent, true);
        selectorEle.classList.remove("showModels");
    }
}
let delayId;
const delay = () => {
    return new Promise((resolve) => delayId = setTimeout(resolve, textSpeed)); //打字机时间间隔
}
const getTime = () => {
    return existVoice === 3 ? new Date().toISOString() : new Date().toString();
}
const getWSPre = (date, requestId) => {
    let osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
    osPlatform += "/" + navigator.platform;
    let osName = navigator.userAgent;
    let osVersion = navigator.appVersion;
    return `Path: speech.config\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${date}\r\nContent-Type: application/json\r\n\r\n{"context":{"system":{"name":"SpeechSDK","version":"1.35.0","build":"JavaScript","lang":"JavaScript"},"os":{"platform":"${osPlatform}","name":"${osName}","version":"${osVersion}"}}}`
}
const getWSAudio = (date, requestId) => {
    return existVoice === 3 ? `Path: synthesis.context\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${date}\r\nContent-Type: application/json\r\n\r\n{"synthesis":{"audio":{"metadataOptions":{"bookmarkEnabled":false,"punctuationBoundaryEnabled":"false","sentenceBoundaryEnabled":"false","sessionEndEnabled":true,"visemeEnabled":false,"wordBoundaryEnabled":"false"},"outputFormat":"${voiceFormat}"},"language":{"autoDetection":false}}}`
        : `X-Timestamp:${date}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"${voiceFormat}"}}}}`
}
const getWSText = (date, requestId, lang, voice, volume, rate, pitch, style, role, msg) => {
    let fmtVolume = (volume >= 1 ? "+" : "") + (volume * 100 - 100) + "%";
    let fmtRate = (rate >= 1 ? "+" : "") + (rate * 100 - 100) + "%";
    let fmtPitch = (pitch >= 1 ? "+" : "") + (pitch - 1) + "Hz";
    if (existVoice === 3) {
        let fmtStyle = style ? ` style="${style}"` : ` style="Default"`;
        let fmtRole = role ? ` role="${role}"` : "";
        let fmtExpress = fmtStyle + fmtRole;
        return `Path: ssml\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${date}\r\nContent-Type: application/ssml+xml\r\n\r\n<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" xml:lang="${lang}"><voice name="${voice}"><lang xml:lang="${lang}"><s /><mstts:express-as${fmtExpress}><prosody pitch="${fmtPitch}" rate="${fmtRate}" volume="${fmtVolume}">${msg}</prosody></mstts:express-as><s /></lang></voice></speak>`;
    } else {
        return `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${date}Z\r\nPath:ssml\r\n\r\n<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${voice}"><prosody pitch="${fmtPitch}" rate="${fmtRate}" volume="${fmtVolume}">${msg}</prosody></voice></speak>`;
    }
}
const getAzureWSURL = () => {
    return `wss://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key=${azureKey}`
}
let edgeTTSURLTmp = "";
const WIN_EPOCH = 11644473600;
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const getEdgeTTSURL = () => {
    if (edgeTTSURLTmp) return edgeTTSURLTmp;
    let currentUnix = Math.floor(Date.now() / 1e3);
    let ticks = currentUnix + WIN_EPOCH;
    let timeOut = ticks % 300;
    setTimeout(() => { edgeTTSURLTmp = "" }, (300 - timeOut) * 1e3);
    ticks = ticks - timeOut + "0000000";
    let secMsGec = createSHA256().update(ticks + TRUSTED_CLIENT_TOKEN).digest("hex").toUpperCase();
    edgeTTSURLTmp = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-133.0.3065.51`;
    return edgeTTSURLTmp;
}
const resetSpeakIcon = () => {
    if (currentVoiceIdx !== void 0) {
        chatlog.children[systemRole ? currentVoiceIdx - 1 : currentVoiceIdx].classList.remove("showVoiceCls");
        chatlog.children[systemRole ? currentVoiceIdx - 1 : currentVoiceIdx].lastChild.lastChild.className = "voiceCls readyVoice";
    }
}
const endSpeak = () => {
    resetSpeakIcon();
    currentVoiceIdx = void 0;
    if (voiceIns && voiceIns instanceof Audio) {
        voiceIns.pause();
        voiceIns.currentTime = 0;
        URL.revokeObjectURL(voiceIns.src);
        voiceIns.removeAttribute("src");
        voiceIns.onended = voiceIns.onerror = null;
        sourceBuffer = void 0;
        speechPushing = false;
        if (voiceSocket && voiceSocket["pending"]) {
            voiceSocket.close()
        }
        if (autoVoiceSocket && autoVoiceSocket["pending"]) {
            autoVoiceSocket.close()
        }
        speechQuene.length = 0;
        autoPlayingIdx = 0;
        autoMediaSource = void 0;
        voiceContentQuene = [];
        voiceEndFlagQuene = [];
        voiceBlobURLQuene = [];
        autoOnlineVoiceFlag = false;
    } else if (supportSpe) {
        speechSynthesis.cancel();
    }
}
const speakEvent = (ins, force = true, end = false) => {
    return new Promise((res, rej) => {
        ins.onerror = () => {
            if (end) {
                endSpeak();
            } else if (force) {
                resetSpeakIcon();
            }
            res();
        }
        if (ins instanceof Audio) {
            ins.onended = ins.onerror;
            ins.play();
        } else {
            ins.onend = ins.onerror;
            speechSynthesis.speak(voiceIns);
        }
    })
};
let voiceData = {};
let voiceSocket;
let speechPushing = false;
let speechQuene = [];
let sourceBuffer;
speechQuene.push = function (buffer) {
    if (!speechPushing && (sourceBuffer && !sourceBuffer.updating)) {
        speechPushing = true;
        sourceBuffer.appendBuffer(buffer);
    } else {
        Array.prototype.push.call(this, buffer)
    }
}
const initSocket = () => {
    return new Promise((res, rej) => {
        let url = existVoice === 3 ? getAzureWSURL() : getEdgeTTSURL();
        if (!voiceSocket || voiceSocket.readyState > 1 || voiceSocket.url !== url) {
            if (voiceSocket && voiceSocket.readyState === 1) voiceSocket.close(1000);
            voiceSocket = new WebSocket(url);
            voiceSocket.binaryType = "arraybuffer";
            voiceSocket.onopen = () => {
                res();
            };
            voiceSocket.onerror = () => {
                rej();
            }
        } else {
            return res();
        }
    })
}
const initStreamVoice = (mediaSource) => {
    return new Promise((r, j) => {
        Promise.all([initSocket(), new Promise(res => {
            mediaSource.onsourceopen = () => {
                res();
            };
        })]).then(() => {
            r();
        })
    })
}
let downQuene = {};
let downSocket;
const downBlob = (blob, name) => {
    let a = document.createElement("a");
    a.download = name;
    let url = URL.createObjectURL(blob);
    a.href = url;
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url)
    }, 1000);
    a = null;
}
const initDownSocket = () => {
    return new Promise((res, rej) => {
        let url = existVoice === 3 ? getAzureWSURL() : getEdgeTTSURL();
        if (!downSocket || downSocket.readyState > 1 || downSocket.url !== url) {
            if (downSocket && downSocket.readyState === 1) downSocket.close(1000);
            downSocket = new WebSocket(url);
            downSocket.binaryType = "arraybuffer";
            downSocket.onopen = () => {
                res();
            };
            downSocket.onmessage = (e) => {
                if (e.data instanceof ArrayBuffer) {
                    let text = new TextDecoder().decode(e.data.slice(0, voicePreLen));
                    let reqIdx = text.indexOf(":");
                    let uuid = text.slice(reqIdx + 1, reqIdx + 33);
                    downQuene[uuid]["blob"].push(e.data.slice(voicePreLen));
                } else if (e.data.indexOf("Path:turn.end") !== -1) {
                    let reqIdx = e.data.indexOf(":");
                    let uuid = e.data.slice(reqIdx + 1, reqIdx + 33);
                    let blob = new Blob(downQuene[uuid]["blob"], { type: voiceMIME });
                    let key = downQuene[uuid]["key"];
                    let name = downQuene[uuid]["name"];
                    if (blob.size === 0) {
                        notyf.open({
                            type: "warning",
                            message: translations[locale]["cantSpeechTip"]
                        });
                        return;
                    }
                    voiceData[key] = blob;
                    if (downQuene[uuid]["isTest"]) {
                        testVoiceBlob = blob;
                        playTestAudio();
                    } else {
                        downBlob(blob, name.slice(0, 16) + voiceSuffix);
                    }
                }
            }
            downSocket.onerror = () => {
                rej();
            }
        } else {
            return res();
        }
    })
}
const getOpenAIVoice = async (input, voice, speed) => {
    let url = apiHost + ((apiHost.length && !apiHost.endsWith("/")) ? "/" : "") + "v1/audio/speech";
    let headers = { "Content-Type": "application/json" };
    if (customAPIKey) headers["Authorization"] = "Bearer " + customAPIKey;
    let body = JSON.stringify({
        model: "tts-1",
        input,
        voice,
        response_format: "aac",
        speed
    });
    let controller = new AbortController();
    let controllerId = setTimeout(() => {
        notyf.error(translations[locale]["timeoutTip"]);
        controller.abort();
    }, 20000);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers,
            body,
            signal: controller.signal
        });
        clearTimeout(controllerId);
        if (res.status === 200) {
            return await res.blob()
        } else {
            notyf.open({ type: "warning", message: translations[locale]["cantSpeechTip"] })
        }
    } catch (e) { }
}
let testVoiceBlob;
let testVoiceIns;
const playTestAudio = () => {
    if (existVoice >= 2) {
        if (!testVoiceIns || testVoiceIns instanceof Audio === false) {
            testVoiceIns = new Audio();
            testVoiceIns.onended = testVoiceIns.onerror = () => {
                stopTestVoice();
            }
        }
        testVoiceIns.src = URL.createObjectURL(testVoiceBlob);
        testVoiceIns.play();
    } else if (supportSpe) {
        speechSynthesis.speak(testVoiceIns);
    }
}
const pauseTestVoice = () => {
    if (testVoiceIns) {
        if (testVoiceIns && testVoiceIns instanceof Audio) {
            testVoiceIns.pause();
        } else if (supportSpe) {
            speechSynthesis.pause();
        }
    }
    testVoiceBtn.className = "justSetLine resumeTestVoice";
}
const resumeTestVoice = () => {
    if (testVoiceIns) {
        if (testVoiceIns && testVoiceIns instanceof Audio) {
            testVoiceIns.play();
        } else if (supportSpe) {
            speechSynthesis.resume();
        }
    }
    testVoiceBtn.className = "justSetLine pauseTestVoice";
}
const stopTestVoice = () => {
    if (testVoiceIns) {
        if (testVoiceIns instanceof Audio) {
            testVoiceIns.pause();
            testVoiceIns.currentTime = 0;
            URL.revokeObjectURL(testVoiceIns.src);
            testVoiceIns.removeAttribute("src");
        } else if (supportSpe) {
            speechSynthesis.cancel();
        }
    }
    testVoiceBtn.className = "justSetLine readyTestVoice";
}
const startTestVoice = async () => {
    testVoiceBtn.className = "justSetLine pauseTestVoice";
    let volume = voiceVolume[voiceType];
    let rate = voiceRate[voiceType];
    let pitch = voicePitch[voiceType];
    let content = voiceTestText;
    if (existVoice === 4) {
        let voice = voiceRole[voiceType].name;
        let key = content + voice + rate;
        let blob = voiceData[key];
        if (blob) {
            testVoiceBlob = blob;
            playTestAudio();
        } else {
            testVoiceBlob = await getOpenAIVoice(content, voice, rate);
            if (testVoiceBlob) {
                voiceData[key] = testVoiceBlob;
                playTestAudio();
            }
        }
    } else if (existVoice >= 2) {
        let voice = existVoice === 3 ? voiceRole[voiceType].ShortName : voiceRole[voiceType].Name;
        let style = azureStyle[voiceType];
        let role = azureRole[voiceType];
        let key = content + voice + volume + rate + pitch + (style ? style : "") + (role ? role : "");
        let blob = voiceData[key];
        if (blob) {
            testVoiceBlob = blob;
            playTestAudio();
        } else {
            await initDownSocket();
            let currDate = getTime();
            let lang = voiceRole[voiceType].lang;
            let uuid = uuidv4(existVoice === 3);
            if (existVoice === 3) {
                downSocket.send(getWSPre(currDate, uuid));
            }
            downSocket.send(getWSAudio(currDate, uuid));
            downSocket.send(getWSText(currDate, uuid, lang, voice, volume, rate, pitch, style, role, content));
            downSocket["pending"] = true;
            downQuene[uuid] = {};
            downQuene[uuid]["name"] = content;
            downQuene[uuid]["key"] = key;
            downQuene[uuid]["isTest"] = true;
            downQuene[uuid]["blob"] = [];
        }
    } else {
        testVoiceIns = new SpeechSynthesisUtterance();
        testVoiceIns.onend = testVoiceIns.onerror = () => {
            stopTestVoice();
        }
        testVoiceIns.voice = voiceRole[voiceType];
        testVoiceIns.volume = volume;
        testVoiceIns.rate = rate;
        testVoiceIns.pitch = pitch;
        testVoiceIns.text = content;
        playTestAudio();
    }
}
const downloadAudio = async (idx) => {
    if (existVoice < 2) {
        return;
    }
    let type = data[idx].role === "user" ? 0 : 1;
    let content = data[idx].reasoning_content ? chatlog.children[systemRole ? idx - 1 : idx].children[1].lastChild.textContent.trim() : chatlog.children[systemRole ? idx - 1 : idx].children[1].textContent.trim();
    let rate = voiceRate[type];
    if (existVoice === 4) {
        let voice = voiceRole[type].name;
        let key = content + voice + rate;
        let blob = voiceData[key];
        if (blob) {
            downBlob(blob, content.slice(0, 16) + openAIVoiceSuffix);
        } else {
            let resBlob = await getOpenAIVoice(content, voice, rate);
            if (resBlob) {
                voiceData[key] = resBlob;
                downBlob(voiceData[key], content.slice(0, 16) + openAIVoiceSuffix);
            }
        }
    } else {
        let voice = existVoice === 3 ? voiceRole[type].ShortName : voiceRole[type].Name;
        let volume = voiceVolume[type];
        let pitch = voicePitch[type];
        let style = azureStyle[type];
        let role = azureRole[type];
        let key = content + voice + volume + rate + pitch + (style ? style : "") + (role ? role : "");
        let blob = voiceData[key];
        if (blob) {
            downBlob(blob, content.slice(0, 16) + voiceSuffix);
        } else {
            await initDownSocket();
            let currDate = getTime();
            let lang = voiceRole[type].lang;
            let uuid = uuidv4(existVoice === 3);
            if (existVoice === 3) {
                downSocket.send(getWSPre(currDate, uuid));
            }
            downSocket.send(getWSAudio(currDate, uuid));
            downSocket.send(getWSText(currDate, uuid, lang, voice, volume, rate, pitch, style, role, content));
            downSocket["pending"] = true;
            downQuene[uuid] = {};
            downQuene[uuid]["name"] = content;
            downQuene[uuid]["key"] = key;
            downQuene[uuid]["blob"] = [];
        }
    }
}
const NoMSEPending = (key) => {
    return new Promise((res, rej) => {
        let bufArray = [];
        voiceSocket.onmessage = (e) => {
            if (e.data instanceof ArrayBuffer) {
                bufArray.push(e.data.slice(voicePreLen));
            } else if (e.data.indexOf("Path:turn.end") !== -1) {
                voiceSocket["pending"] = false;
                if (!(bufArray.length === 1 && bufArray[0].byteLength === 0)) {
                    voiceData[key] = new Blob(bufArray, { type: voiceMIME });
                    res(voiceData[key]);
                } else {
                    res(new Blob());
                }
            }
        }
    })
}
const pauseEv = () => {
    if (voiceIns.src) {
        let ele = chatlog.children[systemRole ? currentVoiceIdx - 1 : currentVoiceIdx].lastChild.lastChild;
        ele.classList.remove("readyVoice");
        ele.classList.remove("pauseVoice");
        ele.classList.add("resumeVoice");
    }
}
const resumeEv = () => {
    if (voiceIns.src) {
        let ele = chatlog.children[systemRole ? currentVoiceIdx - 1 : currentVoiceIdx].lastChild.lastChild;
        ele.classList.remove("readyVoice");
        ele.classList.remove("resumeVoice");
        ele.classList.add("pauseVoice");
    }
}
const speechEvent = async (idx) => {
    if (!data[idx]) return;
    endSpeak();
    currentVoiceIdx = idx;
    if (!data[idx].content && enableContVoice) {
        if (currentVoiceIdx !== data.length - 1) { return speechEvent(currentVoiceIdx + 1) }
        else { return endSpeak() }
    };
    let type = data[idx].role === "user" ? 0 : 1;
    let dom = chatlog.children[systemRole ? idx - 1 : idx];
    dom.classList.add("showVoiceCls");
    let voiceIconEle = dom.lastChild.lastChild;
    voiceIconEle.className = "voiceCls pauseVoice";
    let content = data[idx].reasoning_content ? dom.children[1].lastChild.textContent.trim() : dom.children[1].textContent.trim();
    let volume = voiceVolume[type];
    let rate = voiceRate[type];
    let pitch = voicePitch[type];
    let style = azureStyle[type];
    let role = azureRole[type];
    if (existVoice >= 2) {
        if (!voiceIns || voiceIns instanceof Audio === false) {
            voiceIns = new Audio();
            voiceIns.onpause = pauseEv;
            voiceIns.onplay = resumeEv;
        }
        if (existVoice === 4) {
            let voice = voiceRole[type].name;
            let key = content + voice + rate;
            let currData = voiceData[key];
            if (currData) {
                voiceIns.src = URL.createObjectURL(currData);
            } else {
                let blob = await getOpenAIVoice(content, voice, rate);
                if (blob) {
                    voiceData[key] = blob;
                    voiceIns.src = URL.createObjectURL(blob);
                } else return;
            }
        } else {
            let voice = existVoice === 3 ? voiceRole[type].ShortName : voiceRole[type].Name;
            let key = content + voice + volume + rate + pitch + (style ? style : "") + (role ? role : "");
            let currData = voiceData[key];
            if (currData) {
                voiceIns.src = URL.createObjectURL(currData);
            } else {
                let mediaSource;
                if (supportMSE) {
                    mediaSource = new MediaSource;
                    voiceIns.src = URL.createObjectURL(mediaSource);
                    await initStreamVoice(mediaSource);
                    if (!sourceBuffer) {
                        sourceBuffer = mediaSource.addSourceBuffer(voiceMIME);
                    }
                    sourceBuffer.onupdateend = function () {
                        speechPushing = false;
                        if (speechQuene.length) {
                            let buf = speechQuene.shift();
                            if (buf["end"]) {
                                if (!sourceBuffer.buffered.length) notyf.open({ type: "warning", message: translations[locale]["cantSpeechTip"] });
                                mediaSource.endOfStream();
                            } else {
                                speechPushing = true;
                                sourceBuffer.appendBuffer(buf);
                            }
                        }
                    };
                    let bufArray = [];
                    voiceSocket.onmessage = (e) => {
                        if (e.data instanceof ArrayBuffer) {
                            let buf = e.data.slice(voicePreLen);
                            bufArray.push(buf);
                            speechQuene.push(buf);
                        } else if (e.data.indexOf("Path:turn.end") !== -1) {
                            voiceSocket["pending"] = false;
                            if (!(bufArray.length === 1 && bufArray[0].byteLength === 0)) voiceData[key] = new Blob(bufArray, { type: voiceMIME });
                            if (!speechQuene.length && !speechPushing) {
                                mediaSource.endOfStream();
                            } else {
                                let buf = new ArrayBuffer();
                                buf["end"] = true;
                                speechQuene.push(buf);
                            }
                        }
                    }
                } else {
                    await initSocket();
                }
                let currDate = getTime();
                let lang = voiceRole[type].lang;
                let uuid = uuidv4(existVoice === 3);
                if (existVoice === 3) {
                    voiceSocket.send(getWSPre(currDate, uuid));
                }
                voiceSocket.send(getWSAudio(currDate, uuid));
                voiceSocket.send(getWSText(currDate, uuid, lang, voice, volume, rate, pitch, style, role, content));
                voiceSocket["pending"] = true;
                if (!supportMSE) {
                    let blob = await NoMSEPending(key);
                    if (blob.size === 0) notyf.open({ type: "warning", message: translations[locale]["cantSpeechTip"] });
                    voiceIns.src = URL.createObjectURL(blob);
                }
            }
        }
    } else {
        voiceIns = new SpeechSynthesisUtterance();
        voiceIns.voice = voiceRole[type];
        voiceIns.volume = volume;
        voiceIns.rate = rate;
        voiceIns.pitch = pitch;
        voiceIns.text = content;
    }
    await speakEvent(voiceIns);
    if (enableContVoice) {
        if (currentVoiceIdx !== data.length - 1) { return speechEvent(currentVoiceIdx + 1) }
        else { endSpeak() }
    }
};
let autoVoiceSocket;
let autoMediaSource;
let voiceContentQuene = [];
let voiceEndFlagQuene = [];
let voiceBlobURLQuene = [];
let autoOnlineVoiceFlag = false;
const autoAddQuene = () => {
    if (voiceContentQuene.length) {
        let content = getUnescape(md.render(voiceContentQuene.shift()));
        let currDate = getTime();
        let uuid = uuidv4(existVoice === 3);
        let voice = voiceRole[1].Name;
        if (existVoice === 3) {
            autoVoiceSocket.send(getWSPre(currDate, uuid));
            voice = voiceRole[1].ShortName;
        }
        autoVoiceSocket.send(getWSAudio(currDate, uuid));
        autoVoiceSocket.send(getWSText(currDate, uuid, voiceRole[1].lang, voice, voiceVolume[1], voiceRate[1], voicePitch[1], azureStyle[1], azureRole[1], content));
        autoVoiceSocket["pending"] = true;
        autoOnlineVoiceFlag = true;
    }
}
let autoPlayingIdx = 0;
const autoDirectAddQuene = async (index) => {
    if (voiceContentQuene.length) {
        let content = getUnescape(md.render(voiceContentQuene[voiceContentQuene.length - 1]));
        let voice = voiceRole[1].name;
        let rate = voiceRate[1];
        let blob;
        if (content !== "" && (blob = await getOpenAIVoice(content, voice, rate))) {
            let blobURL = URL.createObjectURL(blob);
            if (!voiceIns.src && autoPlayingIdx === index) {
                voiceIns.src = blobURL;
                voiceIns.play();
            } else voiceBlobURLQuene[index] = blobURL;
        } else {
            if (!voiceIns.src && autoPlayingIdx === index) autoPlayNext();
            else voiceBlobURLQuene[index] = null;
        }
        if (voiceEndFlagQuene.shift()) {
            if (!voiceIns.src) endSpeak();
            else voiceBlobURLQuene.push("end");
        }
    }
}
const autoPlayNext = () => {
    autoPlayingIdx += 1;
    if (voiceBlobURLQuene.length) {
        let src = voiceBlobURLQuene[autoPlayingIdx];
        if (src === "end") {
            endSpeak();
        } else if (src === null) {
            autoPlayNext();
        } else if (src) {
            voiceIns.src = src;
            voiceIns.currentTime = 0;
            voiceIns.play();
        } else {
            voiceIns.currentTime = 0;
            voiceIns.removeAttribute("src");
        }
    } else {
        voiceIns.currentTime = 0;
        voiceIns.removeAttribute("src");
    }
}
const autoSpeechEvent = (content, ele, force = false, end = false) => {
    if (ele.lastChild.lastChild.classList.contains("readyVoice")) {
        ele.classList.add("showVoiceCls");
        ele.lastChild.lastChild.className = "voiceCls pauseVoice";
    }
    if (existVoice >= 2) {
        voiceContentQuene.push(content);
        voiceEndFlagQuene.push(end);
        if (!voiceIns || voiceIns instanceof Audio === false) {
            voiceIns = new Audio();
            voiceIns.onpause = pauseEv;
            voiceIns.onplay = resumeEv;
        }
        if (existVoice === 4) {
            autoDirectAddQuene(voiceContentQuene.length - 1);
            voiceIns.onended = voiceIns.onerror = () => { autoPlayNext() };
        } else {
            let url = existVoice === 3 ? getAzureWSURL() : getEdgeTTSURL();
            if (!autoVoiceSocket || autoVoiceSocket.readyState > 1 || autoVoiceSocket.url !== url) {
                if (autoVoiceSocket && autoVoiceSocket.readyState === 1) autoVoiceSocket.close(1000);
                autoVoiceSocket = new WebSocket(url);
                autoVoiceSocket.binaryType = "arraybuffer";
                autoVoiceSocket.onopen = () => {
                    autoAddQuene();
                };
                autoVoiceSocket.onerror = () => {
                    autoOnlineVoiceFlag = false;
                };
            };
            let bufArray = [];
            autoVoiceSocket.onmessage = (e) => {
                if (e.data instanceof ArrayBuffer) {
                    (supportMSE ? speechQuene : bufArray).push(e.data.slice(voicePreLen));
                } else {
                    if (e.data.indexOf("Path:turn.end") !== -1) {
                        autoVoiceSocket["pending"] = false;
                        autoOnlineVoiceFlag = false;
                        if (!supportMSE) {
                            let blob = new Blob(bufArray, { type: voiceMIME });
                            bufArray = [];
                            if (blob.size) {
                                let blobURL = URL.createObjectURL(blob);
                                if (!voiceIns.src) {
                                    voiceIns.src = blobURL;
                                    voiceIns.play();
                                } else {
                                    voiceBlobURLQuene.push(blobURL);
                                }
                            } else {
                                notyf.open({ type: "warning", message: translations[locale]["cantSpeechTip"] });
                            }
                            autoAddQuene();
                        }
                        if (voiceEndFlagQuene.shift()) {
                            if (supportMSE) {
                                if (!speechQuene.length && !speechPushing) {
                                    autoMediaSource.endOfStream();
                                } else {
                                    let buf = new ArrayBuffer();
                                    buf["end"] = true;
                                    speechQuene.push(buf);
                                }
                            } else {
                                if (!voiceBlobURLQuene.length && !voiceIns.src) {
                                    endSpeak();
                                } else {
                                    voiceBlobURLQuene.push("end");
                                }
                            }
                        };
                        if (supportMSE) {
                            autoAddQuene();
                        }
                    }
                }
            };
            if (!autoOnlineVoiceFlag && autoVoiceSocket.readyState) {
                autoAddQuene();
            }
            if (supportMSE) {
                if (!autoMediaSource) {
                    autoMediaSource = new MediaSource();
                    autoMediaSource.onsourceopen = () => {
                        if (!sourceBuffer) {
                            sourceBuffer = autoMediaSource.addSourceBuffer(voiceMIME);
                            sourceBuffer.onupdateend = () => {
                                speechPushing = false;
                                if (speechQuene.length) {
                                    let buf = speechQuene.shift();
                                    if (buf["end"]) {
                                        if (!sourceBuffer.buffered.length) notyf.open({ type: "warning", message: translations[locale]["cantSpeechTip"] });
                                        autoMediaSource.endOfStream();
                                    } else {
                                        speechPushing = true;
                                        sourceBuffer.appendBuffer(buf);
                                    }
                                }
                            };
                        }
                    }
                }
                if (!voiceIns.src) {
                    voiceIns.src = URL.createObjectURL(autoMediaSource);
                    voiceIns.play();
                    voiceIns.onended = voiceIns.onerror = () => {
                        endSpeak();
                    }
                }
            } else {
                voiceIns.onended = voiceIns.onerror = () => {
                    if (voiceBlobURLQuene.length) {
                        let src = voiceBlobURLQuene.shift();
                        if (src === "end") {
                            endSpeak();
                        } else {
                            voiceIns.src = src;
                            voiceIns.currentTime = 0;
                            voiceIns.play();
                        }
                    } else {
                        voiceIns.currentTime = 0;
                        voiceIns.removeAttribute("src");
                    }
                }
            }
        }
    } else {
        voiceIns = new SpeechSynthesisUtterance(content);
        voiceIns.volume = voiceVolume[1];
        voiceIns.rate = voiceRate[1];
        voiceIns.pitch = voicePitch[1];
        voiceIns.voice = voiceRole[1];
        speakEvent(voiceIns, force, end);
    }
};
const confirmAction = (prompt) => {
    if (window.confirm(prompt)) { return true }
    else { return false }
};
const findLastSpecialCharIndex = (text) => {
    const specialChars = new Set(['.', '?', '!', '~', '。', '？', '！', '\n']);
    for (let i = text.length - 1; i >= 0; i--) {
        if (specialChars.has(text[i])) {
            return i;
        }
    }
    return -1;
};
const toggleCot = (dom) => {
    dom.classList.toggle("down");
    dom.nextElementSibling.classList.toggle("hide");
};
const endCot = (dom) => {
    dom.classList.add("endCot");
    dom.setAttribute("data-i18n-key", "thinked");
    dom.textContent = translations[locale]["thinked"];
};
let currentModelName;
let autoVoiceIdx = 0;
let autoVoiceDataIdx;
let refreshIdx;
let currentResEle;
let cotData = "";
let loadingCOT = 0;
let unexpectedCutOff = "";
let progressData = "";
const streamGen = async (long) => {
    currentModelName = modelVersion;
    controller = new AbortController();
    controllerId = setTimeout(() => {
        notyf.error(translations[locale]["timeoutTip"]);
        stopLoading();
    }, 200000);
    let isRefresh = refreshIdx !== void 0;
    if (isRefresh) {
        currentResEle = chatlog.children[systemRole ? refreshIdx - 1 : refreshIdx];
        if (outOfMsgWindow(currentResEle)) messagesEle.scrollTo(0, currentResEle.offsetTop)
    } else if (!currentResEle) {
        currentResEle = createConvEle("response", true, modelVersion);
        currentResEle.children[1].innerHTML = "<p class='cursorCls'><br /></p>";
        currentResEle.dataset.loading = true;
        scrollToBottom();
    }
    let idx = isRefresh ? refreshIdx : data.length;
    if (existVoice && enableAutoVoice && !long) {
        if (isRefresh) {
            endSpeak();
            autoVoiceDataIdx = currentVoiceIdx = idx;
        } else if (currentVoiceIdx !== data.length) {
            endSpeak();
            autoVoiceDataIdx = currentVoiceIdx = idx;
        }
    };
    try {
        let dataSlice;
        if (long) {
            idx = isRefresh ? refreshIdx : data.length - 1;
            dataSlice = [data[idx - 1], data[idx]];
            if (systemRole) dataSlice.unshift(data[0]);
        } else {
            let startIdx = idx > contLen ? idx - contLen - 1 : 0;
            dataSlice = data.slice(startIdx, idx);
            if (systemRole && startIdx > 0) dataSlice.unshift(data[0]);
        }
        let headers = { "Content-Type": "application/json" };
        let url, body, model = currentModelName.split("|").pop();
        if (modelType === 1) {
            dataSlice = dataSlice.map(item => {
                if (item.role === "assistant") return { role: item.role, content: item.content };
                else return item;
            })
            
            // 检查用户是否已经输入API地址
            if (!apiHost || apiHost.trim() === '') {
                // 显示错误提示
                notyf.error(translations[locale]["badEndpointTip"] || "请设置有效的API端点");
                stopLoading();
                return;
            }
            
            // 修复本地地址处理
            const isLocalhost = apiHost.includes('127.0.0.1') || apiHost.includes('localhost');
            
            // 确保使用完整URL
            url = apiHost.endsWith('/') ? apiHost + API_URL : apiHost + '/' + API_URL;
            
            // 添加开发者调试信息
            console.log("[Debug] 请求URL:", url);
            
            if (customAPIKey) headers["Authorization"] = "Bearer " + customAPIKey;
            body = JSON.stringify({
                messages: dataSlice,
                model,
                stream: true,
                temperature: roleTemp,
                top_p: roleNature
            });
        } else if (modelType === 2) {
            dataSlice = dataSlice.map(item => {
                if (item.role === "assistant") return { role: item.role, content: item.content };
                else return item;
            })
            // 检查deepseekApiHost是否是本地地址
            const isLocalhost = deepseekApiHost.includes('127.0.0.1') || deepseekApiHost.includes('localhost');
            
            // 如果是本地地址，尝试使用相对路径
            if (isLocalhost) {
                url = DeepSeek_API_URL; // 直接使用相对路径
            } else {
                url = deepseekApiHost + ((deepseekApiHost.length && !deepseekApiHost.endsWith("/")) ? "/" : "") + DeepSeek_API_URL;
            }
            
            if (deepseekAPIKey) headers["Authorization"] = "Bearer " + deepseekAPIKey;
            body = JSON.stringify({
                messages: dataSlice,
                model,
                stream: true,
                temperature: roleTemp,
                top_p: roleNature
            });
        } else if (modelType === 3) {
            dataSlice = dataSlice.map(item => {
                if (item.role === "assistant") return { role: item.role, content: item.content };
                else return item;
            })
            url = azureAIApiHost;
            if (azureAIAPIKey) headers["Api-Key"] = azureAIAPIKey;
            body = JSON.stringify({
                messages: dataSlice,
                model,
                stream: true,
                temperature: roleTemp,
                top_p: roleNature
            });
        } else if (modelType === 4) {
            dataSlice = dataSlice.map(item => {
                return { role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content }] };
            })
            url = geminiApiHost + ((geminiApiHost.length && !geminiApiHost.endsWith("/")) ? "/" : "") + Gemini_API_URL + model + `:streamGenerateContent?alt=sse&key=${geminiAPIKey}`;
            body = JSON.stringify({
                contents: dataSlice,
                generationConfig: {
                    temperature: roleTemp,
                    topP: roleNature
                }
            });
        } else {
            let system;
            if (systemRole) {
                system = dataSlice.shift().content;
            }
            dataSlice = dataSlice.map(item => {
                if (item.role === "assistant") return { role: item.role, content: item.content };
                else return item;
            })
            url = claudeApiHost + ((claudeApiHost.length && !claudeApiHost.endsWith("/")) ? "/" : "") + Claude_API_URL;
            if (claudeAPIKey) headers["x-api-key"] = claudeAPIKey;
            headers["anthropic-version"] = "2023-06-01";
            body = JSON.stringify({
                model,
                messages: dataSlice,
                max_tokens: 4096,
                stream: true,
                temperature: roleTemp,
                top_p: roleNature,
                ...(system ? { system } : {})
            });
        }
        const res = await fetch(url, {
            method: "POST",
            headers,
            body,
            signal: controller.signal,
            mode: "cors",  // 添加CORS模式
            credentials: "same-origin"  // 修改为same-origin，避免某些服务器不支持include
        });
        clearTimeout(controllerId);
        controllerId = void 0;
        if (res.status !== 200) {
            if (res.status === 401) {
                notyf.error(translations[locale]["errorAiKeyTip"])
            } else if (res.status === 400 || res.status === 413) {
                notyf.error(translations[locale]["largeReqTip"]);
            } else if (res.status === 404) {
                notyf.error(translations[locale]["noModelPerTip"]);
            } else if (res.status === 429) {
                notyf.error(res.statusText ? translations[locale]["apiRateTip"] : translations[locale]["exceedLimitTip"]);
            } else {
                notyf.error(translations[locale]["badGateTip"]);
            }
            stopLoading();
            return;
        }
        let container = document.createElement("div");
        let cotBody;
        let mdBody = currentResEle.children[1];
        const decoder = new TextDecoder();
        const reader = res.body.getReader();
        let readChunk;
        if (modelType <= 3) {
            readChunk = async () => {
                return reader.read().then(async ({ value, done }) => {
                    if (!done) {
                        value = decoder.decode(value);
                        if (unexpectedCutOff) {
                            value += unexpectedCutOff;
                            unexpectedCutOff = "";
                        };
                        let chunks = value.match(/[^\n]+/g);
                        if (!chunks) return readChunk();
                        let payload;
                        for (let i = 0; i < chunks.length; i++) {
                            let chunk = chunks[i];
                            if (chunk) {
                                try {
                                    payload = JSON.parse(chunk.slice(5));
                                } catch (e) {
                                    if (chunk.startsWith("data:")) unexpectedCutOff = chunk;
                                    continue;
                                }
                                if (!payload.choices.length) continue;
                                if (payload.choices[0].finish_reason) {
                                    let lenStop = payload.choices[0].finish_reason === "length";
                                    longReplyFlag = enableLongReply && lenStop;
                                    let ele = currentResEle.lastChild.children[0].children[0];
                                    if (!enableLongReply && lenStop) { ele.className = "halfRefReq optionItem"; ele.title = translations[locale]["continue"] }
                                    else { ele.className = "refreshReq optionItem"; ele.title = translations[locale]["refresh"] };
                                    if (existVoice && enableAutoVoice && currentVoiceIdx === autoVoiceDataIdx) {
                                        let voiceText = longReplyFlag ? "" : progressData.slice(autoVoiceIdx), stop = !longReplyFlag;
                                        autoSpeechEvent(voiceText, currentResEle, false, stop);
                                    }
                                    break;
                                } else {
                                    if (enableCOT && payload.choices[0].delta.reasoning_content != null) {
                                        loadingCOT = 1;
                                        if (cotBody == void 0) {
                                            cotBody = document.createElement("div");
                                            cotBody.innerHTML = `<div class="cotBtn" data-i18n-key="thinking" onclick="toggleCot(this, event)"></div><div class="cotContent"></div>`
                                            mdBody.innerHTML = "";
                                            mdBody.appendChild(cotBody);
                                            cotBody.firstChild.textContent = translations[locale]["thinking"];
                                            let newMdBody = document.createElement("div");
                                            newMdBody.classList.add("markdown-body");
                                            mdBody.appendChild(newMdBody);
                                            mdBody = newMdBody;
                                        }
                                        cotData += payload.choices[0].delta.reasoning_content;
                                        container.innerHTML = md.render(cotData);
                                        if (container.children.length > 1 && cotBody.lastChild.children.length === container.children.length) {
                                            morphdom(cotBody.lastChild.lastElementChild, container.lastElementChild);
                                        } else {
                                            morphdom(cotBody.lastChild, container, { childrenOnly: true });
                                        }
                                        scrollToBottom();
                                    }
                                    let content = payload.choices[0].delta.content;
                                    if (content != null && content !== "") {
                                        if (loadingCOT == 1 && cotData) {
                                            loadingCOT = 0;
                                            endCot(cotBody.firstChild);
                                        }
                                        if (cotData == "" && content === "<think>") {
                                            loadingCOT = 2;
                                            if (!enableCOT) continue;
                                            if (cotBody == void 0) {
                                                cotBody = document.createElement("div");
                                                cotBody.innerHTML = `<div class="cotBtn" data-i18n-key="thinking" onclick="toggleCot(this, event)"></div><div class="cotContent"></div>`
                                                mdBody.innerHTML = "";
                                                mdBody.appendChild(cotBody);
                                                cotBody.firstChild.textContent = translations[locale]["thinking"];
                                                let newMdBody = document.createElement("div");
                                                newMdBody.classList.add("markdown-body");
                                                mdBody.appendChild(newMdBody);
                                                mdBody = newMdBody;
                                            }
                                            continue;
                                        }
                                        if (content === "</think>") {
                                            loadingCOT = 0;
                                            if (!enableCOT) continue;
                                            endCot(cotBody.firstChild);
                                            continue;
                                        }
                                        if (loadingCOT === 2) {
                                            if (!enableCOT) continue;
                                            cotData += content;
                                            container.innerHTML = md.render(cotData);
                                            if (container.children.length > 1 && cotBody.lastChild.children.length === container.children.length) {
                                                morphdom(cotBody.lastChild.lastElementChild, container.lastElementChild);
                                            } else {
                                                morphdom(cotBody.lastChild, container, { childrenOnly: true });
                                            }
                                            scrollToBottom();
                                            continue;
                                        }
                                        if (existVoice && enableAutoVoice && currentVoiceIdx === autoVoiceDataIdx) {
                                            let spliter = findLastSpecialCharIndex(content);
                                            if (spliter != -1) {
                                                let voiceText = progressData.slice(autoVoiceIdx) + content.slice(0, spliter + 1);
                                                autoVoiceIdx += voiceText.length;
                                                autoSpeechEvent(voiceText, currentResEle);
                                            }
                                        }
                                        if (progressData && textSpeed) await delay();
                                        progressData += content;
                                        container.innerHTML = md.render(progressData);
                                        if (container.children.length > 1 && mdBody.children.length === container.children.length) {
                                            morphdom(mdBody.lastElementChild, container.lastElementChild);
                                        } else {
                                            morphdom(mdBody, container, { childrenOnly: true });
                                        }
                                        scrollToBottom();
                                    }
                                }
                            }
                        }
                        return readChunk();
                    } else {
                        if (isRefresh) {
                            data[refreshIdx].content = progressData;
                            data[refreshIdx].model = currentModelName;
                            if (cotData) data[refreshIdx].reasoning_content = cotData;
                            else delete data[refreshIdx].reasoning_content;
                        } else {
                            if (long) {
                                data[data.length - 1].content = progressData;
                                if (cotData) data[data.length - 1].reasoning_content = cotData;
                                else delete data[data.length - 1].reasoning_content;
                            } else {
                                let dat = { role: "assistant", content: progressData, model: currentModelName };
                                if (cotData) dat.reasoning_content = cotData;
                                data.push(dat);
                            }
                        }
                        if (longReplyFlag) return streamGen(true);
                        stopLoading(false);
                    }
                });
            };
        } else if (modelType === 4) {
            readChunk = async () => {
                return reader.read().then(async ({ value, done }) => {
                    if (!done) {
                        value = decoder.decode(value);
                        let chunks = value.match(/[^\r\n]+/g);
                        if (!chunks) return readChunk();
                        let payload;
                        for (let i = 0; i < chunks.length; i++) {
                            let chunk = chunks[i];
                            if (chunk) {
                                try {
                                    payload = JSON.parse(chunk.slice(5));
                                } catch (e) {
                                    break;
                                }
                                if (!payload.candidates.length) continue;
                                let content = payload.candidates[0].content.parts[0].text;
                                if (content != null && content !== "") {
                                    if (existVoice && enableAutoVoice && currentVoiceIdx === autoVoiceDataIdx) {
                                        let spliter = findLastSpecialCharIndex(content);
                                        if (spliter != -1) {
                                            let voiceText = progressData.slice(autoVoiceIdx) + content.slice(0, spliter + 1);
                                            autoVoiceIdx += voiceText.length;
                                            autoSpeechEvent(voiceText, currentResEle);
                                        }
                                    }
                                    if (progressData && textSpeed) await delay();
                                    progressData += content;
                                    container.innerHTML = md.render(progressData);
                                    if (container.children.length > 1 && currentResEle.children[1].children.length === container.children.length) {
                                        morphdom(currentResEle.children[1].lastElementChild, container.lastElementChild);
                                    } else {
                                        morphdom(currentResEle.children[1], container, { childrenOnly: true });
                                    }
                                    scrollToBottom();
                                }
                                if (payload.candidates[0].finishReason) {
                                    let lenStop = payload.candidates[0].finishReason === "MAX_TOKENS";
                                    longReplyFlag = enableLongReply && lenStop;
                                    let ele = currentResEle.lastChild.children[0].children[0];
                                    if (!enableLongReply && lenStop) { ele.className = "halfRefReq optionItem"; ele.title = translations[locale]["continue"] }
                                    else { ele.className = "refreshReq optionItem"; ele.title = translations[locale]["refresh"] };
                                    if (existVoice && enableAutoVoice && currentVoiceIdx === autoVoiceDataIdx) {
                                        let voiceText = longReplyFlag ? "" : progressData.slice(autoVoiceIdx), stop = !longReplyFlag;
                                        autoSpeechEvent(voiceText, currentResEle, false, stop);
                                    }
                                    break;
                                }
                            }
                        }
                        return readChunk();
                    } else {
                        if (isRefresh) {
                            data[refreshIdx].content = progressData;
                            data[refreshIdx].model = currentModelName;
                            if (cotData) data[refreshIdx].reasoning_content = cotData;
                            else delete data[refreshIdx].reasoning_content;
                        } else {
                            if (long) {
                                data[data.length - 1].content = progressData
                                if (cotData) data[data.length - 1].reasoning_content = cotData;
                                else delete data[data.length - 1].reasoning_content;
                            } else { data.push({ role: "assistant", content: progressData, model: currentModelName }) }
                        }
                        if (longReplyFlag) return streamGen(true);
                        stopLoading(false);
                    }
                });
            };
        } else {
            readChunk = async () => {
                return reader.read().then(async ({ value, done }) => {
                    if (!done) {
                        value = decoder.decode(value);
                        let chunks = value.match(/[^\n]+/g);
                        if (!chunks) return readChunk();
                        let event;
                        let payload;
                        for (let i = 0; i < chunks.length; i++) {
                            let chunk = chunks[i];
                            if (chunk) {
                                try {
                                    if (chunk.startsWith("event")) {
                                        event = chunk.slice(7);
                                    } else {
                                        payload = JSON.parse(chunk.slice(5));
                                    }
                                } catch (e) {
                                    break;
                                }
                                if (chunk.startsWith("event")) continue;
                                if (event === "message_delta") {
                                    let lenStop = payload.delta.stop_reason === "max_tokens";
                                    longReplyFlag = enableLongReply && lenStop;
                                    let ele = currentResEle.lastChild.children[0].children[0];
                                    if (!enableLongReply && lenStop) { ele.className = "halfRefReq optionItem"; ele.title = translations[locale]["continue"] }
                                    else { ele.className = "refreshReq optionItem"; ele.title = translations[locale]["refresh"] };
                                    if (existVoice && enableAutoVoice && currentVoiceIdx === autoVoiceDataIdx) {
                                        let voiceText = longReplyFlag ? "" : progressData.slice(autoVoiceIdx), stop = !longReplyFlag;
                                        autoSpeechEvent(voiceText, currentResEle, false, stop);
                                    }
                                    break;
                                } else if (event === "content_block_delta") {
                                    if (payload.delta.type !== "text_delta") continue;
                                    let content = payload.delta.text;
                                    if (content != null && content !== "") {
                                        if (existVoice && enableAutoVoice && currentVoiceIdx === autoVoiceDataIdx) {
                                            let spliter = findLastSpecialCharIndex(content);
                                            if (spliter != -1) {
                                                let voiceText = progressData.slice(autoVoiceIdx) + content.slice(0, spliter + 1);
                                                autoVoiceIdx += voiceText.length;
                                                autoSpeechEvent(voiceText, currentResEle);
                                            }
                                        }
                                        if (progressData && textSpeed) await delay();
                                        progressData += content;
                                        container.innerHTML = md.render(progressData);
                                        if (container.children.length > 1 && currentResEle.children[1].children.length === container.children.length) {
                                            morphdom(currentResEle.children[1].lastElementChild, container.lastElementChild);
                                        } else {
                                            morphdom(currentResEle.children[1], container, { childrenOnly: true });
                                        }
                                        scrollToBottom();
                                    }
                                }
                            }
                        }
                        return readChunk();
                    } else {
                        if (isRefresh) {
                            data[refreshIdx].content = progressData;
                            data[refreshIdx].model = currentModelName;
                            if (cotData) data[refreshIdx].reasoning_content = cotData;
                            else delete data[refreshIdx].reasoning_content;
                        } else {
                            if (long) {
                                data[data.length - 1].content = progressData
                                if (cotData) data[data.length - 1].reasoning_content = cotData;
                                else delete data[data.length - 1].reasoning_content;
                            }
                            else { data.push({ role: "assistant", content: progressData, model: currentModelName }) }
                        }
                        if (longReplyFlag) return streamGen(true);
                        stopLoading(false);
                    }
                });
            };
        }
        await readChunk();
        container = null;
    } catch (e) {
        if (e.message.indexOf("aborted") === -1) {
            notyf.error(translations[locale]["badEndpointTip"])
            stopLoading();
        }
    }
};
const loadAction = (bool) => {
    loading = bool;
    sendBtnEle.disabled = bool;
    sendBtnEle.className = bool ? " loading" : "loaded";
    stopEle.style.display = bool ? "flex" : "none";
    textInputEvent();
};
const updateChatPre = () => {
    let ele = activeChatEle.children[1].children[1];
    let first = data.find(item => { return item.role === "assistant" });
    ele.textContent = first ? first.content.slice(0, 30) : "";
    forceRepaint(ele.parentElement)
}
const stopLoading = (abort = true) => {
    stopEle.style.display = "none";
    if (currentResEle.children[1].querySelector(".cursorCls")) currentResEle.children[1].innerHTML = "<br />";
    if (abort) {
        controller.abort();
        if (controllerId) clearTimeout(controllerId);
        if (delayId) clearTimeout(delayId);
        if (refreshIdx !== void 0) {
            data[refreshIdx].content = progressData;
            data[refreshIdx].model = currentModelName;
            if (cotData) data[refreshIdx].reasoning_content = cotData;
            else delete data[refreshIdx].reasoning_content;
        }
        else if (data[data.length - 1].role === "assistant") {
            data[data.length - 1].content = progressData;
            data[data.length - 1].model = currentModelName;
            if (cotData) data[data.length - 1].reasoning_content = cotData;
            else delete data[data.length - 1].reasoning_content;
        }
        else {
            let dat = { role: "assistant", content: progressData, model: currentModelName };
            if (cotData) dat.reasoning_content = cotData;
            data.push(dat);
        }
        if (existVoice && enableAutoVoice && currentVoiceIdx === autoVoiceDataIdx && progressData.length) {
            let voiceText = progressData.slice(autoVoiceIdx);
            autoSpeechEvent(voiceText, currentResEle, false, true);
        }
    }
    if (activeChatEle.children[1].children[1].textContent === "") updateChatPre();
    updateChats();
    controllerId = delayId = refreshIdx = autoVoiceDataIdx = void 0;
    autoVoiceIdx = 0;
    currentResEle.dataset.loading = false;
    currentResEle = null;
    progressData = "";
    cotData = "";
    loadingCOT = 0;
    unexpectedCutOff = "";
    loadAction(false);
};
const generateText = (message) => {
    loadAction(true);
    let requestEle;
    let isBottom = isContentBottom();
    if (editingIdx !== void 0) {
        let idx = editingIdx;
        let eleIdx = systemRole ? idx - 1 : idx;
        requestEle = chatlog.children[eleIdx];
        data[idx].content = message;
        resumeSend();
        if (idx !== data.length - 1) {
            requestEle.children[1].textContent = message;
            if (data[idx + 1].role !== "assistant") {
                if (currentVoiceIdx !== void 0) {
                    if (currentVoiceIdx > idx) { currentVoiceIdx++ }
                }
                data.splice(idx + 1, 0, { role: "assistant", content: "", model: modelVersion });
                chatlog.insertBefore(createConvEle("response", false, modelVersion), chatlog.children[eleIdx + 1]);
            } else formatAvatarEle(chatlog.children[eleIdx + 1].children[0], modelVersion);
            chatlog.children[eleIdx + 1].children[1].innerHTML = "<p class='cursorCls'><br /></p>";
            chatlog.children[eleIdx + 1].dataset.loading = true;
            idx = idx + 1;
            data[idx].content = "";
            if (idx === currentVoiceIdx) { endSpeak() };
            refreshIdx = idx;
            updateChats();
            streamGen();
            return;
        }
    } else {
        requestEle = createConvEle("request");
        data.push({ role: "user", content: message });
    }
    requestEle.children[1].textContent = message;
    if (chatsData[activeChatIdx].name === translations[locale]["newChatName"]) {
        if (message.length > 20) message = message.slice(0, 17) + "...";
        chatsData[activeChatIdx].name = message;
        activeChatEle.children[1].children[0].textContent = message;
    }
    updateChats();
    if (isBottom) messagesEle.scrollTo(0, messagesEle.scrollHeight);
    streamGen();
};
inputAreaEle.onkeydown = (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        genFunc();
    } else if (keepListenMic && recing) {
        resetRecRes();
    }
};
const genFunc = async function () {
    clearAutoSendTimer();
    if (recing) {
        if (existRec === 3) await toggleRecEv(false);
        else if (existRec === 2) toggleRecEv(false);
        else if (!keepListenMic) toggleRecEv();
    }
    let message = inputAreaEle.value.trim();
    if (message.length !== 0 && noLoading()) {
        inputAreaEle.value = "";
        inputAreaEle.style.height = "47px";
        if (keepListenMic && recing) resetRecRes();
        generateText(message);
    }
};
sendBtnEle.onclick = genFunc;
stopEle.onclick = stopLoading;
clearEle.onclick = () => {
    if (editingIdx === void 0) {
        if (noLoading() && confirmAction(translations[locale]["clearChatTip"])) {
            endSpeak();
            if (systemRole) { data.length = 1 }
            else { data.length = 0 }
            chatlog.innerHTML = "";
            updateChatPre();
            updateChats();
        }
    } else {
        resumeSend();
    }
}