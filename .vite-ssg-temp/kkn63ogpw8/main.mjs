import { ViteSSG } from "vite-ssg";
import { useSSRContext, ref, onMounted, watch, nextTick, mergeProps, resolveComponent, withCtx, createVNode, resolveDynamicComponent, openBlock, createBlock, KeepAlive, Suspense, version as version$1, unref, inject as inject$1, watchEffect, getCurrentInstance as getCurrentInstance$1, onBeforeUnmount, onDeactivated, onActivated, shallowRef, shallowReactive, defineComponent as defineComponent$1, reactive, computed, h, provide, Fragment, toRefs, capitalize, warn as warn$1, isRef, toRef, onScopeDispose, effectScope, toRaw, onUpdated, Text, readonly, Transition, withDirectives, resolveDirective, TransitionGroup, onBeforeMount, vShow, onServerPrefetch, createCommentVNode, toDisplayString, createTextVNode, renderList } from "vue";
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderComponent, ssrRenderSuspense, ssrRenderVNode } from "vue/server-renderer";
import { marked } from "marked";
import DOMPurify from "dompurify";
import debounce$1 from "lodash/debounce.js";
import format$1 from "date-fns/format";
import isFuture from "date-fns/isFuture";
import { VueFinalModal } from "vue-final-modal";
import isPast from "date-fns/isPast";
import { setupDevtoolsPlugin } from "@vue/devtools-api";
import _ from "lodash";
import { register } from "swiper/element/bundle";
import { createHead as createHead$1, getActiveHead } from "unhead";
import { defineHeadPlugin, composableNames } from "@unhead/shared";
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$f = {
  setup() {
    const botOpen = ref(false);
    const messages = ref([]);
    const userInput = ref("");
    const isLoading = ref(false);
    const chatWindow = ref(null);
    const sampleQuestions = ref([
      "Can you give me examples of case studies or pilot projects where AI has been successfully integrated into public engagement?",
      "How can AI help in addressing misinformation during election campaigns?",
      "Can you summarize the latest research on AI and participatory decision-making in urban planning?"
    ]);
    onMounted(() => {
      if (!sessionStorage.getItem("chatSessionActive")) {
        localStorage.removeItem("chatbotState");
        sessionStorage.setItem("chatSessionActive", "true");
      } else {
        const savedState = localStorage.getItem("chatbotState");
        if (savedState) {
          const { botOpen: savedBotOpen, messages: savedMessages } = JSON.parse(savedState);
          botOpen.value = savedBotOpen;
          messages.value = savedMessages;
        }
      }
    });
    watch(messages, () => {
    }, { deep: true, flush: "post" });
    const openFunc = () => {
      botOpen.value = true;
    };
    const closeFunc = () => {
      botOpen.value = false;
    };
    const renderMarkdown = (text) => {
      const rawHtml = marked(text);
      return DOMPurify.sanitize(rawHtml);
    };
    const handleEnterKey = (event) => {
      if (!event.shiftKey && !isLoading.value) {
        event.preventDefault();
        sendMessage();
      }
    };
    const sendMessage = async () => {
      if (userInput.value.trim() === "" || isLoading.value) return;
      const messageContent = userInput.value;
      userInput.value = "";
      isLoading.value = true;
      messages.value.push({ type: "user", content: messageContent });
      scrollToBottom();
      const botMessage = { type: "bot", content: "", sourceDocuments: [] };
      messages.value.push(botMessage);
      try {
        const response = await fetch("/.netlify/functions/pschat", {
          method: "POST",
          body: JSON.stringify({ message: messageContent, conversation: messages.value }),
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("Network response was not ok");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk2 = decoder.decode(value);
          const lines = chunk2.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              try {
                const data = JSON.parse(jsonStr);
                if (data.content) {
                  botMessage.content += data.content;
                } else if (data.sourceDocuments) {
                  botMessage.sourceDocuments = data.sourceDocuments;
                }
              } catch (parseError) {
                const partialMatch = jsonStr.match(/"content":"(.+?)"/);
                if (partialMatch) {
                  botMessage.content += partialMatch[1];
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error:", error);
        botMessage.content = "Sorry, an error occurred.";
      } finally {
        isLoading.value = false;
        messages.value = [...messages.value];
      }
    };
    const submitSamplePrompt = (question) => {
      userInput.value = question;
      sendMessage();
    };
    const scrollToBottom = debounce$1(() => {
      nextTick(() => {
        if (chatWindow.value) {
          chatWindow.value.scrollTop = chatWindow.value.scrollHeight;
        }
      });
    }, 50);
    return {
      botOpen,
      messages,
      userInput,
      isLoading,
      chatWindow,
      sampleQuestions,
      handleEnterKey,
      openFunc,
      closeFunc,
      renderMarkdown,
      scrollToBottom,
      sendMessage,
      submitSamplePrompt
    };
  }
};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({
    class: ["chatbot-app", !$setup.botOpen ? "chatbot-app-closed" : "chatbot-app"]
  }, _attrs))}>`);
  if (!$setup.botOpen) {
    _push(`<div class="bot-icon"><i class="fa-solid fa-message-bot"></i></div>`);
  } else {
    _push(`<!---->`);
  }
  if ($setup.botOpen) {
    _push(`<div class="assitant-chat"><div class="bot-header"><h4> The Reboot Bot <br><div style="${ssrRenderStyle({ "font-size": "0.9rem", "font-weight": "400" })}"> Your Personal Participatory Democracy Assistant <br></div></h4><br><i class="fa-regular fa-circle-xmark bot-close"></i></div><div class="chat-window"><div class="welcome-message"><p class="bot-welcome-message"> Welcome to the Reboot Democracy Bot. Trained on research and writing from the GovLab and the Reboot Blog, I answer your questions about technology, governance and democracy. <br><br> Type a question you have about AI, democracy and governance in the box below. Here are some sample prompts to get you started! </p><div class="button-grid"><!--[-->`);
    ssrRenderList($setup.sampleQuestions, (question, index) => {
      _push(`<a class="prompt-button">${ssrInterpolate(question)}</a>`);
    });
    _push(`<!--]--></div></div><!--[-->`);
    ssrRenderList($setup.messages, (message, index) => {
      _push(`<div class="${ssrRenderClass(["message", message.type])}">`);
      if (message.type === "user") {
        _push(`<div class="user-message">${ssrInterpolate(message.content)}</div>`);
      } else {
        _push(`<div class="bot-message">`);
        if (message.content) {
          _push(`<div><div>${$setup.renderMarkdown(message.content) ?? ""}</div>`);
          if (message.sourceDocuments && message.sourceDocuments.length > 0) {
            _push(`<div class="source-documents"><h4>Sources:</h4><ul><!--[-->`);
            ssrRenderList(message.sourceDocuments, (source, index2) => {
              _push(`<li><a${ssrRenderAttr("href", source.url)} target="_blank">${ssrInterpolate(source.title)}</a></li>`);
            });
            _push(`<!--]--></ul></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="typing-indicator"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    });
    _push(`<!--]--></div><div style="${ssrRenderStyle({ "font-size": "0.7rem", "font-weight": "600", "padding": "5px" })}"> powered by <a target="_blank" href="https://github.com/CitizensFoundation/policy-synth?tab=readme-ov-file#rag-chatbot">PolicySynth RAG</a></div><div class="input-area"><form><textarea${ssrRenderAttr("placeholder", $setup.isLoading ? "Generating response..." : "Ask a question here!")}${ssrIncludeBooleanAttr($setup.isLoading) ? " disabled" : ""} class="chat-input">${ssrInterpolate($setup.userInput)}</textarea><button type="submit" class="submit-button"${ssrIncludeBooleanAttr($setup.isLoading) ? " disabled" : ""}><i class="fas fa-paper-plane"></i></button></form></div><div style="${ssrRenderStyle({ "display": "flex", "flex-direction": "column", "align-items": "left", "justify-content": "left" })}"><p class="bot-attribution"><i>AI model used: GPT-4o by OpenAI</i> The use of this chatbot is governed by <a href="https://openai.com/policies" target="blank">OpenAI&#39;s terms of use</a>. Do not enter any personally identifiable information. Have feedback about this tool? Email us at hello@thegovlab.org </p></div></div>`);
  } else {
    _push(`<!---->`);
  }
  _push(`</div>`);
}
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/pschat.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const OpenAIChat = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["ssrRender", _sfc_ssrRender$2]]);
const _sfc_main$e = {
  __name: "App",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_router_view = resolveComponent("router-view");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "app-container" }, _attrs))} data-v-10936d98><div class="main-content" data-v-10936d98>`);
      _push(ssrRenderComponent(_component_router_view, null, {
        default: withCtx(({ Component }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(``);
            ssrRenderSuspense(_push2, {
              default: () => {
                ssrRenderVNode(_push2, createVNode(resolveDynamicComponent(Component), null, null), _parent2, _scopeId);
              },
              _: 2
            });
          } else {
            return [
              (openBlock(), createBlock(KeepAlive, null, [
                (openBlock(), createBlock(Suspense, null, {
                  default: withCtx(() => [
                    (openBlock(), createBlock(resolveDynamicComponent(Component)))
                  ]),
                  _: 2
                }, 1024))
              ], 1024))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(OpenAIChat, null, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/App.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const App = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-10936d98"]]);
const Vue3 = version$1[0] === "3";
function resolveUnref(r2) {
  return typeof r2 === "function" ? r2() : unref(r2);
}
function resolveUnrefHeadInput(ref2) {
  if (ref2 instanceof Promise || ref2 instanceof Date || ref2 instanceof RegExp)
    return ref2;
  const root = resolveUnref(ref2);
  if (!ref2 || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r2) => resolveUnrefHeadInput(r2));
  if (typeof root === "object") {
    const resolved = {};
    for (const k2 in root) {
      if (!Object.prototype.hasOwnProperty.call(root, k2)) {
        continue;
      }
      if (k2 === "titleTemplate" || k2[0] === "o" && k2[1] === "n") {
        resolved[k2] = unref(root[k2]);
        continue;
      }
      resolved[k2] = resolveUnrefHeadInput(root[k2]);
    }
    return resolved;
  }
  return root;
}
const VueReactivityPlugin = defineHeadPlugin({
  hooks: {
    "entries:resolve": (ctx) => {
      for (const entry of ctx.entries)
        entry.resolvedInput = resolveUnrefHeadInput(entry.input);
    }
  }
});
const headSymbol = "usehead";
function vueInstall(head) {
  const plugin = {
    install(app) {
      if (Vue3) {
        app.config.globalProperties.$unhead = head;
        app.config.globalProperties.$head = head;
        app.provide(headSymbol, head);
      }
    }
  };
  return plugin.install;
}
function createHead(options = {}) {
  options.domDelayFn = options.domDelayFn || ((fn) => nextTick(() => setTimeout(() => fn(), 0)));
  const head = createHead$1(options);
  head.use(VueReactivityPlugin);
  head.install = vueInstall(head);
  return head;
}
const _global = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey = "__unhead_injection_handler__";
function injectHead() {
  if (globalKey in _global) {
    return _global[globalKey]();
  }
  const head = inject$1(headSymbol);
  if (!head && process.env.NODE_ENV !== "production")
    console.warn("Unhead is missing Vue context, falling back to shared context. This may have unexpected results.");
  return head || getActiveHead();
}
function useHead(input, options = {}) {
  const head = options.head || injectHead();
  if (head) {
    if (!head.ssr)
      return clientUseHead(head, input, options);
    return head.push(input, options);
  }
}
function clientUseHead(head, input, options = {}) {
  const deactivated = ref(false);
  const resolvedInput = ref({});
  watchEffect(() => {
    resolvedInput.value = deactivated.value ? {} : resolveUnrefHeadInput(input);
  });
  const entry = head.push(resolvedInput.value, options);
  watch(resolvedInput, (e) => {
    entry.patch(e);
  });
  const vm = getCurrentInstance$1();
  if (vm) {
    onBeforeUnmount(() => {
      entry.dispose();
    });
    onDeactivated(() => {
      deactivated.value = true;
    });
    onActivated(() => {
      deactivated.value = false;
    });
  }
  return entry;
}
const coreComposableNames = [
  "injectHead"
];
({
  "@unhead/vue": [...coreComposableNames, ...composableNames]
});
/*!
  * vue-router v4.5.0
  * (c) 2024 Eduardo San Martin Morote
  * @license MIT
  */
const isBrowser = typeof document !== "undefined";
function isRouteComponent(component) {
  return typeof component === "object" || "displayName" in component || "props" in component || "__vccOpts" in component;
}
function isESModule(obj) {
  return obj.__esModule || obj[Symbol.toStringTag] === "Module" || // support CF with dynamic imports that do not
  // add the Module string tag
  obj.default && isRouteComponent(obj.default);
}
const assign = Object.assign;
function applyToParams(fn, params) {
  const newParams = {};
  for (const key in params) {
    const value = params[key];
    newParams[key] = isArray(value) ? value.map(fn) : fn(value);
  }
  return newParams;
}
const noop = () => {
};
const isArray = Array.isArray;
function warn(msg) {
  const args = Array.from(arguments).slice(1);
  console.warn.apply(console, ["[Vue Router warn]: " + msg].concat(args));
}
const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const IM_RE = /\?/g;
const PLUS_RE = /\+/g;
const ENC_BRACKET_OPEN_RE = /%5B/g;
const ENC_BRACKET_CLOSE_RE = /%5D/g;
const ENC_CARET_RE = /%5E/g;
const ENC_BACKTICK_RE = /%60/g;
const ENC_CURLY_OPEN_RE = /%7B/g;
const ENC_PIPE_RE = /%7C/g;
const ENC_CURLY_CLOSE_RE = /%7D/g;
const ENC_SPACE_RE = /%20/g;
function commonEncode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|").replace(ENC_BRACKET_OPEN_RE, "[").replace(ENC_BRACKET_CLOSE_RE, "]");
}
function encodeHash(text) {
  return commonEncode(text).replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
}
function encodeQueryValue(text) {
  return commonEncode(text).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function encodePath(text) {
  return commonEncode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F");
}
function encodeParam(text) {
  return text == null ? "" : encodePath(text).replace(SLASH_RE, "%2F");
}
function decode(text) {
  try {
    return decodeURIComponent("" + text);
  } catch (err) {
    process.env.NODE_ENV !== "production" && warn(`Error decoding "${text}". Using original value`);
  }
  return "" + text;
}
const TRAILING_SLASH_RE = /\/$/;
const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, "");
function parseURL(parseQuery2, location2, currentLocation = "/") {
  let path, query = {}, searchString = "", hash = "";
  const hashPos = location2.indexOf("#");
  let searchPos = location2.indexOf("?");
  if (hashPos < searchPos && hashPos >= 0) {
    searchPos = -1;
  }
  if (searchPos > -1) {
    path = location2.slice(0, searchPos);
    searchString = location2.slice(searchPos + 1, hashPos > -1 ? hashPos : location2.length);
    query = parseQuery2(searchString);
  }
  if (hashPos > -1) {
    path = path || location2.slice(0, hashPos);
    hash = location2.slice(hashPos, location2.length);
  }
  path = resolveRelativePath(path != null ? path : location2, currentLocation);
  return {
    fullPath: path + (searchString && "?") + searchString + hash,
    path,
    query,
    hash: decode(hash)
  };
}
function stringifyURL(stringifyQuery2, location2) {
  const query = location2.query ? stringifyQuery2(location2.query) : "";
  return location2.path + (query && "?") + query + (location2.hash || "");
}
function stripBase(pathname, base) {
  if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
    return pathname;
  return pathname.slice(base.length) || "/";
}
function isSameRouteLocation(stringifyQuery2, a, b2) {
  const aLastIndex = a.matched.length - 1;
  const bLastIndex = b2.matched.length - 1;
  return aLastIndex > -1 && aLastIndex === bLastIndex && isSameRouteRecord(a.matched[aLastIndex], b2.matched[bLastIndex]) && isSameRouteLocationParams(a.params, b2.params) && stringifyQuery2(a.query) === stringifyQuery2(b2.query) && a.hash === b2.hash;
}
function isSameRouteRecord(a, b2) {
  return (a.aliasOf || a) === (b2.aliasOf || b2);
}
function isSameRouteLocationParams(a, b2) {
  if (Object.keys(a).length !== Object.keys(b2).length)
    return false;
  for (const key in a) {
    if (!isSameRouteLocationParamsValue(a[key], b2[key]))
      return false;
  }
  return true;
}
function isSameRouteLocationParamsValue(a, b2) {
  return isArray(a) ? isEquivalentArray(a, b2) : isArray(b2) ? isEquivalentArray(b2, a) : a === b2;
}
function isEquivalentArray(a, b2) {
  return isArray(b2) ? a.length === b2.length && a.every((value, i) => value === b2[i]) : a.length === 1 && a[0] === b2;
}
function resolveRelativePath(to, from) {
  if (to.startsWith("/"))
    return to;
  if (process.env.NODE_ENV !== "production" && !from.startsWith("/")) {
    warn(`Cannot resolve a relative location without an absolute path. Trying to resolve "${to}" from "${from}". It should look like "/${from}".`);
    return to;
  }
  if (!to)
    return from;
  const fromSegments = from.split("/");
  const toSegments = to.split("/");
  const lastToSegment = toSegments[toSegments.length - 1];
  if (lastToSegment === ".." || lastToSegment === ".") {
    toSegments.push("");
  }
  let position = fromSegments.length - 1;
  let toPosition;
  let segment;
  for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
    segment = toSegments[toPosition];
    if (segment === ".")
      continue;
    if (segment === "..") {
      if (position > 1)
        position--;
    } else
      break;
  }
  return fromSegments.slice(0, position).join("/") + "/" + toSegments.slice(toPosition).join("/");
}
const START_LOCATION_NORMALIZED = {
  path: "/",
  // TODO: could we use a symbol in the future?
  name: void 0,
  params: {},
  query: {},
  hash: "",
  fullPath: "/",
  matched: [],
  meta: {},
  redirectedFrom: void 0
};
var NavigationType;
(function(NavigationType2) {
  NavigationType2["pop"] = "pop";
  NavigationType2["push"] = "push";
})(NavigationType || (NavigationType = {}));
var NavigationDirection;
(function(NavigationDirection2) {
  NavigationDirection2["back"] = "back";
  NavigationDirection2["forward"] = "forward";
  NavigationDirection2["unknown"] = "";
})(NavigationDirection || (NavigationDirection = {}));
function normalizeBase(base) {
  if (!base) {
    if (isBrowser) {
      const baseEl = document.querySelector("base");
      base = baseEl && baseEl.getAttribute("href") || "/";
      base = base.replace(/^\w+:\/\/[^\/]+/, "");
    } else {
      base = "/";
    }
  }
  if (base[0] !== "/" && base[0] !== "#")
    base = "/" + base;
  return removeTrailingSlash(base);
}
const BEFORE_HASH_RE = /^[^#]+#/;
function createHref(base, location2) {
  return base.replace(BEFORE_HASH_RE, "#") + location2;
}
function getElementPosition(el, offset) {
  const docRect = document.documentElement.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return {
    behavior: offset.behavior,
    left: elRect.left - docRect.left - (offset.left || 0),
    top: elRect.top - docRect.top - (offset.top || 0)
  };
}
const computeScrollPosition = () => ({
  left: window.scrollX,
  top: window.scrollY
});
function scrollToPosition(position) {
  let scrollToOptions;
  if ("el" in position) {
    const positionEl = position.el;
    const isIdSelector = typeof positionEl === "string" && positionEl.startsWith("#");
    if (process.env.NODE_ENV !== "production" && typeof position.el === "string") {
      if (!isIdSelector || !document.getElementById(position.el.slice(1))) {
        try {
          const foundEl = document.querySelector(position.el);
          if (isIdSelector && foundEl) {
            warn(`The selector "${position.el}" should be passed as "el: document.querySelector('${position.el}')" because it starts with "#".`);
            return;
          }
        } catch (err) {
          warn(`The selector "${position.el}" is invalid. If you are using an id selector, make sure to escape it. You can find more information about escaping characters in selectors at https://mathiasbynens.be/notes/css-escapes or use CSS.escape (https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape).`);
          return;
        }
      }
    }
    const el = typeof positionEl === "string" ? isIdSelector ? document.getElementById(positionEl.slice(1)) : document.querySelector(positionEl) : positionEl;
    if (!el) {
      process.env.NODE_ENV !== "production" && warn(`Couldn't find element using selector "${position.el}" returned by scrollBehavior.`);
      return;
    }
    scrollToOptions = getElementPosition(el, position);
  } else {
    scrollToOptions = position;
  }
  if ("scrollBehavior" in document.documentElement.style)
    window.scrollTo(scrollToOptions);
  else {
    window.scrollTo(scrollToOptions.left != null ? scrollToOptions.left : window.scrollX, scrollToOptions.top != null ? scrollToOptions.top : window.scrollY);
  }
}
function getScrollKey(path, delta2) {
  const position = history.state ? history.state.position - delta2 : -1;
  return position + path;
}
const scrollPositions = /* @__PURE__ */ new Map();
function saveScrollPosition(key, scrollPosition) {
  scrollPositions.set(key, scrollPosition);
}
function getSavedScrollPosition(key) {
  const scroll = scrollPositions.get(key);
  scrollPositions.delete(key);
  return scroll;
}
let createBaseLocation = () => location.protocol + "//" + location.host;
function createCurrentLocation(base, location2) {
  const { pathname, search, hash } = location2;
  const hashPos = base.indexOf("#");
  if (hashPos > -1) {
    let slicePos = hash.includes(base.slice(hashPos)) ? base.slice(hashPos).length : 1;
    let pathFromHash = hash.slice(slicePos);
    if (pathFromHash[0] !== "/")
      pathFromHash = "/" + pathFromHash;
    return stripBase(pathFromHash, "");
  }
  const path = stripBase(pathname, base);
  return path + search + hash;
}
function useHistoryListeners(base, historyState, currentLocation, replace2) {
  let listeners = [];
  let teardowns = [];
  let pauseState = null;
  const popStateHandler = ({ state }) => {
    const to = createCurrentLocation(base, location);
    const from = currentLocation.value;
    const fromState = historyState.value;
    let delta2 = 0;
    if (state) {
      currentLocation.value = to;
      historyState.value = state;
      if (pauseState && pauseState === from) {
        pauseState = null;
        return;
      }
      delta2 = fromState ? state.position - fromState.position : 0;
    } else {
      replace2(to);
    }
    listeners.forEach((listener) => {
      listener(currentLocation.value, from, {
        delta: delta2,
        type: NavigationType.pop,
        direction: delta2 ? delta2 > 0 ? NavigationDirection.forward : NavigationDirection.back : NavigationDirection.unknown
      });
    });
  };
  function pauseListeners() {
    pauseState = currentLocation.value;
  }
  function listen(callback) {
    listeners.push(callback);
    const teardown = () => {
      const index = listeners.indexOf(callback);
      if (index > -1)
        listeners.splice(index, 1);
    };
    teardowns.push(teardown);
    return teardown;
  }
  function beforeUnloadListener() {
    const { history: history2 } = window;
    if (!history2.state)
      return;
    history2.replaceState(assign({}, history2.state, { scroll: computeScrollPosition() }), "");
  }
  function destroy() {
    for (const teardown of teardowns)
      teardown();
    teardowns = [];
    window.removeEventListener("popstate", popStateHandler);
    window.removeEventListener("beforeunload", beforeUnloadListener);
  }
  window.addEventListener("popstate", popStateHandler);
  window.addEventListener("beforeunload", beforeUnloadListener, {
    passive: true
  });
  return {
    pauseListeners,
    listen,
    destroy
  };
}
function buildState(back, current, forward, replaced = false, computeScroll = false) {
  return {
    back,
    current,
    forward,
    replaced,
    position: window.history.length,
    scroll: computeScroll ? computeScrollPosition() : null
  };
}
function useHistoryStateNavigation(base) {
  const { history: history2, location: location2 } = window;
  const currentLocation = {
    value: createCurrentLocation(base, location2)
  };
  const historyState = { value: history2.state };
  if (!historyState.value) {
    changeLocation(currentLocation.value, {
      back: null,
      current: currentLocation.value,
      forward: null,
      // the length is off by one, we need to decrease it
      position: history2.length - 1,
      replaced: true,
      // don't add a scroll as the user may have an anchor, and we want
      // scrollBehavior to be triggered without a saved position
      scroll: null
    }, true);
  }
  function changeLocation(to, state, replace22) {
    const hashIndex = base.indexOf("#");
    const url = hashIndex > -1 ? (location2.host && document.querySelector("base") ? base : base.slice(hashIndex)) + to : createBaseLocation() + base + to;
    try {
      history2[replace22 ? "replaceState" : "pushState"](state, "", url);
      historyState.value = state;
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        warn("Error with push/replace State", err);
      } else {
        console.error(err);
      }
      location2[replace22 ? "replace" : "assign"](url);
    }
  }
  function replace2(to, data) {
    const state = assign({}, history2.state, buildState(
      historyState.value.back,
      // keep back and forward entries but override current position
      to,
      historyState.value.forward,
      true
    ), data, { position: historyState.value.position });
    changeLocation(to, state, true);
    currentLocation.value = to;
  }
  function push(to, data) {
    const currentState = assign(
      {},
      // use current history state to gracefully handle a wrong call to
      // history.replaceState
      // https://github.com/vuejs/router/issues/366
      historyState.value,
      history2.state,
      {
        forward: to,
        scroll: computeScrollPosition()
      }
    );
    if (process.env.NODE_ENV !== "production" && !history2.state) {
      warn(`history.state seems to have been manually replaced without preserving the necessary values. Make sure to preserve existing history state if you are manually calling history.replaceState:

history.replaceState(history.state, '', url)

You can find more information at https://router.vuejs.org/guide/migration/#Usage-of-history-state`);
    }
    changeLocation(currentState.current, currentState, true);
    const state = assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data);
    changeLocation(to, state, false);
    currentLocation.value = to;
  }
  return {
    location: currentLocation,
    state: historyState,
    push,
    replace: replace2
  };
}
function createWebHistory(base) {
  base = normalizeBase(base);
  const historyNavigation = useHistoryStateNavigation(base);
  const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
  function go(delta2, triggerListeners = true) {
    if (!triggerListeners)
      historyListeners.pauseListeners();
    history.go(delta2);
  }
  const routerHistory = assign({
    // it's overridden right after
    location: "",
    base,
    go,
    createHref: createHref.bind(null, base)
  }, historyNavigation, historyListeners);
  Object.defineProperty(routerHistory, "location", {
    enumerable: true,
    get: () => historyNavigation.location.value
  });
  Object.defineProperty(routerHistory, "state", {
    enumerable: true,
    get: () => historyNavigation.state.value
  });
  return routerHistory;
}
function isRouteLocation(route) {
  return typeof route === "string" || route && typeof route === "object";
}
function isRouteName(name) {
  return typeof name === "string" || typeof name === "symbol";
}
const NavigationFailureSymbol = Symbol(process.env.NODE_ENV !== "production" ? "navigation failure" : "");
var NavigationFailureType;
(function(NavigationFailureType2) {
  NavigationFailureType2[NavigationFailureType2["aborted"] = 4] = "aborted";
  NavigationFailureType2[NavigationFailureType2["cancelled"] = 8] = "cancelled";
  NavigationFailureType2[NavigationFailureType2["duplicated"] = 16] = "duplicated";
})(NavigationFailureType || (NavigationFailureType = {}));
const ErrorTypeMessages = {
  [
    1
    /* ErrorTypes.MATCHER_NOT_FOUND */
  ]({ location: location2, currentLocation }) {
    return `No match for
 ${JSON.stringify(location2)}${currentLocation ? "\nwhile being at\n" + JSON.stringify(currentLocation) : ""}`;
  },
  [
    2
    /* ErrorTypes.NAVIGATION_GUARD_REDIRECT */
  ]({ from, to }) {
    return `Redirected from "${from.fullPath}" to "${stringifyRoute(to)}" via a navigation guard.`;
  },
  [
    4
    /* ErrorTypes.NAVIGATION_ABORTED */
  ]({ from, to }) {
    return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`;
  },
  [
    8
    /* ErrorTypes.NAVIGATION_CANCELLED */
  ]({ from, to }) {
    return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`;
  },
  [
    16
    /* ErrorTypes.NAVIGATION_DUPLICATED */
  ]({ from, to }) {
    return `Avoided redundant navigation to current location: "${from.fullPath}".`;
  }
};
function createRouterError(type, params) {
  if (process.env.NODE_ENV !== "production" || false) {
    return assign(new Error(ErrorTypeMessages[type](params)), {
      type,
      [NavigationFailureSymbol]: true
    }, params);
  } else {
    return assign(new Error(), {
      type,
      [NavigationFailureSymbol]: true
    }, params);
  }
}
function isNavigationFailure(error, type) {
  return error instanceof Error && NavigationFailureSymbol in error && (type == null || !!(error.type & type));
}
const propertiesToLog = ["params", "query", "hash"];
function stringifyRoute(to) {
  if (typeof to === "string")
    return to;
  if (to.path != null)
    return to.path;
  const location2 = {};
  for (const key of propertiesToLog) {
    if (key in to)
      location2[key] = to[key];
  }
  return JSON.stringify(location2, null, 2);
}
const BASE_PARAM_PATTERN = "[^/]+?";
const BASE_PATH_PARSER_OPTIONS = {
  sensitive: false,
  strict: false,
  start: true,
  end: true
};
const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
function tokensToParser(segments, extraOptions) {
  const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
  const score = [];
  let pattern = options.start ? "^" : "";
  const keys2 = [];
  for (const segment of segments) {
    const segmentScores = segment.length ? [] : [
      90
      /* PathScore.Root */
    ];
    if (options.strict && !segment.length)
      pattern += "/";
    for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
      const token = segment[tokenIndex];
      let subSegmentScore = 40 + (options.sensitive ? 0.25 : 0);
      if (token.type === 0) {
        if (!tokenIndex)
          pattern += "/";
        pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
        subSegmentScore += 40;
      } else if (token.type === 1) {
        const { value, repeatable, optional, regexp } = token;
        keys2.push({
          name: value,
          repeatable,
          optional
        });
        const re2 = regexp ? regexp : BASE_PARAM_PATTERN;
        if (re2 !== BASE_PARAM_PATTERN) {
          subSegmentScore += 10;
          try {
            new RegExp(`(${re2})`);
          } catch (err) {
            throw new Error(`Invalid custom RegExp for param "${value}" (${re2}): ` + err.message);
          }
        }
        let subPattern = repeatable ? `((?:${re2})(?:/(?:${re2}))*)` : `(${re2})`;
        if (!tokenIndex)
          subPattern = // avoid an optional / if there are more segments e.g. /:p?-static
          // or /:p?-:p2
          optional && segment.length < 2 ? `(?:/${subPattern})` : "/" + subPattern;
        if (optional)
          subPattern += "?";
        pattern += subPattern;
        subSegmentScore += 20;
        if (optional)
          subSegmentScore += -8;
        if (repeatable)
          subSegmentScore += -20;
        if (re2 === ".*")
          subSegmentScore += -50;
      }
      segmentScores.push(subSegmentScore);
    }
    score.push(segmentScores);
  }
  if (options.strict && options.end) {
    const i = score.length - 1;
    score[i][score[i].length - 1] += 0.7000000000000001;
  }
  if (!options.strict)
    pattern += "/?";
  if (options.end)
    pattern += "$";
  else if (options.strict && !pattern.endsWith("/"))
    pattern += "(?:/|$)";
  const re = new RegExp(pattern, options.sensitive ? "" : "i");
  function parse(path) {
    const match = path.match(re);
    const params = {};
    if (!match)
      return null;
    for (let i = 1; i < match.length; i++) {
      const value = match[i] || "";
      const key = keys2[i - 1];
      params[key.name] = value && key.repeatable ? value.split("/") : value;
    }
    return params;
  }
  function stringify(params) {
    let path = "";
    let avoidDuplicatedSlash = false;
    for (const segment of segments) {
      if (!avoidDuplicatedSlash || !path.endsWith("/"))
        path += "/";
      avoidDuplicatedSlash = false;
      for (const token of segment) {
        if (token.type === 0) {
          path += token.value;
        } else if (token.type === 1) {
          const { value, repeatable, optional } = token;
          const param = value in params ? params[value] : "";
          if (isArray(param) && !repeatable) {
            throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
          }
          const text = isArray(param) ? param.join("/") : param;
          if (!text) {
            if (optional) {
              if (segment.length < 2) {
                if (path.endsWith("/"))
                  path = path.slice(0, -1);
                else
                  avoidDuplicatedSlash = true;
              }
            } else
              throw new Error(`Missing required param "${value}"`);
          }
          path += text;
        }
      }
    }
    return path || "/";
  }
  return {
    re,
    score,
    keys: keys2,
    parse,
    stringify
  };
}
function compareScoreArray(a, b2) {
  let i = 0;
  while (i < a.length && i < b2.length) {
    const diff = b2[i] - a[i];
    if (diff)
      return diff;
    i++;
  }
  if (a.length < b2.length) {
    return a.length === 1 && a[0] === 40 + 40 ? -1 : 1;
  } else if (a.length > b2.length) {
    return b2.length === 1 && b2[0] === 40 + 40 ? 1 : -1;
  }
  return 0;
}
function comparePathParserScore(a, b2) {
  let i = 0;
  const aScore = a.score;
  const bScore = b2.score;
  while (i < aScore.length && i < bScore.length) {
    const comp = compareScoreArray(aScore[i], bScore[i]);
    if (comp)
      return comp;
    i++;
  }
  if (Math.abs(bScore.length - aScore.length) === 1) {
    if (isLastScoreNegative(aScore))
      return 1;
    if (isLastScoreNegative(bScore))
      return -1;
  }
  return bScore.length - aScore.length;
}
function isLastScoreNegative(score) {
  const last = score[score.length - 1];
  return score.length > 0 && last[last.length - 1] < 0;
}
const ROOT_TOKEN = {
  type: 0,
  value: ""
};
const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
function tokenizePath(path) {
  if (!path)
    return [[]];
  if (path === "/")
    return [[ROOT_TOKEN]];
  if (!path.startsWith("/")) {
    throw new Error(process.env.NODE_ENV !== "production" ? `Route paths should start with a "/": "${path}" should be "/${path}".` : `Invalid path "${path}"`);
  }
  function crash(message) {
    throw new Error(`ERR (${state})/"${buffer}": ${message}`);
  }
  let state = 0;
  let previousState = state;
  const tokens = [];
  let segment;
  function finalizeSegment() {
    if (segment)
      tokens.push(segment);
    segment = [];
  }
  let i = 0;
  let char;
  let buffer = "";
  let customRe = "";
  function consumeBuffer() {
    if (!buffer)
      return;
    if (state === 0) {
      segment.push({
        type: 0,
        value: buffer
      });
    } else if (state === 1 || state === 2 || state === 3) {
      if (segment.length > 1 && (char === "*" || char === "+"))
        crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
      segment.push({
        type: 1,
        value: buffer,
        regexp: customRe,
        repeatable: char === "*" || char === "+",
        optional: char === "*" || char === "?"
      });
    } else {
      crash("Invalid state to consume buffer");
    }
    buffer = "";
  }
  function addCharToBuffer() {
    buffer += char;
  }
  while (i < path.length) {
    char = path[i++];
    if (char === "\\" && state !== 2) {
      previousState = state;
      state = 4;
      continue;
    }
    switch (state) {
      case 0:
        if (char === "/") {
          if (buffer) {
            consumeBuffer();
          }
          finalizeSegment();
        } else if (char === ":") {
          consumeBuffer();
          state = 1;
        } else {
          addCharToBuffer();
        }
        break;
      case 4:
        addCharToBuffer();
        state = previousState;
        break;
      case 1:
        if (char === "(") {
          state = 2;
        } else if (VALID_PARAM_RE.test(char)) {
          addCharToBuffer();
        } else {
          consumeBuffer();
          state = 0;
          if (char !== "*" && char !== "?" && char !== "+")
            i--;
        }
        break;
      case 2:
        if (char === ")") {
          if (customRe[customRe.length - 1] == "\\")
            customRe = customRe.slice(0, -1) + char;
          else
            state = 3;
        } else {
          customRe += char;
        }
        break;
      case 3:
        consumeBuffer();
        state = 0;
        if (char !== "*" && char !== "?" && char !== "+")
          i--;
        customRe = "";
        break;
      default:
        crash("Unknown state");
        break;
    }
  }
  if (state === 2)
    crash(`Unfinished custom RegExp for param "${buffer}"`);
  consumeBuffer();
  finalizeSegment();
  return tokens;
}
function createRouteRecordMatcher(record, parent, options) {
  const parser = tokensToParser(tokenizePath(record.path), options);
  if (process.env.NODE_ENV !== "production") {
    const existingKeys = /* @__PURE__ */ new Set();
    for (const key of parser.keys) {
      if (existingKeys.has(key.name))
        warn(`Found duplicated params with name "${key.name}" for path "${record.path}". Only the last one will be available on "$route.params".`);
      existingKeys.add(key.name);
    }
  }
  const matcher = assign(parser, {
    record,
    parent,
    // these needs to be populated by the parent
    children: [],
    alias: []
  });
  if (parent) {
    if (!matcher.record.aliasOf === !parent.record.aliasOf)
      parent.children.push(matcher);
  }
  return matcher;
}
function createRouterMatcher(routes2, globalOptions) {
  const matchers = [];
  const matcherMap = /* @__PURE__ */ new Map();
  globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions);
  function getRecordMatcher(name) {
    return matcherMap.get(name);
  }
  function addRoute(record, parent, originalRecord) {
    const isRootAdd = !originalRecord;
    const mainNormalizedRecord = normalizeRouteRecord(record);
    if (process.env.NODE_ENV !== "production") {
      checkChildMissingNameWithEmptyPath(mainNormalizedRecord, parent);
    }
    mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
    const options = mergeOptions(globalOptions, record);
    const normalizedRecords = [mainNormalizedRecord];
    if ("alias" in record) {
      const aliases2 = typeof record.alias === "string" ? [record.alias] : record.alias;
      for (const alias of aliases2) {
        normalizedRecords.push(
          // we need to normalize again to ensure the `mods` property
          // being non enumerable
          normalizeRouteRecord(assign({}, mainNormalizedRecord, {
            // this allows us to hold a copy of the `components` option
            // so that async components cache is hold on the original record
            components: originalRecord ? originalRecord.record.components : mainNormalizedRecord.components,
            path: alias,
            // we might be the child of an alias
            aliasOf: originalRecord ? originalRecord.record : mainNormalizedRecord
            // the aliases are always of the same kind as the original since they
            // are defined on the same record
          }))
        );
      }
    }
    let matcher;
    let originalMatcher;
    for (const normalizedRecord of normalizedRecords) {
      const { path } = normalizedRecord;
      if (parent && path[0] !== "/") {
        const parentPath = parent.record.path;
        const connectingSlash = parentPath[parentPath.length - 1] === "/" ? "" : "/";
        normalizedRecord.path = parent.record.path + (path && connectingSlash + path);
      }
      if (process.env.NODE_ENV !== "production" && normalizedRecord.path === "*") {
        throw new Error('Catch all routes ("*") must now be defined using a param with a custom regexp.\nSee more at https://router.vuejs.org/guide/migration/#Removed-star-or-catch-all-routes.');
      }
      matcher = createRouteRecordMatcher(normalizedRecord, parent, options);
      if (process.env.NODE_ENV !== "production" && parent && path[0] === "/")
        checkMissingParamsInAbsolutePath(matcher, parent);
      if (originalRecord) {
        originalRecord.alias.push(matcher);
        if (process.env.NODE_ENV !== "production") {
          checkSameParams(originalRecord, matcher);
        }
      } else {
        originalMatcher = originalMatcher || matcher;
        if (originalMatcher !== matcher)
          originalMatcher.alias.push(matcher);
        if (isRootAdd && record.name && !isAliasRecord(matcher)) {
          if (process.env.NODE_ENV !== "production") {
            checkSameNameAsAncestor(record, parent);
          }
          removeRoute(record.name);
        }
      }
      if (isMatchable(matcher)) {
        insertMatcher(matcher);
      }
      if (mainNormalizedRecord.children) {
        const children = mainNormalizedRecord.children;
        for (let i = 0; i < children.length; i++) {
          addRoute(children[i], matcher, originalRecord && originalRecord.children[i]);
        }
      }
      originalRecord = originalRecord || matcher;
    }
    return originalMatcher ? () => {
      removeRoute(originalMatcher);
    } : noop;
  }
  function removeRoute(matcherRef) {
    if (isRouteName(matcherRef)) {
      const matcher = matcherMap.get(matcherRef);
      if (matcher) {
        matcherMap.delete(matcherRef);
        matchers.splice(matchers.indexOf(matcher), 1);
        matcher.children.forEach(removeRoute);
        matcher.alias.forEach(removeRoute);
      }
    } else {
      const index = matchers.indexOf(matcherRef);
      if (index > -1) {
        matchers.splice(index, 1);
        if (matcherRef.record.name)
          matcherMap.delete(matcherRef.record.name);
        matcherRef.children.forEach(removeRoute);
        matcherRef.alias.forEach(removeRoute);
      }
    }
  }
  function getRoutes() {
    return matchers;
  }
  function insertMatcher(matcher) {
    const index = findInsertionIndex(matcher, matchers);
    matchers.splice(index, 0, matcher);
    if (matcher.record.name && !isAliasRecord(matcher))
      matcherMap.set(matcher.record.name, matcher);
  }
  function resolve(location2, currentLocation) {
    let matcher;
    let params = {};
    let path;
    let name;
    if ("name" in location2 && location2.name) {
      matcher = matcherMap.get(location2.name);
      if (!matcher)
        throw createRouterError(1, {
          location: location2
        });
      if (process.env.NODE_ENV !== "production") {
        const invalidParams = Object.keys(location2.params || {}).filter((paramName) => !matcher.keys.find((k2) => k2.name === paramName));
        if (invalidParams.length) {
          warn(`Discarded invalid param(s) "${invalidParams.join('", "')}" when navigating. See https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md#414-2022-08-22 for more details.`);
        }
      }
      name = matcher.record.name;
      params = assign(
        // paramsFromLocation is a new object
        paramsFromLocation(
          currentLocation.params,
          // only keep params that exist in the resolved location
          // only keep optional params coming from a parent record
          matcher.keys.filter((k2) => !k2.optional).concat(matcher.parent ? matcher.parent.keys.filter((k2) => k2.optional) : []).map((k2) => k2.name)
        ),
        // discard any existing params in the current location that do not exist here
        // #1497 this ensures better active/exact matching
        location2.params && paramsFromLocation(location2.params, matcher.keys.map((k2) => k2.name))
      );
      path = matcher.stringify(params);
    } else if (location2.path != null) {
      path = location2.path;
      if (process.env.NODE_ENV !== "production" && !path.startsWith("/")) {
        warn(`The Matcher cannot resolve relative paths but received "${path}". Unless you directly called \`matcher.resolve("${path}")\`, this is probably a bug in vue-router. Please open an issue at https://github.com/vuejs/router/issues/new/choose.`);
      }
      matcher = matchers.find((m) => m.re.test(path));
      if (matcher) {
        params = matcher.parse(path);
        name = matcher.record.name;
      }
    } else {
      matcher = currentLocation.name ? matcherMap.get(currentLocation.name) : matchers.find((m) => m.re.test(currentLocation.path));
      if (!matcher)
        throw createRouterError(1, {
          location: location2,
          currentLocation
        });
      name = matcher.record.name;
      params = assign({}, currentLocation.params, location2.params);
      path = matcher.stringify(params);
    }
    const matched = [];
    let parentMatcher = matcher;
    while (parentMatcher) {
      matched.unshift(parentMatcher.record);
      parentMatcher = parentMatcher.parent;
    }
    return {
      name,
      path,
      params,
      matched,
      meta: mergeMetaFields(matched)
    };
  }
  routes2.forEach((route) => addRoute(route));
  function clearRoutes() {
    matchers.length = 0;
    matcherMap.clear();
  }
  return {
    addRoute,
    resolve,
    removeRoute,
    clearRoutes,
    getRoutes,
    getRecordMatcher
  };
}
function paramsFromLocation(params, keys2) {
  const newParams = {};
  for (const key of keys2) {
    if (key in params)
      newParams[key] = params[key];
  }
  return newParams;
}
function normalizeRouteRecord(record) {
  const normalized = {
    path: record.path,
    redirect: record.redirect,
    name: record.name,
    meta: record.meta || {},
    aliasOf: record.aliasOf,
    beforeEnter: record.beforeEnter,
    props: normalizeRecordProps(record),
    children: record.children || [],
    instances: {},
    leaveGuards: /* @__PURE__ */ new Set(),
    updateGuards: /* @__PURE__ */ new Set(),
    enterCallbacks: {},
    // must be declared afterwards
    // mods: {},
    components: "components" in record ? record.components || null : record.component && { default: record.component }
  };
  Object.defineProperty(normalized, "mods", {
    value: {}
  });
  return normalized;
}
function normalizeRecordProps(record) {
  const propsObject = {};
  const props = record.props || false;
  if ("component" in record) {
    propsObject.default = props;
  } else {
    for (const name in record.components)
      propsObject[name] = typeof props === "object" ? props[name] : props;
  }
  return propsObject;
}
function isAliasRecord(record) {
  while (record) {
    if (record.record.aliasOf)
      return true;
    record = record.parent;
  }
  return false;
}
function mergeMetaFields(matched) {
  return matched.reduce((meta, record) => assign(meta, record.meta), {});
}
function mergeOptions(defaults, partialOptions) {
  const options = {};
  for (const key in defaults) {
    options[key] = key in partialOptions ? partialOptions[key] : defaults[key];
  }
  return options;
}
function isSameParam(a, b2) {
  return a.name === b2.name && a.optional === b2.optional && a.repeatable === b2.repeatable;
}
function checkSameParams(a, b2) {
  for (const key of a.keys) {
    if (!key.optional && !b2.keys.find(isSameParam.bind(null, key)))
      return warn(`Alias "${b2.record.path}" and the original record: "${a.record.path}" must have the exact same param named "${key.name}"`);
  }
  for (const key of b2.keys) {
    if (!key.optional && !a.keys.find(isSameParam.bind(null, key)))
      return warn(`Alias "${b2.record.path}" and the original record: "${a.record.path}" must have the exact same param named "${key.name}"`);
  }
}
function checkChildMissingNameWithEmptyPath(mainNormalizedRecord, parent) {
  if (parent && parent.record.name && !mainNormalizedRecord.name && !mainNormalizedRecord.path) {
    warn(`The route named "${String(parent.record.name)}" has a child without a name and an empty path. Using that name won't render the empty path child so you probably want to move the name to the child instead. If this is intentional, add a name to the child route to remove the warning.`);
  }
}
function checkSameNameAsAncestor(record, parent) {
  for (let ancestor = parent; ancestor; ancestor = ancestor.parent) {
    if (ancestor.record.name === record.name) {
      throw new Error(`A route named "${String(record.name)}" has been added as a ${parent === ancestor ? "child" : "descendant"} of a route with the same name. Route names must be unique and a nested route cannot use the same name as an ancestor.`);
    }
  }
}
function checkMissingParamsInAbsolutePath(record, parent) {
  for (const key of parent.keys) {
    if (!record.keys.find(isSameParam.bind(null, key)))
      return warn(`Absolute path "${record.record.path}" must have the exact same param named "${key.name}" as its parent "${parent.record.path}".`);
  }
}
function findInsertionIndex(matcher, matchers) {
  let lower = 0;
  let upper = matchers.length;
  while (lower !== upper) {
    const mid = lower + upper >> 1;
    const sortOrder = comparePathParserScore(matcher, matchers[mid]);
    if (sortOrder < 0) {
      upper = mid;
    } else {
      lower = mid + 1;
    }
  }
  const insertionAncestor = getInsertionAncestor(matcher);
  if (insertionAncestor) {
    upper = matchers.lastIndexOf(insertionAncestor, upper - 1);
    if (process.env.NODE_ENV !== "production" && upper < 0) {
      warn(`Finding ancestor route "${insertionAncestor.record.path}" failed for "${matcher.record.path}"`);
    }
  }
  return upper;
}
function getInsertionAncestor(matcher) {
  let ancestor = matcher;
  while (ancestor = ancestor.parent) {
    if (isMatchable(ancestor) && comparePathParserScore(matcher, ancestor) === 0) {
      return ancestor;
    }
  }
  return;
}
function isMatchable({ record }) {
  return !!(record.name || record.components && Object.keys(record.components).length || record.redirect);
}
function parseQuery(search) {
  const query = {};
  if (search === "" || search === "?")
    return query;
  const hasLeadingIM = search[0] === "?";
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
  for (let i = 0; i < searchParams.length; ++i) {
    const searchParam = searchParams[i].replace(PLUS_RE, " ");
    const eqPos = searchParam.indexOf("=");
    const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
    const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));
    if (key in query) {
      let currentValue = query[key];
      if (!isArray(currentValue)) {
        currentValue = query[key] = [currentValue];
      }
      currentValue.push(value);
    } else {
      query[key] = value;
    }
  }
  return query;
}
function stringifyQuery(query) {
  let search = "";
  for (let key in query) {
    const value = query[key];
    key = encodeQueryKey(key);
    if (value == null) {
      if (value !== void 0) {
        search += (search.length ? "&" : "") + key;
      }
      continue;
    }
    const values = isArray(value) ? value.map((v) => v && encodeQueryValue(v)) : [value && encodeQueryValue(value)];
    values.forEach((value2) => {
      if (value2 !== void 0) {
        search += (search.length ? "&" : "") + key;
        if (value2 != null)
          search += "=" + value2;
      }
    });
  }
  return search;
}
function normalizeQuery(query) {
  const normalizedQuery = {};
  for (const key in query) {
    const value = query[key];
    if (value !== void 0) {
      normalizedQuery[key] = isArray(value) ? value.map((v) => v == null ? null : "" + v) : value == null ? value : "" + value;
    }
  }
  return normalizedQuery;
}
const matchedRouteKey = Symbol(process.env.NODE_ENV !== "production" ? "router view location matched" : "");
const viewDepthKey = Symbol(process.env.NODE_ENV !== "production" ? "router view depth" : "");
const routerKey = Symbol(process.env.NODE_ENV !== "production" ? "router" : "");
const routeLocationKey = Symbol(process.env.NODE_ENV !== "production" ? "route location" : "");
const routerViewLocationKey = Symbol(process.env.NODE_ENV !== "production" ? "router view location" : "");
function useCallbacks() {
  let handlers = [];
  function add(handler) {
    handlers.push(handler);
    return () => {
      const i = handlers.indexOf(handler);
      if (i > -1)
        handlers.splice(i, 1);
    };
  }
  function reset() {
    handlers = [];
  }
  return {
    add,
    list: () => handlers.slice(),
    reset
  };
}
function guardToPromiseFn(guard, to, from, record, name, runWithContext = (fn) => fn()) {
  const enterCallbackArray = record && // name is defined if record is because of the function overload
  (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
  return () => new Promise((resolve, reject) => {
    const next = (valid) => {
      if (valid === false) {
        reject(createRouterError(4, {
          from,
          to
        }));
      } else if (valid instanceof Error) {
        reject(valid);
      } else if (isRouteLocation(valid)) {
        reject(createRouterError(2, {
          from: to,
          to: valid
        }));
      } else {
        if (enterCallbackArray && // since enterCallbackArray is truthy, both record and name also are
        record.enterCallbacks[name] === enterCallbackArray && typeof valid === "function") {
          enterCallbackArray.push(valid);
        }
        resolve();
      }
    };
    const guardReturn = runWithContext(() => guard.call(record && record.instances[name], to, from, process.env.NODE_ENV !== "production" ? canOnlyBeCalledOnce(next, to, from) : next));
    let guardCall = Promise.resolve(guardReturn);
    if (guard.length < 3)
      guardCall = guardCall.then(next);
    if (process.env.NODE_ENV !== "production" && guard.length > 2) {
      const message = `The "next" callback was never called inside of ${guard.name ? '"' + guard.name + '"' : ""}:
${guard.toString()}
. If you are returning a value instead of calling "next", make sure to remove the "next" parameter from your function.`;
      if (typeof guardReturn === "object" && "then" in guardReturn) {
        guardCall = guardCall.then((resolvedValue) => {
          if (!next._called) {
            warn(message);
            return Promise.reject(new Error("Invalid navigation guard"));
          }
          return resolvedValue;
        });
      } else if (guardReturn !== void 0) {
        if (!next._called) {
          warn(message);
          reject(new Error("Invalid navigation guard"));
          return;
        }
      }
    }
    guardCall.catch((err) => reject(err));
  });
}
function canOnlyBeCalledOnce(next, to, from) {
  let called = 0;
  return function() {
    if (called++ === 1)
      warn(`The "next" callback was called more than once in one navigation guard when going from "${from.fullPath}" to "${to.fullPath}". It should be called exactly one time in each navigation guard. This will fail in production.`);
    next._called = true;
    if (called === 1)
      next.apply(null, arguments);
  };
}
function extractComponentsGuards(matched, guardType, to, from, runWithContext = (fn) => fn()) {
  const guards = [];
  for (const record of matched) {
    if (process.env.NODE_ENV !== "production" && !record.components && !record.children.length) {
      warn(`Record with path "${record.path}" is either missing a "component(s)" or "children" property.`);
    }
    for (const name in record.components) {
      let rawComponent = record.components[name];
      if (process.env.NODE_ENV !== "production") {
        if (!rawComponent || typeof rawComponent !== "object" && typeof rawComponent !== "function") {
          warn(`Component "${name}" in record with path "${record.path}" is not a valid component. Received "${String(rawComponent)}".`);
          throw new Error("Invalid route component");
        } else if ("then" in rawComponent) {
          warn(`Component "${name}" in record with path "${record.path}" is a Promise instead of a function that returns a Promise. Did you write "import('./MyPage.vue')" instead of "() => import('./MyPage.vue')" ? This will break in production if not fixed.`);
          const promise = rawComponent;
          rawComponent = () => promise;
        } else if (rawComponent.__asyncLoader && // warn only once per component
        !rawComponent.__warnedDefineAsync) {
          rawComponent.__warnedDefineAsync = true;
          warn(`Component "${name}" in record with path "${record.path}" is defined using "defineAsyncComponent()". Write "() => import('./MyPage.vue')" instead of "defineAsyncComponent(() => import('./MyPage.vue'))".`);
        }
      }
      if (guardType !== "beforeRouteEnter" && !record.instances[name])
        continue;
      if (isRouteComponent(rawComponent)) {
        const options = rawComponent.__vccOpts || rawComponent;
        const guard = options[guardType];
        guard && guards.push(guardToPromiseFn(guard, to, from, record, name, runWithContext));
      } else {
        let componentPromise = rawComponent();
        if (process.env.NODE_ENV !== "production" && !("catch" in componentPromise)) {
          warn(`Component "${name}" in record with path "${record.path}" is a function that does not return a Promise. If you were passing a functional component, make sure to add a "displayName" to the component. This will break in production if not fixed.`);
          componentPromise = Promise.resolve(componentPromise);
        }
        guards.push(() => componentPromise.then((resolved) => {
          if (!resolved)
            throw new Error(`Couldn't resolve component "${name}" at "${record.path}"`);
          const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
          record.mods[name] = resolved;
          record.components[name] = resolvedComponent;
          const options = resolvedComponent.__vccOpts || resolvedComponent;
          const guard = options[guardType];
          return guard && guardToPromiseFn(guard, to, from, record, name, runWithContext)();
        }));
      }
    }
  }
  return guards;
}
function useLink$1(props) {
  const router2 = inject$1(routerKey);
  const currentRoute = inject$1(routeLocationKey);
  let hasPrevious = false;
  let previousTo = null;
  const route = computed(() => {
    const to = unref(props.to);
    if (process.env.NODE_ENV !== "production" && (!hasPrevious || to !== previousTo)) {
      if (!isRouteLocation(to)) {
        if (hasPrevious) {
          warn(`Invalid value for prop "to" in useLink()
- to:`, to, `
- previous to:`, previousTo, `
- props:`, props);
        } else {
          warn(`Invalid value for prop "to" in useLink()
- to:`, to, `
- props:`, props);
        }
      }
      previousTo = to;
      hasPrevious = true;
    }
    return router2.resolve(to);
  });
  const activeRecordIndex = computed(() => {
    const { matched } = route.value;
    const { length } = matched;
    const routeMatched = matched[length - 1];
    const currentMatched = currentRoute.matched;
    if (!routeMatched || !currentMatched.length)
      return -1;
    const index = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
    if (index > -1)
      return index;
    const parentRecordPath = getOriginalPath(matched[length - 2]);
    return (
      // we are dealing with nested routes
      length > 1 && // if the parent and matched route have the same path, this link is
      // referring to the empty child. Or we currently are on a different
      // child of the same parent
      getOriginalPath(routeMatched) === parentRecordPath && // avoid comparing the child with its parent
      currentMatched[currentMatched.length - 1].path !== parentRecordPath ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2])) : index
    );
  });
  const isActive = computed(() => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params));
  const isExactActive = computed(() => activeRecordIndex.value > -1 && activeRecordIndex.value === currentRoute.matched.length - 1 && isSameRouteLocationParams(currentRoute.params, route.value.params));
  function navigate(e = {}) {
    if (guardEvent(e)) {
      const p = router2[unref(props.replace) ? "replace" : "push"](
        unref(props.to)
        // avoid uncaught errors are they are logged anyway
      ).catch(noop);
      if (props.viewTransition && typeof document !== "undefined" && "startViewTransition" in document) {
        document.startViewTransition(() => p);
      }
      return p;
    }
    return Promise.resolve();
  }
  if ((process.env.NODE_ENV !== "production" || false) && isBrowser) {
    const instance = getCurrentInstance$1();
    if (instance) {
      const linkContextDevtools = {
        route: route.value,
        isActive: isActive.value,
        isExactActive: isExactActive.value,
        error: null
      };
      instance.__vrl_devtools = instance.__vrl_devtools || [];
      instance.__vrl_devtools.push(linkContextDevtools);
      watchEffect(() => {
        linkContextDevtools.route = route.value;
        linkContextDevtools.isActive = isActive.value;
        linkContextDevtools.isExactActive = isExactActive.value;
        linkContextDevtools.error = isRouteLocation(unref(props.to)) ? null : 'Invalid "to" value';
      }, { flush: "post" });
    }
  }
  return {
    route,
    href: computed(() => route.value.href),
    isActive,
    isExactActive,
    navigate
  };
}
function preferSingleVNode(vnodes) {
  return vnodes.length === 1 ? vnodes[0] : vnodes;
}
const RouterLinkImpl = /* @__PURE__ */ defineComponent$1({
  name: "RouterLink",
  compatConfig: { MODE: 3 },
  props: {
    to: {
      type: [String, Object],
      required: true
    },
    replace: Boolean,
    activeClass: String,
    // inactiveClass: String,
    exactActiveClass: String,
    custom: Boolean,
    ariaCurrentValue: {
      type: String,
      default: "page"
    }
  },
  useLink: useLink$1,
  setup(props, { slots }) {
    const link = reactive(useLink$1(props));
    const { options } = inject$1(routerKey);
    const elClass = computed(() => ({
      [getLinkClass(props.activeClass, options.linkActiveClass, "router-link-active")]: link.isActive,
      // [getLinkClass(
      //   props.inactiveClass,
      //   options.linkInactiveClass,
      //   'router-link-inactive'
      // )]: !link.isExactActive,
      [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, "router-link-exact-active")]: link.isExactActive
    }));
    return () => {
      const children = slots.default && preferSingleVNode(slots.default(link));
      return props.custom ? children : h("a", {
        "aria-current": link.isExactActive ? props.ariaCurrentValue : null,
        href: link.href,
        // this would override user added attrs but Vue will still add
        // the listener, so we end up triggering both
        onClick: link.navigate,
        class: elClass.value
      }, children);
    };
  }
});
const RouterLink = RouterLinkImpl;
function guardEvent(e) {
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
    return;
  if (e.defaultPrevented)
    return;
  if (e.button !== void 0 && e.button !== 0)
    return;
  if (e.currentTarget && e.currentTarget.getAttribute) {
    const target = e.currentTarget.getAttribute("target");
    if (/\b_blank\b/i.test(target))
      return;
  }
  if (e.preventDefault)
    e.preventDefault();
  return true;
}
function includesParams(outer, inner) {
  for (const key in inner) {
    const innerValue = inner[key];
    const outerValue = outer[key];
    if (typeof innerValue === "string") {
      if (innerValue !== outerValue)
        return false;
    } else {
      if (!isArray(outerValue) || outerValue.length !== innerValue.length || innerValue.some((value, i) => value !== outerValue[i]))
        return false;
    }
  }
  return true;
}
function getOriginalPath(record) {
  return record ? record.aliasOf ? record.aliasOf.path : record.path : "";
}
const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null ? propClass : globalClass != null ? globalClass : defaultClass;
const RouterViewImpl = /* @__PURE__ */ defineComponent$1({
  name: "RouterView",
  // #674 we manually inherit them
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: "default"
    },
    route: Object
  },
  // Better compat for @vue/compat users
  // https://github.com/vuejs/router/issues/1315
  compatConfig: { MODE: 3 },
  setup(props, { attrs, slots }) {
    process.env.NODE_ENV !== "production" && warnDeprecatedUsage();
    const injectedRoute = inject$1(routerViewLocationKey);
    const routeToDisplay = computed(() => props.route || injectedRoute.value);
    const injectedDepth = inject$1(viewDepthKey, 0);
    const depth = computed(() => {
      let initialDepth = unref(injectedDepth);
      const { matched } = routeToDisplay.value;
      let matchedRoute;
      while ((matchedRoute = matched[initialDepth]) && !matchedRoute.components) {
        initialDepth++;
      }
      return initialDepth;
    });
    const matchedRouteRef = computed(() => routeToDisplay.value.matched[depth.value]);
    provide(viewDepthKey, computed(() => depth.value + 1));
    provide(matchedRouteKey, matchedRouteRef);
    provide(routerViewLocationKey, routeToDisplay);
    const viewRef = ref();
    watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
      if (to) {
        to.instances[name] = instance;
        if (from && from !== to && instance && instance === oldInstance) {
          if (!to.leaveGuards.size) {
            to.leaveGuards = from.leaveGuards;
          }
          if (!to.updateGuards.size) {
            to.updateGuards = from.updateGuards;
          }
        }
      }
      if (instance && to && // if there is no instance but to and from are the same this might be
      // the first visit
      (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
        (to.enterCallbacks[name] || []).forEach((callback) => callback(instance));
      }
    }, { flush: "post" });
    return () => {
      const route = routeToDisplay.value;
      const currentName = props.name;
      const matchedRoute = matchedRouteRef.value;
      const ViewComponent = matchedRoute && matchedRoute.components[currentName];
      if (!ViewComponent) {
        return normalizeSlot(slots.default, { Component: ViewComponent, route });
      }
      const routePropsOption = matchedRoute.props[currentName];
      const routeProps = routePropsOption ? routePropsOption === true ? route.params : typeof routePropsOption === "function" ? routePropsOption(route) : routePropsOption : null;
      const onVnodeUnmounted = (vnode) => {
        if (vnode.component.isUnmounted) {
          matchedRoute.instances[currentName] = null;
        }
      };
      const component = h(ViewComponent, assign({}, routeProps, attrs, {
        onVnodeUnmounted,
        ref: viewRef
      }));
      if ((process.env.NODE_ENV !== "production" || false) && isBrowser && component.ref) {
        const info = {
          depth: depth.value,
          name: matchedRoute.name,
          path: matchedRoute.path,
          meta: matchedRoute.meta
        };
        const internalInstances = isArray(component.ref) ? component.ref.map((r2) => r2.i) : [component.ref.i];
        internalInstances.forEach((instance) => {
          instance.__vrv_devtools = info;
        });
      }
      return (
        // pass the vnode to the slot as a prop.
        // h and <component :is="..."> both accept vnodes
        normalizeSlot(slots.default, { Component: component, route }) || component
      );
    };
  }
});
function normalizeSlot(slot, data) {
  if (!slot)
    return null;
  const slotContent = slot(data);
  return slotContent.length === 1 ? slotContent[0] : slotContent;
}
const RouterView = RouterViewImpl;
function warnDeprecatedUsage() {
  const instance = getCurrentInstance$1();
  const parentName = instance.parent && instance.parent.type.name;
  const parentSubTreeType = instance.parent && instance.parent.subTree && instance.parent.subTree.type;
  if (parentName && (parentName === "KeepAlive" || parentName.includes("Transition")) && typeof parentSubTreeType === "object" && parentSubTreeType.name === "RouterView") {
    const comp = parentName === "KeepAlive" ? "keep-alive" : "transition";
    warn(`<router-view> can no longer be used directly inside <transition> or <keep-alive>.
Use slot props instead:

<router-view v-slot="{ Component }">
  <${comp}>
    <component :is="Component" />
  </${comp}>
</router-view>`);
  }
}
function formatRouteLocation(routeLocation, tooltip) {
  const copy = assign({}, routeLocation, {
    // remove variables that can contain vue instances
    matched: routeLocation.matched.map((matched) => omit(matched, ["instances", "children", "aliasOf"]))
  });
  return {
    _custom: {
      type: null,
      readOnly: true,
      display: routeLocation.fullPath,
      tooltip,
      value: copy
    }
  };
}
function formatDisplay(display) {
  return {
    _custom: {
      display
    }
  };
}
let routerId = 0;
function addDevtools(app, router2, matcher) {
  if (router2.__hasDevtools)
    return;
  router2.__hasDevtools = true;
  const id = routerId++;
  setupDevtoolsPlugin({
    id: "org.vuejs.router" + (id ? "." + id : ""),
    label: "Vue Router",
    packageName: "vue-router",
    homepage: "https://router.vuejs.org",
    logo: "https://router.vuejs.org/logo.png",
    componentStateTypes: ["Routing"],
    app
  }, (api) => {
    if (typeof api.now !== "function") {
      console.warn("[Vue Router]: You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
    }
    api.on.inspectComponent((payload, ctx) => {
      if (payload.instanceData) {
        payload.instanceData.state.push({
          type: "Routing",
          key: "$route",
          editable: false,
          value: formatRouteLocation(router2.currentRoute.value, "Current Route")
        });
      }
    });
    api.on.visitComponentTree(({ treeNode: node, componentInstance }) => {
      if (componentInstance.__vrv_devtools) {
        const info = componentInstance.__vrv_devtools;
        node.tags.push({
          label: (info.name ? `${info.name.toString()}: ` : "") + info.path,
          textColor: 0,
          tooltip: "This component is rendered by &lt;router-view&gt;",
          backgroundColor: PINK_500
        });
      }
      if (isArray(componentInstance.__vrl_devtools)) {
        componentInstance.__devtoolsApi = api;
        componentInstance.__vrl_devtools.forEach((devtoolsData) => {
          let label = devtoolsData.route.path;
          let backgroundColor = ORANGE_400;
          let tooltip = "";
          let textColor = 0;
          if (devtoolsData.error) {
            label = devtoolsData.error;
            backgroundColor = RED_100;
            textColor = RED_700;
          } else if (devtoolsData.isExactActive) {
            backgroundColor = LIME_500;
            tooltip = "This is exactly active";
          } else if (devtoolsData.isActive) {
            backgroundColor = BLUE_600;
            tooltip = "This link is active";
          }
          node.tags.push({
            label,
            textColor,
            tooltip,
            backgroundColor
          });
        });
      }
    });
    watch(router2.currentRoute, () => {
      refreshRoutesView();
      api.notifyComponentUpdate();
      api.sendInspectorTree(routerInspectorId);
      api.sendInspectorState(routerInspectorId);
    });
    const navigationsLayerId = "router:navigations:" + id;
    api.addTimelineLayer({
      id: navigationsLayerId,
      label: `Router${id ? " " + id : ""} Navigations`,
      color: 4237508
    });
    router2.onError((error, to) => {
      api.addTimelineEvent({
        layerId: navigationsLayerId,
        event: {
          title: "Error during Navigation",
          subtitle: to.fullPath,
          logType: "error",
          time: api.now(),
          data: { error },
          groupId: to.meta.__navigationId
        }
      });
    });
    let navigationId = 0;
    router2.beforeEach((to, from) => {
      const data = {
        guard: formatDisplay("beforeEach"),
        from: formatRouteLocation(from, "Current Location during this navigation"),
        to: formatRouteLocation(to, "Target location")
      };
      Object.defineProperty(to.meta, "__navigationId", {
        value: navigationId++
      });
      api.addTimelineEvent({
        layerId: navigationsLayerId,
        event: {
          time: api.now(),
          title: "Start of navigation",
          subtitle: to.fullPath,
          data,
          groupId: to.meta.__navigationId
        }
      });
    });
    router2.afterEach((to, from, failure) => {
      const data = {
        guard: formatDisplay("afterEach")
      };
      if (failure) {
        data.failure = {
          _custom: {
            type: Error,
            readOnly: true,
            display: failure ? failure.message : "",
            tooltip: "Navigation Failure",
            value: failure
          }
        };
        data.status = formatDisplay("❌");
      } else {
        data.status = formatDisplay("✅");
      }
      data.from = formatRouteLocation(from, "Current Location during this navigation");
      data.to = formatRouteLocation(to, "Target location");
      api.addTimelineEvent({
        layerId: navigationsLayerId,
        event: {
          title: "End of navigation",
          subtitle: to.fullPath,
          time: api.now(),
          data,
          logType: failure ? "warning" : "default",
          groupId: to.meta.__navigationId
        }
      });
    });
    const routerInspectorId = "router-inspector:" + id;
    api.addInspector({
      id: routerInspectorId,
      label: "Routes" + (id ? " " + id : ""),
      icon: "book",
      treeFilterPlaceholder: "Search routes"
    });
    function refreshRoutesView() {
      if (!activeRoutesPayload)
        return;
      const payload = activeRoutesPayload;
      let routes2 = matcher.getRoutes().filter((route) => !route.parent || // these routes have a parent with no component which will not appear in the view
      // therefore we still need to include them
      !route.parent.record.components);
      routes2.forEach(resetMatchStateOnRouteRecord);
      if (payload.filter) {
        routes2 = routes2.filter((route) => (
          // save matches state based on the payload
          isRouteMatching(route, payload.filter.toLowerCase())
        ));
      }
      routes2.forEach((route) => markRouteRecordActive(route, router2.currentRoute.value));
      payload.rootNodes = routes2.map(formatRouteRecordForInspector);
    }
    let activeRoutesPayload;
    api.on.getInspectorTree((payload) => {
      activeRoutesPayload = payload;
      if (payload.app === app && payload.inspectorId === routerInspectorId) {
        refreshRoutesView();
      }
    });
    api.on.getInspectorState((payload) => {
      if (payload.app === app && payload.inspectorId === routerInspectorId) {
        const routes2 = matcher.getRoutes();
        const route = routes2.find((route2) => route2.record.__vd_id === payload.nodeId);
        if (route) {
          payload.state = {
            options: formatRouteRecordMatcherForStateInspector(route)
          };
        }
      }
    });
    api.sendInspectorTree(routerInspectorId);
    api.sendInspectorState(routerInspectorId);
  });
}
function modifierForKey(key) {
  if (key.optional) {
    return key.repeatable ? "*" : "?";
  } else {
    return key.repeatable ? "+" : "";
  }
}
function formatRouteRecordMatcherForStateInspector(route) {
  const { record } = route;
  const fields = [
    { editable: false, key: "path", value: record.path }
  ];
  if (record.name != null) {
    fields.push({
      editable: false,
      key: "name",
      value: record.name
    });
  }
  fields.push({ editable: false, key: "regexp", value: route.re });
  if (route.keys.length) {
    fields.push({
      editable: false,
      key: "keys",
      value: {
        _custom: {
          type: null,
          readOnly: true,
          display: route.keys.map((key) => `${key.name}${modifierForKey(key)}`).join(" "),
          tooltip: "Param keys",
          value: route.keys
        }
      }
    });
  }
  if (record.redirect != null) {
    fields.push({
      editable: false,
      key: "redirect",
      value: record.redirect
    });
  }
  if (route.alias.length) {
    fields.push({
      editable: false,
      key: "aliases",
      value: route.alias.map((alias) => alias.record.path)
    });
  }
  if (Object.keys(route.record.meta).length) {
    fields.push({
      editable: false,
      key: "meta",
      value: route.record.meta
    });
  }
  fields.push({
    key: "score",
    editable: false,
    value: {
      _custom: {
        type: null,
        readOnly: true,
        display: route.score.map((score) => score.join(", ")).join(" | "),
        tooltip: "Score used to sort routes",
        value: route.score
      }
    }
  });
  return fields;
}
const PINK_500 = 15485081;
const BLUE_600 = 2450411;
const LIME_500 = 8702998;
const CYAN_400 = 2282478;
const ORANGE_400 = 16486972;
const DARK = 6710886;
const RED_100 = 16704226;
const RED_700 = 12131356;
function formatRouteRecordForInspector(route) {
  const tags = [];
  const { record } = route;
  if (record.name != null) {
    tags.push({
      label: String(record.name),
      textColor: 0,
      backgroundColor: CYAN_400
    });
  }
  if (record.aliasOf) {
    tags.push({
      label: "alias",
      textColor: 0,
      backgroundColor: ORANGE_400
    });
  }
  if (route.__vd_match) {
    tags.push({
      label: "matches",
      textColor: 0,
      backgroundColor: PINK_500
    });
  }
  if (route.__vd_exactActive) {
    tags.push({
      label: "exact",
      textColor: 0,
      backgroundColor: LIME_500
    });
  }
  if (route.__vd_active) {
    tags.push({
      label: "active",
      textColor: 0,
      backgroundColor: BLUE_600
    });
  }
  if (record.redirect) {
    tags.push({
      label: typeof record.redirect === "string" ? `redirect: ${record.redirect}` : "redirects",
      textColor: 16777215,
      backgroundColor: DARK
    });
  }
  let id = record.__vd_id;
  if (id == null) {
    id = String(routeRecordId++);
    record.__vd_id = id;
  }
  return {
    id,
    label: record.path,
    tags,
    children: route.children.map(formatRouteRecordForInspector)
  };
}
let routeRecordId = 0;
const EXTRACT_REGEXP_RE = /^\/(.*)\/([a-z]*)$/;
function markRouteRecordActive(route, currentRoute) {
  const isExactActive = currentRoute.matched.length && isSameRouteRecord(currentRoute.matched[currentRoute.matched.length - 1], route.record);
  route.__vd_exactActive = route.__vd_active = isExactActive;
  if (!isExactActive) {
    route.__vd_active = currentRoute.matched.some((match) => isSameRouteRecord(match, route.record));
  }
  route.children.forEach((childRoute) => markRouteRecordActive(childRoute, currentRoute));
}
function resetMatchStateOnRouteRecord(route) {
  route.__vd_match = false;
  route.children.forEach(resetMatchStateOnRouteRecord);
}
function isRouteMatching(route, filter) {
  const found = String(route.re).match(EXTRACT_REGEXP_RE);
  route.__vd_match = false;
  if (!found || found.length < 3) {
    return false;
  }
  const nonEndingRE = new RegExp(found[1].replace(/\$$/, ""), found[2]);
  if (nonEndingRE.test(filter)) {
    route.children.forEach((child) => isRouteMatching(child, filter));
    if (route.record.path !== "/" || filter === "/") {
      route.__vd_match = route.re.test(filter);
      return true;
    }
    return false;
  }
  const path = route.record.path.toLowerCase();
  const decodedPath = decode(path);
  if (!filter.startsWith("/") && (decodedPath.includes(filter) || path.includes(filter)))
    return true;
  if (decodedPath.startsWith(filter) || path.startsWith(filter))
    return true;
  if (route.record.name && String(route.record.name).includes(filter))
    return true;
  return route.children.some((child) => isRouteMatching(child, filter));
}
function omit(obj, keys2) {
  const ret = {};
  for (const key in obj) {
    if (!keys2.includes(key)) {
      ret[key] = obj[key];
    }
  }
  return ret;
}
function createRouter(options) {
  const matcher = createRouterMatcher(options.routes, options);
  const parseQuery$1 = options.parseQuery || parseQuery;
  const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
  const routerHistory = options.history;
  if (process.env.NODE_ENV !== "production" && !routerHistory)
    throw new Error('Provide the "history" option when calling "createRouter()": https://router.vuejs.org/api/interfaces/RouterOptions.html#history');
  const beforeGuards = useCallbacks();
  const beforeResolveGuards = useCallbacks();
  const afterGuards = useCallbacks();
  const currentRoute = shallowRef(START_LOCATION_NORMALIZED);
  let pendingLocation = START_LOCATION_NORMALIZED;
  if (isBrowser && options.scrollBehavior && "scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  const normalizeParams = applyToParams.bind(null, (paramValue) => "" + paramValue);
  const encodeParams = applyToParams.bind(null, encodeParam);
  const decodeParams = (
    // @ts-expect-error: intentionally avoid the type check
    applyToParams.bind(null, decode)
  );
  function addRoute(parentOrRoute, route) {
    let parent;
    let record;
    if (isRouteName(parentOrRoute)) {
      parent = matcher.getRecordMatcher(parentOrRoute);
      if (process.env.NODE_ENV !== "production" && !parent) {
        warn(`Parent route "${String(parentOrRoute)}" not found when adding child route`, route);
      }
      record = route;
    } else {
      record = parentOrRoute;
    }
    return matcher.addRoute(record, parent);
  }
  function removeRoute(name) {
    const recordMatcher = matcher.getRecordMatcher(name);
    if (recordMatcher) {
      matcher.removeRoute(recordMatcher);
    } else if (process.env.NODE_ENV !== "production") {
      warn(`Cannot remove non-existent route "${String(name)}"`);
    }
  }
  function getRoutes() {
    return matcher.getRoutes().map((routeMatcher) => routeMatcher.record);
  }
  function hasRoute(name) {
    return !!matcher.getRecordMatcher(name);
  }
  function resolve(rawLocation, currentLocation) {
    currentLocation = assign({}, currentLocation || currentRoute.value);
    if (typeof rawLocation === "string") {
      const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
      const matchedRoute2 = matcher.resolve({ path: locationNormalized.path }, currentLocation);
      const href2 = routerHistory.createHref(locationNormalized.fullPath);
      if (process.env.NODE_ENV !== "production") {
        if (href2.startsWith("//"))
          warn(`Location "${rawLocation}" resolved to "${href2}". A resolved location cannot start with multiple slashes.`);
        else if (!matchedRoute2.matched.length) {
          warn(`No match found for location with path "${rawLocation}"`);
        }
      }
      return assign(locationNormalized, matchedRoute2, {
        params: decodeParams(matchedRoute2.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: void 0,
        href: href2
      });
    }
    if (process.env.NODE_ENV !== "production" && !isRouteLocation(rawLocation)) {
      warn(`router.resolve() was passed an invalid location. This will fail in production.
- Location:`, rawLocation);
      return resolve({});
    }
    let matcherLocation;
    if (rawLocation.path != null) {
      if (process.env.NODE_ENV !== "production" && "params" in rawLocation && !("name" in rawLocation) && // @ts-expect-error: the type is never
      Object.keys(rawLocation.params).length) {
        warn(`Path "${rawLocation.path}" was passed with params but they will be ignored. Use a named route alongside params instead.`);
      }
      matcherLocation = assign({}, rawLocation, {
        path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path
      });
    } else {
      const targetParams = assign({}, rawLocation.params);
      for (const key in targetParams) {
        if (targetParams[key] == null) {
          delete targetParams[key];
        }
      }
      matcherLocation = assign({}, rawLocation, {
        params: encodeParams(targetParams)
      });
      currentLocation.params = encodeParams(currentLocation.params);
    }
    const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
    const hash = rawLocation.hash || "";
    if (process.env.NODE_ENV !== "production" && hash && !hash.startsWith("#")) {
      warn(`A \`hash\` should always start with the character "#". Replace "${hash}" with "#${hash}".`);
    }
    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
    const fullPath = stringifyURL(stringifyQuery$1, assign({}, rawLocation, {
      hash: encodeHash(hash),
      path: matchedRoute.path
    }));
    const href = routerHistory.createHref(fullPath);
    if (process.env.NODE_ENV !== "production") {
      if (href.startsWith("//")) {
        warn(`Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`);
      } else if (!matchedRoute.matched.length) {
        warn(`No match found for location with path "${rawLocation.path != null ? rawLocation.path : rawLocation}"`);
      }
    }
    return assign({
      fullPath,
      // keep the hash encoded so fullPath is effectively path + encodedQuery +
      // hash
      hash,
      query: (
        // if the user is using a custom query lib like qs, we might have
        // nested objects, so we keep the query as is, meaning it can contain
        // numbers at `$route.query`, but at the point, the user will have to
        // use their own type anyway.
        // https://github.com/vuejs/router/issues/328#issuecomment-649481567
        stringifyQuery$1 === stringifyQuery ? normalizeQuery(rawLocation.query) : rawLocation.query || {}
      )
    }, matchedRoute, {
      redirectedFrom: void 0,
      href
    });
  }
  function locationAsObject(to) {
    return typeof to === "string" ? parseURL(parseQuery$1, to, currentRoute.value.path) : assign({}, to);
  }
  function checkCanceledNavigation(to, from) {
    if (pendingLocation !== to) {
      return createRouterError(8, {
        from,
        to
      });
    }
  }
  function push(to) {
    return pushWithRedirect(to);
  }
  function replace2(to) {
    return push(assign(locationAsObject(to), { replace: true }));
  }
  function handleRedirectRecord(to) {
    const lastMatched = to.matched[to.matched.length - 1];
    if (lastMatched && lastMatched.redirect) {
      const { redirect } = lastMatched;
      let newTargetLocation = typeof redirect === "function" ? redirect(to) : redirect;
      if (typeof newTargetLocation === "string") {
        newTargetLocation = newTargetLocation.includes("?") || newTargetLocation.includes("#") ? newTargetLocation = locationAsObject(newTargetLocation) : (
          // force empty params
          { path: newTargetLocation }
        );
        newTargetLocation.params = {};
      }
      if (process.env.NODE_ENV !== "production" && newTargetLocation.path == null && !("name" in newTargetLocation)) {
        warn(`Invalid redirect found:
${JSON.stringify(newTargetLocation, null, 2)}
 when navigating to "${to.fullPath}". A redirect must contain a name or path. This will break in production.`);
        throw new Error("Invalid redirect");
      }
      return assign({
        query: to.query,
        hash: to.hash,
        // avoid transferring params if the redirect has a path
        params: newTargetLocation.path != null ? {} : to.params
      }, newTargetLocation);
    }
  }
  function pushWithRedirect(to, redirectedFrom) {
    const targetLocation = pendingLocation = resolve(to);
    const from = currentRoute.value;
    const data = to.state;
    const force = to.force;
    const replace22 = to.replace === true;
    const shouldRedirect = handleRedirectRecord(targetLocation);
    if (shouldRedirect)
      return pushWithRedirect(
        assign(locationAsObject(shouldRedirect), {
          state: typeof shouldRedirect === "object" ? assign({}, data, shouldRedirect.state) : data,
          force,
          replace: replace22
        }),
        // keep original redirectedFrom if it exists
        redirectedFrom || targetLocation
      );
    const toLocation = targetLocation;
    toLocation.redirectedFrom = redirectedFrom;
    let failure;
    if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
      failure = createRouterError(16, { to: toLocation, from });
      handleScroll(
        from,
        from,
        // this is a push, the only way for it to be triggered from a
        // history.listen is with a redirect, which makes it become a push
        true,
        // This cannot be the first navigation because the initial location
        // cannot be manually navigated to
        false
      );
    }
    return (failure ? Promise.resolve(failure) : navigate(toLocation, from)).catch((error) => isNavigationFailure(error) ? (
      // navigation redirects still mark the router as ready
      isNavigationFailure(
        error,
        2
        /* ErrorTypes.NAVIGATION_GUARD_REDIRECT */
      ) ? error : markAsReady(error)
    ) : (
      // reject any unknown error
      triggerError(error, toLocation, from)
    )).then((failure2) => {
      if (failure2) {
        if (isNavigationFailure(
          failure2,
          2
          /* ErrorTypes.NAVIGATION_GUARD_REDIRECT */
        )) {
          if (process.env.NODE_ENV !== "production" && // we are redirecting to the same location we were already at
          isSameRouteLocation(stringifyQuery$1, resolve(failure2.to), toLocation) && // and we have done it a couple of times
          redirectedFrom && // @ts-expect-error: added only in dev
          (redirectedFrom._count = redirectedFrom._count ? (
            // @ts-expect-error
            redirectedFrom._count + 1
          ) : 1) > 30) {
            warn(`Detected a possibly infinite redirection in a navigation guard when going from "${from.fullPath}" to "${toLocation.fullPath}". Aborting to avoid a Stack Overflow.
 Are you always returning a new location within a navigation guard? That would lead to this error. Only return when redirecting or aborting, that should fix this. This might break in production if not fixed.`);
            return Promise.reject(new Error("Infinite redirect in navigation guard"));
          }
          return pushWithRedirect(
            // keep options
            assign({
              // preserve an existing replacement but allow the redirect to override it
              replace: replace22
            }, locationAsObject(failure2.to), {
              state: typeof failure2.to === "object" ? assign({}, data, failure2.to.state) : data,
              force
            }),
            // preserve the original redirectedFrom if any
            redirectedFrom || toLocation
          );
        }
      } else {
        failure2 = finalizeNavigation(toLocation, from, true, replace22, data);
      }
      triggerAfterEach(toLocation, from, failure2);
      return failure2;
    });
  }
  function checkCanceledNavigationAndReject(to, from) {
    const error = checkCanceledNavigation(to, from);
    return error ? Promise.reject(error) : Promise.resolve();
  }
  function runWithContext(fn) {
    const app = installedApps.values().next().value;
    return app && typeof app.runWithContext === "function" ? app.runWithContext(fn) : fn();
  }
  function navigate(to, from) {
    let guards;
    const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
    guards = extractComponentsGuards(leavingRecords.reverse(), "beforeRouteLeave", to, from);
    for (const record of leavingRecords) {
      record.leaveGuards.forEach((guard) => {
        guards.push(guardToPromiseFn(guard, to, from));
      });
    }
    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
    guards.push(canceledNavigationCheck);
    return runGuardQueue(guards).then(() => {
      guards = [];
      for (const guard of beforeGuards.list()) {
        guards.push(guardToPromiseFn(guard, to, from));
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = extractComponentsGuards(updatingRecords, "beforeRouteUpdate", to, from);
      for (const record of updatingRecords) {
        record.updateGuards.forEach((guard) => {
          guards.push(guardToPromiseFn(guard, to, from));
        });
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = [];
      for (const record of enteringRecords) {
        if (record.beforeEnter) {
          if (isArray(record.beforeEnter)) {
            for (const beforeEnter of record.beforeEnter)
              guards.push(guardToPromiseFn(beforeEnter, to, from));
          } else {
            guards.push(guardToPromiseFn(record.beforeEnter, to, from));
          }
        }
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      to.matched.forEach((record) => record.enterCallbacks = {});
      guards = extractComponentsGuards(enteringRecords, "beforeRouteEnter", to, from, runWithContext);
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = [];
      for (const guard of beforeResolveGuards.list()) {
        guards.push(guardToPromiseFn(guard, to, from));
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).catch((err) => isNavigationFailure(
      err,
      8
      /* ErrorTypes.NAVIGATION_CANCELLED */
    ) ? err : Promise.reject(err));
  }
  function triggerAfterEach(to, from, failure) {
    afterGuards.list().forEach((guard) => runWithContext(() => guard(to, from, failure)));
  }
  function finalizeNavigation(toLocation, from, isPush, replace22, data) {
    const error = checkCanceledNavigation(toLocation, from);
    if (error)
      return error;
    const isFirstNavigation = from === START_LOCATION_NORMALIZED;
    const state = !isBrowser ? {} : history.state;
    if (isPush) {
      if (replace22 || isFirstNavigation)
        routerHistory.replace(toLocation.fullPath, assign({
          scroll: isFirstNavigation && state && state.scroll
        }, data));
      else
        routerHistory.push(toLocation.fullPath, data);
    }
    currentRoute.value = toLocation;
    handleScroll(toLocation, from, isPush, isFirstNavigation);
    markAsReady();
  }
  let removeHistoryListener;
  function setupListeners() {
    if (removeHistoryListener)
      return;
    removeHistoryListener = routerHistory.listen((to, _from, info) => {
      if (!router2.listening)
        return;
      const toLocation = resolve(to);
      const shouldRedirect = handleRedirectRecord(toLocation);
      if (shouldRedirect) {
        pushWithRedirect(assign(shouldRedirect, { replace: true, force: true }), toLocation).catch(noop);
        return;
      }
      pendingLocation = toLocation;
      const from = currentRoute.value;
      if (isBrowser) {
        saveScrollPosition(getScrollKey(from.fullPath, info.delta), computeScrollPosition());
      }
      navigate(toLocation, from).catch((error) => {
        if (isNavigationFailure(
          error,
          4 | 8
          /* ErrorTypes.NAVIGATION_CANCELLED */
        )) {
          return error;
        }
        if (isNavigationFailure(
          error,
          2
          /* ErrorTypes.NAVIGATION_GUARD_REDIRECT */
        )) {
          pushWithRedirect(
            assign(locationAsObject(error.to), {
              force: true
            }),
            toLocation
            // avoid an uncaught rejection, let push call triggerError
          ).then((failure) => {
            if (isNavigationFailure(
              failure,
              4 | 16
              /* ErrorTypes.NAVIGATION_DUPLICATED */
            ) && !info.delta && info.type === NavigationType.pop) {
              routerHistory.go(-1, false);
            }
          }).catch(noop);
          return Promise.reject();
        }
        if (info.delta) {
          routerHistory.go(-info.delta, false);
        }
        return triggerError(error, toLocation, from);
      }).then((failure) => {
        failure = failure || finalizeNavigation(
          // after navigation, all matched components are resolved
          toLocation,
          from,
          false
        );
        if (failure) {
          if (info.delta && // a new navigation has been triggered, so we do not want to revert, that will change the current history
          // entry while a different route is displayed
          !isNavigationFailure(
            failure,
            8
            /* ErrorTypes.NAVIGATION_CANCELLED */
          )) {
            routerHistory.go(-info.delta, false);
          } else if (info.type === NavigationType.pop && isNavigationFailure(
            failure,
            4 | 16
            /* ErrorTypes.NAVIGATION_DUPLICATED */
          )) {
            routerHistory.go(-1, false);
          }
        }
        triggerAfterEach(toLocation, from, failure);
      }).catch(noop);
    });
  }
  let readyHandlers = useCallbacks();
  let errorListeners = useCallbacks();
  let ready;
  function triggerError(error, to, from) {
    markAsReady(error);
    const list = errorListeners.list();
    if (list.length) {
      list.forEach((handler) => handler(error, to, from));
    } else {
      if (process.env.NODE_ENV !== "production") {
        warn("uncaught error during route navigation:");
      }
      console.error(error);
    }
    return Promise.reject(error);
  }
  function isReady() {
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
      return Promise.resolve();
    return new Promise((resolve2, reject) => {
      readyHandlers.add([resolve2, reject]);
    });
  }
  function markAsReady(err) {
    if (!ready) {
      ready = !err;
      setupListeners();
      readyHandlers.list().forEach(([resolve2, reject]) => err ? reject(err) : resolve2());
      readyHandlers.reset();
    }
    return err;
  }
  function handleScroll(to, from, isPush, isFirstNavigation) {
    const { scrollBehavior } = options;
    if (!isBrowser || !scrollBehavior)
      return Promise.resolve();
    const scrollPosition = !isPush && getSavedScrollPosition(getScrollKey(to.fullPath, 0)) || (isFirstNavigation || !isPush) && history.state && history.state.scroll || null;
    return nextTick().then(() => scrollBehavior(to, from, scrollPosition)).then((position) => position && scrollToPosition(position)).catch((err) => triggerError(err, to, from));
  }
  const go = (delta2) => routerHistory.go(delta2);
  let started;
  const installedApps = /* @__PURE__ */ new Set();
  const router2 = {
    currentRoute,
    listening: true,
    addRoute,
    removeRoute,
    clearRoutes: matcher.clearRoutes,
    hasRoute,
    getRoutes,
    resolve,
    options,
    push,
    replace: replace2,
    go,
    back: () => go(-1),
    forward: () => go(1),
    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,
    onError: errorListeners.add,
    isReady,
    install(app) {
      const router22 = this;
      app.component("RouterLink", RouterLink);
      app.component("RouterView", RouterView);
      app.config.globalProperties.$router = router22;
      Object.defineProperty(app.config.globalProperties, "$route", {
        enumerable: true,
        get: () => unref(currentRoute)
      });
      if (isBrowser && // used for the initial navigation client side to avoid pushing
      // multiple times when the router is used in multiple apps
      !started && currentRoute.value === START_LOCATION_NORMALIZED) {
        started = true;
        push(routerHistory.location).catch((err) => {
          if (process.env.NODE_ENV !== "production")
            warn("Unexpected error when starting the router:", err);
        });
      }
      const reactiveRoute = {};
      for (const key in START_LOCATION_NORMALIZED) {
        Object.defineProperty(reactiveRoute, key, {
          get: () => currentRoute.value[key],
          enumerable: true
        });
      }
      app.provide(routerKey, router22);
      app.provide(routeLocationKey, shallowReactive(reactiveRoute));
      app.provide(routerViewLocationKey, currentRoute);
      const unmountApp = app.unmount;
      installedApps.add(app);
      app.unmount = function() {
        installedApps.delete(app);
        if (installedApps.size < 1) {
          pendingLocation = START_LOCATION_NORMALIZED;
          removeHistoryListener && removeHistoryListener();
          removeHistoryListener = null;
          currentRoute.value = START_LOCATION_NORMALIZED;
          started = false;
          ready = false;
        }
        unmountApp();
      };
      if ((process.env.NODE_ENV !== "production" || false) && isBrowser) {
        addDevtools(app, router22, matcher);
      }
    }
  };
  function runGuardQueue(guards) {
    return guards.reduce((promise, guard) => promise.then(() => runWithContext(guard)), Promise.resolve());
  }
  return router2;
}
function extractChangingRecords(to, from) {
  const leavingRecords = [];
  const updatingRecords = [];
  const enteringRecords = [];
  const len = Math.max(from.matched.length, to.matched.length);
  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i];
    if (recordFrom) {
      if (to.matched.find((record) => isSameRouteRecord(record, recordFrom)))
        updatingRecords.push(recordFrom);
      else
        leavingRecords.push(recordFrom);
    }
    const recordTo = to.matched[i];
    if (recordTo) {
      if (!from.matched.find((record) => isSameRouteRecord(record, recordTo))) {
        enteringRecords.push(recordTo);
      }
    }
  }
  return [leavingRecords, updatingRecords, enteringRecords];
}
function useRoute$1(_name) {
  return inject$1(routeLocationKey);
}
const _imports_0$2 = "/assets/pp-prod14.css";
const _imports_1$1 = "/assets/pp-prod10.css";
const _imports_2$1 = "/assets/pp-prod6.css";
const _imports_0$1 = "/assets/pp-prod8.css";
const _imports_4 = "/assets/pp-prod9.css";
const _imports_5 = "/assets/pp-prod5.css";
var A = "/", L = (e, t) => (e.endsWith(A) && (e = e.slice(0, -1)), t.startsWith(A) || (t = A + t), e + t), g = (e, t, o) => {
  let a = e.pathname === A ? t : L(e.pathname, t), s = new globalThis.URL(a, e);
  if (o) for (let [c, i] of Object.entries(J(o))) if (i && typeof i == "object" && !Array.isArray(i)) for (let [p, u] of Object.entries(i)) s.searchParams.set(`${c}[${p}]`, String(u));
  else s.searchParams.set(c, i);
  return s;
};
function $(e) {
  return typeof e != "object" || !e ? false : "headers" in e && "ok" in e && "json" in e && typeof e.json == "function" && "text" in e && typeof e.json == "function";
}
async function k(e) {
  var _a;
  if (!(typeof e != "object" || !e)) {
    if ($(e)) {
      let t = (_a = e.headers.get("Content-Type")) == null ? void 0 : _a.toLowerCase();
      if ((t == null ? void 0 : t.startsWith("application/json")) || (t == null ? void 0 : t.startsWith("application/health+json"))) {
        let o = await e.json();
        if (!e.ok || "errors" in o) throw o;
        return "data" in o ? o.data : o;
      }
      if ((t == null ? void 0 : t.startsWith("text/html")) || (t == null ? void 0 : t.startsWith("text/plain"))) {
        let o = await e.text();
        if (!e.ok) throw o;
        return o;
      }
      return e;
    }
    if ("errors" in e) throw e;
    return "data" in e ? e.data : e;
  }
}
var b = async (e, t, o = globalThis.fetch) => (t.headers = typeof t.headers == "object" && !Array.isArray(t.headers) ? t.headers : {}, o(e, t).then((a) => k(a).catch((s) => {
  let c = { errors: s && typeof s == "object" && "errors" in s ? s.errors : s, response: a };
  return s && typeof s == "object" && "data" in s && (c.data = s.data), Promise.reject(c);
})));
var K = { fetch: globalThis.fetch, WebSocket: globalThis.WebSocket, URL: globalThis.URL, logger: globalThis.console }, le = (e, t = {}) => {
  let o = t.globals ? { ...K, ...t.globals } : K;
  return { globals: o, url: new o.URL(e), with(a) {
    return { ...this, ...a(this) };
  } };
};
function j(e) {
  return ["directus_access", "directus_activity", "directus_collections", "directus_comments", "directus_fields", "directus_files", "directus_folders", "directus_migrations", "directus_permissions", "directus_policies", "directus_presets", "directus_relations", "directus_revisions", "directus_roles", "directus_sessions", "directus_settings", "directus_users", "directus_webhooks", "directus_dashboards", "directus_panels", "directus_notifications", "directus_shares", "directus_flows", "directus_operations", "directus_translations", "directus_versions", "directus_extensions"].includes(e);
}
var U = (e) => {
  let t = (o, a = []) => {
    if (typeof o == "object") {
      let s = [];
      for (let c in o) {
        let i = o[c] ?? [];
        if (Array.isArray(i)) for (let p of i) s.push(t(p, [...a, c]));
        else if (typeof i == "object") for (let p of Object.keys(i)) {
          let u = i[p];
          for (let f of u) s.push(t(f, [...a, `${c}:${p}`]));
        }
      }
      return s.flatMap((c) => c);
    }
    return [...a, String(o)].join(".");
  };
  return e.flatMap((o) => t(o));
}, J = (e) => {
  let t = {};
  Array.isArray(e.fields) && e.fields.length > 0 && (t.fields = U(e.fields).join(",")), e.filter && Object.keys(e.filter).length > 0 && (t.filter = JSON.stringify(e.filter)), e.search && (t.search = e.search), "sort" in e && e.sort && (t.sort = typeof e.sort == "string" ? e.sort : e.sort.join(",")), typeof e.limit == "number" && e.limit >= -1 && (t.limit = String(e.limit)), typeof e.offset == "number" && e.offset >= 0 && (t.offset = String(e.offset)), typeof e.page == "number" && e.page >= 1 && (t.page = String(e.page)), e.deep && Object.keys(e.deep).length > 0 && (t.deep = JSON.stringify(e.deep)), e.alias && Object.keys(e.alias).length > 0 && (t.alias = JSON.stringify(e.alias)), e.aggregate && Object.keys(e.aggregate).length > 0 && (t.aggregate = JSON.stringify(e.aggregate)), e.groupBy && e.groupBy.length > 0 && (t.groupBy = e.groupBy.join(","));
  for (let [o, a] of Object.entries(e)) o in t || (typeof a == "string" || typeof a == "number" || typeof a == "boolean" ? t[o] = String(a) : t[o] = JSON.stringify(a));
  return t;
};
var r = (e, t) => {
  if (e.length === 0) throw new Error(t);
};
var x = (e, t) => {
  if (j(String(e))) throw new Error(t);
};
var Gs = (e, t) => () => (r(String(e), "Collection cannot be empty"), x(e, "Cannot use readItems for core collections"), { path: `/items/${e}`, params: t ?? {}, method: "GET" });
var B = {}, Fu = (e = {}) => (t) => {
  let o = { ...B, ...e };
  return { async request(a) {
    let s = a();
    if (s.headers || (s.headers = {}), "Content-Type" in s.headers ? s.headers["Content-Type"] === "multipart/form-data" && delete s.headers["Content-Type"] : s.headers["Content-Type"] = "application/json", "getToken" in this && !("Authorization" in s.headers)) {
      let u = await this.getToken();
      u && (s.headers.Authorization = `Bearer ${u}`);
    }
    let c = g(t.url, s.path, s.params), i = { method: s.method ?? "GET", headers: s.headers ?? {} };
    "credentials" in o && (i.credentials = o.credentials), s.body && (i.body = s.body), s.onRequest && (i = await s.onRequest(i)), o.onRequest && (i = await o.onRequest(i));
    let p = await b(c.toString(), i, t.globals.fetch);
    return "onResponse" in s && (p = await s.onResponse(p, i)), "onResponse" in e && (p = await e.onResponse(p, i)), p;
  } };
};
const _imports_0 = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20150.12%2027.31'%3e%3cdefs%3e%3cstyle%3e.cls-1,.cls-2,.cls-3{fill:%23fff;}.cls-1,.cls-3{fill-rule:evenodd;}.cls-3{opacity:0.5;}%3c/style%3e%3c/defs%3e%3cg%20id='Layer_1'%20data-name='Layer%201'%3e%3cpath%20class='cls-1'%20d='M8,22.08H2.37a1.65,1.65,0,0,1-1.43-.78L.72,21a2.15,2.15,0,0,1-.18-1.61A2.53,2.53,0,0,1,.72,19c.32-.67.63-1.35,1-2s.59-1.12.87-1.69.38-.86.59-1.29.55-1.11.83-1.66c.07-.15.12-.3.19-.44.25-.51.51-1,.75-1.55A1,1,0,0,0,5,9.94C5,8.64,5,7.34,5,6a1.12,1.12,0,0,1,.22-.81A1.1,1.1,0,0,1,5.48,5a2.87,2.87,0,0,1,1.17-.17c.94,0,1.88,0,2.83,0a2.38,2.38,0,0,1,.88.18,1,1,0,0,1,.57,1c0,1.27,0,2.55,0,3.81a2.57,2.57,0,0,0,.44,1.38c.13.23.23.47.34.71l.26.5c.21.44.43.87.64,1.3l.78,1.69c.21.43.43.84.64,1.26.08.18.16.36.25.53.31.64.64,1.27.91,1.92a3,3,0,0,1,.18,1,2.17,2.17,0,0,1-.68,1.51,1.32,1.32,0,0,1-1,.42H8Zm-.1-6.2h3.53c.29,0,.39-.15.26-.42l-.57-1.13c-.08-.17-.13-.36-.21-.54-.3-.68-.62-1.36-.92-2-.1-.22-.21-.43-.3-.65a2.27,2.27,0,0,1-.24-.78c0-1.26,0-2.52,0-3.78,0-.4-.08-.49-.48-.48H6.85c-.38,0-.43,0-.43.41v3.3a2.26,2.26,0,0,1-.17,1.12c-.24.46-.4.94-.62,1.4-.29.66-.6,1.31-.9,2-.19.41-.39.82-.57,1.23a.38.38,0,0,0,0,.29c0,.06.17.1.26.1H7.9'/%3e%3cpath%20class='cls-2'%20d='M79.37,19.48A7,7,0,0,1,77,21.22,9.25,9.25,0,0,1,73,22a6.67,6.67,0,0,1-4.91-1.86,6.48,6.48,0,0,1-1.89-4.83V11.87A6.58,6.58,0,0,1,68,7.05a6.37,6.37,0,0,1,4.75-1.87A6.69,6.69,0,0,1,77.5,6.64a5.88,5.88,0,0,1,1.78,4l0,.06H75.7a3.35,3.35,0,0,0-.83-1.94,2.69,2.69,0,0,0-2-.65,2.56,2.56,0,0,0-2.13,1.05A4.3,4.3,0,0,0,70,11.85v3.43a4.39,4.39,0,0,0,.8,2.74,2.65,2.65,0,0,0,2.23,1,6.37,6.37,0,0,0,1.64-.17,2.57,2.57,0,0,0,.94-.45V15.86H73V13.35h6.37Z'/%3e%3cpath%20class='cls-2'%20d='M95.18,15a6.83,6.83,0,0,1-1.92,5,6.66,6.66,0,0,1-5,1.95,6.65,6.65,0,0,1-7-6.93V12.11a6.81,6.81,0,0,1,1.92-5,7.38,7.38,0,0,1,10,0,6.82,6.82,0,0,1,1.93,5Zm-3.78-3a4.74,4.74,0,0,0-.83-2.87,3,3,0,0,0-4.67,0,4.76,4.76,0,0,0-.81,2.87v3a4.79,4.79,0,0,0,.82,2.9,2.78,2.78,0,0,0,2.36,1.12,2.72,2.72,0,0,0,2.31-1.12A4.79,4.79,0,0,0,91.4,15Z'/%3e%3cpolygon%20class='cls-2'%20points='102.99%2017.31%20103.1%2017.9%20103.17%2017.9%20103.28%2017.35%20106.52%205.41%20110.49%205.41%20105.2%2021.74%20101.11%2021.74%2095.84%205.41%2099.79%205.41%20102.99%2017.31'/%3e%3cpolygon%20class='cls-2'%20points='113.96%2020.59%20122.03%2020.59%20122.03%2021.74%20112.62%2021.74%20112.62%205.41%20113.96%205.41%20113.96%2020.59'/%3e%3cpath%20class='cls-2'%20d='M133.69,17.18h-7.47l-1.69,4.56h-1.39l6.2-16.33h1.27l6.15,16.33h-1.39Zm-7-1.2h6.6L130,7.15h-.06Z'/%3e%3cpath%20class='cls-2'%20d='M139.26,21.74V5.41H144a6.49,6.49,0,0,1,4,1.07,3.79,3.79,0,0,1,1.42,3.23,3.53,3.53,0,0,1-.71,2.19,3.68,3.68,0,0,1-1.94,1.29,3.89,3.89,0,0,1,2.42,1.4,4,4,0,0,1,.94,2.61,4.15,4.15,0,0,1-1.42,3.36,5.79,5.79,0,0,1-3.8,1.18Zm1.34-9h3.75a4.26,4.26,0,0,0,2.74-.78,2.74,2.74,0,0,0,1-2.29,2.71,2.71,0,0,0-1-2.32,4.92,4.92,0,0,0-3-.78H140.6Zm0,1.15v6.71h4.3a4.17,4.17,0,0,0,2.84-.89,3.09,3.09,0,0,0,1-2.48,3.22,3.22,0,0,0-.94-2.4,3.64,3.64,0,0,0-2.71-.94Z'/%3e%3cpolygon%20class='cls-2'%20points='35.01%206.52%2029.37%206.52%2029.37%2021.79%2027.99%2021.79%2027.99%206.52%2022.36%206.52%2022.36%205.35%2035.01%205.35%2035.01%206.52'/%3e%3cpolygon%20class='cls-2'%20points='49.85%2021.79%2048.45%2021.79%2048.45%2013.91%2039.05%2013.91%2039.05%2021.79%2037.66%2021.79%2037.66%205.35%2039.05%205.35%2039.05%2012.73%2048.45%2012.73%2048.45%205.35%2049.85%205.35%2049.85%2021.79'/%3e%3cpolygon%20class='cls-2'%20points='63.11%2013.91%2055.42%2013.91%2055.42%2020.62%2064.26%2020.62%2064.26%2021.79%2054.03%2021.79%2054.03%205.35%2064.2%205.35%2064.2%206.52%2055.42%206.52%2055.42%2012.73%2063.11%2012.73%2063.11%2013.91'/%3e%3cpath%20class='cls-3'%20d='M5.89,24.23h8.45a1.56,1.56,0,0,1,.94.18A1.59,1.59,0,0,1,16,25.83a1.55,1.55,0,0,1-1.58,1.48H1.7a1.53,1.53,0,0,1-1.32-.57,1.45,1.45,0,0,1,0-2,1.37,1.37,0,0,1,1.14-.54H5.89'/%3e%3cpath%20class='cls-3'%20d='M1.54,0A1.37,1.37,0,0,0,.4.54a1.46,1.46,0,0,0,0,2,1.55,1.55,0,0,0,1.32.56H14.46A1.56,1.56,0,0,0,15.28.2a1.58,1.58,0,0,0-.94-.2Z'/%3e%3c/g%3e%3c/svg%3e";
const _imports_1 = "/assets/pp-prod12.css";
const _sfc_main$d = {
  props: ["menutype"],
  data() {
    return {
      menuOpen: false,
      dropdownOpen: false,
      screenWidth: "desktop"
    };
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
      if (!this.menuOpen) {
        this.dropdownOpen = false;
      }
    },
    toggleDropdown() {
      if (this.screenWidth === "mobile") {
        this.dropdownOpen = !this.dropdownOpen;
      }
    },
    updateScreenWidth() {
      this.screenWidth = window.innerWidth < 786 ? "mobile" : "desktop";
      if (this.screenWidth === "desktop") {
        this.dropdownOpen = false;
      }
    }
  },
  mounted() {
    this.updateScreenWidth();
    window.addEventListener("resize", this.updateScreenWidth);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateScreenWidth);
  }
};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "menu-component" }, _attrs))}>`);
  if ($data.screenWidth === "mobile") {
    _push(`<div><i class="fa-solid fa-bars bars"></i><div class="${ssrRenderClass(["menu-shadow", "menu", { "open": $data.menuOpen }])}" style="${ssrRenderStyle($data.menuOpen ? null : { display: "none" })}"><a href="/about">About Us</a><a href="/blog">Blog</a><a href="/events">Events</a><div class="dropdown"><button class="dropbtn"> Our Work <i class="${ssrRenderClass(["fa-regular", $data.dropdownOpen ? "fa-angle-up" : "fa-angle-down"])}"></i></button><div class="dropdown-content" style="${ssrRenderStyle($data.dropdownOpen ? null : { display: "none" })}"><a href="/our-engagements">Engagements</a><a href="/our-research">Research</a><a href="/our-writing">Writing</a><a href="/our-teaching">Teaching</a><a href="/more-resources">More Resources</a></div></div><a href="/signup" class="btn btn-small btn-primary">Sign up</a></div></div>`);
  } else {
    _push(`<div><div class="menu"><a href="/about">About Us</a><a href="/blog">Blog</a><a href="/events">Events</a><div class="dropdown"><button class="dropbtn">Our Work <i class="fa-regular fa-angle-down"></i></button><div class="dropdown-content"><a href="/our-engagements">Engagements</a><a href="/our-research">Research</a><a href="/our-writing">Writing</a><a href="/our-teaching">Teaching</a><a href="/more-resources">More Resources</a></div></div><a href="/signup" class="btn btn-small btn-primary">Sign up</a></div></div>`);
  }
  _push(`</div>`);
}
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/menu.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const MenuComponent = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["ssrRender", _sfc_ssrRender$1]]);
const _sfc_main$c = /* @__PURE__ */ defineComponent$1({
  __name: "header",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "header-section" }, _attrs))} data-v-ee3b4cd5><div class="logo-section" data-v-ee3b4cd5><div class="logo" data-v-ee3b4cd5><a href="http://thegovlab.org" target="_blank" data-v-ee3b4cd5><img${ssrRenderAttr("src", _imports_0)} data-v-ee3b4cd5></a><a href="http://burnes.northeastern.edu" target="_blank" data-v-ee3b4cd5><img${ssrRenderAttr("src", _imports_1)} data-v-ee3b4cd5></a></div><div class="wordmark" data-v-ee3b4cd5> Reboot<br data-v-ee3b4cd5>Democracy<br data-v-ee3b4cd5>.AI </div></div>`);
      _push(ssrRenderComponent(MenuComponent, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/header.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const HeaderComponent = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["__scopeId", "data-v-ee3b4cd5"]]);
const _imports_2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAfCAMAAABUFvrSAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAEZ0FNQQAAsY58+1GTAAAAAXNSR0IB2cksfwAAAb9QTFRF////////////////8fHx7+/v6Ofn4+Pj4N/g39/f1tXV09bS0tXS0tXR0dTR0dTQ0NTQ0NPPz9PPztLOztHNzdHNzdHMz8/PzdDMzNDMzNDLzM/Ly8/Ly8/Ky87Kys3Jyc3Jyc3Iy8rLyMzIyMzHx8vHxsrGycjIxsrFxcnFyMfHxcnExMnExMjDw8jDxMfDw8fCwsfCwcXAwMXAwMW/wMS/v8S+v8O+vsO+vsK9vcK9vcK8v7+/vMG8vMG7vMC8u8C7u8C6ur+6ur+5ub65ub64uL23t7y2urm5tru1tbq0tLqztLmzs7iysrixtbW1srexsbewsbawsLavsLWvr7Wur7SusLOvrrStrrOtr7KvrbOsrLKrr6+vq7GqrKuro6Ghn6OenqCdn5+fnp2dn5aalpmWmJaXk5iTkZSRkZORkY+Pj4+PiYyJjoeLhIaEhIWEgoWChIGCgICAfX98fH98eXx5dnN0cHJvcHBwbmxsY19hYGBgXV5dUFFQUFBQQ0RDQEBAPj8+Pzc5NTY1MjMxMDAwMS0uLS0tKSkpKCkoKCgoKicnJCQkIx8gICAgGxsbEBAQDg4ODQ4NAAAAi/BQCAAAAAN0Uk5TAAoO5yEBUwAAA49JREFUeNq1lo930lYUx7Pdsg5pjdF0DiixTNyyKpVhtToY2lGKxeJaHU4HpWrdZplOV7STDfnRbdGyLTTy/YN3XkJoGqBn4nwHzjvn+3gfbr73vvvCvYu3MjgOSCUTsfPhKTkwIXndbq/vWEAOhmdic8lUevnrm9lsLv/6A+CQSsYjZ0Oy3ycK/IjLNXJQEMf9cmg6EmfkzM1sbiAyh2Q8ciZ4QhL5x7UWe4hW7RF/xBc4Ff48nkxdvZ65ZYa8uc2WtzftjJ46OCQiZ4IBj1DY2TVoZ11w+0+GI3PJxaXr7ZDvN4B6qVQHGvethD46OMTOBgNuvgJAKxej0WJZA1A5/YH/1HQssZBeNkK+8wpVJxGRs4pXFkI/HRzOh054GFcrOsgYaxrQOO0OhGZm51N6yPl8A2UiAtgyGrsAXR+enBy26eAQliWhAihO6gyHAlQEnxyOJBbS125kc7lNVA+YYKqi46eu31ZVVb28R2fgqeNiAVAcRHvJ60f8wXOzyStLmVu53DYs/+vEtrmf6ZPq77/9oqo/WnUGln38DrSjtGc4NOzw43L4i0TqKvMCdaaWoRtCdXT212noO/UnonvqC6vOwIGxx0CRbGMNeCQGQhfiC+lrDFwi3QnDi9IuuERD/6h/EQ2r6nsWnYEnDtegOYii1Xq9aEwPiEhDTTjGvFhcvrEvmL56GdXB79vAEt9iDxjVK7i+ok9l9titg76T05fmryxn9rWCLt/+hGhVVe1WeEeBB0QKms5oc02B4lxprulejHjlcGw+tZTJmskzArYl756qbmz8rf5gT57HBUTZnqKxtW13FHC5PzbBm6hSn3Ij2mDl9uuQvdz+E9h6QEpdB+Sj1dUDNn2PFY6jzaIChU12KwY50u3ktbPWSV4JLV7qJC+fv9MAlHJJsTehPrpebhVo1Cm3lbo+URM1YSJ47kuj3AZpm4Gxgu5FrwPy2YW5hbTRhV6/0X+qH2nn/kd6EPDUcfFuryZUEP1TM7PJRb0JDQLGU0l4DiiWNuTU26b08xtd0wCeeQ9ZG72jqAF/8J6neFMwnrgPPbddTfyH39t+aZwPGN/uBeoFxhOvcNd6mRYEj50Lan+oWzcXu8F4Jol8wbz+13lR6vbBbJs9FowW0hOMP7/1jR3mR12uUV4Qx7/Z6jatjxHGUt+IAWw9vCh5PR6vdPHhVq9s9IvY9L4v+P9+K3znLXH/BS/TEND+y7DLAAAAAElFTkSuQmCC";
const _sfc_main$b = /* @__PURE__ */ defineComponent$1({
  __name: "footer",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "footer-section" }, _attrs))} data-v-fc2d6740><div class="footer-contents" data-v-fc2d6740><div class="logo-section footer-col" data-v-fc2d6740><div class="wordmark" data-v-fc2d6740> Reboot Democracy </div><p data-v-fc2d6740>A Project Of</p><a href="http://thegovlab.org" target="_blank" data-v-fc2d6740><img${ssrRenderAttr("src", _imports_0)} data-v-fc2d6740></a><a href="http://burnes.northeastern.edu" target="_blank" data-v-fc2d6740><img${ssrRenderAttr("src", _imports_1)} data-v-fc2d6740></a></div></div><div class="cc-license" data-v-fc2d6740><img${ssrRenderAttr("src", _imports_2)} data-v-fc2d6740><p data-v-fc2d6740> This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License. </p></div></div>`);
    };
  }
});
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/footer.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const FooterComponent = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["__scopeId", "data-v-fc2d6740"]]);
const _sfc_main$a = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "mailing-list-section" }, _attrs))}><div class="mailing-list-row"><div class="col-50"><h3>Sign up for the Reboot Democracy Mailing List to Learn about Upcoming Events</h3></div><div class="col-50"><a href="/signup" class="btn btn-primary btn-dark btn-medium">Sign up to receive updates!</a></div></div></div>`);
}
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/mailing.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const MailingListComponent = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$9 = /* @__PURE__ */ defineComponent$1({
  __name: "modal",
  __ssrInlineRender: true,
  props: {
    modalData: {
      type: Object,
      required: true
    },
    closeFunc: {
      type: Function,
      required: true
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "modal-bg" }, _attrs))}><div class="modal-section"><i class="fa-regular fa-circle-xmark modal-close"></i><div class="row"><h3>${ssrInterpolate(__props.modalData.title)}</h3><div class="modal-content">${__props.modalData.content ?? ""}</div><a${ssrRenderAttr("href", __props.modalData.button_url)} class="btn btn-primary btn-medium">${ssrInterpolate(__props.modalData.button_text)}</a></div></div></div>`);
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/modal.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const IN_BROWSER = typeof window !== "undefined";
const SUPPORTS_INTERSECTION = IN_BROWSER && "IntersectionObserver" in window;
const SUPPORTS_TOUCH = IN_BROWSER && ("ontouchstart" in window || window.navigator.maxTouchPoints > 0);
function getNestedValue(obj, path, fallback) {
  const last = path.length - 1;
  if (last < 0) return obj === void 0 ? fallback : obj;
  for (let i = 0; i < last; i++) {
    if (obj == null) {
      return fallback;
    }
    obj = obj[path[i]];
  }
  if (obj == null) return fallback;
  return obj[path[last]] === void 0 ? fallback : obj[path[last]];
}
function deepEqual(a, b2) {
  if (a === b2) return true;
  if (a instanceof Date && b2 instanceof Date && a.getTime() !== b2.getTime()) {
    return false;
  }
  if (a !== Object(a) || b2 !== Object(b2)) {
    return false;
  }
  const props = Object.keys(a);
  if (props.length !== Object.keys(b2).length) {
    return false;
  }
  return props.every((p) => deepEqual(a[p], b2[p]));
}
function getObjectValueByPath(obj, path, fallback) {
  if (obj == null || !path || typeof path !== "string") return fallback;
  if (obj[path] !== void 0) return obj[path];
  path = path.replace(/\[(\w+)\]/g, ".$1");
  path = path.replace(/^\./, "");
  return getNestedValue(obj, path.split("."), fallback);
}
function createRange(length) {
  let start = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  return Array.from({
    length
  }, (v, k2) => start + k2);
}
function convertToUnit(str) {
  let unit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "px";
  if (str == null || str === "") {
    return void 0;
  } else if (isNaN(+str)) {
    return String(str);
  } else if (!isFinite(+str)) {
    return void 0;
  } else {
    return `${Number(str)}${unit}`;
  }
}
function isObject(obj) {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
function isPlainObject(obj) {
  let proto;
  return obj !== null && typeof obj === "object" && ((proto = Object.getPrototypeOf(obj)) === Object.prototype || proto === null);
}
function refElement(obj) {
  if (obj && "$el" in obj) {
    const el = obj.$el;
    if ((el == null ? void 0 : el.nodeType) === Node.TEXT_NODE) {
      return el.nextElementSibling;
    }
    return el;
  }
  return obj;
}
const keyCodes = Object.freeze({
  enter: 13,
  tab: 9,
  delete: 46,
  esc: 27,
  space: 32,
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  end: 35,
  home: 36,
  del: 46,
  backspace: 8,
  insert: 45,
  pageup: 33,
  pagedown: 34,
  shift: 16
});
function keys(o) {
  return Object.keys(o);
}
function has(obj, key) {
  return key.every((k2) => obj.hasOwnProperty(k2));
}
function pick(obj, paths) {
  const found = {};
  const keys2 = new Set(Object.keys(obj));
  for (const path of paths) {
    if (keys2.has(path)) {
      found[path] = obj[path];
    }
  }
  return found;
}
function wrapInArray(v) {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
function debounce(fn, delay) {
  let timeoutId = 0;
  const wrap = function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), unref(delay));
  };
  wrap.clear = () => {
    clearTimeout(timeoutId);
  };
  wrap.immediate = fn;
  return wrap;
}
function clamp(value) {
  let min = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  let max = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
  return Math.max(min, Math.min(max, value));
}
function padEnd(str, length) {
  let char = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "0";
  return str + char.repeat(Math.max(0, length - str.length));
}
function padStart(str, length) {
  let char = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "0";
  return char.repeat(Math.max(0, length - str.length)) + str;
}
function chunk(str) {
  let size = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
  const chunked = [];
  let index = 0;
  while (index < str.length) {
    chunked.push(str.substr(index, size));
    index += size;
  }
  return chunked;
}
function mergeDeep() {
  let source = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  let target = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  let arrayFn = arguments.length > 2 ? arguments[2] : void 0;
  const out = {};
  for (const key in source) {
    out[key] = source[key];
  }
  for (const key in target) {
    const sourceProperty = source[key];
    const targetProperty = target[key];
    if (isPlainObject(sourceProperty) && isPlainObject(targetProperty)) {
      out[key] = mergeDeep(sourceProperty, targetProperty, arrayFn);
      continue;
    }
    if (arrayFn && Array.isArray(sourceProperty) && Array.isArray(targetProperty)) {
      out[key] = arrayFn(sourceProperty, targetProperty);
      continue;
    }
    out[key] = targetProperty;
  }
  return out;
}
function flattenFragments(nodes) {
  return nodes.map((node) => {
    if (node.type === Fragment) {
      return flattenFragments(node.children);
    } else {
      return node;
    }
  }).flat();
}
function toKebabCase() {
  let str = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
  if (toKebabCase.cache.has(str)) return toKebabCase.cache.get(str);
  const kebab = str.replace(/[^a-z]/gi, "-").replace(/\B([A-Z])/g, "-$1").toLowerCase();
  toKebabCase.cache.set(str, kebab);
  return kebab;
}
toKebabCase.cache = /* @__PURE__ */ new Map();
function findChildrenWithProvide(key, vnode) {
  if (!vnode || typeof vnode !== "object") return [];
  if (Array.isArray(vnode)) {
    return vnode.map((child) => findChildrenWithProvide(key, child)).flat(1);
  } else if (vnode.suspense) {
    return findChildrenWithProvide(key, vnode.ssContent);
  } else if (Array.isArray(vnode.children)) {
    return vnode.children.map((child) => findChildrenWithProvide(key, child)).flat(1);
  } else if (vnode.component) {
    if (Object.getOwnPropertySymbols(vnode.component.provides).includes(key)) {
      return [vnode.component];
    } else if (vnode.component.subTree) {
      return findChildrenWithProvide(key, vnode.component.subTree).flat(1);
    }
  }
  return [];
}
function destructComputed(getter) {
  const refs = reactive({});
  const base = computed(getter);
  watchEffect(() => {
    for (const key in base.value) {
      refs[key] = base.value[key];
    }
  }, {
    flush: "sync"
  });
  return toRefs(refs);
}
function includes(arr, val) {
  return arr.includes(val);
}
function hasEvent(props, name) {
  name = "on" + capitalize(name);
  return !!(props[name] || props[`${name}Once`] || props[`${name}Capture`] || props[`${name}OnceCapture`] || props[`${name}CaptureOnce`]);
}
function templateRef() {
  const el = shallowRef();
  const fn = (target) => {
    el.value = target;
  };
  Object.defineProperty(fn, "value", {
    enumerable: true,
    get: () => el.value,
    set: (val) => el.value = val
  });
  Object.defineProperty(fn, "el", {
    enumerable: true,
    get: () => refElement(el.value)
  });
  return fn;
}
const block = ["top", "bottom"];
const inline = ["start", "end", "left", "right"];
function parseAnchor(anchor, isRtl) {
  let [side, align] = anchor.split(" ");
  if (!align) {
    align = includes(block, side) ? "start" : includes(inline, side) ? "top" : "center";
  }
  return {
    side: toPhysical(side, isRtl),
    align: toPhysical(align, isRtl)
  };
}
function toPhysical(str, isRtl) {
  if (str === "start") return isRtl ? "right" : "left";
  if (str === "end") return isRtl ? "left" : "right";
  return str;
}
const mainTRC = 2.4;
const Rco = 0.2126729;
const Gco = 0.7151522;
const Bco = 0.072175;
const normBG = 0.55;
const normTXT = 0.58;
const revTXT = 0.57;
const revBG = 0.62;
const blkThrs = 0.03;
const blkClmp = 1.45;
const deltaYmin = 5e-4;
const scaleBoW = 1.25;
const scaleWoB = 1.25;
const loConThresh = 0.078;
const loConFactor = 12.82051282051282;
const loConOffset = 0.06;
const loClip = 1e-3;
function APCAcontrast(text, background) {
  const Rtxt = (text.r / 255) ** mainTRC;
  const Gtxt = (text.g / 255) ** mainTRC;
  const Btxt = (text.b / 255) ** mainTRC;
  const Rbg = (background.r / 255) ** mainTRC;
  const Gbg = (background.g / 255) ** mainTRC;
  const Bbg = (background.b / 255) ** mainTRC;
  let Ytxt = Rtxt * Rco + Gtxt * Gco + Btxt * Bco;
  let Ybg = Rbg * Rco + Gbg * Gco + Bbg * Bco;
  if (Ytxt <= blkThrs) Ytxt += (blkThrs - Ytxt) ** blkClmp;
  if (Ybg <= blkThrs) Ybg += (blkThrs - Ybg) ** blkClmp;
  if (Math.abs(Ybg - Ytxt) < deltaYmin) return 0;
  let outputContrast;
  if (Ybg > Ytxt) {
    const SAPC = (Ybg ** normBG - Ytxt ** normTXT) * scaleBoW;
    outputContrast = SAPC < loClip ? 0 : SAPC < loConThresh ? SAPC - SAPC * loConFactor * loConOffset : SAPC - loConOffset;
  } else {
    const SAPC = (Ybg ** revBG - Ytxt ** revTXT) * scaleWoB;
    outputContrast = SAPC > -loClip ? 0 : SAPC > -loConThresh ? SAPC - SAPC * loConFactor * loConOffset : SAPC + loConOffset;
  }
  return outputContrast * 100;
}
function consoleWarn(message) {
  warn$1(`Vuetify: ${message}`);
}
function consoleError(message) {
  warn$1(`Vuetify error: ${message}`);
}
const delta = 0.20689655172413793;
const cielabForwardTransform = (t) => t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29;
const cielabReverseTransform = (t) => t > delta ? t ** 3 : 3 * delta ** 2 * (t - 4 / 29);
function fromXYZ$1(xyz) {
  const transform2 = cielabForwardTransform;
  const transformedY = transform2(xyz[1]);
  return [116 * transformedY - 16, 500 * (transform2(xyz[0] / 0.95047) - transformedY), 200 * (transformedY - transform2(xyz[2] / 1.08883))];
}
function toXYZ$1(lab) {
  const transform2 = cielabReverseTransform;
  const Ln = (lab[0] + 16) / 116;
  return [transform2(Ln + lab[1] / 500) * 0.95047, transform2(Ln), transform2(Ln - lab[2] / 200) * 1.08883];
}
const srgbForwardMatrix = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.204, 1.057]];
const srgbForwardTransform = (C) => C <= 31308e-7 ? C * 12.92 : 1.055 * C ** (1 / 2.4) - 0.055;
const srgbReverseMatrix = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]];
const srgbReverseTransform = (C) => C <= 0.04045 ? C / 12.92 : ((C + 0.055) / 1.055) ** 2.4;
function fromXYZ(xyz) {
  const rgb = Array(3);
  const transform2 = srgbForwardTransform;
  const matrix = srgbForwardMatrix;
  for (let i = 0; i < 3; ++i) {
    rgb[i] = Math.round(clamp(transform2(matrix[i][0] * xyz[0] + matrix[i][1] * xyz[1] + matrix[i][2] * xyz[2])) * 255);
  }
  return {
    r: rgb[0],
    g: rgb[1],
    b: rgb[2]
  };
}
function toXYZ(_ref) {
  let {
    r: r2,
    g: g2,
    b: b2
  } = _ref;
  const xyz = [0, 0, 0];
  const transform2 = srgbReverseTransform;
  const matrix = srgbReverseMatrix;
  r2 = transform2(r2 / 255);
  g2 = transform2(g2 / 255);
  b2 = transform2(b2 / 255);
  for (let i = 0; i < 3; ++i) {
    xyz[i] = matrix[i][0] * r2 + matrix[i][1] * g2 + matrix[i][2] * b2;
  }
  return xyz;
}
function isCssColor(color) {
  return !!color && /^(#|var\(--|(rgb|hsl)a?\()/.test(color);
}
function isParsableColor(color) {
  return isCssColor(color) && !/^((rgb|hsl)a?\()?var\(--/.test(color);
}
const cssColorRe = /^(?<fn>(?:rgb|hsl)a?)\((?<values>.+)\)/;
const mappers = {
  rgb: (r2, g2, b2, a) => ({
    r: r2,
    g: g2,
    b: b2,
    a
  }),
  rgba: (r2, g2, b2, a) => ({
    r: r2,
    g: g2,
    b: b2,
    a
  }),
  hsl: (h2, s, l, a) => HSLtoRGB({
    h: h2,
    s,
    l,
    a
  }),
  hsla: (h2, s, l, a) => HSLtoRGB({
    h: h2,
    s,
    l,
    a
  }),
  hsv: (h2, s, v, a) => HSVtoRGB({
    h: h2,
    s,
    v,
    a
  }),
  hsva: (h2, s, v, a) => HSVtoRGB({
    h: h2,
    s,
    v,
    a
  })
};
function parseColor(color) {
  if (typeof color === "number") {
    if (isNaN(color) || color < 0 || color > 16777215) {
      consoleWarn(`'${color}' is not a valid hex color`);
    }
    return {
      r: (color & 16711680) >> 16,
      g: (color & 65280) >> 8,
      b: color & 255
    };
  } else if (typeof color === "string" && cssColorRe.test(color)) {
    const {
      groups
    } = color.match(cssColorRe);
    const {
      fn,
      values
    } = groups;
    const realValues = values.split(/,\s*/).map((v) => {
      if (v.endsWith("%") && ["hsl", "hsla", "hsv", "hsva"].includes(fn)) {
        return parseFloat(v) / 100;
      } else {
        return parseFloat(v);
      }
    });
    return mappers[fn](...realValues);
  } else if (typeof color === "string") {
    let hex = color.startsWith("#") ? color.slice(1) : color;
    if ([3, 4].includes(hex.length)) {
      hex = hex.split("").map((char) => char + char).join("");
    } else if (![6, 8].includes(hex.length)) {
      consoleWarn(`'${color}' is not a valid hex(a) color`);
    }
    const int = parseInt(hex, 16);
    if (isNaN(int) || int < 0 || int > 4294967295) {
      consoleWarn(`'${color}' is not a valid hex(a) color`);
    }
    return HexToRGB(hex);
  } else if (typeof color === "object") {
    if (has(color, ["r", "g", "b"])) {
      return color;
    } else if (has(color, ["h", "s", "l"])) {
      return HSVtoRGB(HSLtoHSV(color));
    } else if (has(color, ["h", "s", "v"])) {
      return HSVtoRGB(color);
    }
  }
  throw new TypeError(`Invalid color: ${color == null ? color : String(color) || color.constructor.name}
Expected #hex, #hexa, rgb(), rgba(), hsl(), hsla(), object or number`);
}
function HSVtoRGB(hsva) {
  const {
    h: h2,
    s,
    v,
    a
  } = hsva;
  const f = (n) => {
    const k2 = (n + h2 / 60) % 6;
    return v - v * s * Math.max(Math.min(k2, 4 - k2, 1), 0);
  };
  const rgb = [f(5), f(3), f(1)].map((v2) => Math.round(v2 * 255));
  return {
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
    a
  };
}
function HSLtoRGB(hsla) {
  return HSVtoRGB(HSLtoHSV(hsla));
}
function HSLtoHSV(hsl) {
  const {
    h: h2,
    s,
    l,
    a
  } = hsl;
  const v = l + s * Math.min(l, 1 - l);
  const sprime = v === 0 ? 0 : 2 - 2 * l / v;
  return {
    h: h2,
    s: sprime,
    v,
    a
  };
}
function toHex(v) {
  const h2 = Math.round(v).toString(16);
  return ("00".substr(0, 2 - h2.length) + h2).toUpperCase();
}
function RGBtoHex(_ref2) {
  let {
    r: r2,
    g: g2,
    b: b2,
    a
  } = _ref2;
  return `#${[toHex(r2), toHex(g2), toHex(b2), a !== void 0 ? toHex(Math.round(a * 255)) : ""].join("")}`;
}
function HexToRGB(hex) {
  hex = parseHex(hex);
  let [r2, g2, b2, a] = chunk(hex, 2).map((c) => parseInt(c, 16));
  a = a === void 0 ? a : a / 255;
  return {
    r: r2,
    g: g2,
    b: b2,
    a
  };
}
function parseHex(hex) {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }
  hex = hex.replace(/([^0-9a-f])/gi, "F");
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split("").map((x2) => x2 + x2).join("");
  }
  if (hex.length !== 6) {
    hex = padEnd(padEnd(hex, 6), 8, "F");
  }
  return hex;
}
function lighten(value, amount) {
  const lab = fromXYZ$1(toXYZ(value));
  lab[0] = lab[0] + amount * 10;
  return fromXYZ(toXYZ$1(lab));
}
function darken(value, amount) {
  const lab = fromXYZ$1(toXYZ(value));
  lab[0] = lab[0] - amount * 10;
  return fromXYZ(toXYZ$1(lab));
}
function getLuma(color) {
  const rgb = parseColor(color);
  return toXYZ(rgb)[1];
}
function getForeground(color) {
  const blackContrast = Math.abs(APCAcontrast(parseColor(0), parseColor(color)));
  const whiteContrast = Math.abs(APCAcontrast(parseColor(16777215), parseColor(color)));
  return whiteContrast > Math.min(blackContrast, 50) ? "#fff" : "#000";
}
function propsFactory(props, source) {
  return (defaults) => {
    return Object.keys(props).reduce((obj, prop) => {
      const isObjectDefinition = typeof props[prop] === "object" && props[prop] != null && !Array.isArray(props[prop]);
      const definition = isObjectDefinition ? props[prop] : {
        type: props[prop]
      };
      if (defaults && prop in defaults) {
        obj[prop] = {
          ...definition,
          default: defaults[prop]
        };
      } else {
        obj[prop] = definition;
      }
      if (source && !obj[prop].source) {
        obj[prop].source = source;
      }
      return obj;
    }, {});
  };
}
const makeComponentProps = propsFactory({
  class: [String, Array, Object],
  style: {
    type: [String, Array, Object],
    default: null
  }
}, "component");
function getCurrentInstance(name, message) {
  const vm = getCurrentInstance$1();
  if (!vm) {
    throw new Error(`[Vuetify] ${name} ${"must be called from inside a setup function"}`);
  }
  return vm;
}
function getCurrentInstanceName() {
  let name = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "composables";
  const vm = getCurrentInstance(name).type;
  return toKebabCase((vm == null ? void 0 : vm.aliasName) || (vm == null ? void 0 : vm.name));
}
let _uid = 0;
let _map = /* @__PURE__ */ new WeakMap();
function getUid() {
  const vm = getCurrentInstance("getUid");
  if (_map.has(vm)) return _map.get(vm);
  else {
    const uid = _uid++;
    _map.set(vm, uid);
    return uid;
  }
}
getUid.reset = () => {
  _uid = 0;
  _map = /* @__PURE__ */ new WeakMap();
};
function injectSelf(key) {
  let vm = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstance("injectSelf");
  const {
    provides
  } = vm;
  if (provides && key in provides) {
    return provides[key];
  }
  return void 0;
}
const DefaultsSymbol = Symbol.for("vuetify:defaults");
function createDefaults(options) {
  return ref(options);
}
function injectDefaults() {
  const defaults = inject$1(DefaultsSymbol);
  if (!defaults) throw new Error("[Vuetify] Could not find defaults instance");
  return defaults;
}
function provideDefaults(defaults, options) {
  const injectedDefaults = injectDefaults();
  const providedDefaults = ref(defaults);
  const newDefaults = computed(() => {
    const disabled = unref(options == null ? void 0 : options.disabled);
    if (disabled) return injectedDefaults.value;
    const scoped = unref(options == null ? void 0 : options.scoped);
    const reset = unref(options == null ? void 0 : options.reset);
    const root = unref(options == null ? void 0 : options.root);
    if (providedDefaults.value == null && !(scoped || reset || root)) return injectedDefaults.value;
    let properties = mergeDeep(providedDefaults.value, {
      prev: injectedDefaults.value
    });
    if (scoped) return properties;
    if (reset || root) {
      const len = Number(reset || Infinity);
      for (let i = 0; i <= len; i++) {
        if (!properties || !("prev" in properties)) {
          break;
        }
        properties = properties.prev;
      }
      if (properties && typeof root === "string" && root in properties) {
        properties = mergeDeep(mergeDeep(properties, {
          prev: properties
        }), properties[root]);
      }
      return properties;
    }
    return properties.prev ? mergeDeep(properties.prev, properties) : properties;
  });
  provide(DefaultsSymbol, newDefaults);
  return newDefaults;
}
function propIsDefined(vnode, prop) {
  var _a, _b;
  return typeof ((_a = vnode.props) == null ? void 0 : _a[prop]) !== "undefined" || typeof ((_b = vnode.props) == null ? void 0 : _b[toKebabCase(prop)]) !== "undefined";
}
function internalUseDefaults() {
  let props = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  let name = arguments.length > 1 ? arguments[1] : void 0;
  let defaults = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : injectDefaults();
  const vm = getCurrentInstance("useDefaults");
  name = name ?? vm.type.name ?? vm.type.__name;
  if (!name) {
    throw new Error("[Vuetify] Could not determine component name");
  }
  const componentDefaults = computed(() => {
    var _a;
    return (_a = defaults.value) == null ? void 0 : _a[props._as ?? name];
  });
  const _props = new Proxy(props, {
    get(target, prop) {
      var _a, _b, _c, _d, _e, _f, _g;
      const propValue = Reflect.get(target, prop);
      if (prop === "class" || prop === "style") {
        return [(_a = componentDefaults.value) == null ? void 0 : _a[prop], propValue].filter((v) => v != null);
      } else if (typeof prop === "string" && !propIsDefined(vm.vnode, prop)) {
        return ((_b = componentDefaults.value) == null ? void 0 : _b[prop]) !== void 0 ? (_c = componentDefaults.value) == null ? void 0 : _c[prop] : ((_e = (_d = defaults.value) == null ? void 0 : _d.global) == null ? void 0 : _e[prop]) !== void 0 ? (_g = (_f = defaults.value) == null ? void 0 : _f.global) == null ? void 0 : _g[prop] : propValue;
      }
      return propValue;
    }
  });
  const _subcomponentDefaults = shallowRef();
  watchEffect(() => {
    if (componentDefaults.value) {
      const subComponents = Object.entries(componentDefaults.value).filter((_ref) => {
        let [key] = _ref;
        return key.startsWith(key[0].toUpperCase());
      });
      _subcomponentDefaults.value = subComponents.length ? Object.fromEntries(subComponents) : void 0;
    } else {
      _subcomponentDefaults.value = void 0;
    }
  });
  function provideSubDefaults() {
    const injected = injectSelf(DefaultsSymbol, vm);
    provide(DefaultsSymbol, computed(() => {
      return _subcomponentDefaults.value ? mergeDeep((injected == null ? void 0 : injected.value) ?? {}, _subcomponentDefaults.value) : injected == null ? void 0 : injected.value;
    }));
  }
  return {
    props: _props,
    provideSubDefaults
  };
}
function defineComponent(options) {
  options._setup = options._setup ?? options.setup;
  if (!options.name) {
    consoleWarn("The component is missing an explicit name, unable to generate default prop value");
    return options;
  }
  if (options._setup) {
    options.props = propsFactory(options.props ?? {}, options.name)();
    const propKeys = Object.keys(options.props).filter((key) => key !== "class" && key !== "style");
    options.filterProps = function filterProps(props) {
      return pick(props, propKeys);
    };
    options.props._as = String;
    options.setup = function setup(props, ctx) {
      const defaults = injectDefaults();
      if (!defaults.value) return options._setup(props, ctx);
      const {
        props: _props,
        provideSubDefaults
      } = internalUseDefaults(props, props._as ?? options.name, defaults);
      const setupBindings = options._setup(_props, ctx);
      provideSubDefaults();
      return setupBindings;
    };
  }
  return options;
}
function genericComponent() {
  let exposeDefaults = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
  return (options) => (exposeDefaults ? defineComponent : defineComponent$1)(options);
}
function getScrollParent(el) {
  let includeHidden = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
  while (el) {
    if (includeHidden ? isPotentiallyScrollable(el) : hasScrollbar(el)) return el;
    el = el.parentElement;
  }
  return document.scrollingElement;
}
function hasScrollbar(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  const style = window.getComputedStyle(el);
  return style.overflowY === "scroll" || style.overflowY === "auto" && el.scrollHeight > el.clientHeight;
}
function isPotentiallyScrollable(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
  const style = window.getComputedStyle(el);
  return ["scroll", "auto"].includes(style.overflowY);
}
function useRender(render) {
  const vm = getCurrentInstance("useRender");
  vm.render = render;
}
const makeBorderProps = propsFactory({
  border: [Boolean, Number, String]
}, "border");
function useBorder(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const borderClasses = computed(() => {
    const border = isRef(props) ? props.value : props.border;
    const classes = [];
    if (border === true || border === "") {
      classes.push(`${name}--border`);
    } else if (typeof border === "string" || border === 0) {
      for (const value of String(border).split(" ")) {
        classes.push(`border-${value}`);
      }
    }
    return classes;
  });
  return {
    borderClasses
  };
}
const allowedDensities = [null, "default", "comfortable", "compact"];
const makeDensityProps = propsFactory({
  density: {
    type: String,
    default: "default",
    validator: (v) => allowedDensities.includes(v)
  }
}, "density");
function useDensity(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const densityClasses = computed(() => {
    return `${name}--density-${props.density}`;
  });
  return {
    densityClasses
  };
}
const makeElevationProps = propsFactory({
  elevation: {
    type: [Number, String],
    validator(v) {
      const value = parseInt(v);
      return !isNaN(value) && value >= 0 && // Material Design has a maximum elevation of 24
      // https://material.io/design/environment/elevation.html#default-elevations
      value <= 24;
    }
  }
}, "elevation");
function useElevation(props) {
  const elevationClasses = computed(() => {
    const elevation = isRef(props) ? props.value : props.elevation;
    const classes = [];
    if (elevation == null) return classes;
    classes.push(`elevation-${elevation}`);
    return classes;
  });
  return {
    elevationClasses
  };
}
const makeRoundedProps = propsFactory({
  rounded: {
    type: [Boolean, Number, String],
    default: void 0
  },
  tile: Boolean
}, "rounded");
function useRounded(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const roundedClasses = computed(() => {
    const rounded = isRef(props) ? props.value : props.rounded;
    const tile = isRef(props) ? props.value : props.tile;
    const classes = [];
    if (rounded === true || rounded === "") {
      classes.push(`${name}--rounded`);
    } else if (typeof rounded === "string" || rounded === 0) {
      for (const value of String(rounded).split(" ")) {
        classes.push(`rounded-${value}`);
      }
    } else if (tile || rounded === false) {
      classes.push("rounded-0");
    }
    return classes;
  });
  return {
    roundedClasses
  };
}
const makeTagProps = propsFactory({
  tag: {
    type: String,
    default: "div"
  }
}, "tag");
const ThemeSymbol = Symbol.for("vuetify:theme");
const makeThemeProps = propsFactory({
  theme: String
}, "theme");
function genDefaults$3() {
  return {
    defaultTheme: "light",
    variations: {
      colors: [],
      lighten: 0,
      darken: 0
    },
    themes: {
      light: {
        dark: false,
        colors: {
          background: "#FFFFFF",
          surface: "#FFFFFF",
          "surface-bright": "#FFFFFF",
          "surface-light": "#EEEEEE",
          "surface-variant": "#424242",
          "on-surface-variant": "#EEEEEE",
          primary: "#1867C0",
          "primary-darken-1": "#1F5592",
          secondary: "#48A9A6",
          "secondary-darken-1": "#018786",
          error: "#B00020",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FB8C00"
        },
        variables: {
          "border-color": "#000000",
          "border-opacity": 0.12,
          "high-emphasis-opacity": 0.87,
          "medium-emphasis-opacity": 0.6,
          "disabled-opacity": 0.38,
          "idle-opacity": 0.04,
          "hover-opacity": 0.04,
          "focus-opacity": 0.12,
          "selected-opacity": 0.08,
          "activated-opacity": 0.12,
          "pressed-opacity": 0.12,
          "dragged-opacity": 0.08,
          "theme-kbd": "#212529",
          "theme-on-kbd": "#FFFFFF",
          "theme-code": "#F5F5F5",
          "theme-on-code": "#000000"
        }
      },
      dark: {
        dark: true,
        colors: {
          background: "#121212",
          surface: "#212121",
          "surface-bright": "#ccbfd6",
          "surface-light": "#424242",
          "surface-variant": "#a3a3a3",
          "on-surface-variant": "#424242",
          primary: "#2196F3",
          "primary-darken-1": "#277CC1",
          secondary: "#54B6B2",
          "secondary-darken-1": "#48A9A6",
          error: "#CF6679",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FB8C00"
        },
        variables: {
          "border-color": "#FFFFFF",
          "border-opacity": 0.12,
          "high-emphasis-opacity": 1,
          "medium-emphasis-opacity": 0.7,
          "disabled-opacity": 0.5,
          "idle-opacity": 0.1,
          "hover-opacity": 0.04,
          "focus-opacity": 0.12,
          "selected-opacity": 0.08,
          "activated-opacity": 0.12,
          "pressed-opacity": 0.16,
          "dragged-opacity": 0.08,
          "theme-kbd": "#212529",
          "theme-on-kbd": "#FFFFFF",
          "theme-code": "#343434",
          "theme-on-code": "#CCCCCC"
        }
      }
    }
  };
}
function parseThemeOptions() {
  var _a, _b;
  let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : genDefaults$3();
  const defaults = genDefaults$3();
  if (!options) return {
    ...defaults,
    isDisabled: true
  };
  const themes = {};
  for (const [key, theme] of Object.entries(options.themes ?? {})) {
    const defaultTheme = theme.dark || key === "dark" ? (_a = defaults.themes) == null ? void 0 : _a.dark : (_b = defaults.themes) == null ? void 0 : _b.light;
    themes[key] = mergeDeep(defaultTheme, theme);
  }
  return mergeDeep(defaults, {
    ...options,
    themes
  });
}
function createTheme(options) {
  const parsedOptions = parseThemeOptions(options);
  const name = ref(parsedOptions.defaultTheme);
  const themes = ref(parsedOptions.themes);
  const computedThemes = computed(() => {
    const acc = {};
    for (const [name2, original] of Object.entries(themes.value)) {
      const theme = acc[name2] = {
        ...original,
        colors: {
          ...original.colors
        }
      };
      if (parsedOptions.variations) {
        for (const name3 of parsedOptions.variations.colors) {
          const color = theme.colors[name3];
          if (!color) continue;
          for (const variation of ["lighten", "darken"]) {
            const fn = variation === "lighten" ? lighten : darken;
            for (const amount of createRange(parsedOptions.variations[variation], 1)) {
              theme.colors[`${name3}-${variation}-${amount}`] = RGBtoHex(fn(parseColor(color), amount));
            }
          }
        }
      }
      for (const color of Object.keys(theme.colors)) {
        if (/^on-[a-z]/.test(color) || theme.colors[`on-${color}`]) continue;
        const onColor = `on-${color}`;
        const colorVal = parseColor(theme.colors[color]);
        theme.colors[onColor] = getForeground(colorVal);
      }
    }
    return acc;
  });
  const current = computed(() => computedThemes.value[name.value]);
  const styles = computed(() => {
    var _a;
    const lines = [];
    if ((_a = current.value) == null ? void 0 : _a.dark) {
      createCssClass(lines, ":root", ["color-scheme: dark"]);
    }
    createCssClass(lines, ":root", genCssVariables(current.value));
    for (const [themeName, theme] of Object.entries(computedThemes.value)) {
      createCssClass(lines, `.v-theme--${themeName}`, [`color-scheme: ${theme.dark ? "dark" : "normal"}`, ...genCssVariables(theme)]);
    }
    const bgLines = [];
    const fgLines = [];
    const colors = new Set(Object.values(computedThemes.value).flatMap((theme) => Object.keys(theme.colors)));
    for (const key of colors) {
      if (/^on-[a-z]/.test(key)) {
        createCssClass(fgLines, `.${key}`, [`color: rgb(var(--v-theme-${key})) !important`]);
      } else {
        createCssClass(bgLines, `.bg-${key}`, [`--v-theme-overlay-multiplier: var(--v-theme-${key}-overlay-multiplier)`, `background-color: rgb(var(--v-theme-${key})) !important`, `color: rgb(var(--v-theme-on-${key})) !important`]);
        createCssClass(fgLines, `.text-${key}`, [`color: rgb(var(--v-theme-${key})) !important`]);
        createCssClass(fgLines, `.border-${key}`, [`--v-border-color: var(--v-theme-${key})`]);
      }
    }
    lines.push(...bgLines, ...fgLines);
    return lines.map((str, i) => i === 0 ? str : `    ${str}`).join("");
  });
  function getHead() {
    return {
      style: [{
        children: styles.value,
        id: "vuetify-theme-stylesheet",
        nonce: parsedOptions.cspNonce || false
      }]
    };
  }
  function install(app) {
    if (parsedOptions.isDisabled) return;
    const head = app._context.provides.usehead;
    if (head) {
      if (head.push) {
        const entry = head.push(getHead);
        if (IN_BROWSER) {
          watch(styles, () => {
            entry.patch(getHead);
          });
        }
      } else {
        if (IN_BROWSER) {
          head.addHeadObjs(computed(getHead));
          watchEffect(() => head.updateDOM());
        } else {
          head.addHeadObjs(getHead());
        }
      }
    } else {
      let updateStyles = function() {
        if (typeof document !== "undefined" && !styleEl) {
          const el = document.createElement("style");
          el.type = "text/css";
          el.id = "vuetify-theme-stylesheet";
          if (parsedOptions.cspNonce) el.setAttribute("nonce", parsedOptions.cspNonce);
          styleEl = el;
          document.head.appendChild(styleEl);
        }
        if (styleEl) styleEl.innerHTML = styles.value;
      };
      let styleEl = IN_BROWSER ? document.getElementById("vuetify-theme-stylesheet") : null;
      if (IN_BROWSER) {
        watch(styles, updateStyles, {
          immediate: true
        });
      } else {
        updateStyles();
      }
    }
  }
  const themeClasses = computed(() => parsedOptions.isDisabled ? void 0 : `v-theme--${name.value}`);
  return {
    install,
    isDisabled: parsedOptions.isDisabled,
    name,
    themes,
    current,
    computedThemes,
    themeClasses,
    styles,
    global: {
      name,
      current
    }
  };
}
function provideTheme(props) {
  getCurrentInstance("provideTheme");
  const theme = inject$1(ThemeSymbol, null);
  if (!theme) throw new Error("Could not find Vuetify theme injection");
  const name = computed(() => {
    return props.theme ?? theme.name.value;
  });
  const current = computed(() => theme.themes.value[name.value]);
  const themeClasses = computed(() => theme.isDisabled ? void 0 : `v-theme--${name.value}`);
  const newTheme = {
    ...theme,
    name,
    current,
    themeClasses
  };
  provide(ThemeSymbol, newTheme);
  return newTheme;
}
function createCssClass(lines, selector, content) {
  lines.push(`${selector} {
`, ...content.map((line) => `  ${line};
`), "}\n");
}
function genCssVariables(theme) {
  const lightOverlay = theme.dark ? 2 : 1;
  const darkOverlay = theme.dark ? 1 : 2;
  const variables = [];
  for (const [key, value] of Object.entries(theme.colors)) {
    const rgb = parseColor(value);
    variables.push(`--v-theme-${key}: ${rgb.r},${rgb.g},${rgb.b}`);
    if (!key.startsWith("on-")) {
      variables.push(`--v-theme-${key}-overlay-multiplier: ${getLuma(value) > 0.18 ? lightOverlay : darkOverlay}`);
    }
  }
  for (const [key, value] of Object.entries(theme.variables)) {
    const color = typeof value === "string" && value.startsWith("#") ? parseColor(value) : void 0;
    const rgb = color ? `${color.r}, ${color.g}, ${color.b}` : void 0;
    variables.push(`--v-${key}: ${rgb ?? value}`);
  }
  return variables;
}
function useColor(colors) {
  return destructComputed(() => {
    const classes = [];
    const styles = {};
    if (colors.value.background) {
      if (isCssColor(colors.value.background)) {
        styles.backgroundColor = colors.value.background;
        if (!colors.value.text && isParsableColor(colors.value.background)) {
          const backgroundColor = parseColor(colors.value.background);
          if (backgroundColor.a == null || backgroundColor.a === 1) {
            const textColor = getForeground(backgroundColor);
            styles.color = textColor;
            styles.caretColor = textColor;
          }
        }
      } else {
        classes.push(`bg-${colors.value.background}`);
      }
    }
    if (colors.value.text) {
      if (isCssColor(colors.value.text)) {
        styles.color = colors.value.text;
        styles.caretColor = colors.value.text;
      } else {
        classes.push(`text-${colors.value.text}`);
      }
    }
    return {
      colorClasses: classes,
      colorStyles: styles
    };
  });
}
function useTextColor(props, name) {
  const colors = computed(() => ({
    text: isRef(props) ? props.value : name ? props[name] : null
  }));
  const {
    colorClasses: textColorClasses,
    colorStyles: textColorStyles
  } = useColor(colors);
  return {
    textColorClasses,
    textColorStyles
  };
}
function useBackgroundColor(props, name) {
  const colors = computed(() => ({
    background: isRef(props) ? props.value : name ? props[name] : null
  }));
  const {
    colorClasses: backgroundColorClasses,
    colorStyles: backgroundColorStyles
  } = useColor(colors);
  return {
    backgroundColorClasses,
    backgroundColorStyles
  };
}
const allowedVariants = ["elevated", "flat", "tonal", "outlined", "text", "plain"];
function genOverlays(isClickable, name) {
  return createVNode(Fragment, null, [createVNode("span", {
    "key": "overlay",
    "class": `${name}__overlay`
  }, null), createVNode("span", {
    "key": "underlay",
    "class": `${name}__underlay`
  }, null)]);
}
const makeVariantProps = propsFactory({
  color: String,
  variant: {
    type: String,
    default: "elevated",
    validator: (v) => allowedVariants.includes(v)
  }
}, "variant");
function useVariant(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const variantClasses = computed(() => {
    const {
      variant
    } = unref(props);
    return `${name}--variant-${variant}`;
  });
  const {
    colorClasses,
    colorStyles
  } = useColor(computed(() => {
    const {
      variant,
      color
    } = unref(props);
    return {
      [["elevated", "flat"].includes(variant) ? "background" : "text"]: color
    };
  }));
  return {
    colorClasses,
    colorStyles,
    variantClasses
  };
}
const makeVBtnGroupProps = propsFactory({
  baseColor: String,
  divided: Boolean,
  ...makeBorderProps(),
  ...makeComponentProps(),
  ...makeDensityProps(),
  ...makeElevationProps(),
  ...makeRoundedProps(),
  ...makeTagProps(),
  ...makeThemeProps(),
  ...makeVariantProps()
}, "VBtnGroup");
const VBtnGroup = genericComponent()({
  name: "VBtnGroup",
  props: makeVBtnGroupProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    provideDefaults({
      VBtn: {
        height: "auto",
        baseColor: toRef(props, "baseColor"),
        color: toRef(props, "color"),
        density: toRef(props, "density"),
        flat: true,
        variant: toRef(props, "variant")
      }
    });
    useRender(() => {
      return createVNode(props.tag, {
        "class": ["v-btn-group", {
          "v-btn-group--divided": props.divided
        }, themeClasses.value, borderClasses.value, densityClasses.value, elevationClasses.value, roundedClasses.value, props.class],
        "style": props.style
      }, slots);
    });
  }
});
function useToggleScope(source, fn) {
  let scope;
  function start() {
    scope = effectScope();
    scope.run(() => fn.length ? fn(() => {
      scope == null ? void 0 : scope.stop();
      start();
    }) : fn());
  }
  watch(source, (active) => {
    if (active && !scope) {
      start();
    } else if (!active) {
      scope == null ? void 0 : scope.stop();
      scope = void 0;
    }
  }, {
    immediate: true
  });
  onScopeDispose(() => {
    scope == null ? void 0 : scope.stop();
  });
}
function useProxiedModel(props, prop, defaultValue) {
  let transformIn = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : (v) => v;
  let transformOut = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : (v) => v;
  const vm = getCurrentInstance("useProxiedModel");
  const internal = ref(props[prop] !== void 0 ? props[prop] : defaultValue);
  const kebabProp = toKebabCase(prop);
  const checkKebab = kebabProp !== prop;
  const isControlled = checkKebab ? computed(() => {
    var _a, _b, _c, _d;
    void props[prop];
    return !!((((_a = vm.vnode.props) == null ? void 0 : _a.hasOwnProperty(prop)) || ((_b = vm.vnode.props) == null ? void 0 : _b.hasOwnProperty(kebabProp))) && (((_c = vm.vnode.props) == null ? void 0 : _c.hasOwnProperty(`onUpdate:${prop}`)) || ((_d = vm.vnode.props) == null ? void 0 : _d.hasOwnProperty(`onUpdate:${kebabProp}`))));
  }) : computed(() => {
    var _a, _b;
    void props[prop];
    return !!(((_a = vm.vnode.props) == null ? void 0 : _a.hasOwnProperty(prop)) && ((_b = vm.vnode.props) == null ? void 0 : _b.hasOwnProperty(`onUpdate:${prop}`)));
  });
  useToggleScope(() => !isControlled.value, () => {
    watch(() => props[prop], (val) => {
      internal.value = val;
    });
  });
  const model = computed({
    get() {
      const externalValue = props[prop];
      return transformIn(isControlled.value ? externalValue : internal.value);
    },
    set(internalValue) {
      const newValue = transformOut(internalValue);
      const value = toRaw(isControlled.value ? props[prop] : internal.value);
      if (value === newValue || transformIn(value) === internalValue) {
        return;
      }
      internal.value = newValue;
      vm == null ? void 0 : vm.emit(`update:${prop}`, newValue);
    }
  });
  Object.defineProperty(model, "externalValue", {
    get: () => isControlled.value ? props[prop] : internal.value
  });
  return model;
}
const makeGroupProps = propsFactory({
  modelValue: {
    type: null,
    default: void 0
  },
  multiple: Boolean,
  mandatory: [Boolean, String],
  max: Number,
  selectedClass: String,
  disabled: Boolean
}, "group");
const makeGroupItemProps = propsFactory({
  value: null,
  disabled: Boolean,
  selectedClass: String
}, "group-item");
function useGroupItem(props, injectKey) {
  let required = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
  const vm = getCurrentInstance("useGroupItem");
  if (!vm) {
    throw new Error("[Vuetify] useGroupItem composable must be used inside a component setup function");
  }
  const id = getUid();
  provide(Symbol.for(`${injectKey.description}:id`), id);
  const group = inject$1(injectKey, null);
  if (!group) {
    if (!required) return group;
    throw new Error(`[Vuetify] Could not find useGroup injection with symbol ${injectKey.description}`);
  }
  const value = toRef(props, "value");
  const disabled = computed(() => !!(group.disabled.value || props.disabled));
  group.register({
    id,
    value,
    disabled
  }, vm);
  onBeforeUnmount(() => {
    group.unregister(id);
  });
  const isSelected = computed(() => {
    return group.isSelected(id);
  });
  const isFirst = computed(() => {
    return group.items.value[0].id === id;
  });
  const isLast = computed(() => {
    return group.items.value[group.items.value.length - 1].id === id;
  });
  const selectedClass = computed(() => isSelected.value && [group.selectedClass.value, props.selectedClass]);
  watch(isSelected, (value2) => {
    vm.emit("group:selected", {
      value: value2
    });
  }, {
    flush: "sync"
  });
  return {
    id,
    isSelected,
    isFirst,
    isLast,
    toggle: () => group.select(id, !isSelected.value),
    select: (value2) => group.select(id, value2),
    selectedClass,
    value,
    disabled,
    group
  };
}
function useGroup(props, injectKey) {
  let isUnmounted = false;
  const items = reactive([]);
  const selected = useProxiedModel(props, "modelValue", [], (v) => {
    if (v == null) return [];
    return getIds(items, wrapInArray(v));
  }, (v) => {
    const arr = getValues(items, v);
    return props.multiple ? arr : arr[0];
  });
  const groupVm = getCurrentInstance("useGroup");
  function register2(item, vm) {
    const unwrapped = item;
    const key = Symbol.for(`${injectKey.description}:id`);
    const children = findChildrenWithProvide(key, groupVm == null ? void 0 : groupVm.vnode);
    const index = children.indexOf(vm);
    if (unref(unwrapped.value) == null) {
      unwrapped.value = index;
      unwrapped.useIndexAsValue = true;
    }
    if (index > -1) {
      items.splice(index, 0, unwrapped);
    } else {
      items.push(unwrapped);
    }
  }
  function unregister(id) {
    if (isUnmounted) return;
    forceMandatoryValue();
    const index = items.findIndex((item) => item.id === id);
    items.splice(index, 1);
  }
  function forceMandatoryValue() {
    const item = items.find((item2) => !item2.disabled);
    if (item && props.mandatory === "force" && !selected.value.length) {
      selected.value = [item.id];
    }
  }
  onMounted(() => {
    forceMandatoryValue();
  });
  onBeforeUnmount(() => {
    isUnmounted = true;
  });
  onUpdated(() => {
    for (let i = 0; i < items.length; i++) {
      if (items[i].useIndexAsValue) {
        items[i].value = i;
      }
    }
  });
  function select(id, value) {
    const item = items.find((item2) => item2.id === id);
    if (value && (item == null ? void 0 : item.disabled)) return;
    if (props.multiple) {
      const internalValue = selected.value.slice();
      const index = internalValue.findIndex((v) => v === id);
      const isSelected = ~index;
      value = value ?? !isSelected;
      if (isSelected && props.mandatory && internalValue.length <= 1) return;
      if (!isSelected && props.max != null && internalValue.length + 1 > props.max) return;
      if (index < 0 && value) internalValue.push(id);
      else if (index >= 0 && !value) internalValue.splice(index, 1);
      selected.value = internalValue;
    } else {
      const isSelected = selected.value.includes(id);
      if (props.mandatory && isSelected) return;
      selected.value = value ?? !isSelected ? [id] : [];
    }
  }
  function step(offset) {
    if (props.multiple) consoleWarn('This method is not supported when using "multiple" prop');
    if (!selected.value.length) {
      const item = items.find((item2) => !item2.disabled);
      item && (selected.value = [item.id]);
    } else {
      const currentId = selected.value[0];
      const currentIndex = items.findIndex((i) => i.id === currentId);
      let newIndex = (currentIndex + offset) % items.length;
      let newItem = items[newIndex];
      while (newItem.disabled && newIndex !== currentIndex) {
        newIndex = (newIndex + offset) % items.length;
        newItem = items[newIndex];
      }
      if (newItem.disabled) return;
      selected.value = [items[newIndex].id];
    }
  }
  const state = {
    register: register2,
    unregister,
    selected,
    select,
    disabled: toRef(props, "disabled"),
    prev: () => step(items.length - 1),
    next: () => step(1),
    isSelected: (id) => selected.value.includes(id),
    selectedClass: computed(() => props.selectedClass),
    items: computed(() => items),
    getItemIndex: (value) => getItemIndex(items, value)
  };
  provide(injectKey, state);
  return state;
}
function getItemIndex(items, value) {
  const ids = getIds(items, [value]);
  if (!ids.length) return -1;
  return items.findIndex((item) => item.id === ids[0]);
}
function getIds(items, modelValue) {
  const ids = [];
  modelValue.forEach((value) => {
    const item = items.find((item2) => deepEqual(value, item2.value));
    const itemByIndex = items[value];
    if ((item == null ? void 0 : item.value) != null) {
      ids.push(item.id);
    } else if (itemByIndex != null) {
      ids.push(itemByIndex.id);
    }
  });
  return ids;
}
function getValues(items, ids) {
  const values = [];
  ids.forEach((id) => {
    const itemIndex = items.findIndex((item) => item.id === id);
    if (~itemIndex) {
      const item = items[itemIndex];
      values.push(item.value != null ? item.value : itemIndex);
    }
  });
  return values;
}
const VBtnToggleSymbol = Symbol.for("vuetify:v-btn-toggle");
const makeVBtnToggleProps = propsFactory({
  ...makeVBtnGroupProps(),
  ...makeGroupProps()
}, "VBtnToggle");
genericComponent()({
  name: "VBtnToggle",
  props: makeVBtnToggleProps(),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      isSelected,
      next,
      prev,
      select,
      selected
    } = useGroup(props, VBtnToggleSymbol);
    useRender(() => {
      const btnGroupProps = VBtnGroup.filterProps(props);
      return createVNode(VBtnGroup, mergeProps({
        "class": ["v-btn-toggle", props.class]
      }, btnGroupProps, {
        "style": props.style
      }), {
        default: () => {
          var _a;
          return [(_a = slots.default) == null ? void 0 : _a.call(slots, {
            isSelected,
            next,
            prev,
            select,
            selected
          })];
        }
      });
    });
    return {
      next,
      prev,
      select
    };
  }
});
const makeVDefaultsProviderProps = propsFactory({
  defaults: Object,
  disabled: Boolean,
  reset: [Number, String],
  root: [Boolean, String],
  scoped: Boolean
}, "VDefaultsProvider");
const VDefaultsProvider = genericComponent(false)({
  name: "VDefaultsProvider",
  props: makeVDefaultsProviderProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      defaults,
      disabled,
      reset,
      root,
      scoped
    } = toRefs(props);
    provideDefaults(defaults, {
      reset,
      root,
      scoped,
      disabled
    });
    return () => {
      var _a;
      return (_a = slots.default) == null ? void 0 : _a.call(slots);
    };
  }
});
const aliases = {
  collapse: "mdi-chevron-up",
  complete: "mdi-check",
  cancel: "mdi-close-circle",
  close: "mdi-close",
  delete: "mdi-close-circle",
  // delete (e.g. v-chip close)
  clear: "mdi-close-circle",
  success: "mdi-check-circle",
  info: "mdi-information",
  warning: "mdi-alert-circle",
  error: "mdi-close-circle",
  prev: "mdi-chevron-left",
  next: "mdi-chevron-right",
  checkboxOn: "mdi-checkbox-marked",
  checkboxOff: "mdi-checkbox-blank-outline",
  checkboxIndeterminate: "mdi-minus-box",
  delimiter: "mdi-circle",
  // for carousel
  sortAsc: "mdi-arrow-up",
  sortDesc: "mdi-arrow-down",
  expand: "mdi-chevron-down",
  menu: "mdi-menu",
  subgroup: "mdi-menu-down",
  dropdown: "mdi-menu-down",
  radioOn: "mdi-radiobox-marked",
  radioOff: "mdi-radiobox-blank",
  edit: "mdi-pencil",
  ratingEmpty: "mdi-star-outline",
  ratingFull: "mdi-star",
  ratingHalf: "mdi-star-half-full",
  loading: "mdi-cached",
  first: "mdi-page-first",
  last: "mdi-page-last",
  unfold: "mdi-unfold-more-horizontal",
  file: "mdi-paperclip",
  plus: "mdi-plus",
  minus: "mdi-minus",
  calendar: "mdi-calendar",
  treeviewCollapse: "mdi-menu-down",
  treeviewExpand: "mdi-menu-right",
  eyeDropper: "mdi-eyedropper"
};
const mdi = {
  // Not using mergeProps here, functional components merge props by default (?)
  component: (props) => h(VClassIcon, {
    ...props,
    class: "mdi"
  })
};
const IconValue = [String, Function, Object, Array];
const IconSymbol = Symbol.for("vuetify:icons");
const makeIconProps = propsFactory({
  icon: {
    type: IconValue
  },
  // Could not remove this and use makeTagProps, types complained because it is not required
  tag: {
    type: String,
    required: true
  }
}, "icon");
const VComponentIcon = genericComponent()({
  name: "VComponentIcon",
  props: makeIconProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      const Icon = props.icon;
      return createVNode(props.tag, null, {
        default: () => {
          var _a;
          return [props.icon ? createVNode(Icon, null, null) : (_a = slots.default) == null ? void 0 : _a.call(slots)];
        }
      });
    };
  }
});
const VSvgIcon = defineComponent({
  name: "VSvgIcon",
  inheritAttrs: false,
  props: makeIconProps(),
  setup(props, _ref2) {
    let {
      attrs
    } = _ref2;
    return () => {
      return createVNode(props.tag, mergeProps(attrs, {
        "style": null
      }), {
        default: () => [createVNode("svg", {
          "class": "v-icon__svg",
          "xmlns": "http://www.w3.org/2000/svg",
          "viewBox": "0 0 24 24",
          "role": "img",
          "aria-hidden": "true"
        }, [Array.isArray(props.icon) ? props.icon.map((path) => Array.isArray(path) ? createVNode("path", {
          "d": path[0],
          "fill-opacity": path[1]
        }, null) : createVNode("path", {
          "d": path
        }, null)) : createVNode("path", {
          "d": props.icon
        }, null)])]
      });
    };
  }
});
defineComponent({
  name: "VLigatureIcon",
  props: makeIconProps(),
  setup(props) {
    return () => {
      return createVNode(props.tag, null, {
        default: () => [props.icon]
      });
    };
  }
});
const VClassIcon = defineComponent({
  name: "VClassIcon",
  props: makeIconProps(),
  setup(props) {
    return () => {
      return createVNode(props.tag, {
        "class": props.icon
      }, null);
    };
  }
});
function genDefaults$2() {
  return {
    svg: {
      component: VSvgIcon
    },
    class: {
      component: VClassIcon
    }
  };
}
function createIcons(options) {
  const sets = genDefaults$2();
  const defaultSet = (options == null ? void 0 : options.defaultSet) ?? "mdi";
  if (defaultSet === "mdi" && !sets.mdi) {
    sets.mdi = mdi;
  }
  return mergeDeep({
    defaultSet,
    sets,
    aliases: {
      ...aliases,
      /* eslint-disable max-len */
      vuetify: ["M8.2241 14.2009L12 21L22 3H14.4459L8.2241 14.2009Z", ["M7.26303 12.4733L7.00113 12L2 3H12.5261C12.5261 3 12.5261 3 12.5261 3L7.26303 12.4733Z", 0.6]],
      "vuetify-outline": "svg:M7.26 12.47 12.53 3H2L7.26 12.47ZM14.45 3 8.22 14.2 12 21 22 3H14.45ZM18.6 5 12 16.88 10.51 14.2 15.62 5ZM7.26 8.35 5.4 5H9.13L7.26 8.35Z",
      "vuetify-play": ["m6.376 13.184-4.11-7.192C1.505 4.66 2.467 3 4.003 3h8.532l-.953 1.576-.006.01-.396.677c-.429.732-.214 1.507.194 2.015.404.503 1.092.878 1.869.806a3.72 3.72 0 0 1 1.005.022c.276.053.434.143.523.237.138.146.38.635-.25 2.09-.893 1.63-1.553 1.722-1.847 1.677-.213-.033-.468-.158-.756-.406a4.95 4.95 0 0 1-.8-.927c-.39-.564-1.04-.84-1.66-.846-.625-.006-1.316.27-1.693.921l-.478.826-.911 1.506Z", ["M9.093 11.552c.046-.079.144-.15.32-.148a.53.53 0 0 1 .43.207c.285.414.636.847 1.046 1.2.405.35.914.662 1.516.754 1.334.205 2.502-.698 3.48-2.495l.014-.028.013-.03c.687-1.574.774-2.852-.005-3.675-.37-.391-.861-.586-1.333-.676a5.243 5.243 0 0 0-1.447-.044c-.173.016-.393-.073-.54-.257-.145-.18-.127-.316-.082-.392l.393-.672L14.287 3h5.71c1.536 0 2.499 1.659 1.737 2.992l-7.997 13.996c-.768 1.344-2.706 1.344-3.473 0l-3.037-5.314 1.377-2.278.004-.006.004-.007.481-.831Z", 0.6]]
      /* eslint-enable max-len */
    }
  }, options);
}
const useIcon = (props) => {
  const icons = inject$1(IconSymbol);
  if (!icons) throw new Error("Missing Vuetify Icons provide!");
  const iconData = computed(() => {
    var _a;
    const iconAlias = unref(props);
    if (!iconAlias) return {
      component: VComponentIcon
    };
    let icon = iconAlias;
    if (typeof icon === "string") {
      icon = icon.trim();
      if (icon.startsWith("$")) {
        icon = (_a = icons.aliases) == null ? void 0 : _a[icon.slice(1)];
      }
    }
    if (!icon) consoleWarn(`Could not find aliased icon "${iconAlias}"`);
    if (Array.isArray(icon)) {
      return {
        component: VSvgIcon,
        icon
      };
    } else if (typeof icon !== "string") {
      return {
        component: VComponentIcon,
        icon
      };
    }
    const iconSetName = Object.keys(icons.sets).find((setName) => typeof icon === "string" && icon.startsWith(`${setName}:`));
    const iconName = iconSetName ? icon.slice(iconSetName.length + 1) : icon;
    const iconSet = icons.sets[iconSetName ?? icons.defaultSet];
    return {
      component: iconSet.component,
      icon: iconName
    };
  });
  return {
    iconData
  };
};
const predefinedSizes = ["x-small", "small", "default", "large", "x-large"];
const makeSizeProps = propsFactory({
  size: {
    type: [String, Number],
    default: "default"
  }
}, "size");
function useSize(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  return destructComputed(() => {
    let sizeClasses;
    let sizeStyles;
    if (includes(predefinedSizes, props.size)) {
      sizeClasses = `${name}--size-${props.size}`;
    } else if (props.size) {
      sizeStyles = {
        width: convertToUnit(props.size),
        height: convertToUnit(props.size)
      };
    }
    return {
      sizeClasses,
      sizeStyles
    };
  });
}
const makeVIconProps = propsFactory({
  color: String,
  disabled: Boolean,
  start: Boolean,
  end: Boolean,
  icon: IconValue,
  ...makeComponentProps(),
  ...makeSizeProps(),
  ...makeTagProps({
    tag: "i"
  }),
  ...makeThemeProps()
}, "VIcon");
const VIcon = genericComponent()({
  name: "VIcon",
  props: makeVIconProps(),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const slotIcon = ref();
    const {
      themeClasses
    } = provideTheme(props);
    const {
      iconData
    } = useIcon(computed(() => slotIcon.value || props.icon));
    const {
      sizeClasses
    } = useSize(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(toRef(props, "color"));
    useRender(() => {
      var _a, _b;
      const slotValue = (_a = slots.default) == null ? void 0 : _a.call(slots);
      if (slotValue) {
        slotIcon.value = (_b = flattenFragments(slotValue).filter((node) => node.type === Text && node.children && typeof node.children === "string")[0]) == null ? void 0 : _b.children;
      }
      const hasClick = !!(attrs.onClick || attrs.onClickOnce);
      return createVNode(iconData.value.component, {
        "tag": props.tag,
        "icon": iconData.value.icon,
        "class": ["v-icon", "notranslate", themeClasses.value, sizeClasses.value, textColorClasses.value, {
          "v-icon--clickable": hasClick,
          "v-icon--disabled": props.disabled,
          "v-icon--start": props.start,
          "v-icon--end": props.end
        }, props.class],
        "style": [!sizeClasses.value ? {
          fontSize: convertToUnit(props.size),
          height: convertToUnit(props.size),
          width: convertToUnit(props.size)
        } : void 0, textColorStyles.value, props.style],
        "role": hasClick ? "button" : void 0,
        "aria-hidden": !hasClick,
        "tabindex": hasClick ? props.disabled ? -1 : 0 : void 0
      }, {
        default: () => [slotValue]
      });
    });
    return {};
  }
});
function useIntersectionObserver(callback, options) {
  const intersectionRef = ref();
  const isIntersecting = shallowRef(false);
  if (SUPPORTS_INTERSECTION) {
    const observer = new IntersectionObserver((entries) => {
      isIntersecting.value = !!entries.find((entry) => entry.isIntersecting);
    }, options);
    onBeforeUnmount(() => {
      observer.disconnect();
    });
    watch(intersectionRef, (newValue, oldValue) => {
      if (oldValue) {
        observer.unobserve(oldValue);
        isIntersecting.value = false;
      }
      if (newValue) observer.observe(newValue);
    }, {
      flush: "post"
    });
  }
  return {
    intersectionRef,
    isIntersecting
  };
}
function useResizeObserver(callback) {
  let box = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "content";
  const resizeRef = templateRef();
  const contentRect = ref();
  if (IN_BROWSER) {
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      if (box === "content") {
        contentRect.value = entries[0].contentRect;
      } else {
        contentRect.value = entries[0].target.getBoundingClientRect();
      }
    });
    onBeforeUnmount(() => {
      observer.disconnect();
    });
    watch(() => resizeRef.el, (newValue, oldValue) => {
      if (oldValue) {
        observer.unobserve(oldValue);
        contentRect.value = void 0;
      }
      if (newValue) observer.observe(newValue);
    }, {
      flush: "post"
    });
  }
  return {
    resizeRef,
    contentRect: readonly(contentRect)
  };
}
const makeVProgressCircularProps = propsFactory({
  bgColor: String,
  color: String,
  indeterminate: [Boolean, String],
  modelValue: {
    type: [Number, String],
    default: 0
  },
  rotate: {
    type: [Number, String],
    default: 0
  },
  width: {
    type: [Number, String],
    default: 4
  },
  ...makeComponentProps(),
  ...makeSizeProps(),
  ...makeTagProps({
    tag: "div"
  }),
  ...makeThemeProps()
}, "VProgressCircular");
const VProgressCircular = genericComponent()({
  name: "VProgressCircular",
  props: makeVProgressCircularProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const MAGIC_RADIUS_CONSTANT = 20;
    const CIRCUMFERENCE = 2 * Math.PI * MAGIC_RADIUS_CONSTANT;
    const root = ref();
    const {
      themeClasses
    } = provideTheme(props);
    const {
      sizeClasses,
      sizeStyles
    } = useSize(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(toRef(props, "color"));
    const {
      textColorClasses: underlayColorClasses,
      textColorStyles: underlayColorStyles
    } = useTextColor(toRef(props, "bgColor"));
    const {
      intersectionRef,
      isIntersecting
    } = useIntersectionObserver();
    const {
      resizeRef,
      contentRect
    } = useResizeObserver();
    const normalizedValue = computed(() => Math.max(0, Math.min(100, parseFloat(props.modelValue))));
    const width = computed(() => Number(props.width));
    const size = computed(() => {
      return sizeStyles.value ? Number(props.size) : contentRect.value ? contentRect.value.width : Math.max(width.value, 32);
    });
    const diameter = computed(() => MAGIC_RADIUS_CONSTANT / (1 - width.value / size.value) * 2);
    const strokeWidth = computed(() => width.value / size.value * diameter.value);
    const strokeDashOffset = computed(() => convertToUnit((100 - normalizedValue.value) / 100 * CIRCUMFERENCE));
    watchEffect(() => {
      intersectionRef.value = root.value;
      resizeRef.value = root.value;
    });
    useRender(() => createVNode(props.tag, {
      "ref": root,
      "class": ["v-progress-circular", {
        "v-progress-circular--indeterminate": !!props.indeterminate,
        "v-progress-circular--visible": isIntersecting.value,
        "v-progress-circular--disable-shrink": props.indeterminate === "disable-shrink"
      }, themeClasses.value, sizeClasses.value, textColorClasses.value, props.class],
      "style": [sizeStyles.value, textColorStyles.value, props.style],
      "role": "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": props.indeterminate ? void 0 : normalizedValue.value
    }, {
      default: () => [createVNode("svg", {
        "style": {
          transform: `rotate(calc(-90deg + ${Number(props.rotate)}deg))`
        },
        "xmlns": "http://www.w3.org/2000/svg",
        "viewBox": `0 0 ${diameter.value} ${diameter.value}`
      }, [createVNode("circle", {
        "class": ["v-progress-circular__underlay", underlayColorClasses.value],
        "style": underlayColorStyles.value,
        "fill": "transparent",
        "cx": "50%",
        "cy": "50%",
        "r": MAGIC_RADIUS_CONSTANT,
        "stroke-width": strokeWidth.value,
        "stroke-dasharray": CIRCUMFERENCE,
        "stroke-dashoffset": 0
      }, null), createVNode("circle", {
        "class": "v-progress-circular__overlay",
        "fill": "transparent",
        "cx": "50%",
        "cy": "50%",
        "r": MAGIC_RADIUS_CONSTANT,
        "stroke-width": strokeWidth.value,
        "stroke-dasharray": CIRCUMFERENCE,
        "stroke-dashoffset": strokeDashOffset.value
      }, null)]), slots.default && createVNode("div", {
        "class": "v-progress-circular__content"
      }, [slots.default({
        value: normalizedValue.value
      })])]
    }));
    return {};
  }
});
const makeDimensionProps = propsFactory({
  height: [Number, String],
  maxHeight: [Number, String],
  maxWidth: [Number, String],
  minHeight: [Number, String],
  minWidth: [Number, String],
  width: [Number, String]
}, "dimension");
function useDimension(props) {
  const dimensionStyles = computed(() => {
    const styles = {};
    const height = convertToUnit(props.height);
    const maxHeight = convertToUnit(props.maxHeight);
    const maxWidth = convertToUnit(props.maxWidth);
    const minHeight = convertToUnit(props.minHeight);
    const minWidth = convertToUnit(props.minWidth);
    const width = convertToUnit(props.width);
    if (height != null) styles.height = height;
    if (maxHeight != null) styles.maxHeight = maxHeight;
    if (maxWidth != null) styles.maxWidth = maxWidth;
    if (minHeight != null) styles.minHeight = minHeight;
    if (minWidth != null) styles.minWidth = minWidth;
    if (width != null) styles.width = width;
    return styles;
  });
  return {
    dimensionStyles
  };
}
const en = {
  badge: "Badge",
  open: "Open",
  close: "Close",
  dismiss: "Dismiss",
  confirmEdit: {
    ok: "OK",
    cancel: "Cancel"
  },
  dataIterator: {
    noResultsText: "No matching records found",
    loadingText: "Loading items..."
  },
  dataTable: {
    itemsPerPageText: "Rows per page:",
    ariaLabel: {
      sortDescending: "Sorted descending.",
      sortAscending: "Sorted ascending.",
      sortNone: "Not sorted.",
      activateNone: "Activate to remove sorting.",
      activateDescending: "Activate to sort descending.",
      activateAscending: "Activate to sort ascending."
    },
    sortBy: "Sort by"
  },
  dataFooter: {
    itemsPerPageText: "Items per page:",
    itemsPerPageAll: "All",
    nextPage: "Next page",
    prevPage: "Previous page",
    firstPage: "First page",
    lastPage: "Last page",
    pageText: "{0}-{1} of {2}"
  },
  dateRangeInput: {
    divider: "to"
  },
  datePicker: {
    itemsSelected: "{0} selected",
    range: {
      title: "Select dates",
      header: "Enter dates"
    },
    title: "Select date",
    header: "Enter date",
    input: {
      placeholder: "Enter date"
    }
  },
  noDataText: "No data available",
  carousel: {
    prev: "Previous visual",
    next: "Next visual",
    ariaLabel: {
      delimiter: "Carousel slide {0} of {1}"
    }
  },
  calendar: {
    moreEvents: "{0} more",
    today: "Today"
  },
  input: {
    clear: "Clear {0}",
    prependAction: "{0} prepended action",
    appendAction: "{0} appended action",
    otp: "Please enter OTP character {0}"
  },
  fileInput: {
    counter: "{0} files",
    counterSize: "{0} files ({1} in total)"
  },
  timePicker: {
    am: "AM",
    pm: "PM",
    title: "Select Time"
  },
  pagination: {
    ariaLabel: {
      root: "Pagination Navigation",
      next: "Next page",
      previous: "Previous page",
      page: "Go to page {0}",
      currentPage: "Page {0}, Current page",
      first: "First page",
      last: "Last page"
    }
  },
  stepper: {
    next: "Next",
    prev: "Previous"
  },
  rating: {
    ariaLabel: {
      item: "Rating {0} of {1}"
    }
  },
  loading: "Loading...",
  infiniteScroll: {
    loadMore: "Load more",
    empty: "No more"
  }
};
const LANG_PREFIX = "$vuetify.";
const replace = (str, params) => {
  return str.replace(/\{(\d+)\}/g, (match, index) => {
    return String(params[+index]);
  });
};
const createTranslateFunction = (current, fallback, messages) => {
  return function(key) {
    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }
    if (!key.startsWith(LANG_PREFIX)) {
      return replace(key, params);
    }
    const shortKey = key.replace(LANG_PREFIX, "");
    const currentLocale = current.value && messages.value[current.value];
    const fallbackLocale = fallback.value && messages.value[fallback.value];
    let str = getObjectValueByPath(currentLocale, shortKey, null);
    if (!str) {
      consoleWarn(`Translation key "${key}" not found in "${current.value}", trying fallback locale`);
      str = getObjectValueByPath(fallbackLocale, shortKey, null);
    }
    if (!str) {
      consoleError(`Translation key "${key}" not found in fallback`);
      str = key;
    }
    if (typeof str !== "string") {
      consoleError(`Translation key "${key}" has a non-string value`);
      str = key;
    }
    return replace(str, params);
  };
};
function createNumberFunction(current, fallback) {
  return (value, options) => {
    const numberFormat = new Intl.NumberFormat([current.value, fallback.value], options);
    return numberFormat.format(value);
  };
}
function useProvided(props, prop, provided) {
  const internal = useProxiedModel(props, prop, props[prop] ?? provided.value);
  internal.value = props[prop] ?? provided.value;
  watch(provided, (v) => {
    if (props[prop] == null) {
      internal.value = provided.value;
    }
  });
  return internal;
}
function createProvideFunction(state) {
  return (props) => {
    const current = useProvided(props, "locale", state.current);
    const fallback = useProvided(props, "fallback", state.fallback);
    const messages = useProvided(props, "messages", state.messages);
    return {
      name: "vuetify",
      current,
      fallback,
      messages,
      t: createTranslateFunction(current, fallback, messages),
      n: createNumberFunction(current, fallback),
      provide: createProvideFunction({
        current,
        fallback,
        messages
      })
    };
  };
}
function createVuetifyAdapter(options) {
  const current = shallowRef((options == null ? void 0 : options.locale) ?? "en");
  const fallback = shallowRef((options == null ? void 0 : options.fallback) ?? "en");
  const messages = ref({
    en,
    ...options == null ? void 0 : options.messages
  });
  return {
    name: "vuetify",
    current,
    fallback,
    messages,
    t: createTranslateFunction(current, fallback, messages),
    n: createNumberFunction(current, fallback),
    provide: createProvideFunction({
      current,
      fallback,
      messages
    })
  };
}
const LocaleSymbol = Symbol.for("vuetify:locale");
function isLocaleInstance(obj) {
  return obj.name != null;
}
function createLocale(options) {
  const i18n = (options == null ? void 0 : options.adapter) && isLocaleInstance(options == null ? void 0 : options.adapter) ? options == null ? void 0 : options.adapter : createVuetifyAdapter(options);
  const rtl = createRtl(i18n, options);
  return {
    ...i18n,
    ...rtl
  };
}
function useLocale() {
  const locale = inject$1(LocaleSymbol);
  if (!locale) throw new Error("[Vuetify] Could not find injected locale instance");
  return locale;
}
function genDefaults$1() {
  return {
    af: false,
    ar: true,
    bg: false,
    ca: false,
    ckb: false,
    cs: false,
    de: false,
    el: false,
    en: false,
    es: false,
    et: false,
    fa: true,
    fi: false,
    fr: false,
    hr: false,
    hu: false,
    he: true,
    id: false,
    it: false,
    ja: false,
    km: false,
    ko: false,
    lv: false,
    lt: false,
    nl: false,
    no: false,
    pl: false,
    pt: false,
    ro: false,
    ru: false,
    sk: false,
    sl: false,
    srCyrl: false,
    srLatn: false,
    sv: false,
    th: false,
    tr: false,
    az: false,
    uk: false,
    vi: false,
    zhHans: false,
    zhHant: false
  };
}
function createRtl(i18n, options) {
  const rtl = ref((options == null ? void 0 : options.rtl) ?? genDefaults$1());
  const isRtl = computed(() => rtl.value[i18n.current.value] ?? false);
  return {
    isRtl,
    rtl,
    rtlClasses: computed(() => `v-locale--is-${isRtl.value ? "rtl" : "ltr"}`)
  };
}
function useRtl() {
  const locale = inject$1(LocaleSymbol);
  if (!locale) throw new Error("[Vuetify] Could not find injected rtl instance");
  return {
    isRtl: locale.isRtl,
    rtlClasses: locale.rtlClasses
  };
}
const oppositeMap = {
  center: "center",
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
const makeLocationProps = propsFactory({
  location: String
}, "location");
function useLocation(props) {
  let opposite = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
  let offset = arguments.length > 2 ? arguments[2] : void 0;
  const {
    isRtl
  } = useRtl();
  const locationStyles = computed(() => {
    if (!props.location) return {};
    const {
      side,
      align
    } = parseAnchor(props.location.split(" ").length > 1 ? props.location : `${props.location} center`, isRtl.value);
    function getOffset(side2) {
      return offset ? offset(side2) : 0;
    }
    const styles = {};
    if (side !== "center") {
      if (opposite) styles[oppositeMap[side]] = `calc(100% - ${getOffset(side)}px)`;
      else styles[side] = 0;
    }
    if (align !== "center") {
      if (opposite) styles[oppositeMap[align]] = `calc(100% - ${getOffset(align)}px)`;
      else styles[align] = 0;
    } else {
      if (side === "center") styles.top = styles.left = "50%";
      else {
        styles[{
          top: "left",
          bottom: "left",
          left: "top",
          right: "top"
        }[side]] = "50%";
      }
      styles.transform = {
        top: "translateX(-50%)",
        bottom: "translateX(-50%)",
        left: "translateY(-50%)",
        right: "translateY(-50%)",
        center: "translate(-50%, -50%)"
      }[side];
    }
    return styles;
  });
  return {
    locationStyles
  };
}
const makeVProgressLinearProps = propsFactory({
  absolute: Boolean,
  active: {
    type: Boolean,
    default: true
  },
  bgColor: String,
  bgOpacity: [Number, String],
  bufferValue: {
    type: [Number, String],
    default: 0
  },
  bufferColor: String,
  bufferOpacity: [Number, String],
  clickable: Boolean,
  color: String,
  height: {
    type: [Number, String],
    default: 4
  },
  indeterminate: Boolean,
  max: {
    type: [Number, String],
    default: 100
  },
  modelValue: {
    type: [Number, String],
    default: 0
  },
  opacity: [Number, String],
  reverse: Boolean,
  stream: Boolean,
  striped: Boolean,
  roundedBar: Boolean,
  ...makeComponentProps(),
  ...makeLocationProps({
    location: "top"
  }),
  ...makeRoundedProps(),
  ...makeTagProps(),
  ...makeThemeProps()
}, "VProgressLinear");
const VProgressLinear = genericComponent()({
  name: "VProgressLinear",
  props: makeVProgressLinearProps(),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    var _a;
    let {
      slots
    } = _ref;
    const progress = useProxiedModel(props, "modelValue");
    const {
      isRtl,
      rtlClasses
    } = useRtl();
    const {
      themeClasses
    } = provideTheme(props);
    const {
      locationStyles
    } = useLocation(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(props, "color");
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(computed(() => props.bgColor || props.color));
    const {
      backgroundColorClasses: bufferColorClasses,
      backgroundColorStyles: bufferColorStyles
    } = useBackgroundColor(computed(() => props.bufferColor || props.bgColor || props.color));
    const {
      backgroundColorClasses: barColorClasses,
      backgroundColorStyles: barColorStyles
    } = useBackgroundColor(props, "color");
    const {
      roundedClasses
    } = useRounded(props);
    const {
      intersectionRef,
      isIntersecting
    } = useIntersectionObserver();
    const max = computed(() => parseFloat(props.max));
    const height = computed(() => parseFloat(props.height));
    const normalizedBuffer = computed(() => clamp(parseFloat(props.bufferValue) / max.value * 100, 0, 100));
    const normalizedValue = computed(() => clamp(parseFloat(progress.value) / max.value * 100, 0, 100));
    const isReversed = computed(() => isRtl.value !== props.reverse);
    const transition = computed(() => props.indeterminate ? "fade-transition" : "slide-x-transition");
    const isForcedColorsModeActive = IN_BROWSER && ((_a = window.matchMedia) == null ? void 0 : _a.call(window, "(forced-colors: active)").matches);
    function handleClick(e) {
      if (!intersectionRef.value) return;
      const {
        left,
        right,
        width
      } = intersectionRef.value.getBoundingClientRect();
      const value = isReversed.value ? width - e.clientX + (right - width) : e.clientX - left;
      progress.value = Math.round(value / width * max.value);
    }
    useRender(() => createVNode(props.tag, {
      "ref": intersectionRef,
      "class": ["v-progress-linear", {
        "v-progress-linear--absolute": props.absolute,
        "v-progress-linear--active": props.active && isIntersecting.value,
        "v-progress-linear--reverse": isReversed.value,
        "v-progress-linear--rounded": props.rounded,
        "v-progress-linear--rounded-bar": props.roundedBar,
        "v-progress-linear--striped": props.striped
      }, roundedClasses.value, themeClasses.value, rtlClasses.value, props.class],
      "style": [{
        bottom: props.location === "bottom" ? 0 : void 0,
        top: props.location === "top" ? 0 : void 0,
        height: props.active ? convertToUnit(height.value) : 0,
        "--v-progress-linear-height": convertToUnit(height.value),
        ...props.absolute ? locationStyles.value : {}
      }, props.style],
      "role": "progressbar",
      "aria-hidden": props.active ? "false" : "true",
      "aria-valuemin": "0",
      "aria-valuemax": props.max,
      "aria-valuenow": props.indeterminate ? void 0 : normalizedValue.value,
      "onClick": props.clickable && handleClick
    }, {
      default: () => [props.stream && createVNode("div", {
        "key": "stream",
        "class": ["v-progress-linear__stream", textColorClasses.value],
        "style": {
          ...textColorStyles.value,
          [isReversed.value ? "left" : "right"]: convertToUnit(-height.value),
          borderTop: `${convertToUnit(height.value / 2)} dotted`,
          opacity: parseFloat(props.bufferOpacity),
          top: `calc(50% - ${convertToUnit(height.value / 4)})`,
          width: convertToUnit(100 - normalizedBuffer.value, "%"),
          "--v-progress-linear-stream-to": convertToUnit(height.value * (isReversed.value ? 1 : -1))
        }
      }, null), createVNode("div", {
        "class": ["v-progress-linear__background", !isForcedColorsModeActive ? backgroundColorClasses.value : void 0],
        "style": [backgroundColorStyles.value, {
          opacity: parseFloat(props.bgOpacity),
          width: props.stream ? 0 : void 0
        }]
      }, null), createVNode("div", {
        "class": ["v-progress-linear__buffer", !isForcedColorsModeActive ? bufferColorClasses.value : void 0],
        "style": [bufferColorStyles.value, {
          opacity: parseFloat(props.bufferOpacity),
          width: convertToUnit(normalizedBuffer.value, "%")
        }]
      }, null), createVNode(Transition, {
        "name": transition.value
      }, {
        default: () => [!props.indeterminate ? createVNode("div", {
          "class": ["v-progress-linear__determinate", !isForcedColorsModeActive ? barColorClasses.value : void 0],
          "style": [barColorStyles.value, {
            width: convertToUnit(normalizedValue.value, "%")
          }]
        }, null) : createVNode("div", {
          "class": "v-progress-linear__indeterminate"
        }, [["long", "short"].map((bar) => createVNode("div", {
          "key": bar,
          "class": ["v-progress-linear__indeterminate", bar, !isForcedColorsModeActive ? barColorClasses.value : void 0],
          "style": barColorStyles.value
        }, null))])]
      }), slots.default && createVNode("div", {
        "class": "v-progress-linear__content"
      }, [slots.default({
        value: normalizedValue.value,
        buffer: normalizedBuffer.value
      })])]
    }));
    return {};
  }
});
const makeLoaderProps = propsFactory({
  loading: [Boolean, String]
}, "loader");
function useLoader(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const loaderClasses = computed(() => ({
    [`${name}--loading`]: props.loading
  }));
  return {
    loaderClasses
  };
}
const positionValues = ["static", "relative", "fixed", "absolute", "sticky"];
const makePositionProps = propsFactory({
  position: {
    type: String,
    validator: (
      /* istanbul ignore next */
      (v) => positionValues.includes(v)
    )
  }
}, "position");
function usePosition(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const positionClasses = computed(() => {
    return props.position ? `${name}--${props.position}` : void 0;
  });
  return {
    positionClasses
  };
}
function useRoute() {
  const vm = getCurrentInstance("useRoute");
  return computed(() => {
    var _a;
    return (_a = vm == null ? void 0 : vm.proxy) == null ? void 0 : _a.$route;
  });
}
function useLink(props, attrs) {
  var _a, _b;
  const RouterLink2 = resolveDynamicComponent("RouterLink");
  const isLink = computed(() => !!(props.href || props.to));
  const isClickable = computed(() => {
    return (isLink == null ? void 0 : isLink.value) || hasEvent(attrs, "click") || hasEvent(props, "click");
  });
  if (typeof RouterLink2 === "string" || !("useLink" in RouterLink2)) {
    const href2 = toRef(props, "href");
    return {
      isLink,
      isClickable,
      href: href2,
      linkProps: reactive({
        href: href2
      })
    };
  }
  const linkProps = computed(() => ({
    ...props,
    to: toRef(() => props.to || "")
  }));
  const routerLink = RouterLink2.useLink(linkProps.value);
  const link = computed(() => props.to ? routerLink : void 0);
  const route = useRoute();
  const isActive = computed(() => {
    var _a2, _b2, _c;
    if (!link.value) return false;
    if (!props.exact) return ((_a2 = link.value.isActive) == null ? void 0 : _a2.value) ?? false;
    if (!route.value) return ((_b2 = link.value.isExactActive) == null ? void 0 : _b2.value) ?? false;
    return ((_c = link.value.isExactActive) == null ? void 0 : _c.value) && deepEqual(link.value.route.value.query, route.value.query);
  });
  const href = computed(() => {
    var _a2;
    return props.to ? (_a2 = link.value) == null ? void 0 : _a2.route.value.href : props.href;
  });
  return {
    isLink,
    isClickable,
    isActive,
    route: (_a = link.value) == null ? void 0 : _a.route,
    navigate: (_b = link.value) == null ? void 0 : _b.navigate,
    href,
    linkProps: reactive({
      href,
      "aria-current": computed(() => isActive.value ? "page" : void 0)
    })
  };
}
const makeRouterProps = propsFactory({
  href: String,
  replace: Boolean,
  to: [String, Object],
  exact: Boolean
}, "router");
function useSelectLink(link, select) {
  watch(() => {
    var _a;
    return (_a = link.isActive) == null ? void 0 : _a.value;
  }, (isActive) => {
    if (link.isLink.value && isActive && select) {
      nextTick(() => {
        select(true);
      });
    }
  }, {
    immediate: true
  });
}
const stopSymbol = Symbol("rippleStop");
const DELAY_RIPPLE = 80;
function transform(el, value) {
  el.style.transform = value;
  el.style.webkitTransform = value;
}
function isTouchEvent(e) {
  return e.constructor.name === "TouchEvent";
}
function isKeyboardEvent(e) {
  return e.constructor.name === "KeyboardEvent";
}
const calculate = function(e, el) {
  var _a;
  let value = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  let localX = 0;
  let localY = 0;
  if (!isKeyboardEvent(e)) {
    const offset = el.getBoundingClientRect();
    const target = isTouchEvent(e) ? e.touches[e.touches.length - 1] : e;
    localX = target.clientX - offset.left;
    localY = target.clientY - offset.top;
  }
  let radius = 0;
  let scale = 0.3;
  if ((_a = el._ripple) == null ? void 0 : _a.circle) {
    scale = 0.15;
    radius = el.clientWidth / 2;
    radius = value.center ? radius : radius + Math.sqrt((localX - radius) ** 2 + (localY - radius) ** 2) / 4;
  } else {
    radius = Math.sqrt(el.clientWidth ** 2 + el.clientHeight ** 2) / 2;
  }
  const centerX = `${(el.clientWidth - radius * 2) / 2}px`;
  const centerY = `${(el.clientHeight - radius * 2) / 2}px`;
  const x2 = value.center ? centerX : `${localX - radius}px`;
  const y = value.center ? centerY : `${localY - radius}px`;
  return {
    radius,
    scale,
    x: x2,
    y,
    centerX,
    centerY
  };
};
const ripples = {
  /* eslint-disable max-statements */
  show(e, el) {
    var _a;
    let value = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    if (!((_a = el == null ? void 0 : el._ripple) == null ? void 0 : _a.enabled)) {
      return;
    }
    const container = document.createElement("span");
    const animation = document.createElement("span");
    container.appendChild(animation);
    container.className = "v-ripple__container";
    if (value.class) {
      container.className += ` ${value.class}`;
    }
    const {
      radius,
      scale,
      x: x2,
      y,
      centerX,
      centerY
    } = calculate(e, el, value);
    const size = `${radius * 2}px`;
    animation.className = "v-ripple__animation";
    animation.style.width = size;
    animation.style.height = size;
    el.appendChild(container);
    const computed2 = window.getComputedStyle(el);
    if (computed2 && computed2.position === "static") {
      el.style.position = "relative";
      el.dataset.previousPosition = "static";
    }
    animation.classList.add("v-ripple__animation--enter");
    animation.classList.add("v-ripple__animation--visible");
    transform(animation, `translate(${x2}, ${y}) scale3d(${scale},${scale},${scale})`);
    animation.dataset.activated = String(performance.now());
    setTimeout(() => {
      animation.classList.remove("v-ripple__animation--enter");
      animation.classList.add("v-ripple__animation--in");
      transform(animation, `translate(${centerX}, ${centerY}) scale3d(1,1,1)`);
    }, 0);
  },
  hide(el) {
    var _a;
    if (!((_a = el == null ? void 0 : el._ripple) == null ? void 0 : _a.enabled)) return;
    const ripples2 = el.getElementsByClassName("v-ripple__animation");
    if (ripples2.length === 0) return;
    const animation = ripples2[ripples2.length - 1];
    if (animation.dataset.isHiding) return;
    else animation.dataset.isHiding = "true";
    const diff = performance.now() - Number(animation.dataset.activated);
    const delay = Math.max(250 - diff, 0);
    setTimeout(() => {
      animation.classList.remove("v-ripple__animation--in");
      animation.classList.add("v-ripple__animation--out");
      setTimeout(() => {
        var _a2;
        const ripples3 = el.getElementsByClassName("v-ripple__animation");
        if (ripples3.length === 1 && el.dataset.previousPosition) {
          el.style.position = el.dataset.previousPosition;
          delete el.dataset.previousPosition;
        }
        if (((_a2 = animation.parentNode) == null ? void 0 : _a2.parentNode) === el) el.removeChild(animation.parentNode);
      }, 300);
    }, delay);
  }
};
function isRippleEnabled(value) {
  return typeof value === "undefined" || !!value;
}
function rippleShow(e) {
  const value = {};
  const element = e.currentTarget;
  if (!(element == null ? void 0 : element._ripple) || element._ripple.touched || e[stopSymbol]) return;
  e[stopSymbol] = true;
  if (isTouchEvent(e)) {
    element._ripple.touched = true;
    element._ripple.isTouch = true;
  } else {
    if (element._ripple.isTouch) return;
  }
  value.center = element._ripple.centered || isKeyboardEvent(e);
  if (element._ripple.class) {
    value.class = element._ripple.class;
  }
  if (isTouchEvent(e)) {
    if (element._ripple.showTimerCommit) return;
    element._ripple.showTimerCommit = () => {
      ripples.show(e, element, value);
    };
    element._ripple.showTimer = window.setTimeout(() => {
      var _a;
      if ((_a = element == null ? void 0 : element._ripple) == null ? void 0 : _a.showTimerCommit) {
        element._ripple.showTimerCommit();
        element._ripple.showTimerCommit = null;
      }
    }, DELAY_RIPPLE);
  } else {
    ripples.show(e, element, value);
  }
}
function rippleStop(e) {
  e[stopSymbol] = true;
}
function rippleHide(e) {
  const element = e.currentTarget;
  if (!(element == null ? void 0 : element._ripple)) return;
  window.clearTimeout(element._ripple.showTimer);
  if (e.type === "touchend" && element._ripple.showTimerCommit) {
    element._ripple.showTimerCommit();
    element._ripple.showTimerCommit = null;
    element._ripple.showTimer = window.setTimeout(() => {
      rippleHide(e);
    });
    return;
  }
  window.setTimeout(() => {
    if (element._ripple) {
      element._ripple.touched = false;
    }
  });
  ripples.hide(element);
}
function rippleCancelShow(e) {
  const element = e.currentTarget;
  if (!(element == null ? void 0 : element._ripple)) return;
  if (element._ripple.showTimerCommit) {
    element._ripple.showTimerCommit = null;
  }
  window.clearTimeout(element._ripple.showTimer);
}
let keyboardRipple = false;
function keyboardRippleShow(e) {
  if (!keyboardRipple && (e.keyCode === keyCodes.enter || e.keyCode === keyCodes.space)) {
    keyboardRipple = true;
    rippleShow(e);
  }
}
function keyboardRippleHide(e) {
  keyboardRipple = false;
  rippleHide(e);
}
function focusRippleHide(e) {
  if (keyboardRipple) {
    keyboardRipple = false;
    rippleHide(e);
  }
}
function updateRipple(el, binding, wasEnabled) {
  const {
    value,
    modifiers
  } = binding;
  const enabled = isRippleEnabled(value);
  if (!enabled) {
    ripples.hide(el);
  }
  el._ripple = el._ripple ?? {};
  el._ripple.enabled = enabled;
  el._ripple.centered = modifiers.center;
  el._ripple.circle = modifiers.circle;
  if (isObject(value) && value.class) {
    el._ripple.class = value.class;
  }
  if (enabled && !wasEnabled) {
    if (modifiers.stop) {
      el.addEventListener("touchstart", rippleStop, {
        passive: true
      });
      el.addEventListener("mousedown", rippleStop);
      return;
    }
    el.addEventListener("touchstart", rippleShow, {
      passive: true
    });
    el.addEventListener("touchend", rippleHide, {
      passive: true
    });
    el.addEventListener("touchmove", rippleCancelShow, {
      passive: true
    });
    el.addEventListener("touchcancel", rippleHide);
    el.addEventListener("mousedown", rippleShow);
    el.addEventListener("mouseup", rippleHide);
    el.addEventListener("mouseleave", rippleHide);
    el.addEventListener("keydown", keyboardRippleShow);
    el.addEventListener("keyup", keyboardRippleHide);
    el.addEventListener("blur", focusRippleHide);
    el.addEventListener("dragstart", rippleHide, {
      passive: true
    });
  } else if (!enabled && wasEnabled) {
    removeListeners(el);
  }
}
function removeListeners(el) {
  el.removeEventListener("mousedown", rippleShow);
  el.removeEventListener("touchstart", rippleShow);
  el.removeEventListener("touchend", rippleHide);
  el.removeEventListener("touchmove", rippleCancelShow);
  el.removeEventListener("touchcancel", rippleHide);
  el.removeEventListener("mouseup", rippleHide);
  el.removeEventListener("mouseleave", rippleHide);
  el.removeEventListener("keydown", keyboardRippleShow);
  el.removeEventListener("keyup", keyboardRippleHide);
  el.removeEventListener("dragstart", rippleHide);
  el.removeEventListener("blur", focusRippleHide);
}
function mounted$2(el, binding) {
  updateRipple(el, binding, false);
}
function unmounted$2(el) {
  delete el._ripple;
  removeListeners(el);
}
function updated(el, binding) {
  if (binding.value === binding.oldValue) {
    return;
  }
  const wasEnabled = isRippleEnabled(binding.oldValue);
  updateRipple(el, binding, wasEnabled);
}
const Ripple = {
  mounted: mounted$2,
  unmounted: unmounted$2,
  updated
};
const makeVBtnProps = propsFactory({
  active: {
    type: Boolean,
    default: void 0
  },
  activeColor: String,
  baseColor: String,
  symbol: {
    type: null,
    default: VBtnToggleSymbol
  },
  flat: Boolean,
  icon: [Boolean, String, Function, Object],
  prependIcon: IconValue,
  appendIcon: IconValue,
  block: Boolean,
  readonly: Boolean,
  slim: Boolean,
  stacked: Boolean,
  ripple: {
    type: [Boolean, Object],
    default: true
  },
  text: String,
  ...makeBorderProps(),
  ...makeComponentProps(),
  ...makeDensityProps(),
  ...makeDimensionProps(),
  ...makeElevationProps(),
  ...makeGroupItemProps(),
  ...makeLoaderProps(),
  ...makeLocationProps(),
  ...makePositionProps(),
  ...makeRoundedProps(),
  ...makeRouterProps(),
  ...makeSizeProps(),
  ...makeTagProps({
    tag: "button"
  }),
  ...makeThemeProps(),
  ...makeVariantProps({
    variant: "elevated"
  })
}, "VBtn");
const VBtn = genericComponent()({
  name: "VBtn",
  props: makeVBtnProps(),
  emits: {
    "group:selected": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      loaderClasses
    } = useLoader(props);
    const {
      locationStyles
    } = useLocation(props);
    const {
      positionClasses
    } = usePosition(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      sizeClasses,
      sizeStyles
    } = useSize(props);
    const group = useGroupItem(props, props.symbol, false);
    const link = useLink(props, attrs);
    const isActive = computed(() => {
      var _a;
      if (props.active !== void 0) {
        return props.active;
      }
      if (link.isLink.value) {
        return (_a = link.isActive) == null ? void 0 : _a.value;
      }
      return group == null ? void 0 : group.isSelected.value;
    });
    const color = computed(() => isActive.value ? props.activeColor ?? props.color : props.color);
    const variantProps = computed(() => {
      var _a, _b;
      const showColor = (group == null ? void 0 : group.isSelected.value) && (!link.isLink.value || ((_a = link.isActive) == null ? void 0 : _a.value)) || !group || ((_b = link.isActive) == null ? void 0 : _b.value);
      return {
        color: showColor ? color.value ?? props.baseColor : props.baseColor,
        variant: props.variant
      };
    });
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(variantProps);
    const isDisabled = computed(() => (group == null ? void 0 : group.disabled.value) || props.disabled);
    const isElevated = computed(() => {
      return props.variant === "elevated" && !(props.disabled || props.flat || props.border);
    });
    const valueAttr = computed(() => {
      if (props.value === void 0 || typeof props.value === "symbol") return void 0;
      return Object(props.value) === props.value ? JSON.stringify(props.value, null, 0) : props.value;
    });
    function onClick(e) {
      var _a;
      if (isDisabled.value || link.isLink.value && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || attrs.target === "_blank")) return;
      (_a = link.navigate) == null ? void 0 : _a.call(link, e);
      group == null ? void 0 : group.toggle();
    }
    useSelectLink(link, group == null ? void 0 : group.select);
    useRender(() => {
      const Tag = link.isLink.value ? "a" : props.tag;
      const hasPrepend = !!(props.prependIcon || slots.prepend);
      const hasAppend = !!(props.appendIcon || slots.append);
      const hasIcon = !!(props.icon && props.icon !== true);
      return withDirectives(createVNode(Tag, mergeProps({
        "type": Tag === "a" ? void 0 : "button",
        "class": ["v-btn", group == null ? void 0 : group.selectedClass.value, {
          "v-btn--active": isActive.value,
          "v-btn--block": props.block,
          "v-btn--disabled": isDisabled.value,
          "v-btn--elevated": isElevated.value,
          "v-btn--flat": props.flat,
          "v-btn--icon": !!props.icon,
          "v-btn--loading": props.loading,
          "v-btn--readonly": props.readonly,
          "v-btn--slim": props.slim,
          "v-btn--stacked": props.stacked
        }, themeClasses.value, borderClasses.value, colorClasses.value, densityClasses.value, elevationClasses.value, loaderClasses.value, positionClasses.value, roundedClasses.value, sizeClasses.value, variantClasses.value, props.class],
        "style": [colorStyles.value, dimensionStyles.value, locationStyles.value, sizeStyles.value, props.style],
        "aria-busy": props.loading ? true : void 0,
        "disabled": isDisabled.value || void 0,
        "tabindex": props.loading || props.readonly ? -1 : void 0,
        "onClick": onClick,
        "value": valueAttr.value
      }, link.linkProps), {
        default: () => {
          var _a;
          return [genOverlays(true, "v-btn"), !props.icon && hasPrepend && createVNode("span", {
            "key": "prepend",
            "class": "v-btn__prepend"
          }, [!slots.prepend ? createVNode(VIcon, {
            "key": "prepend-icon",
            "icon": props.prependIcon
          }, null) : createVNode(VDefaultsProvider, {
            "key": "prepend-defaults",
            "disabled": !props.prependIcon,
            "defaults": {
              VIcon: {
                icon: props.prependIcon
              }
            }
          }, slots.prepend)]), createVNode("span", {
            "class": "v-btn__content",
            "data-no-activator": ""
          }, [!slots.default && hasIcon ? createVNode(VIcon, {
            "key": "content-icon",
            "icon": props.icon
          }, null) : createVNode(VDefaultsProvider, {
            "key": "content-defaults",
            "disabled": !hasIcon,
            "defaults": {
              VIcon: {
                icon: props.icon
              }
            }
          }, {
            default: () => {
              var _a2;
              return [((_a2 = slots.default) == null ? void 0 : _a2.call(slots)) ?? props.text];
            }
          })]), !props.icon && hasAppend && createVNode("span", {
            "key": "append",
            "class": "v-btn__append"
          }, [!slots.append ? createVNode(VIcon, {
            "key": "append-icon",
            "icon": props.appendIcon
          }, null) : createVNode(VDefaultsProvider, {
            "key": "append-defaults",
            "disabled": !props.appendIcon,
            "defaults": {
              VIcon: {
                icon: props.appendIcon
              }
            }
          }, slots.append)]), !!props.loading && createVNode("span", {
            "key": "loader",
            "class": "v-btn__loader"
          }, [((_a = slots.loader) == null ? void 0 : _a.call(slots)) ?? createVNode(VProgressCircular, {
            "color": typeof props.loading === "boolean" ? void 0 : props.loading,
            "indeterminate": true,
            "width": "2"
          }, null)])];
        }
      }), [[Ripple, !isDisabled.value && props.ripple, "", {
        center: !!props.icon
      }]]);
    });
    return {
      group
    };
  }
});
const handleGesture = (wrapper) => {
  const {
    touchstartX,
    touchendX,
    touchstartY,
    touchendY
  } = wrapper;
  const dirRatio = 0.5;
  const minDistance = 16;
  wrapper.offsetX = touchendX - touchstartX;
  wrapper.offsetY = touchendY - touchstartY;
  if (Math.abs(wrapper.offsetY) < dirRatio * Math.abs(wrapper.offsetX)) {
    wrapper.left && touchendX < touchstartX - minDistance && wrapper.left(wrapper);
    wrapper.right && touchendX > touchstartX + minDistance && wrapper.right(wrapper);
  }
  if (Math.abs(wrapper.offsetX) < dirRatio * Math.abs(wrapper.offsetY)) {
    wrapper.up && touchendY < touchstartY - minDistance && wrapper.up(wrapper);
    wrapper.down && touchendY > touchstartY + minDistance && wrapper.down(wrapper);
  }
};
function touchstart(event, wrapper) {
  var _a;
  const touch = event.changedTouches[0];
  wrapper.touchstartX = touch.clientX;
  wrapper.touchstartY = touch.clientY;
  (_a = wrapper.start) == null ? void 0 : _a.call(wrapper, {
    originalEvent: event,
    ...wrapper
  });
}
function touchend(event, wrapper) {
  var _a;
  const touch = event.changedTouches[0];
  wrapper.touchendX = touch.clientX;
  wrapper.touchendY = touch.clientY;
  (_a = wrapper.end) == null ? void 0 : _a.call(wrapper, {
    originalEvent: event,
    ...wrapper
  });
  handleGesture(wrapper);
}
function touchmove(event, wrapper) {
  var _a;
  const touch = event.changedTouches[0];
  wrapper.touchmoveX = touch.clientX;
  wrapper.touchmoveY = touch.clientY;
  (_a = wrapper.move) == null ? void 0 : _a.call(wrapper, {
    originalEvent: event,
    ...wrapper
  });
}
function createHandlers() {
  let value = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const wrapper = {
    touchstartX: 0,
    touchstartY: 0,
    touchendX: 0,
    touchendY: 0,
    touchmoveX: 0,
    touchmoveY: 0,
    offsetX: 0,
    offsetY: 0,
    left: value.left,
    right: value.right,
    up: value.up,
    down: value.down,
    start: value.start,
    move: value.move,
    end: value.end
  };
  return {
    touchstart: (e) => touchstart(e, wrapper),
    touchend: (e) => touchend(e, wrapper),
    touchmove: (e) => touchmove(e, wrapper)
  };
}
function mounted$1(el, binding) {
  var _a;
  const value = binding.value;
  const target = (value == null ? void 0 : value.parent) ? el.parentElement : el;
  const options = (value == null ? void 0 : value.options) ?? {
    passive: true
  };
  const uid = (_a = binding.instance) == null ? void 0 : _a.$.uid;
  if (!target || !uid) return;
  const handlers = createHandlers(binding.value);
  target._touchHandlers = target._touchHandlers ?? /* @__PURE__ */ Object.create(null);
  target._touchHandlers[uid] = handlers;
  keys(handlers).forEach((eventName) => {
    target.addEventListener(eventName, handlers[eventName], options);
  });
}
function unmounted$1(el, binding) {
  var _a, _b;
  const target = ((_a = binding.value) == null ? void 0 : _a.parent) ? el.parentElement : el;
  const uid = (_b = binding.instance) == null ? void 0 : _b.$.uid;
  if (!(target == null ? void 0 : target._touchHandlers) || !uid) return;
  const handlers = target._touchHandlers[uid];
  keys(handlers).forEach((eventName) => {
    target.removeEventListener(eventName, handlers[eventName]);
  });
  delete target._touchHandlers[uid];
}
const Touch = {
  mounted: mounted$1,
  unmounted: unmounted$1
};
const VWindowSymbol = Symbol.for("vuetify:v-window");
const VWindowGroupSymbol = Symbol.for("vuetify:v-window-group");
const makeVWindowProps = propsFactory({
  continuous: Boolean,
  nextIcon: {
    type: [Boolean, String, Function, Object],
    default: "$next"
  },
  prevIcon: {
    type: [Boolean, String, Function, Object],
    default: "$prev"
  },
  reverse: Boolean,
  showArrows: {
    type: [Boolean, String],
    validator: (v) => typeof v === "boolean" || v === "hover"
  },
  touch: {
    type: [Object, Boolean],
    default: void 0
  },
  direction: {
    type: String,
    default: "horizontal"
  },
  modelValue: null,
  disabled: Boolean,
  selectedClass: {
    type: String,
    default: "v-window-item--active"
  },
  // TODO: mandatory should probably not be exposed but do this for now
  mandatory: {
    type: [Boolean, String],
    default: "force"
  },
  ...makeComponentProps(),
  ...makeTagProps(),
  ...makeThemeProps()
}, "VWindow");
const VWindow = genericComponent()({
  name: "VWindow",
  directives: {
    Touch
  },
  props: makeVWindowProps(),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      isRtl
    } = useRtl();
    const {
      t
    } = useLocale();
    const group = useGroup(props, VWindowGroupSymbol);
    const rootRef = ref();
    const isRtlReverse = computed(() => isRtl.value ? !props.reverse : props.reverse);
    const isReversed = shallowRef(false);
    const transition = computed(() => {
      const axis = props.direction === "vertical" ? "y" : "x";
      const reverse = isRtlReverse.value ? !isReversed.value : isReversed.value;
      const direction = reverse ? "-reverse" : "";
      return `v-window-${axis}${direction}-transition`;
    });
    const transitionCount = shallowRef(0);
    const transitionHeight = ref(void 0);
    const activeIndex = computed(() => {
      return group.items.value.findIndex((item) => group.selected.value.includes(item.id));
    });
    watch(activeIndex, (newVal, oldVal) => {
      const itemsLength = group.items.value.length;
      const lastIndex = itemsLength - 1;
      if (itemsLength <= 2) {
        isReversed.value = newVal < oldVal;
      } else if (newVal === lastIndex && oldVal === 0) {
        isReversed.value = true;
      } else if (newVal === 0 && oldVal === lastIndex) {
        isReversed.value = false;
      } else {
        isReversed.value = newVal < oldVal;
      }
    });
    provide(VWindowSymbol, {
      transition,
      isReversed,
      transitionCount,
      transitionHeight,
      rootRef
    });
    const canMoveBack = computed(() => props.continuous || activeIndex.value !== 0);
    const canMoveForward = computed(() => props.continuous || activeIndex.value !== group.items.value.length - 1);
    function prev() {
      canMoveBack.value && group.prev();
    }
    function next() {
      canMoveForward.value && group.next();
    }
    const arrows = computed(() => {
      const arrows2 = [];
      const prevProps = {
        icon: isRtl.value ? props.nextIcon : props.prevIcon,
        class: `v-window__${isRtlReverse.value ? "right" : "left"}`,
        onClick: group.prev,
        "aria-label": t("$vuetify.carousel.prev")
      };
      arrows2.push(canMoveBack.value ? slots.prev ? slots.prev({
        props: prevProps
      }) : createVNode(VBtn, prevProps, null) : createVNode("div", null, null));
      const nextProps = {
        icon: isRtl.value ? props.prevIcon : props.nextIcon,
        class: `v-window__${isRtlReverse.value ? "left" : "right"}`,
        onClick: group.next,
        "aria-label": t("$vuetify.carousel.next")
      };
      arrows2.push(canMoveForward.value ? slots.next ? slots.next({
        props: nextProps
      }) : createVNode(VBtn, nextProps, null) : createVNode("div", null, null));
      return arrows2;
    });
    const touchOptions = computed(() => {
      if (props.touch === false) return props.touch;
      const options = {
        left: () => {
          isRtlReverse.value ? prev() : next();
        },
        right: () => {
          isRtlReverse.value ? next() : prev();
        },
        start: (_ref2) => {
          let {
            originalEvent
          } = _ref2;
          originalEvent.stopPropagation();
        }
      };
      return {
        ...options,
        ...props.touch === true ? {} : props.touch
      };
    });
    useRender(() => withDirectives(createVNode(props.tag, {
      "ref": rootRef,
      "class": ["v-window", {
        "v-window--show-arrows-on-hover": props.showArrows === "hover"
      }, themeClasses.value, props.class],
      "style": props.style
    }, {
      default: () => {
        var _a, _b;
        return [createVNode("div", {
          "class": "v-window__container",
          "style": {
            height: transitionHeight.value
          }
        }, [(_a = slots.default) == null ? void 0 : _a.call(slots, {
          group
        }), props.showArrows !== false && createVNode("div", {
          "class": "v-window__controls"
        }, [arrows.value])]), (_b = slots.additional) == null ? void 0 : _b.call(slots, {
          group
        })];
      }
    }), [[resolveDirective("touch"), touchOptions.value]]));
    return {
      group
    };
  }
});
const makeVCarouselProps = propsFactory({
  color: String,
  cycle: Boolean,
  delimiterIcon: {
    type: IconValue,
    default: "$delimiter"
  },
  height: {
    type: [Number, String],
    default: 500
  },
  hideDelimiters: Boolean,
  hideDelimiterBackground: Boolean,
  interval: {
    type: [Number, String],
    default: 6e3,
    validator: (value) => Number(value) > 0
  },
  progress: [Boolean, String],
  verticalDelimiters: [Boolean, String],
  ...makeVWindowProps({
    continuous: true,
    mandatory: "force",
    showArrows: true
  })
}, "VCarousel");
const VCarousel = genericComponent()({
  name: "VCarousel",
  props: makeVCarouselProps(),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const model = useProxiedModel(props, "modelValue");
    const {
      t
    } = useLocale();
    const windowRef = ref();
    let slideTimeout = -1;
    watch(model, restartTimeout);
    watch(() => props.interval, restartTimeout);
    watch(() => props.cycle, (val) => {
      if (val) restartTimeout();
      else window.clearTimeout(slideTimeout);
    });
    onMounted(startTimeout);
    function startTimeout() {
      if (!props.cycle || !windowRef.value) return;
      slideTimeout = window.setTimeout(windowRef.value.group.next, +props.interval > 0 ? +props.interval : 6e3);
    }
    function restartTimeout() {
      window.clearTimeout(slideTimeout);
      window.requestAnimationFrame(startTimeout);
    }
    useRender(() => {
      const windowProps = VWindow.filterProps(props);
      return createVNode(VWindow, mergeProps({
        "ref": windowRef
      }, windowProps, {
        "modelValue": model.value,
        "onUpdate:modelValue": ($event) => model.value = $event,
        "class": ["v-carousel", {
          "v-carousel--hide-delimiter-background": props.hideDelimiterBackground,
          "v-carousel--vertical-delimiters": props.verticalDelimiters
        }, props.class],
        "style": [{
          height: convertToUnit(props.height)
        }, props.style]
      }), {
        default: slots.default,
        additional: (_ref2) => {
          let {
            group
          } = _ref2;
          return createVNode(Fragment, null, [!props.hideDelimiters && createVNode("div", {
            "class": "v-carousel__controls",
            "style": {
              left: props.verticalDelimiters === "left" && props.verticalDelimiters ? 0 : "auto",
              right: props.verticalDelimiters === "right" ? 0 : "auto"
            }
          }, [group.items.value.length > 0 && createVNode(VDefaultsProvider, {
            "defaults": {
              VBtn: {
                color: props.color,
                icon: props.delimiterIcon,
                size: "x-small",
                variant: "text"
              }
            },
            "scoped": true
          }, {
            default: () => [group.items.value.map((item, index) => {
              const props2 = {
                id: `carousel-item-${item.id}`,
                "aria-label": t("$vuetify.carousel.ariaLabel.delimiter", index + 1, group.items.value.length),
                class: ["v-carousel__controls__item", group.isSelected(item.id) && "v-btn--active"],
                onClick: () => group.select(item.id, true)
              };
              return slots.item ? slots.item({
                props: props2,
                item
              }) : createVNode(VBtn, mergeProps(item, props2), null);
            })]
          })]), props.progress && createVNode(VProgressLinear, {
            "class": "v-carousel__progress",
            "color": typeof props.progress === "string" ? props.progress : void 0,
            "modelValue": (group.getItemIndex(model.value) + 1) / group.items.value.length * 100
          }, null)]);
        },
        prev: slots.prev,
        next: slots.next
      });
    });
    return {};
  }
});
function useAspectStyles(props) {
  return {
    aspectStyles: computed(() => {
      const ratio = Number(props.aspectRatio);
      return ratio ? {
        paddingBottom: String(1 / ratio * 100) + "%"
      } : void 0;
    })
  };
}
const makeVResponsiveProps = propsFactory({
  aspectRatio: [String, Number],
  contentClass: null,
  inline: Boolean,
  ...makeComponentProps(),
  ...makeDimensionProps()
}, "VResponsive");
const VResponsive = genericComponent()({
  name: "VResponsive",
  props: makeVResponsiveProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      aspectStyles
    } = useAspectStyles(props);
    const {
      dimensionStyles
    } = useDimension(props);
    useRender(() => {
      var _a;
      return createVNode("div", {
        "class": ["v-responsive", {
          "v-responsive--inline": props.inline
        }, props.class],
        "style": [dimensionStyles.value, props.style]
      }, [createVNode("div", {
        "class": "v-responsive__sizer",
        "style": aspectStyles.value
      }, null), (_a = slots.additional) == null ? void 0 : _a.call(slots), slots.default && createVNode("div", {
        "class": ["v-responsive__content", props.contentClass]
      }, [slots.default()])]);
    });
    return {};
  }
});
const makeTransitionProps = propsFactory({
  transition: {
    type: [Boolean, String, Object],
    default: "fade-transition",
    validator: (val) => val !== true
  }
}, "transition");
const MaybeTransition = (props, _ref) => {
  let {
    slots
  } = _ref;
  const {
    transition,
    disabled,
    group,
    ...rest
  } = props;
  const {
    component = group ? TransitionGroup : Transition,
    ...customProps
  } = typeof transition === "object" ? transition : {};
  return h(component, mergeProps(typeof transition === "string" ? {
    name: disabled ? "" : transition
  } : customProps, typeof transition === "string" ? {} : Object.fromEntries(Object.entries({
    disabled,
    group
  }).filter((_ref2) => {
    let [_2, v] = _ref2;
    return v !== void 0;
  })), rest), slots);
};
function mounted(el, binding) {
  if (!SUPPORTS_INTERSECTION) return;
  const modifiers = binding.modifiers || {};
  const value = binding.value;
  const {
    handler,
    options
  } = typeof value === "object" ? value : {
    handler: value,
    options: {}
  };
  const observer = new IntersectionObserver(function() {
    var _a;
    let entries = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    let observer2 = arguments.length > 1 ? arguments[1] : void 0;
    const _observe = (_a = el._observe) == null ? void 0 : _a[binding.instance.$.uid];
    if (!_observe) return;
    const isIntersecting = entries.some((entry) => entry.isIntersecting);
    if (handler && (!modifiers.quiet || _observe.init) && (!modifiers.once || isIntersecting || _observe.init)) {
      handler(isIntersecting, entries, observer2);
    }
    if (isIntersecting && modifiers.once) unmounted(el, binding);
    else _observe.init = true;
  }, options);
  el._observe = Object(el._observe);
  el._observe[binding.instance.$.uid] = {
    init: false,
    observer
  };
  observer.observe(el);
}
function unmounted(el, binding) {
  var _a;
  const observe = (_a = el._observe) == null ? void 0 : _a[binding.instance.$.uid];
  if (!observe) return;
  observe.observer.unobserve(el);
  delete el._observe[binding.instance.$.uid];
}
const Intersect = {
  mounted,
  unmounted
};
const makeVImgProps = propsFactory({
  absolute: Boolean,
  alt: String,
  cover: Boolean,
  color: String,
  draggable: {
    type: [Boolean, String],
    default: void 0
  },
  eager: Boolean,
  gradient: String,
  lazySrc: String,
  options: {
    type: Object,
    // For more information on types, navigate to:
    // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
    default: () => ({
      root: void 0,
      rootMargin: void 0,
      threshold: void 0
    })
  },
  sizes: String,
  src: {
    type: [String, Object],
    default: ""
  },
  crossorigin: String,
  referrerpolicy: String,
  srcset: String,
  position: String,
  ...makeVResponsiveProps(),
  ...makeComponentProps(),
  ...makeRoundedProps(),
  ...makeTransitionProps()
}, "VImg");
const VImg = genericComponent()({
  name: "VImg",
  directives: {
    intersect: Intersect
  },
  props: makeVImgProps(),
  emits: {
    loadstart: (value) => true,
    load: (value) => true,
    error: (value) => true
  },
  setup(props, _ref) {
    let {
      emit,
      slots
    } = _ref;
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(toRef(props, "color"));
    const {
      roundedClasses
    } = useRounded(props);
    const vm = getCurrentInstance("VImg");
    const currentSrc = shallowRef("");
    const image = ref();
    const state = shallowRef(props.eager ? "loading" : "idle");
    const naturalWidth = shallowRef();
    const naturalHeight = shallowRef();
    const normalisedSrc = computed(() => {
      return props.src && typeof props.src === "object" ? {
        src: props.src.src,
        srcset: props.srcset || props.src.srcset,
        lazySrc: props.lazySrc || props.src.lazySrc,
        aspect: Number(props.aspectRatio || props.src.aspect || 0)
      } : {
        src: props.src,
        srcset: props.srcset,
        lazySrc: props.lazySrc,
        aspect: Number(props.aspectRatio || 0)
      };
    });
    const aspectRatio = computed(() => {
      return normalisedSrc.value.aspect || naturalWidth.value / naturalHeight.value || 0;
    });
    watch(() => props.src, () => {
      init(state.value !== "idle");
    });
    watch(aspectRatio, (val, oldVal) => {
      if (!val && oldVal && image.value) {
        pollForSize(image.value);
      }
    });
    onBeforeMount(() => init());
    function init(isIntersecting) {
      if (props.eager && isIntersecting) return;
      if (SUPPORTS_INTERSECTION && !isIntersecting && !props.eager) return;
      state.value = "loading";
      if (normalisedSrc.value.lazySrc) {
        const lazyImg = new Image();
        lazyImg.src = normalisedSrc.value.lazySrc;
        pollForSize(lazyImg, null);
      }
      if (!normalisedSrc.value.src) return;
      nextTick(() => {
        var _a;
        emit("loadstart", ((_a = image.value) == null ? void 0 : _a.currentSrc) || normalisedSrc.value.src);
        setTimeout(() => {
          var _a2;
          if (vm.isUnmounted) return;
          if ((_a2 = image.value) == null ? void 0 : _a2.complete) {
            if (!image.value.naturalWidth) {
              onError();
            }
            if (state.value === "error") return;
            if (!aspectRatio.value) pollForSize(image.value, null);
            if (state.value === "loading") onLoad();
          } else {
            if (!aspectRatio.value) pollForSize(image.value);
            getSrc();
          }
        });
      });
    }
    function onLoad() {
      var _a;
      if (vm.isUnmounted) return;
      getSrc();
      pollForSize(image.value);
      state.value = "loaded";
      emit("load", ((_a = image.value) == null ? void 0 : _a.currentSrc) || normalisedSrc.value.src);
    }
    function onError() {
      var _a;
      if (vm.isUnmounted) return;
      state.value = "error";
      emit("error", ((_a = image.value) == null ? void 0 : _a.currentSrc) || normalisedSrc.value.src);
    }
    function getSrc() {
      const img = image.value;
      if (img) currentSrc.value = img.currentSrc || img.src;
    }
    let timer = -1;
    onBeforeUnmount(() => {
      clearTimeout(timer);
    });
    function pollForSize(img) {
      let timeout = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 100;
      const poll = () => {
        clearTimeout(timer);
        if (vm.isUnmounted) return;
        const {
          naturalHeight: imgHeight,
          naturalWidth: imgWidth
        } = img;
        if (imgHeight || imgWidth) {
          naturalWidth.value = imgWidth;
          naturalHeight.value = imgHeight;
        } else if (!img.complete && state.value === "loading" && timeout != null) {
          timer = window.setTimeout(poll, timeout);
        } else if (img.currentSrc.endsWith(".svg") || img.currentSrc.startsWith("data:image/svg+xml")) {
          naturalWidth.value = 1;
          naturalHeight.value = 1;
        }
      };
      poll();
    }
    const containClasses = computed(() => ({
      "v-img__img--cover": props.cover,
      "v-img__img--contain": !props.cover
    }));
    const __image = () => {
      var _a;
      if (!normalisedSrc.value.src || state.value === "idle") return null;
      const img = createVNode("img", {
        "class": ["v-img__img", containClasses.value],
        "style": {
          objectPosition: props.position
        },
        "src": normalisedSrc.value.src,
        "srcset": normalisedSrc.value.srcset,
        "alt": props.alt,
        "crossorigin": props.crossorigin,
        "referrerpolicy": props.referrerpolicy,
        "draggable": props.draggable,
        "sizes": props.sizes,
        "ref": image,
        "onLoad": onLoad,
        "onError": onError
      }, null);
      const sources = (_a = slots.sources) == null ? void 0 : _a.call(slots);
      return createVNode(MaybeTransition, {
        "transition": props.transition,
        "appear": true
      }, {
        default: () => [withDirectives(sources ? createVNode("picture", {
          "class": "v-img__picture"
        }, [sources, img]) : img, [[vShow, state.value === "loaded"]])]
      });
    };
    const __preloadImage = () => createVNode(MaybeTransition, {
      "transition": props.transition
    }, {
      default: () => [normalisedSrc.value.lazySrc && state.value !== "loaded" && createVNode("img", {
        "class": ["v-img__img", "v-img__img--preload", containClasses.value],
        "style": {
          objectPosition: props.position
        },
        "src": normalisedSrc.value.lazySrc,
        "alt": props.alt,
        "crossorigin": props.crossorigin,
        "referrerpolicy": props.referrerpolicy,
        "draggable": props.draggable
      }, null)]
    });
    const __placeholder = () => {
      if (!slots.placeholder) return null;
      return createVNode(MaybeTransition, {
        "transition": props.transition,
        "appear": true
      }, {
        default: () => [(state.value === "loading" || state.value === "error" && !slots.error) && createVNode("div", {
          "class": "v-img__placeholder"
        }, [slots.placeholder()])]
      });
    };
    const __error = () => {
      if (!slots.error) return null;
      return createVNode(MaybeTransition, {
        "transition": props.transition,
        "appear": true
      }, {
        default: () => [state.value === "error" && createVNode("div", {
          "class": "v-img__error"
        }, [slots.error()])]
      });
    };
    const __gradient = () => {
      if (!props.gradient) return null;
      return createVNode("div", {
        "class": "v-img__gradient",
        "style": {
          backgroundImage: `linear-gradient(${props.gradient})`
        }
      }, null);
    };
    const isBooted = shallowRef(false);
    {
      const stop = watch(aspectRatio, (val) => {
        if (val) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              isBooted.value = true;
            });
          });
          stop();
        }
      });
    }
    useRender(() => {
      const responsiveProps = VResponsive.filterProps(props);
      return withDirectives(createVNode(VResponsive, mergeProps({
        "class": ["v-img", {
          "v-img--absolute": props.absolute,
          "v-img--booting": !isBooted.value
        }, backgroundColorClasses.value, roundedClasses.value, props.class],
        "style": [{
          width: convertToUnit(props.width === "auto" ? naturalWidth.value : props.width)
        }, backgroundColorStyles.value, props.style]
      }, responsiveProps, {
        "aspectRatio": aspectRatio.value,
        "aria-label": props.alt,
        "role": props.alt ? "img" : void 0
      }), {
        additional: () => createVNode(Fragment, null, [createVNode(__image, null, null), createVNode(__preloadImage, null, null), createVNode(__gradient, null, null), createVNode(__placeholder, null, null), createVNode(__error, null, null)]),
        default: slots.default
      }), [[resolveDirective("intersect"), {
        handler: init,
        options: props.options
      }, null, {
        once: true
      }]]);
    });
    return {
      currentSrc,
      image,
      state,
      naturalWidth,
      naturalHeight
    };
  }
});
const makeLazyProps = propsFactory({
  eager: Boolean
}, "lazy");
function useLazy(props, active) {
  const isBooted = shallowRef(false);
  const hasContent = computed(() => isBooted.value || props.eager || active.value);
  watch(active, () => isBooted.value = true);
  function onAfterLeave() {
    if (!props.eager) isBooted.value = false;
  }
  return {
    isBooted,
    hasContent,
    onAfterLeave
  };
}
function useSsrBoot() {
  const isBooted = shallowRef(false);
  onMounted(() => {
    window.requestAnimationFrame(() => {
      isBooted.value = true;
    });
  });
  const ssrBootStyles = computed(() => !isBooted.value ? {
    transition: "none !important"
  } : void 0);
  return {
    ssrBootStyles,
    isBooted: readonly(isBooted)
  };
}
const makeVWindowItemProps = propsFactory({
  reverseTransition: {
    type: [Boolean, String],
    default: void 0
  },
  transition: {
    type: [Boolean, String],
    default: void 0
  },
  ...makeComponentProps(),
  ...makeGroupItemProps(),
  ...makeLazyProps()
}, "VWindowItem");
const VWindowItem = genericComponent()({
  name: "VWindowItem",
  directives: {
    Touch
  },
  props: makeVWindowItemProps(),
  emits: {
    "group:selected": (val) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const window2 = inject$1(VWindowSymbol);
    const groupItem = useGroupItem(props, VWindowGroupSymbol);
    const {
      isBooted
    } = useSsrBoot();
    if (!window2 || !groupItem) throw new Error("[Vuetify] VWindowItem must be used inside VWindow");
    const isTransitioning = shallowRef(false);
    const hasTransition = computed(() => isBooted.value && (window2.isReversed.value ? props.reverseTransition !== false : props.transition !== false));
    function onAfterTransition() {
      if (!isTransitioning.value || !window2) {
        return;
      }
      isTransitioning.value = false;
      if (window2.transitionCount.value > 0) {
        window2.transitionCount.value -= 1;
        if (window2.transitionCount.value === 0) {
          window2.transitionHeight.value = void 0;
        }
      }
    }
    function onBeforeTransition() {
      var _a;
      if (isTransitioning.value || !window2) {
        return;
      }
      isTransitioning.value = true;
      if (window2.transitionCount.value === 0) {
        window2.transitionHeight.value = convertToUnit((_a = window2.rootRef.value) == null ? void 0 : _a.clientHeight);
      }
      window2.transitionCount.value += 1;
    }
    function onTransitionCancelled() {
      onAfterTransition();
    }
    function onEnterTransition(el) {
      if (!isTransitioning.value) {
        return;
      }
      nextTick(() => {
        if (!hasTransition.value || !isTransitioning.value || !window2) {
          return;
        }
        window2.transitionHeight.value = convertToUnit(el.clientHeight);
      });
    }
    const transition = computed(() => {
      const name = window2.isReversed.value ? props.reverseTransition : props.transition;
      return !hasTransition.value ? false : {
        name: typeof name !== "string" ? window2.transition.value : name,
        onBeforeEnter: onBeforeTransition,
        onAfterEnter: onAfterTransition,
        onEnterCancelled: onTransitionCancelled,
        onBeforeLeave: onBeforeTransition,
        onAfterLeave: onAfterTransition,
        onLeaveCancelled: onTransitionCancelled,
        onEnter: onEnterTransition
      };
    });
    const {
      hasContent
    } = useLazy(props, groupItem.isSelected);
    useRender(() => createVNode(MaybeTransition, {
      "transition": transition.value,
      "disabled": !isBooted.value
    }, {
      default: () => {
        var _a;
        return [withDirectives(createVNode("div", {
          "class": ["v-window-item", groupItem.selectedClass.value, props.class],
          "style": props.style
        }, [hasContent.value && ((_a = slots.default) == null ? void 0 : _a.call(slots))]), [[vShow, groupItem.isSelected.value]])];
      }
    }));
    return {
      groupItem
    };
  }
});
const makeVCarouselItemProps = propsFactory({
  ...makeVImgProps(),
  ...makeVWindowItemProps()
}, "VCarouselItem");
const VCarouselItem = genericComponent()({
  name: "VCarouselItem",
  inheritAttrs: false,
  props: makeVCarouselItemProps(),
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    useRender(() => {
      const imgProps = VImg.filterProps(props);
      const windowItemProps = VWindowItem.filterProps(props);
      return createVNode(VWindowItem, mergeProps({
        "class": ["v-carousel-item", props.class]
      }, windowItemProps), {
        default: () => [createVNode(VImg, mergeProps(attrs, imgProps), slots)]
      });
    });
  }
});
const _sfc_main$8 = /* @__PURE__ */ defineComponent$1({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const model = ref(0);
    const indexData = ref({});
    const eventsData = ref([]);
    const featuredData = ref([]);
    const researchData = ref([]);
    const writingData = ref([]);
    const teachingData = ref([]);
    const engagementData = ref([]);
    const eelData = ref([]);
    const modalData = ref({});
    const showmodal = ref(false);
    const moreresourceData = ref([]);
    ref(0);
    const directus = le("https://content.thegovlab.com").with(Fu());
    async function fetchIndex() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy", {
            meta: "total_count",
            limit: -1,
            fields: ["*.*"]
          })
        );
        indexData.value = response;
      } catch (error) {
        console.error("Error fetching index data:", error);
      }
    }
    async function fetchEvents() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_resources", {
            filter: {
              _and: [
                { type: { _eq: "Event" } },
                { date: { _gte: "$NOW" } }
              ]
            },
            meta: "total_count",
            limit: 2,
            sort: ["date"],
            fields: ["*.*", "thumbnail.*", "event_series.general_events_series_id.*"]
          })
        );
        eventsData.value = response;
      } catch (error) {
        console.error("Error fetching events data:", error);
      }
    }
    async function fetchFeatured() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_blog", {
            filter: { status: { _eq: "published" } },
            meta: "total_count",
            limit: 6,
            sort: ["-date"],
            fields: [
              "*.*",
              "authors.team_id.*",
              "authors.team_id.Headshot.*"
            ]
          })
        );
        featuredData.value = response;
        preloadImages();
      } catch (error) {
        console.error("Error fetching featured data:", error);
      }
    }
    async function fetchResearch() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_resources", {
            filter: { type: { _eq: "Case Study" } },
            meta: "total_count",
            limit: -1,
            sort: ["-id"],
            fields: ["*.*", "thumbnail.*"]
          })
        );
        researchData.value = response;
      } catch (error) {
        console.error("Error fetching research data:", error);
      }
    }
    async function fetchWriting() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_resources", {
            filter: {
              _or: [
                { type: { _eq: "Article" } },
                { type: { _eq: "Book" } }
              ]
            },
            meta: "total_count",
            limit: -1,
            sort: ["-id"],
            fields: ["*.*", "thumbnail.*", "authors.team_id.*"]
          })
        );
        writingData.value = response;
      } catch (error) {
        console.error("Error fetching writing data:", error);
      }
    }
    async function fetchTeaching() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_resources", {
            filter: { type: { _eq: "Teaching" } },
            meta: "total_count",
            limit: -1,
            sort: ["-id"],
            fields: ["*.*", "thumbnail.*"]
          })
        );
        teachingData.value = response;
      } catch (error) {
        console.error("Error fetching teaching data:", error);
      }
    }
    async function fetchEEL() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_resources", {
            filter: { type: { _eq: "Equitable Engagement Lab" } },
            meta: "total_count",
            limit: -1,
            sort: ["-id"],
            fields: ["*.*", "thumbnail.*"]
          })
        );
        eelData.value = response;
      } catch (error) {
        console.error("Error fetching EEL data:", error);
      }
    }
    async function fetchEngagements() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_resources", {
            filter: { type: { _eq: "Engagement" } },
            meta: "total_count",
            limit: -1,
            sort: ["-id"],
            fields: ["*.*", "thumbnail.*"]
          })
        );
        engagementData.value = response;
      } catch (error) {
        console.error("Error fetching engagements data:", error);
      }
    }
    async function fetchMoreResources() {
      try {
        const response = await directus.request(
          Gs("reboot_democracy_resources", {
            filter: {
              _or: [
                { type: { _eq: "Video" } },
                { type: { _eq: "Podcast" } },
                { type: { _eq: "Resources" } }
              ]
            },
            meta: "total_count",
            limit: -1,
            sort: ["-id"],
            fields: ["*.*", "thumbnail.*"]
          })
        );
        moreresourceData.value = response;
      } catch (error) {
        console.error("Error fetching more resources data:", error);
      }
    }
    function loadModal() {
      directus.request(
        Gs("reboot_democracy_modal", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((item) => {
        var _a, _b, _c, _d;
        modalData.value = item;
        if (typeof window !== "undefined") {
          const campaignName = ((_b = (_a = modalData.value) == null ? void 0 : _a.campaigns) == null ? void 0 : _b.campaign_name) || "ModalCampaign";
          const alreadyOff = localStorage.getItem(campaignName) === "off";
          showmodal.value = ((_c = modalData.value) == null ? void 0 : _c.status) === "published" && !alreadyOff;
        } else {
          showmodal.value = ((_d = modalData.value) == null ? void 0 : _d.status) === "published";
        }
      }).catch((err) => {
        console.error("Error loading modal:", err);
      });
    }
    function closeModal() {
      showmodal.value = false;
      localStorage.setItem("Reboot Democracy", "off");
    }
    function formatDateTime(d1) {
      return format$1(new Date(d1), "MMMM d, yyyy, h:mm aa");
    }
    function formatDateOnly(d1) {
      return format$1(new Date(d1), "MMMM d, yyyy");
    }
    function FutureDate(d1) {
      return isFuture(new Date(d1));
    }
    function preloadImages() {
      if (typeof window !== "undefined") {
        featuredData.value.forEach((item) => {
          if (item.image) {
            const img = new Image();
            img.src = directus.url.href + "assets/" + item.image.id + "?width=438";
          }
        });
      }
    }
    async function fetchAllData() {
      await Promise.all([
        fetchIndex(),
        fetchEvents(),
        fetchFeatured(),
        fetchResearch(),
        fetchWriting(),
        fetchTeaching(),
        fetchEngagements(),
        fetchEEL(),
        fetchMoreResources(),
        loadModal()
      ]);
    }
    {
      onServerPrefetch(async () => {
        await fetchAllData();
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-d172b8df>`);
      if (showmodal.value) {
        _push(ssrRenderComponent(unref(VueFinalModal), {
          modelValue: showmodal.value,
          "onUpdate:modelValue": ($event) => showmodal.value = $event,
          classes: "modal-container",
          "content-class": "modal-comp",
          onBeforeClose: closeModal
        }, {
          default: withCtx(({ close }, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_sfc_main$9, {
                modalData: modalData.value,
                closeFunc: () => {
                  close();
                  closeModal();
                }
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(_sfc_main$9, {
                  modalData: modalData.value,
                  closeFunc: () => {
                    close();
                    closeModal();
                  }
                }, null, 8, ["modalData", "closeFunc"])
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="hero" data-v-d172b8df><video autoplay loop muted playsinline data-v-d172b8df><source${ssrRenderAttr("src", _imports_0$2)} type="video/mp4" title="generated with https://runwayml.com/" data-v-d172b8df> Your browser does not support the video tag. </video><div class="hero-fallback-image" data-v-d172b8df></div><div class="hero-content" data-v-d172b8df><h1 class="eyebrow blue" data-v-d172b8df>${ssrInterpolate(indexData.value.title)}</h1><h1 class="title" data-v-d172b8df>${indexData.value.subtitle ?? ""}</h1></div><div class="featured-section" data-v-d172b8df>`);
      _push(ssrRenderComponent(VCarousel, {
        "hide-delimiters": "",
        modelValue: model.value,
        "onUpdate:modelValue": ($event) => model.value = $event
      }, {
        default: withCtx((_2, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<!--[-->`);
            ssrRenderList(featuredData.value, (item, i) => {
              _push2(ssrRenderComponent(VCarouselItem, {
                class: "index_carousel",
                key: i
              }, {
                default: withCtx((_22, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="featured-content" data-v-d172b8df${_scopeId2}><h1 class="eyebrow" data-v-d172b8df${_scopeId2}>From the Blog</h1><div class="featured-image" data-v-d172b8df${_scopeId2}>`);
                    if (item.image) {
                      _push3(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + item.image.id + "?width=438")} data-v-d172b8df${_scopeId2}>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`</div><h4 data-v-d172b8df${_scopeId2}>${ssrInterpolate(item.title)}</h4><p data-v-d172b8df${_scopeId2}>${ssrInterpolate(formatDateOnly(new Date(item.date)))}</p>`);
                    if (item.authors == "" && item.type != "Event") {
                      _push3(`<p class="featured-event-description" data-v-d172b8df${_scopeId2}>${ssrInterpolate(item.description)}</p>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (item.type == "Event") {
                      _push3(`<p data-v-d172b8df${_scopeId2}>${ssrInterpolate(formatDateTime(new Date(item.date)))}</p>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    if (item.authors != "") {
                      _push3(`<p data-v-d172b8df${_scopeId2}>By <!--[-->`);
                      ssrRenderList(item.authors, (author, index) => {
                        _push3(`<span data-v-d172b8df${_scopeId2}>${ssrInterpolate(author.team_id.First_Name)} ${ssrInterpolate(author.team_id.Last_Name)}`);
                        if (index < item.authors.length - 1) {
                          _push3(`<span data-v-d172b8df${_scopeId2}>, </span>`);
                        } else {
                          _push3(`<!---->`);
                        }
                        _push3(`</span>`);
                      });
                      _push3(`<!--]--></p>`);
                    } else {
                      _push3(`<!---->`);
                    }
                    _push3(`<div class="speakers-list" style="${ssrRenderStyle(item.speakers ? null : { display: "none" })}" data-v-d172b8df${_scopeId2}>${item.speakers ?? ""}</div><a class="btn btn-small btn-blue"${ssrRenderAttr("href", "blog/" + item.slug)} data-v-d172b8df${_scopeId2}>Details <i class="fa-regular fa-arrow-right" data-v-d172b8df${_scopeId2}></i></a></div>`);
                  } else {
                    return [
                      createVNode("div", { class: "featured-content" }, [
                        createVNode("h1", { class: "eyebrow" }, "From the Blog"),
                        createVNode("div", { class: "featured-image" }, [
                          item.image ? (openBlock(), createBlock("img", {
                            key: 0,
                            src: unref(directus).url.href + "assets/" + item.image.id + "?width=438"
                          }, null, 8, ["src"])) : createCommentVNode("", true)
                        ]),
                        createVNode("h4", null, toDisplayString(item.title), 1),
                        createVNode("p", null, toDisplayString(formatDateOnly(new Date(item.date))), 1),
                        item.authors == "" && item.type != "Event" ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "featured-event-description"
                        }, toDisplayString(item.description), 1)) : createCommentVNode("", true),
                        item.type == "Event" ? (openBlock(), createBlock("p", { key: 1 }, toDisplayString(formatDateTime(new Date(item.date))), 1)) : createCommentVNode("", true),
                        item.authors != "" ? (openBlock(), createBlock("p", { key: 2 }, [
                          createTextVNode("By "),
                          (openBlock(true), createBlock(Fragment, null, renderList(item.authors, (author, index) => {
                            return openBlock(), createBlock("span", null, [
                              createTextVNode(toDisplayString(author.team_id.First_Name) + " " + toDisplayString(author.team_id.Last_Name), 1),
                              index < item.authors.length - 1 ? (openBlock(), createBlock("span", { key: 0 }, ", ")) : createCommentVNode("", true)
                            ]);
                          }), 256))
                        ])) : createCommentVNode("", true),
                        withDirectives(createVNode("div", {
                          class: "speakers-list",
                          innerHTML: item.speakers
                        }, null, 8, ["innerHTML"]), [
                          [vShow, item.speakers]
                        ]),
                        createVNode("a", {
                          class: "btn btn-small btn-blue",
                          href: "blog/" + item.slug
                        }, [
                          createTextVNode("Details "),
                          createVNode("i", { class: "fa-regular fa-arrow-right" })
                        ], 8, ["href"])
                      ])
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
            });
            _push2(`<!--]-->`);
          } else {
            return [
              (openBlock(true), createBlock(Fragment, null, renderList(featuredData.value, (item, i) => {
                return openBlock(), createBlock(VCarouselItem, {
                  class: "index_carousel",
                  key: i
                }, {
                  default: withCtx(() => [
                    createVNode("div", { class: "featured-content" }, [
                      createVNode("h1", { class: "eyebrow" }, "From the Blog"),
                      createVNode("div", { class: "featured-image" }, [
                        item.image ? (openBlock(), createBlock("img", {
                          key: 0,
                          src: unref(directus).url.href + "assets/" + item.image.id + "?width=438"
                        }, null, 8, ["src"])) : createCommentVNode("", true)
                      ]),
                      createVNode("h4", null, toDisplayString(item.title), 1),
                      createVNode("p", null, toDisplayString(formatDateOnly(new Date(item.date))), 1),
                      item.authors == "" && item.type != "Event" ? (openBlock(), createBlock("p", {
                        key: 0,
                        class: "featured-event-description"
                      }, toDisplayString(item.description), 1)) : createCommentVNode("", true),
                      item.type == "Event" ? (openBlock(), createBlock("p", { key: 1 }, toDisplayString(formatDateTime(new Date(item.date))), 1)) : createCommentVNode("", true),
                      item.authors != "" ? (openBlock(), createBlock("p", { key: 2 }, [
                        createTextVNode("By "),
                        (openBlock(true), createBlock(Fragment, null, renderList(item.authors, (author, index) => {
                          return openBlock(), createBlock("span", null, [
                            createTextVNode(toDisplayString(author.team_id.First_Name) + " " + toDisplayString(author.team_id.Last_Name), 1),
                            index < item.authors.length - 1 ? (openBlock(), createBlock("span", { key: 0 }, ", ")) : createCommentVNode("", true)
                          ]);
                        }), 256))
                      ])) : createCommentVNode("", true),
                      withDirectives(createVNode("div", {
                        class: "speakers-list",
                        innerHTML: item.speakers
                      }, null, 8, ["innerHTML"]), [
                        [vShow, item.speakers]
                      ]),
                      createVNode("a", {
                        class: "btn btn-small btn-blue",
                        href: "blog/" + item.slug
                      }, [
                        createTextVNode("Details "),
                        createVNode("i", { class: "fa-regular fa-arrow-right" })
                      ], 8, ["href"])
                    ])
                  ]),
                  _: 2
                }, 1024);
              }), 128))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div id="about" class="mission-section" data-v-d172b8df><div class="mission-text" data-v-d172b8df><h2 class="eyebrow peach" data-v-d172b8df>${ssrInterpolate(indexData.value.mission_title)}</h2><div data-v-d172b8df>${indexData.value.mission_heading ?? ""}</div><div class="mission-description" data-v-d172b8df>${indexData.value.mission_description ?? ""}</div></div><div class="mission-image" data-v-d172b8df></div></div><div class="upcoming-events-section" style="${ssrRenderStyle(!eventsData.value ? null : { display: "none" })}" data-v-d172b8df><div class="upcoming-events-box" data-v-d172b8df><div class="upcoming-events-text" data-v-d172b8df><h3 data-v-d172b8df>Reboot Democracy Lecture Series</h3><div class="our-work-description" data-v-d172b8df><p data-v-d172b8df>Upcoming events in the Reboot Democracy Lecture Series</p></div><a class="btn btn-ghost btn-dark btn-medium" href="/events/reboot-democracy" target="_blank" data-v-d172b8df>View all events</a><div class="col-50-home" data-v-d172b8df></div></div><div class="upcoming-events-content" data-v-d172b8df><!--[-->`);
      ssrRenderList(eventsData.value, (resource_item) => {
        _push(`<div class="upcoming-events-item" style="${ssrRenderStyle(FutureDate(new Date(resource_item.date)) ? null : { display: "none" })}" data-v-d172b8df>`);
        if (!resource_item.instructor && resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + resource_item.thumbnail.id + "?width=334")} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h4 data-v-d172b8df>${ssrInterpolate(resource_item.title)}</h4><div style="${ssrRenderStyle({ "display": "flex", "flex-direction": "column" })}" data-v-d172b8df><p data-v-d172b8df><b data-v-d172b8df>Speakers: </b></p><div data-v-d172b8df>${resource_item.speakers ?? ""}</div></div><p data-v-d172b8df>${ssrInterpolate(formatDateOnly(new Date(resource_item.date)))}</p><a class="btn btn-small btn-primary"${ssrRenderAttr("href", resource_item.link)} target="_blank" data-v-d172b8df>Read More <i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div>`);
      });
      _push(`<!--]--></div></div></div><div class="our-work-section" data-v-d172b8df><div class="our-work-image equitable-engagement-img" data-v-d172b8df><img${ssrRenderAttr("src", _imports_1$1)} data-v-d172b8df></div><div class="our-work-layout" data-v-d172b8df><div class="our-work-text" data-v-d172b8df><h3 data-v-d172b8df>${ssrInterpolate(indexData.value.equitable_engagement_lab_title)}</h3><div class="our-work-description" data-v-d172b8df>${indexData.value.equitable_engagement_lab_description ?? ""}</div></div><div class="two-col-resources" data-v-d172b8df><div class="resource-row" data-v-d172b8df><!--[-->`);
      ssrRenderList(eelData.value.slice(0, 6), (resource_item) => {
        _push(`<div class="resource-col" data-v-d172b8df><div class="resource-item" data-v-d172b8df><div class="resource-item-img" data-v-d172b8df>`);
        if (resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + resource_item.thumbnail.id)} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        if (!resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", _imports_1$1)} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="resource-item-text" data-v-d172b8df><h4 data-v-d172b8df>${ssrInterpolate(resource_item.title)}</h4><p data-v-d172b8df>${ssrInterpolate(resource_item.description)}</p><a class="btn btn-small btn-tertiary"${ssrRenderAttr("href", resource_item.link)} target="_blank" data-v-d172b8df>Read More <i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div>`);
      });
      _push(`<!--]--></div><div class="join-section" data-v-d172b8df><div class="join-text" data-v-d172b8df><h3 data-v-d172b8df>${ssrInterpolate(indexData.value.join_the_lab_title)}</h3><div data-v-d172b8df>${indexData.value.join_the_lab_description ?? ""}</div><a class="btn btn-primary btn-dark btn-medium" data-v-d172b8df>Join the Lab</a></div></div></div></div></div><div id="about" class="mission-section" data-v-d172b8df><div class="mission-text" data-v-d172b8df><h2 class="eyebrow peach" data-v-d172b8df>${ssrInterpolate(indexData.value.experience_title)}</h2><h2 data-v-d172b8df>${ssrInterpolate(indexData.value.experience_heading)}</h2><div class="mission-description" data-v-d172b8df>${indexData.value.experience_description ?? ""}</div></div><div class="mission-image" data-v-d172b8df></div></div><div class="our-work-separator" data-v-d172b8df><div class="our-work-separator-text" data-v-d172b8df><h2 class="eyebrow white" data-v-d172b8df>${ssrInterpolate(indexData.value.our_work_title)}</h2><p data-v-d172b8df>${ssrInterpolate(indexData.value.our_work_subtitle)}</p></div></div><div class="our-work-section" data-v-d172b8df><div class="our-work-image research-img" data-v-d172b8df><img${ssrRenderAttr("src", _imports_2$1)} data-v-d172b8df></div><div class="our-work-layout" data-v-d172b8df><div class="our-work-text" data-v-d172b8df><h3 data-v-d172b8df>${ssrInterpolate(indexData.value.engagement_title)}</h3><div class="our-work-description" data-v-d172b8df>${indexData.value.engagement_description ?? ""}</div></div><div class="two-col-resources" data-v-d172b8df><div class="resource-row" data-v-d172b8df><!--[-->`);
      ssrRenderList(engagementData.value.slice().reverse().slice(0, 6), (resource_item) => {
        var _a, _b;
        _push(`<div class="resource-col" data-v-d172b8df><div class="resource-item" data-v-d172b8df><div class="resource-item-img" data-v-d172b8df>`);
        if (resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + resource_item.thumbnail.id + "?width=566")} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        if (!resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", _imports_0$1)} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="resource-item-text" data-v-d172b8df>`);
        if (((_a = resource_item.stage) == null ? void 0 : _a.length) > 0) {
          _push(`<div class="event-tag-row" data-v-d172b8df><div class="engagement_dot" data-v-d172b8df></div><p data-v-d172b8df>${ssrInterpolate(((_b = resource_item.stage) == null ? void 0 : _b.length) > 0 ? resource_item.stage[0] : "")}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h4 data-v-d172b8df>${ssrInterpolate(resource_item.title)}</h4><p data-v-d172b8df>${ssrInterpolate(resource_item.description)}</p><a class="btn btn-small btn-tertiary"${ssrRenderAttr("href", resource_item.link)} target="_blank" data-v-d172b8df>Read More <i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div>`);
      });
      _push(`<!--]--></div><a class="btn btn-small btn-ghost" href="/our-engagements" data-v-d172b8df>More Engagements<i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div><div class="our-work-section" data-v-d172b8df><div class="our-work-image research-img" data-v-d172b8df><img${ssrRenderAttr("src", _imports_4)} data-v-d172b8df></div><div class="our-work-layout" data-v-d172b8df><div class="our-work-text" data-v-d172b8df><h3 data-v-d172b8df>${ssrInterpolate(indexData.value.research_title)}</h3><div class="our-work-description" data-v-d172b8df>${indexData.value.research_description ?? ""}</div></div><div class="two-col-resources" data-v-d172b8df><div class="resource-row" data-v-d172b8df><!--[-->`);
      ssrRenderList(researchData.value.slice(0, 6), (resource_item) => {
        _push(`<div class="resource-col" data-v-d172b8df><div class="resource-item" data-v-d172b8df><div class="resource-item-img" data-v-d172b8df>`);
        if (resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + resource_item.thumbnail.id + "?width=566")} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="resource-item-text" data-v-d172b8df><h5 class="eyebrow" data-v-d172b8df>${ssrInterpolate(resource_item.type)}</h5><h4 data-v-d172b8df>${ssrInterpolate(resource_item.title)}</h4><p data-v-d172b8df>${ssrInterpolate(resource_item.description)}</p><a class="btn btn-small btn-tertiary"${ssrRenderAttr("href", resource_item.link)} target="_blank" data-v-d172b8df>Read More <i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div>`);
      });
      _push(`<!--]--></div><a class="btn btn-small btn-ghost" href="/our-research" data-v-d172b8df>More Research<i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div><div class="our-work-section" data-v-d172b8df><div class="our-work-image writing-img" data-v-d172b8df><img${ssrRenderAttr("src", _imports_5)} data-v-d172b8df></div><div class="our-work-layout" data-v-d172b8df><div class="our-work-text" data-v-d172b8df><h3 data-v-d172b8df>${ssrInterpolate(indexData.value.writing_title)}</h3><div class="our-work-description" data-v-d172b8df>${indexData.value.writing_description ?? ""}</div></div><div class="two-col-resources" data-v-d172b8df><div class="resource-row" data-v-d172b8df><!--[-->`);
      ssrRenderList(writingData.value.slice().reverse().slice(0, 6), (resource_item) => {
        _push(`<div class="resource-col" data-v-d172b8df><div class="resource-item" data-v-d172b8df><div class="resource-item-img" data-v-d172b8df>`);
        if (resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + resource_item.thumbnail.id + "?width=566")} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        if (!resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", _imports_0$1)} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="resource-item-text" data-v-d172b8df><h5 class="eyebrow" data-v-d172b8df>${ssrInterpolate(resource_item.type)}</h5><h4 data-v-d172b8df>${ssrInterpolate(resource_item.title)}</h4><p data-v-d172b8df>By <!--[-->`);
        ssrRenderList(resource_item.authors, (author, index) => {
          _push(`<span data-v-d172b8df>${ssrInterpolate(author.team_id.name)}`);
          if (index < resource_item.authors.length - 1) {
            _push(`<span data-v-d172b8df>, </span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</span>`);
        });
        _push(`<!--]--></p><a class="btn btn-small btn-tertiary"${ssrRenderAttr("href", resource_item.link)} target="_blank" data-v-d172b8df>Read More <i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div>`);
      });
      _push(`<!--]--></div><a class="btn btn-small btn-ghost" href="/our-writing" data-v-d172b8df>More Writing<i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div><div class="our-work-section" data-v-d172b8df><div class="our-work-image writing-img" data-v-d172b8df><img${ssrRenderAttr("src", _imports_0$1)} data-v-d172b8df></div><div class="our-work-layout" data-v-d172b8df><div class="our-work-text" data-v-d172b8df><h3 data-v-d172b8df>${ssrInterpolate(indexData.value.teaching_title)}</h3><div class="our-work-description" data-v-d172b8df>${indexData.value.teaching_description ?? ""}</div></div><div class="two-col-resources" data-v-d172b8df><div class="resource-row" data-v-d172b8df><!--[-->`);
      ssrRenderList(teachingData.value.slice(0, 6), (resource_item) => {
        _push(`<div class="resource-col" data-v-d172b8df><div class="resource-item" data-v-d172b8df><div class="resource-item-img" data-v-d172b8df>`);
        if (resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + resource_item.thumbnail.id + "?width=566")} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        if (!resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", _imports_0$1)} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="resource-item-text" data-v-d172b8df><h5 class="eyebrow" data-v-d172b8df>${ssrInterpolate(resource_item.type)}</h5><h4 data-v-d172b8df>${ssrInterpolate(resource_item.title)}</h4><p data-v-d172b8df>${ssrInterpolate(resource_item.description)}</p><a class="btn btn-small btn-tertiary"${ssrRenderAttr("href", resource_item.link)} target="_blank" data-v-d172b8df>Read More <i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div>`);
      });
      _push(`<!--]--></div><a class="btn btn-small btn-ghost" href="/our-teaching" data-v-d172b8df>More Teaching<i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div><div class="our-work-section" data-v-d172b8df><div class="our-work-image writing-img" data-v-d172b8df><img${ssrRenderAttr("src", _imports_2$1)} data-v-d172b8df></div><div class="our-work-layout" data-v-d172b8df><div class="our-work-text" data-v-d172b8df><h3 data-v-d172b8df>${ssrInterpolate(indexData.value.more_resources_title)}</h3><div class="our-work-description" data-v-d172b8df>${indexData.value.more_resources_description ?? ""}</div></div><div class="two-col-resources" data-v-d172b8df><div class="resource-row" data-v-d172b8df><!--[-->`);
      ssrRenderList(moreresourceData.value.slice(0, 6), (resource_item) => {
        _push(`<div class="resource-col" data-v-d172b8df><div class="resource-item" data-v-d172b8df><div class="resource-item-img" data-v-d172b8df>`);
        if (resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + resource_item.thumbnail.id + "?width=566")} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        if (!resource_item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", _imports_0$1)} data-v-d172b8df>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="resource-item-text" data-v-d172b8df><h5 class="eyebrow" data-v-d172b8df>${ssrInterpolate(resource_item.type)}</h5><h4 data-v-d172b8df>${ssrInterpolate(resource_item.title)}</h4><p data-v-d172b8df>${ssrInterpolate(resource_item.description)}</p><a class="btn btn-small btn-tertiary"${ssrRenderAttr("href", resource_item.link)} target="_blank" data-v-d172b8df>Read More <i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div>`);
      });
      _push(`<!--]--></div><a class="btn btn-small btn-ghost" href="/more-resources" data-v-d172b8df>More Resources<i class="fa-regular fa-arrow-right" data-v-d172b8df></i></a></div></div></div>`);
      _push(ssrRenderComponent(MailingListComponent, null, null, _parent));
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/index.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const Home = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-d172b8df"]]);
const _sfc_main$7 = /* @__PURE__ */ defineComponent$1({
  __name: "events",
  __ssrInlineRender: true,
  setup(__props) {
    var _a;
    ref(null);
    ref(null);
    const directus = le("https://content.thegovlab.com").with(Fu());
    const route = typeof window !== "undefined" ? useRoute$1() : ref(null);
    ref(0);
    const showingFullText = ref(true);
    const accordionContent = ref("");
    const indexData = ref([]);
    const eventsData = ref([]);
    ref([]);
    ref(void 0);
    const eventTitle = ref("");
    const eventDescription = ref("");
    const eventFullDescription = ref("");
    const seriesData = ref([]);
    ref(route.query);
    const alleventsData = ref([]);
    ref(typeof window !== "undefined" ? (_a = route.value) == null ? void 0 : _a.fullPath : "");
    onMounted(() => {
      fetchIndex();
      fetchEvents();
      fetchSeries();
    });
    watch(
      () => [showingFullText.value, eventFullDescription.value],
      () => {
        formattedBody();
      },
      { immediate: true }
    );
    watch(
      () => {
        var _a2;
        return typeof window !== "undefined" ? (_a2 = route.value) == null ? void 0 : _a2.fullPath : "";
      },
      () => {
      },
      { deep: true, immediate: true }
    );
    function formatDateTime(d1) {
      return format$1(d1, "MMMM d, yyyy, h:mm aa");
    }
    function PastDate(d1) {
      return isPast(d1);
    }
    function FutureDate(d1) {
      return isFuture(new Date(d1));
    }
    function formattedBody() {
      if (showingFullText.value) {
        accordionContent.value = eventFullDescription.value;
      } else {
        if (eventFullDescription.value) {
          const lines = eventFullDescription.value.split("\n");
          const truncatedLines = lines.slice(0, 2);
          accordionContent.value = truncatedLines.join("\n");
        }
      }
    }
    function fetchIndex() {
      directus.request(
        Gs("reboot_democracy", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((response) => {
        indexData.value = response.data;
      }).catch((err) => console.error(err));
    }
    function fetchSeries() {
      directus.request(
        Gs("general_events_series", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((response) => {
        var _a2;
        seriesData.value = response.data;
        if ((_a2 = seriesData.value) == null ? void 0 : _a2[1]) {
          eventTitle.value = seriesData.value[1].title;
          eventDescription.value = seriesData.value[1].description;
          eventFullDescription.value = seriesData.value[1].full_description;
        }
      }).catch((err) => console.error(err));
    }
    function fetchEvents() {
      directus.request(
        Gs("reboot_democracy_resources", {
          filter: { type: { _eq: "Event" } },
          meta: "total_count",
          limit: -1,
          sort: ["-date"],
          fields: [
            "*.*",
            "thumbnail.*",
            "partner_logo.*",
            "event_series.general_events_series_id.*"
          ]
        })
      ).then((response) => {
        eventsData.value = response.map((element) => ({
          event_element: element,
          series_name: "Reboot Democracy Lecture Series"
        }));
        eventsData.value.sort((b2, a) => {
          return new Date(b2.event_element.date).getTime() - new Date(a.event_element.date).getTime();
        });
        const tempData = eventsData.value.filter((e) => {
          var _a2, _b;
          return ((_a2 = e.event_element.event_series) == null ? void 0 : _a2.length) > 0 && ((_b = e.event_element.event_series[0].general_events_series_id) == null ? void 0 : _b.title) === "Reboot Democracy Lecture Series";
        });
        alleventsData.value = tempData;
        alleventsData.value.sort((b2, a) => {
          return new Date(b2.event_element.date).getTime() - new Date(a.event_element.date).getTime();
        });
      }).catch((err) => console.error(err));
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="events-hero" data-v-796f48ff><div class="events-title-row" data-v-796f48ff><div class="events-title-col" data-v-796f48ff><h1 data-v-796f48ff>Rebooting Democracy in the Age of AI</h1><h2 class="red-subtitle" data-v-796f48ff><span data-v-796f48ff>Lecture Series</span></h2></div></div><div class="events-row" data-v-796f48ff>`);
      if (eventTitle.value !== "") {
        _push(`<div class="event-information" data-v-796f48ff><div class="event-short-description" data-v-796f48ff><h1 data-v-796f48ff>${ssrInterpolate(eventDescription.value)}</h1><div class="btn-row" data-v-796f48ff><a href="/signup" target="_blank" class="mt-10 btn btn-primary btn-dark btn-medium" data-v-796f48ff>Sign up to receive updates!</a></div></div><div class="event-long-description" data-v-796f48ff><div data-v-796f48ff>${accordionContent.value ?? ""}</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="event-selection-row" data-v-796f48ff><h2 class="event-selector active" data-v-796f48ff> Upcoming Events </h2><h2 class="event-selector" data-v-796f48ff> Past Events </h2></div><div class="event-grid-section" data-v-796f48ff><div class="event-grid-row" data-v-796f48ff><!--[-->`);
      ssrRenderList(eventsData.value, (event_item) => {
        _push(`<div class="event-grid-col" style="${ssrRenderStyle(FutureDate(new Date(event_item.event_element.date)) ? null : { display: "none" })}" data-v-796f48ff><div class="event-grid-item" data-v-796f48ff><div class="event-grid-padding" data-v-796f48ff><div class="event-title" data-v-796f48ff><h3 data-v-796f48ff>${ssrInterpolate(event_item.event_element.title)}</h3></div><div class="event-item-row" data-v-796f48ff><div class="event-image" data-v-796f48ff>`);
        if (!event_item.event_element.instructor && event_item.event_element.thumbnail) {
          _push(`<img${ssrRenderAttr(
            "src",
            unref(directus).url.href + "assets/" + event_item.event_element.thumbnail.id
          )} data-v-796f48ff>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--[-->`);
        ssrRenderList(event_item.event_element.instructor, (instructor_item, index) => {
          _push(`<div style="${ssrRenderStyle(index < 1 ? null : { display: "none" })}" data-v-796f48ff><img${ssrRenderAttr(
            "src",
            unref(directus).url.href + "assets/" + instructor_item.innovate_us_instructors_id.headshot.id
          )} data-v-796f48ff></div>`);
        });
        _push(`<!--]--></div><div class="event-text" data-v-796f48ff><div class="event-speakers" data-v-796f48ff>`);
        if (event_item.event_element.speakers) {
          _push(`<p data-v-796f48ff> Speaker(s):  </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div data-v-796f48ff>${event_item.event_element.speakers ?? ""}</div></div><p class="event-description" data-v-796f48ff>${event_item.event_element.description ?? ""}</p>`);
        if (event_item.event_element.online_event && !event_item.event_element.inperson_event) {
          _push(`<p class="event-type" data-v-796f48ff><i class="fa-solid fa-video" data-v-796f48ff></i> Online </p>`);
        } else {
          _push(`<!---->`);
        }
        if (event_item.event_element.inperson_event) {
          _push(`<p class="event-type" data-v-796f48ff><i class="fa-solid fa-building-user" data-v-796f48ff></i> Hybrid </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="event-date" data-v-796f48ff>${ssrInterpolate(formatDateTime(new Date(event_item.event_element.date)))} ET </p><a${ssrRenderAttr("href", event_item.event_element.link)} target="_blank" class="btn register-btn btn-dark btn-medium register-btn" data-v-796f48ff>Register</a></div></div></div>`);
        if (event_item.event_element.partner_logo) {
          _push(`<div class="event-item-partnership-row" data-v-796f48ff><div class="partner-logo-section" data-v-796f48ff><p class="partnership-label" data-v-796f48ff>In Partnership with:</p><img class="partner-logo-img"${ssrRenderAttr(
            "src",
            unref(directus).url.href + "assets/" + event_item.event_element.partner_logo.id
          )} data-v-796f48ff></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      });
      _push(`<!--]--></div></div><div class="event-grid-section" data-v-796f48ff><h3 data-v-796f48ff>Past Events</h3><div class="past-event-grid-row" data-v-796f48ff><!--[-->`);
      ssrRenderList(eventsData.value.slice().reverse(), (event_item) => {
        _push(`<div class="past-event-grid-item" style="${ssrRenderStyle(PastDate(new Date(event_item.event_element.date)) ? null : { display: "none" })}" data-v-796f48ff><div class="past-event-col-1" data-v-796f48ff><div class="event-thumbnail" data-v-796f48ff>`);
        if (event_item.event_element.thumbnail) {
          _push(`<img${ssrRenderAttr(
            "src",
            unref(directus).url.href + "assets/" + event_item.event_element.thumbnail.id
          )} data-v-796f48ff>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="past-event-col-2" data-v-796f48ff><h5 class="eyebrow" data-v-796f48ff>${ssrInterpolate(event_item.series_name)}</h5><h2 data-v-796f48ff>${ssrInterpolate(event_item.event_element.title)}</h2><p data-v-796f48ff>${ssrInterpolate(formatDateTime(new Date(event_item.event_element.date)))} ET</p><div class="event-partnership-container" data-v-796f48ff>`);
        if (event_item.event_element.partner_logo) {
          _push(`<p class="partnership-label" data-v-796f48ff> In Partnership with: </p>`);
        } else {
          _push(`<!---->`);
        }
        if (event_item.event_element.partner_logo) {
          _push(`<img class="partner-logo-img"${ssrRenderAttr(
            "src",
            unref(directus).url.href + "assets/" + event_item.event_element.partner_logo.id
          )} data-v-796f48ff>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><p class="event-description" data-v-796f48ff>${event_item.event_element.description ?? ""}</p><a${ssrRenderAttr("href", event_item.event_element.link)} target="_blank" class="btn btn-secondary btn-dark btn-medium" data-v-796f48ff>Watch</a></div></div>`);
      });
      _push(`<!--]--></div></div>`);
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/events.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const Events = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-796f48ff"]]);
const _sfc_main$6 = /* @__PURE__ */ defineComponent$1({
  __name: "our-writing",
  __ssrInlineRender: true,
  setup(__props) {
    const directus = le("https://content.thegovlab.com").with(Fu());
    const route = useRoute$1();
    const articleData = ref([]);
    const indexData = ref({});
    const selectedType = ref("All");
    ref(route.fullPath || "");
    onMounted(() => {
      fetchIndex();
      fetchArticle();
    });
    watch(selectedType, () => {
    });
    function fetchIndex() {
      directus.request(
        Gs("reboot_democracy", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((response) => {
        indexData.value = response;
      }).catch((err) => {
        console.error("Error in fetchIndex:", err);
      });
    }
    function fetchArticle() {
      directus.request(
        Gs("reboot_democracy_resources", {
          meta: "total_count",
          limit: -1,
          sort: ["-id"],
          fields: ["*.*", "thumbnail.*", "authors.team_id.*"],
          filter: {
            _or: [
              { type: { _eq: "Article" } },
              { type: { _eq: "Book" } }
            ]
          }
        })
      ).then((response) => {
        articleData.value = response;
      }).catch((err) => {
        console.error("Error in fetchArticle:", err);
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="resource-page our-writing-page" data-v-1cf934c4><div class="resource-description" data-v-1cf934c4><h1 data-v-1cf934c4>${ssrInterpolate(indexData.value.writing_title)}</h1><div class="our-work-description" data-v-1cf934c4>${indexData.value.writing_description ?? ""}</div><div class="resource-menu" data-v-1cf934c4><ul data-v-1cf934c4><li class="${ssrRenderClass({ isActive: selectedType.value === "All" })}" data-v-1cf934c4> All Writing </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Book" })}" data-v-1cf934c4> Books </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Article" })}" data-v-1cf934c4> Articles </li></ul></div></div><div class="resource-scroll-section" data-v-1cf934c4><div class="resource-scroller" data-v-1cf934c4><!--[-->`);
      ssrRenderList(articleData.value, (item) => {
        _push(`<!--[-->`);
        if (item.type === selectedType.value || selectedType.value === "All") {
          _push(`<div class="featured-items" data-v-1cf934c4><div class="featured-item-text" data-v-1cf934c4><h5 class="eyebrow" data-v-1cf934c4>${ssrInterpolate(item.type)}</h5><div class="resource-item-img" data-v-1cf934c4>`);
          if (item.thumbnail) {
            _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + item.thumbnail.id)} alt="thumbnail" data-v-1cf934c4>`);
          } else {
            _push(`<img${ssrRenderAttr("src", _imports_0$1)} alt="no thumbnail" data-v-1cf934c4>`);
          }
          _push(`</div><h4 data-v-1cf934c4>${ssrInterpolate(item.title)}</h4><p data-v-1cf934c4> By <!--[-->`);
          ssrRenderList(item.authors, (author, index) => {
            _push(`<span data-v-1cf934c4>${ssrInterpolate(author.team_id.name)} `);
            if (index < item.authors.length - 1) {
              _push(`<span data-v-1cf934c4>, </span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</span>`);
          });
          _push(`<!--]--></p><a class="btn btn-small btn-blue"${ssrRenderAttr("href", item.link)} data-v-1cf934c4> Details <i class="fa-regular fa-arrow-right" data-v-1cf934c4></i></a></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></div></div><div class="resource-image" data-v-1cf934c4></div></div>`);
      _push(ssrRenderComponent(MailingListComponent, null, null, _parent));
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/our-writing.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const Writing = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-1cf934c4"]]);
const _sfc_main$5 = /* @__PURE__ */ defineComponent$1({
  __name: "our-research",
  __ssrInlineRender: true,
  setup(__props) {
    const directus = le("https://content.thegovlab.com").with(Fu());
    const route = useRoute$1();
    const articleData = ref([]);
    const indexData = ref({});
    const selectedType = ref("All");
    ref(route.fullPath);
    const resourceScrollerRef = ref(null);
    onMounted(() => {
      fetchIndex();
      fetchArticle();
    });
    watch(selectedType, () => {
      scrollTop();
    });
    function fetchIndex() {
      directus.request(
        Gs("reboot_democracy", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((response) => {
        console.log(response);
        indexData.value = response;
      }).catch((err) => {
        console.error(err);
      });
    }
    function fetchArticle() {
      directus.request(
        Gs("reboot_democracy_resources", {
          meta: "total_count",
          limit: -1,
          sort: ["-id"],
          fields: ["*.*"],
          filter: {
            type: {
              _eq: "Case Study"
            }
          }
        })
      ).then((response) => {
        console.log(response);
        articleData.value = response;
      }).catch((err) => {
        console.error(err);
      });
    }
    function scrollTop() {
      if (resourceScrollerRef.value) {
        resourceScrollerRef.value.scrollTop = 0;
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="resource-page our-research-page" data-v-ab76136f><div class="resource-description" data-v-ab76136f><h1 data-v-ab76136f>${ssrInterpolate(indexData.value.research_title)}</h1><div class="our-work-description" data-v-ab76136f>${indexData.value.research_description ?? ""}</div><div class="resource-menu" data-v-ab76136f><ul data-v-ab76136f><li class="${ssrRenderClass({ isActive: selectedType.value === "All" })}" data-v-ab76136f> All Case Studies </li><li class="${ssrRenderClass({ isActive: selectedType.value === "CrowdLaw" })}" data-v-ab76136f> CrowdLaw </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Virtual Communities" })}" data-v-ab76136f> Virtual Communities </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Smarter State" })}" data-v-ab76136f> Smarter State </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Collective Intelligence" })}" data-v-ab76136f> Collective Intelligence </li><li class="${ssrRenderClass({ isActive: selectedType.value === "" })}" data-v-ab76136f><a href="#research" data-v-ab76136f>Research Questions</a></li></ul></div></div><div class="resource-scroll-section" data-v-ab76136f><div class="resource-scroller" data-v-ab76136f><!--[-->`);
      ssrRenderList(articleData.value, (item) => {
        _push(`<!--[-->`);
        if (item.case_study_type === selectedType.value || selectedType.value === "All") {
          _push(`<div class="featured-items" data-v-ab76136f><div class="featured-item-text" data-v-ab76136f><h5 class="eyebrow" data-v-ab76136f>${ssrInterpolate(item.case_study_type)}</h5><div class="resource-item-img" data-v-ab76136f>`);
          if (item.thumbnail) {
            _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + item.thumbnail.id)} alt="Thumbnail" data-v-ab76136f>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><h4 data-v-ab76136f>${ssrInterpolate(item.title)}</h4><p data-v-ab76136f>${ssrInterpolate(item.description)}</p><a class="btn btn-small btn-blue"${ssrRenderAttr("href", item.link)} target="_blank" rel="noopener" data-v-ab76136f> Details <i class="fa-regular fa-arrow-right" data-v-ab76136f></i></a></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></div></div><div class="resource-image" data-v-ab76136f></div></div><div id="research" class="research-questions" data-v-ab76136f><div class="research-questions-description" data-v-ab76136f><h2 data-v-ab76136f>Research Questions</h2><div data-v-ab76136f>${indexData.value.research_questions_description ?? ""}</div></div><div class="research-questions-content" data-v-ab76136f>${indexData.value.research_questions_content ?? ""}</div></div>`);
      _push(ssrRenderComponent(MailingListComponent, null, null, _parent));
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/our-research.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const Research = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-ab76136f"]]);
const makeVVirtualScrollItemProps = propsFactory({
  renderless: Boolean,
  ...makeComponentProps()
}, "VVirtualScrollItem");
const VVirtualScrollItem = genericComponent()({
  name: "VVirtualScrollItem",
  inheritAttrs: false,
  props: makeVVirtualScrollItemProps(),
  emits: {
    "update:height": (height) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      emit,
      slots
    } = _ref;
    const {
      resizeRef,
      contentRect
    } = useResizeObserver(void 0, "border");
    watch(() => {
      var _a;
      return (_a = contentRect.value) == null ? void 0 : _a.height;
    }, (height) => {
      if (height != null) emit("update:height", height);
    });
    useRender(() => {
      var _a, _b;
      return props.renderless ? createVNode(Fragment, null, [(_a = slots.default) == null ? void 0 : _a.call(slots, {
        itemRef: resizeRef
      })]) : createVNode("div", mergeProps({
        "ref": resizeRef,
        "class": ["v-virtual-scroll__item", props.class],
        "style": props.style
      }, attrs), [(_b = slots.default) == null ? void 0 : _b.call(slots)]);
    });
  }
});
const DisplaySymbol = Symbol.for("vuetify:display");
const defaultDisplayOptions = {
  mobileBreakpoint: "lg",
  thresholds: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
    xxl: 2560
  }
};
const parseDisplayOptions = function() {
  let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : defaultDisplayOptions;
  return mergeDeep(defaultDisplayOptions, options);
};
function getClientWidth(ssr) {
  return IN_BROWSER && !ssr ? window.innerWidth : typeof ssr === "object" && ssr.clientWidth || 0;
}
function getClientHeight(ssr) {
  return IN_BROWSER && !ssr ? window.innerHeight : typeof ssr === "object" && ssr.clientHeight || 0;
}
function getPlatform(ssr) {
  const userAgent = IN_BROWSER && !ssr ? window.navigator.userAgent : "ssr";
  function match(regexp) {
    return Boolean(userAgent.match(regexp));
  }
  const android = match(/android/i);
  const ios = match(/iphone|ipad|ipod/i);
  const cordova = match(/cordova/i);
  const electron = match(/electron/i);
  const chrome = match(/chrome/i);
  const edge = match(/edge/i);
  const firefox = match(/firefox/i);
  const opera = match(/opera/i);
  const win = match(/win/i);
  const mac = match(/mac/i);
  const linux = match(/linux/i);
  return {
    android,
    ios,
    cordova,
    electron,
    chrome,
    edge,
    firefox,
    opera,
    win,
    mac,
    linux,
    touch: SUPPORTS_TOUCH,
    ssr: userAgent === "ssr"
  };
}
function createDisplay(options, ssr) {
  const {
    thresholds,
    mobileBreakpoint
  } = parseDisplayOptions(options);
  const height = shallowRef(getClientHeight(ssr));
  const platform = shallowRef(getPlatform(ssr));
  const state = reactive({});
  const width = shallowRef(getClientWidth(ssr));
  function updateSize() {
    height.value = getClientHeight();
    width.value = getClientWidth();
  }
  function update() {
    updateSize();
    platform.value = getPlatform();
  }
  watchEffect(() => {
    const xs = width.value < thresholds.sm;
    const sm = width.value < thresholds.md && !xs;
    const md = width.value < thresholds.lg && !(sm || xs);
    const lg = width.value < thresholds.xl && !(md || sm || xs);
    const xl = width.value < thresholds.xxl && !(lg || md || sm || xs);
    const xxl = width.value >= thresholds.xxl;
    const name = xs ? "xs" : sm ? "sm" : md ? "md" : lg ? "lg" : xl ? "xl" : "xxl";
    const breakpointValue = typeof mobileBreakpoint === "number" ? mobileBreakpoint : thresholds[mobileBreakpoint];
    const mobile = width.value < breakpointValue;
    state.xs = xs;
    state.sm = sm;
    state.md = md;
    state.lg = lg;
    state.xl = xl;
    state.xxl = xxl;
    state.smAndUp = !xs;
    state.mdAndUp = !(xs || sm);
    state.lgAndUp = !(xs || sm || md);
    state.xlAndUp = !(xs || sm || md || lg);
    state.smAndDown = !(md || lg || xl || xxl);
    state.mdAndDown = !(lg || xl || xxl);
    state.lgAndDown = !(xl || xxl);
    state.xlAndDown = !xxl;
    state.name = name;
    state.height = height.value;
    state.width = width.value;
    state.mobile = mobile;
    state.mobileBreakpoint = mobileBreakpoint;
    state.platform = platform.value;
    state.thresholds = thresholds;
  });
  if (IN_BROWSER) {
    window.addEventListener("resize", updateSize, {
      passive: true
    });
  }
  return {
    ...toRefs(state),
    update,
    ssr: !!ssr
  };
}
function useDisplay() {
  let props = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const display = inject$1(DisplaySymbol);
  if (!display) throw new Error("Could not find Vuetify display injection");
  const mobile = computed(() => {
    if (props.mobile != null) return props.mobile;
    if (!props.mobileBreakpoint) return display.mobile.value;
    const breakpointValue = typeof props.mobileBreakpoint === "number" ? props.mobileBreakpoint : display.thresholds.value[props.mobileBreakpoint];
    return display.width.value < breakpointValue;
  });
  const displayClasses = computed(() => {
    if (!name) return {};
    return {
      [`${name}--mobile`]: mobile.value
    };
  });
  return {
    ...display,
    displayClasses,
    mobile
  };
}
const UP = -1;
const DOWN = 1;
const BUFFER_PX = 100;
const makeVirtualProps = propsFactory({
  itemHeight: {
    type: [Number, String],
    default: null
  },
  height: [Number, String]
}, "virtual");
function useVirtual(props, items) {
  const display = useDisplay();
  const itemHeight = shallowRef(0);
  watchEffect(() => {
    itemHeight.value = parseFloat(props.itemHeight || 0);
  });
  const first = shallowRef(0);
  const last = shallowRef(Math.ceil(
    // Assume 16px items filling the entire screen height if
    // not provided. This is probably incorrect but it minimises
    // the chance of ending up with empty space at the bottom.
    // The default value is set here to avoid poisoning getSize()
    (parseInt(props.height) || display.height.value) / (itemHeight.value || 16)
  ) || 1);
  const paddingTop = shallowRef(0);
  const paddingBottom = shallowRef(0);
  const containerRef = ref();
  const markerRef = ref();
  let markerOffset = 0;
  const {
    resizeRef,
    contentRect
  } = useResizeObserver();
  watchEffect(() => {
    resizeRef.value = containerRef.value;
  });
  const viewportHeight = computed(() => {
    var _a;
    return containerRef.value === document.documentElement ? display.height.value : ((_a = contentRect.value) == null ? void 0 : _a.height) || parseInt(props.height) || 0;
  });
  const hasInitialRender = computed(() => {
    return !!(containerRef.value && markerRef.value && viewportHeight.value && itemHeight.value);
  });
  let sizes = Array.from({
    length: items.value.length
  });
  let offsets = Array.from({
    length: items.value.length
  });
  const updateTime = shallowRef(0);
  let targetScrollIndex = -1;
  function getSize(index) {
    return sizes[index] || itemHeight.value;
  }
  const updateOffsets = debounce(() => {
    const start = performance.now();
    offsets[0] = 0;
    const length = items.value.length;
    for (let i = 1; i <= length - 1; i++) {
      offsets[i] = (offsets[i - 1] || 0) + getSize(i - 1);
    }
    updateTime.value = Math.max(updateTime.value, performance.now() - start);
  }, updateTime);
  const unwatch = watch(hasInitialRender, (v) => {
    if (!v) return;
    unwatch();
    markerOffset = markerRef.value.offsetTop;
    updateOffsets.immediate();
    calculateVisibleItems();
    if (!~targetScrollIndex) return;
    nextTick(() => {
      IN_BROWSER && window.requestAnimationFrame(() => {
        scrollToIndex(targetScrollIndex);
        targetScrollIndex = -1;
      });
    });
  });
  onScopeDispose(() => {
    updateOffsets.clear();
  });
  function handleItemResize(index, height) {
    const prevHeight = sizes[index];
    const prevMinHeight = itemHeight.value;
    itemHeight.value = prevMinHeight ? Math.min(itemHeight.value, height) : height;
    if (prevHeight !== height || prevMinHeight !== itemHeight.value) {
      sizes[index] = height;
      updateOffsets();
    }
  }
  function calculateOffset(index) {
    index = clamp(index, 0, items.value.length - 1);
    return offsets[index] || 0;
  }
  function calculateIndex(scrollTop) {
    return binaryClosest(offsets, scrollTop);
  }
  let lastScrollTop = 0;
  let scrollVelocity = 0;
  let lastScrollTime = 0;
  watch(viewportHeight, (val, oldVal) => {
    if (oldVal) {
      calculateVisibleItems();
      if (val < oldVal) {
        requestAnimationFrame(() => {
          scrollVelocity = 0;
          calculateVisibleItems();
        });
      }
    }
  });
  function handleScroll() {
    if (!containerRef.value || !markerRef.value) return;
    const scrollTop = containerRef.value.scrollTop;
    const scrollTime = performance.now();
    const scrollDeltaT = scrollTime - lastScrollTime;
    if (scrollDeltaT > 500) {
      scrollVelocity = Math.sign(scrollTop - lastScrollTop);
      markerOffset = markerRef.value.offsetTop;
    } else {
      scrollVelocity = scrollTop - lastScrollTop;
    }
    lastScrollTop = scrollTop;
    lastScrollTime = scrollTime;
    calculateVisibleItems();
  }
  function handleScrollend() {
    if (!containerRef.value || !markerRef.value) return;
    scrollVelocity = 0;
    lastScrollTime = 0;
    calculateVisibleItems();
  }
  let raf = -1;
  function calculateVisibleItems() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(_calculateVisibleItems);
  }
  function _calculateVisibleItems() {
    if (!containerRef.value || !viewportHeight.value) return;
    const scrollTop = lastScrollTop - markerOffset;
    const direction = Math.sign(scrollVelocity);
    const startPx = Math.max(0, scrollTop - BUFFER_PX);
    const start = clamp(calculateIndex(startPx), 0, items.value.length);
    const endPx = scrollTop + viewportHeight.value + BUFFER_PX;
    const end = clamp(calculateIndex(endPx) + 1, start + 1, items.value.length);
    if (
      // Only update the side we're scrolling towards,
      // the other side will be updated incidentally
      (direction !== UP || start < first.value) && (direction !== DOWN || end > last.value)
    ) {
      const topOverflow = calculateOffset(first.value) - calculateOffset(start);
      const bottomOverflow = calculateOffset(end) - calculateOffset(last.value);
      const bufferOverflow = Math.max(topOverflow, bottomOverflow);
      if (bufferOverflow > BUFFER_PX) {
        first.value = start;
        last.value = end;
      } else {
        if (start <= 0) first.value = start;
        if (end >= items.value.length) last.value = end;
      }
    }
    paddingTop.value = calculateOffset(first.value);
    paddingBottom.value = calculateOffset(items.value.length) - calculateOffset(last.value);
  }
  function scrollToIndex(index) {
    const offset = calculateOffset(index);
    if (!containerRef.value || index && !offset) {
      targetScrollIndex = index;
    } else {
      containerRef.value.scrollTop = offset;
    }
  }
  const computedItems = computed(() => {
    return items.value.slice(first.value, last.value).map((item, index) => ({
      raw: item,
      index: index + first.value
    }));
  });
  watch(items, () => {
    sizes = Array.from({
      length: items.value.length
    });
    offsets = Array.from({
      length: items.value.length
    });
    updateOffsets.immediate();
    calculateVisibleItems();
  }, {
    deep: true
  });
  return {
    calculateVisibleItems,
    containerRef,
    markerRef,
    computedItems,
    paddingTop,
    paddingBottom,
    scrollToIndex,
    handleScroll,
    handleScrollend,
    handleItemResize
  };
}
function binaryClosest(arr, val) {
  let high = arr.length - 1;
  let low = 0;
  let mid = 0;
  let item = null;
  let target = -1;
  if (arr[high] < val) {
    return high;
  }
  while (low <= high) {
    mid = low + high >> 1;
    item = arr[mid];
    if (item > val) {
      high = mid - 1;
    } else if (item < val) {
      target = mid;
      low = mid + 1;
    } else if (item === val) {
      return mid;
    } else {
      return low;
    }
  }
  return target;
}
const makeVVirtualScrollProps = propsFactory({
  items: {
    type: Array,
    default: () => []
  },
  renderless: Boolean,
  ...makeVirtualProps(),
  ...makeComponentProps(),
  ...makeDimensionProps()
}, "VVirtualScroll");
const VVirtualScroll = genericComponent()({
  name: "VVirtualScroll",
  props: makeVVirtualScrollProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const vm = getCurrentInstance("VVirtualScroll");
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      calculateVisibleItems,
      containerRef,
      markerRef,
      handleScroll,
      handleScrollend,
      handleItemResize,
      scrollToIndex,
      paddingTop,
      paddingBottom,
      computedItems
    } = useVirtual(props, toRef(props, "items"));
    useToggleScope(() => props.renderless, () => {
      function handleListeners() {
        var _a, _b;
        let add = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
        const method = add ? "addEventListener" : "removeEventListener";
        if (containerRef.value === document.documentElement) {
          document[method]("scroll", handleScroll, {
            passive: true
          });
          document[method]("scrollend", handleScrollend);
        } else {
          (_a = containerRef.value) == null ? void 0 : _a[method]("scroll", handleScroll, {
            passive: true
          });
          (_b = containerRef.value) == null ? void 0 : _b[method]("scrollend", handleScrollend);
        }
      }
      onMounted(() => {
        containerRef.value = getScrollParent(vm.vnode.el, true);
        handleListeners(true);
      });
      onScopeDispose(handleListeners);
    });
    useRender(() => {
      const children = computedItems.value.map((item) => createVNode(VVirtualScrollItem, {
        "key": item.index,
        "renderless": props.renderless,
        "onUpdate:height": (height) => handleItemResize(item.index, height)
      }, {
        default: (slotProps) => {
          var _a;
          return (_a = slots.default) == null ? void 0 : _a.call(slots, {
            item: item.raw,
            index: item.index,
            ...slotProps
          });
        }
      }));
      return props.renderless ? createVNode(Fragment, null, [createVNode("div", {
        "ref": markerRef,
        "class": "v-virtual-scroll__spacer",
        "style": {
          paddingTop: convertToUnit(paddingTop.value)
        }
      }, null), children, createVNode("div", {
        "class": "v-virtual-scroll__spacer",
        "style": {
          paddingBottom: convertToUnit(paddingBottom.value)
        }
      }, null)]) : createVNode("div", {
        "ref": containerRef,
        "class": ["v-virtual-scroll", props.class],
        "onScrollPassive": handleScroll,
        "onScrollend": handleScrollend,
        "style": [dimensionStyles.value, props.style]
      }, [createVNode("div", {
        "ref": markerRef,
        "class": "v-virtual-scroll__container",
        "style": {
          paddingTop: convertToUnit(paddingTop.value),
          paddingBottom: convertToUnit(paddingBottom.value)
        }
      }, [children])]);
    });
    return {
      calculateVisibleItems,
      scrollToIndex
    };
  }
});
const _sfc_main$4 = /* @__PURE__ */ defineComponent$1({
  __name: "our-teaching",
  __ssrInlineRender: true,
  setup(__props) {
    const directus = le("https://content.thegovlab.com").with(Fu());
    const route = useRoute$1();
    const articleData = ref([]);
    const indexData = ref({});
    const selectedType = ref("All");
    ref(route.fullPath || "");
    onMounted(() => {
      fetchIndex();
      fetchArticle();
    });
    watch(selectedType, () => {
    });
    function fetchIndex() {
      directus.request(
        Gs("reboot_democracy", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((response) => {
        indexData.value = response;
      }).catch((err) => {
        console.error("Error fetching index data:", err);
      });
    }
    function fetchArticle() {
      directus.request(
        Gs("reboot_democracy_resources", {
          meta: "total_count",
          limit: -1,
          sort: ["-id"],
          fields: ["*.*"],
          filter: {
            _or: [
              { type: { _eq: "Teaching" } }
            ]
          }
        })
      ).then((response) => {
        articleData.value = response || [];
      }).catch((err) => {
        console.error("Error fetching article data:", err);
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="resource-page our-teaching-page" data-v-5bb9c668><div class="resource-description" data-v-5bb9c668><h1 data-v-5bb9c668>${ssrInterpolate(indexData.value.teaching_title)}</h1><div class="our-work-description" data-v-5bb9c668>${indexData.value.teaching_description ?? ""}</div><div class="resource-menu" data-v-5bb9c668><ul data-v-5bb9c668><li class="${ssrRenderClass({ isActive: selectedType.value === "All" })}" data-v-5bb9c668> All Teaching </li><li class="${ssrRenderClass({ isActive: selectedType.value === "at-your-own-pace" })}" data-v-5bb9c668> At-Your-Own-Pace </li><li class="${ssrRenderClass({ isActive: selectedType.value === "video" })}" data-v-5bb9c668> Videos </li></ul></div></div><div class="resource-scroll-section" data-v-5bb9c668><div class="resource-scroller" data-v-5bb9c668>`);
      _push(ssrRenderComponent(VVirtualScroll, { items: articleData.value }, {
        default: withCtx(({ item }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="featured-items" style="${ssrRenderStyle(item.teaching_type === selectedType.value || selectedType.value === "All" ? null : { display: "none" })}" data-v-5bb9c668${_scopeId}><div class="featured-item-text" data-v-5bb9c668${_scopeId}><h5 class="eyebrow" data-v-5bb9c668${_scopeId}>${ssrInterpolate(item.teaching_type)}</h5><div class="resource-item-img" data-v-5bb9c668${_scopeId}>`);
            if (item.thumbnail) {
              _push2(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + item.thumbnail.id)} alt="Thumbnail" data-v-5bb9c668${_scopeId}>`);
            } else {
              _push2(`<img${ssrRenderAttr("src", _imports_0$1)} alt="No thumbnail" data-v-5bb9c668${_scopeId}>`);
            }
            _push2(`</div><h4 data-v-5bb9c668${_scopeId}>${ssrInterpolate(item.title)}</h4><p data-v-5bb9c668${_scopeId}>${ssrInterpolate(item.description)}</p><a class="btn btn-small btn-tertiary"${ssrRenderAttr("href", item.link)} target="_blank" rel="noopener" data-v-5bb9c668${_scopeId}> Details <i class="fa-regular fa-arrow-right" data-v-5bb9c668${_scopeId}></i></a></div></div>`);
          } else {
            return [
              withDirectives(createVNode("div", { class: "featured-items" }, [
                createVNode("div", { class: "featured-item-text" }, [
                  createVNode("h5", { class: "eyebrow" }, toDisplayString(item.teaching_type), 1),
                  createVNode("div", { class: "resource-item-img" }, [
                    item.thumbnail ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: unref(directus).url.href + "assets/" + item.thumbnail.id,
                      alt: "Thumbnail"
                    }, null, 8, ["src"])) : (openBlock(), createBlock("img", {
                      key: 1,
                      src: _imports_0$1,
                      alt: "No thumbnail"
                    }))
                  ]),
                  createVNode("h4", null, toDisplayString(item.title), 1),
                  createVNode("p", null, toDisplayString(item.description), 1),
                  createVNode("a", {
                    class: "btn btn-small btn-tertiary",
                    href: item.link,
                    target: "_blank",
                    rel: "noopener"
                  }, [
                    createTextVNode(" Details "),
                    createVNode("i", { class: "fa-regular fa-arrow-right" })
                  ], 8, ["href"])
                ])
              ], 512), [
                [vShow, item.teaching_type === selectedType.value || selectedType.value === "All"]
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="resource-image" data-v-5bb9c668></div></div>`);
      _push(ssrRenderComponent(MailingListComponent, null, null, _parent));
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/our-teaching.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const Teaching = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-5bb9c668"]]);
const _sfc_main$3 = /* @__PURE__ */ defineComponent$1({
  __name: "our-engagements",
  __ssrInlineRender: true,
  setup(__props) {
    const directus = le("https://content.thegovlab.com").with(Fu());
    const route = useRoute$1();
    const articleData = ref([]);
    const indexData = ref({});
    const selectedType = ref("All");
    ref(route.fullPath || "");
    onMounted(() => {
      fetchIndex();
      fetchArticle();
    });
    function fetchIndex() {
      directus.request(
        Gs("reboot_democracy", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((response) => {
        indexData.value = response;
      }).catch((err) => {
        console.error("Error fetching index data:", err);
      });
    }
    function fetchArticle() {
      directus.request(
        Gs("reboot_democracy_resources", {
          meta: "total_count",
          limit: -1,
          sort: ["-id"],
          fields: ["*.*"],
          filter: {
            _or: [
              {
                type: {
                  _eq: "Engagement"
                }
              }
            ]
          }
        })
      ).then((response) => {
        articleData.value = response;
        console.log("Fetched article data:", response);
      }).catch((err) => {
        console.error("Error fetching article data:", err);
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="resource-page our-engagements-page" data-v-67294693><div class="resource-description" data-v-67294693><h1 data-v-67294693>${ssrInterpolate(indexData.value.engagement_title)}</h1><div class="our-work-description" data-v-67294693>${indexData.value.engagement_description ?? ""}</div><div class="resource-menu" data-v-67294693><ul data-v-67294693><li class="${ssrRenderClass({ isActive: selectedType.value === "All" })}" data-v-67294693> All Engagements </li></ul></div></div><div class="resource-scroll-section" data-v-67294693><div class="resource-scroller" data-v-67294693><!--[-->`);
      ssrRenderList(articleData.value, (item) => {
        var _a, _b;
        _push(`<div class="featured-items" style="${ssrRenderStyle(item.type === selectedType.value || selectedType.value === "All" ? null : { display: "none" })}" data-v-67294693><div class="featured-item-text" data-v-67294693><div class="resource-item-img" data-v-67294693>`);
        if (item.thumbnail) {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + item.thumbnail.id + "?width=648")} data-v-67294693>`);
        } else {
          _push(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/a23c4d59-eb04-4d2a-ab9b-74136043954c?quality=80")} data-v-67294693>`);
        }
        _push(`</div>`);
        if (((_a = item.stage) == null ? void 0 : _a.length) > 0) {
          _push(`<div class="event-tag-row" data-v-67294693><div class="engagement_dot" data-v-67294693></div><p data-v-67294693>${ssrInterpolate((_b = item.stage) == null ? void 0 : _b[0])}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h5 class="eyebrow peach" data-v-67294693>Partner: ${ssrInterpolate(item.partner)}</h5><h4 data-v-67294693>${ssrInterpolate(item.title)}</h4><p data-v-67294693>${ssrInterpolate(item.description)}</p><a class="btn btn-small btn-secondary"${ssrRenderAttr("href", item.link)} data-v-67294693>Details <i class="fa-regular fa-arrow-right" data-v-67294693></i></a></div></div>`);
      });
      _push(`<!--]--></div></div><div class="resource-image" data-v-67294693></div></div>`);
      _push(ssrRenderComponent(MailingListComponent, null, null, _parent));
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/our-engagements.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const Engagement = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-67294693"]]);
const _sfc_main$2 = /* @__PURE__ */ defineComponent$1({
  __name: "more-resources",
  __ssrInlineRender: true,
  setup(__props) {
    const directus = le("https://content.thegovlab.com").with(Fu());
    const route = useRoute$1();
    const articleData = ref([]);
    const indexData = ref({});
    const selectedType = ref("All");
    ref(route.fullPath || "");
    onMounted(() => {
      fetchIndex();
      fetchArticle();
    });
    function fetchIndex() {
      directus.request(
        Gs("reboot_democracy", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((res) => {
        indexData.value = res || [];
      }).catch((err) => {
        console.error("Error fetching index data:", err);
      });
    }
    function fetchArticle() {
      directus.request(
        Gs("reboot_democracy_resources", {
          meta: "total_count",
          limit: -1,
          sort: ["-id"],
          fields: ["*.*", "thumbnail.*", "authors.team_id.*"],
          filter: {
            _or: [
              { type: { _eq: "Resources" } },
              { type: { _eq: "Video" } },
              { type: { _eq: "Podcast" } }
            ]
          }
        })
      ).then((res) => {
        articleData.value = res || [];
      }).catch((err) => {
        console.error("Error fetching article data:", err);
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="resource-page our-writing-page" data-v-63440b92><div class="resource-description" data-v-63440b92><h1 data-v-63440b92>${ssrInterpolate(indexData.value.more_resources_title)}</h1><div class="our-work-description" data-v-63440b92>${indexData.value.more_resources_description ?? ""}</div><div class="resource-menu" data-v-63440b92><ul data-v-63440b92><li class="${ssrRenderClass({ isActive: selectedType.value === "All" })}" data-v-63440b92> All Resources </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Resources" })}" data-v-63440b92> Process Docs and Worksheets </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Podcast" })}" data-v-63440b92> Podcast </li><li class="${ssrRenderClass({ isActive: selectedType.value === "Video" })}" data-v-63440b92> Video </li></ul></div></div><div class="resource-scroll-section" data-v-63440b92><div class="resource-scroller" data-v-63440b92>`);
      _push(ssrRenderComponent(VVirtualScroll, { items: articleData.value }, {
        default: withCtx(({ item }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="featured-items" style="${ssrRenderStyle(item.type === selectedType.value || selectedType.value === "All" ? null : { display: "none" })}" data-v-63440b92${_scopeId}><div class="featured-item-text" data-v-63440b92${_scopeId}><div class="resource-item-img" data-v-63440b92${_scopeId}>`);
            if (item.thumbnail) {
              _push2(`<img${ssrRenderAttr("src", unref(directus).url.href + "assets/" + item.thumbnail.id)} alt="Thumbnail" data-v-63440b92${_scopeId}>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><h5 class="eyebrow peach" data-v-63440b92${_scopeId}>${ssrInterpolate(item.type)}</h5><h4 data-v-63440b92${_scopeId}>${ssrInterpolate(item.title)}</h4><p data-v-63440b92${_scopeId}>${ssrInterpolate(item.description)}</p><a class="btn btn-small btn-secondary"${ssrRenderAttr("href", item.link)} data-v-63440b92${_scopeId}> Details <i class="fa-regular fa-arrow-right" data-v-63440b92${_scopeId}></i></a></div></div>`);
          } else {
            return [
              withDirectives(createVNode("div", { class: "featured-items" }, [
                createVNode("div", { class: "featured-item-text" }, [
                  createVNode("div", { class: "resource-item-img" }, [
                    item.thumbnail ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: unref(directus).url.href + "assets/" + item.thumbnail.id,
                      alt: "Thumbnail"
                    }, null, 8, ["src"])) : createCommentVNode("", true)
                  ]),
                  createVNode("h5", { class: "eyebrow peach" }, toDisplayString(item.type), 1),
                  createVNode("h4", null, toDisplayString(item.title), 1),
                  createVNode("p", null, toDisplayString(item.description), 1),
                  createVNode("a", {
                    class: "btn btn-small btn-secondary",
                    href: item.link
                  }, [
                    createTextVNode(" Details "),
                    createVNode("i", { class: "fa-regular fa-arrow-right" })
                  ], 8, ["href"])
                ])
              ], 512), [
                [vShow, item.type === selectedType.value || selectedType.value === "All"]
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="resource-image" data-v-63440b92></div></div>`);
      _push(ssrRenderComponent(MailingListComponent, null, null, _parent));
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/more-resources.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const Resources = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-63440b92"]]);
const _sfc_main$1 = /* @__PURE__ */ defineComponent$1({
  __name: "blog-page",
  __ssrInlineRender: true,
  setup(__props) {
    var _a;
    const isClient = typeof window !== "undefined";
    const route = isClient ? useRoute$1() : ref(null);
    const directus = le("https://content.thegovlab.com").with(Fu());
    const searchResultsFlag = ref(0);
    ref([]);
    const searchTerm = ref("");
    const searchTermDisplay = ref("");
    const debounceSearch = ref(null);
    const searchloader = ref(false);
    ref(false);
    ref(0);
    ref("");
    ref(0);
    ref(1);
    ref(2);
    ref(0);
    const blogData = ref([]);
    const blogDataSearch = ref([]);
    const filteredTagData = ref([]);
    const modalData = ref([]);
    ref([]);
    ref(true);
    const showmodal = ref(false);
    ref(isClient ? (_a = route.value) == null ? void 0 : _a.fullPath : "");
    ref(1);
    ref(7e3);
    ref("");
    ref(false);
    ref(true);
    debounceSearch.value = _.debounce(searchBlog, 500);
    const latestBlogPost = computed(() => {
      if (Array.isArray(blogData.value) && blogData.value.length > 0) {
        return [...blogData.value].reverse()[0];
      }
      return null;
    });
    const filteredTagDataWithoutNews = computed(() => {
      return filteredTagData.value.filter((tag) => tag !== "News that caught our eye");
    });
    function includesString(array, stringVal) {
      if (!array) return false;
      const lowerCasePartialSentence = stringVal.toLowerCase();
      return array.some((s) => s.toLowerCase().includes(lowerCasePartialSentence));
    }
    function searchBlog() {
      searchloader.value = true;
      let searchTArray = searchTerm.value.split(" ").filter((item) => item);
      const searchObj = [];
      searchTArray.map((a) => {
        searchObj.push({ excerpt: { _contains: a } });
        searchObj.push({ title: { _contains: a } });
        searchObj.push({ content: { _contains: a } });
        searchObj.push({ authors: { team_id: { First_Name: { _contains: a } } } });
        searchObj.push({ authors: { team_id: { Last_Name: { _contains: a } } } });
        searchObj.push({ authors: { team_id: { Title: { _contains: a } } } });
      });
      if (searchTArray.length > 0) {
        searchResultsFlag.value = 1;
      } else {
        searchResultsFlag.value = 0;
      }
      directus.request(
        Gs("reboot_democracy_blog", {
          limit: -1,
          filter: {
            _and: [{ date: { _lte: "$NOW(-5 hours)" } }, { status: { _eq: "published" } }],
            _or: searchObj
          },
          sort: ["date"],
          fields: ["*.*", "authors.team_id.*", "authors.team_id.Headshot.*"]
        })
      ).then((b2) => {
        blogDataSearch.value = b2;
        searchloader.value = false;
      }).catch((err) => {
        console.error(err);
        searchloader.value = false;
      });
    }
    function formatDateOnly(d1) {
      return format$1(d1, "MMMM d, yyyy");
    }
    function loadModal() {
      directus.request(
        Gs("reboot_democracy_modal", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((item) => {
        modalData.value = item || {};
        console.log("Modal Data:", modalData.value);
        let storageItem = typeof window !== "undefined" ? localStorage.getItem("Reboot Democracy") : null;
        showmodal.value = modalData.value.status == "published" && (modalData.value.visibility == "always" || modalData.value.visibility == "once" && storageItem != "off");
      }).catch((err) => {
        console.error(err);
      });
    }
    function closeModal() {
      showmodal.value = false;
      if (typeof window !== "undefined") {
        localStorage.setItem("Reboot Democracy", "off");
      }
    }
    async function fetchBlog() {
      try {
        const item = await directus.request(
          Gs("reboot_democracy_blog", {
            meta: "total_count",
            limit: -1,
            filter: { status: { _eq: "published" } },
            fields: ["*.*", "authors.team_id.*", "authors.team_id.Headshot.*"],
            sort: ["date"]
          })
        );
        blogData.value = item;
        item.map((tag) => {
          var _a2;
          (_a2 = tag == null ? void 0 : tag.Tags) == null ? void 0 : _a2.map((subTags) => {
            if (subTags != null && !includesString(filteredTagData.value, subTags)) {
              filteredTagData.value.push(subTags);
            }
          });
        });
        const newsIndex = filteredTagData.value.indexOf("News that caught our eye");
        if (newsIndex > -1) {
          filteredTagData.value.unshift(filteredTagData.value.splice(newsIndex, 1)[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }
    watch(
      () => {
        var _a2;
        return isClient ? (_a2 = route.value) == null ? void 0 : _a2.fullPath : "";
      },
      () => {
        loadModal();
      },
      { immediate: true }
    );
    const isSSR = computed(() => true);
    {
      onServerPrefetch(async () => {
        await fetchBlog();
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-f98ed6e8>`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      if (showmodal.value) {
        _push(ssrRenderComponent(unref(VueFinalModal), {
          modelValue: showmodal.value,
          "onUpdate:modelValue": ($event) => showmodal.value = $event,
          classes: "modal-container",
          class: "modal-container",
          "content-class": "modal-comp"
        }, {
          default: withCtx(({ close }, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_sfc_main$9, {
                modalData: modalData.value,
                closeFunc: () => {
                  close();
                  closeModal();
                }
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(_sfc_main$9, {
                  modalData: modalData.value,
                  closeFunc: () => {
                    close();
                    closeModal();
                  }
                }, null, 8, ["modalData", "closeFunc"])
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="blog-page-hero" data-v-f98ed6e8><h1 class="eyebrow" data-v-f98ed6e8>Reboot Democracy</h1><h1 data-v-f98ed6e8>Blog</h1><p style="${ssrRenderStyle({ "padding": "1rem 0 0 0" })}" data-v-f98ed6e8>The Reboot Democracy Blog explores the complex relationship among AI, democracy and governance.</p><div class="search-bar-section" data-v-f98ed6e8><input class="search-bar"${ssrRenderAttr("value", searchTerm.value)} type="text" placeholder="SEARCH" data-v-f98ed6e8><span type="submit" class="search-bar-cancel-btn material-symbols-outlined" data-v-f98ed6e8> cancel </span><span type="submit" class="search-bar-btn material-symbols-outlined" data-v-f98ed6e8> search </span></div><a href="/signup" class="btn btn-small btn-primary" data-v-f98ed6e8>Sign up for our newsletter</a></div>`);
      if (searchloader.value) {
        _push(`<div class="loader-blog" data-v-f98ed6e8></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!searchResultsFlag.value && searchTermDisplay.value == "") {
        _push(`<div class="blog-featured" data-v-f98ed6e8><div class="blog-featured-row" data-v-f98ed6e8>`);
        if (latestBlogPost.value) {
          _push(`<div class="first-blog-post" data-v-f98ed6e8><a${ssrRenderAttr("href", "/blog/" + latestBlogPost.value.slug)} data-v-f98ed6e8>`);
          if (!isSSR.value && latestBlogPost.value.image) {
            _push(`<div data-v-f98ed6e8><img class="blog-list-img"${ssrRenderAttr("src", unref(directus).url.href + "assets/" + blogData.value.slice().reverse()[0].image.filename_disk + "?width=800")} loading="lazy" data-v-f98ed6e8></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<h3 data-v-f98ed6e8>${ssrInterpolate(latestBlogPost.value.title)}</h3><p data-v-f98ed6e8>${ssrInterpolate(latestBlogPost.value.excerpt)}</p><p data-v-f98ed6e8>Published on ${ssrInterpolate(formatDateOnly(new Date(latestBlogPost.value.date)))}</p><div class="author-list" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(latestBlogPost.value.authors.length > 0 ? "By" : "")}</p><!--[-->`);
          ssrRenderList(latestBlogPost.value.authors, (author, i) => {
            _push(`<div class="author-item" data-v-f98ed6e8><div class="author-details" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(author.team_id.First_Name)} ${ssrInterpolate(author.team_id.Last_Name)}</p>`);
            if (latestBlogPost.value.authors.length > 1 && i < blogData.value.slice().reverse()[0].authors.length - 1) {
              _push(`<p class="author-name" data-v-f98ed6e8>and</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></a></div>`);
        } else {
          _push(`<!---->`);
        }
        if (!searchResultsFlag.value || searchTerm.value == "") {
          _push(`<div class="other-blog-posts" data-v-f98ed6e8><!--[-->`);
          ssrRenderList(blogData.value.slice().reverse(), (blog_item, index) => {
            _push(`<div class="other-post-row" style="${ssrRenderStyle(index > 0 && index < 4 ? null : { display: "none" })}" data-v-f98ed6e8><a${ssrRenderAttr("href", "/blog/" + blog_item.slug)} data-v-f98ed6e8>`);
            if (!isSSR.value && blog_item.image) {
              _push(`<div data-v-f98ed6e8><img class="blog-list-img"${ssrRenderAttr("src", unref(directus).url.href + "assets/" + blog_item.image.id + "?width=300")} loading="lazy" data-v-f98ed6e8></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="other-post-details" data-v-f98ed6e8><h3 data-v-f98ed6e8>${ssrInterpolate(blog_item.title)}</h3><p data-v-f98ed6e8>${ssrInterpolate(blog_item.excerpt)}</p><p data-v-f98ed6e8>Published on ${ssrInterpolate(formatDateOnly(new Date(blog_item.date)))}</p><div class="author-list" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(blog_item.authors.length > 0 ? "By" : "")}</p><!--[-->`);
            ssrRenderList(blog_item.authors, (author, i) => {
              _push(`<div class="author-item" data-v-f98ed6e8><div class="author-details" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(author.team_id.First_Name)} ${ssrInterpolate(author.team_id.Last_Name)}</p>`);
              if (blog_item.authors.length > 1 && i < blog_item.authors.length - 1) {
                _push(`<p class="author-name" data-v-f98ed6e8>and</p>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div></div>`);
            });
            _push(`<!--]--></div></div></a></div>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!searchResultsFlag.value && searchTermDisplay.value == "") {
        _push(`<div class="read-more-post" data-v-f98ed6e8><a href="/all-blog-posts" class="btn btn-small btn-primary" data-v-f98ed6e8>Read All Posts</a></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!searchResultsFlag.value && searchTermDisplay.value == "") {
        _push(`<div class="blog-section-header" data-v-f98ed6e8><h2 data-v-f98ed6e8>Latest Posts</h2></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!searchResultsFlag.value && searchTermDisplay.value == "") {
        _push(`<div class="allposts-section" data-v-f98ed6e8><!--[-->`);
        ssrRenderList(blogDataSearch.value.slice().reverse(), (blog_item, index) => {
          _push(`<div class="allposts-post-row" style="${ssrRenderStyle(index >= 4 && index < 16 ? null : { display: "none" })}" data-v-f98ed6e8><a${ssrRenderAttr("href", "/blog/" + blog_item.slug)} data-v-f98ed6e8>`);
          if (!isSSR.value && blog_item.image) {
            _push(`<div data-v-f98ed6e8><img class="blog-list-img"${ssrRenderAttr("src", unref(directus).url.href + "assets/" + blog_item.image.id + "?width=300")} loading="lazy" data-v-f98ed6e8></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="allposts-post-details" data-v-f98ed6e8><h3 data-v-f98ed6e8>${ssrInterpolate(blog_item.title)}</h3><p class="post-date" data-v-f98ed6e8>Published on ${ssrInterpolate(formatDateOnly(new Date(blog_item.date)))}</p><div class="author-list" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(blog_item.authors.length > 0 ? "By" : "")}</p><!--[-->`);
          ssrRenderList(blog_item.authors, (author, i) => {
            _push(`<div class="author-item" data-v-f98ed6e8><div class="author-details" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(author.team_id.First_Name)} ${ssrInterpolate(author.team_id.Last_Name)}</p>`);
            if (blog_item.authors.length > 1 && i < blog_item.authors.length - 1) {
              _push(`<p class="author-name" data-v-f98ed6e8>and</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></div></a></div>`);
        });
        _push(`<!--]--><a href="/all-blog-posts" class="btn btn-small btn-primary" data-v-f98ed6e8>Read All Posts</a></div>`);
      } else {
        _push(`<!---->`);
      }
      if (searchResultsFlag.value && searchTermDisplay.value != "") {
        _push(`<h2 class="search-term" data-v-f98ed6e8> Searching for <i data-v-f98ed6e8>${ssrInterpolate(searchTermDisplay.value)}</i></h2>`);
      } else {
        _push(`<!---->`);
      }
      if (searchResultsFlag.value || searchTerm.value == "") {
        _push(`<div data-v-f98ed6e8>`);
        if (!searchResultsFlag.value && searchTermDisplay.value == "") {
          _push(`<div data-v-f98ed6e8><div class="allposts-section" data-v-f98ed6e8><!--[-->`);
          ssrRenderList(filteredTagDataWithoutNews.value, (tag_item) => {
            _push(`<div class="all-posts-row" data-v-f98ed6e8><div class="blog-section-header" data-v-f98ed6e8><h2 data-v-f98ed6e8>${ssrInterpolate(tag_item)}</h2></div><div class="tag-posts-row-container" data-v-f98ed6e8><!--[-->`);
            ssrRenderList(blogDataSearch.value.slice().reverse(), (blog_item, index) => {
              _push(`<div class="tag-posts-row" data-v-f98ed6e8>`);
              if (includesString(blog_item == null ? void 0 : blog_item.Tags, tag_item)) {
                _push(`<div data-v-f98ed6e8><a${ssrRenderAttr("href", "/blog/" + blog_item.slug)} data-v-f98ed6e8>`);
                if (!isSSR.value && blog_item.image) {
                  _push(`<div data-v-f98ed6e8><img class="blog-list-img"${ssrRenderAttr("src", unref(directus).url.href + "assets/" + blog_item.image.id + "?width=300")} loading="lazy" data-v-f98ed6e8></div>`);
                } else {
                  _push(`<!---->`);
                }
                _push(`<div class="allposts-post-details" data-v-f98ed6e8><h3 data-v-f98ed6e8>${ssrInterpolate(blog_item.title)}</h3><p class="post-date" data-v-f98ed6e8>Published on ${ssrInterpolate(formatDateOnly(new Date(blog_item.date)))}</p><div class="author-list" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(blog_item.authors.length > 0 ? "By" : "")}</p><!--[-->`);
                ssrRenderList(blog_item.authors, (author, i) => {
                  _push(`<div class="author-item" data-v-f98ed6e8><div class="author-details" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(author.team_id.First_Name)} ${ssrInterpolate(author.team_id.Last_Name)}</p>`);
                  if (blog_item.authors.length > 1 && i < blog_item.authors.length - 1) {
                    _push(`<p class="author-name" data-v-f98ed6e8>and</p>`);
                  } else {
                    _push(`<!---->`);
                  }
                  _push(`</div></div>`);
                });
                _push(`<!--]--></div></div></a></div>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            });
            _push(`<!--]--></div></div>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (searchResultsFlag.value && searchTermDisplay.value != "") {
        _push(`<div class="allposts-section" data-v-f98ed6e8><!--[-->`);
        ssrRenderList(blogDataSearch.value.slice().reverse(), (blog_item, index) => {
          _push(`<div class="allposts-post-row" data-v-f98ed6e8><a${ssrRenderAttr("href", "/blog/" + blog_item.slug)} data-v-f98ed6e8>`);
          if (!isSSR.value && blog_item.image) {
            _push(`<div data-v-f98ed6e8><img class="blog-list-img"${ssrRenderAttr("src", unref(directus).url.href + "assets/" + blog_item.image.id + "?width=300")} loading="lazy" data-v-f98ed6e8></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="allposts-post-details" data-v-f98ed6e8><h3 data-v-f98ed6e8>${ssrInterpolate(blog_item.title)}</h3><p class="post-date" data-v-f98ed6e8>Published on ${ssrInterpolate(formatDateOnly(new Date(blog_item.date)))}</p><div class="author-list" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(blog_item.authors.length > 0 ? "By" : "")}</p><!--[-->`);
          ssrRenderList(blog_item.authors, (author, i) => {
            _push(`<div class="author-item" data-v-f98ed6e8><div class="author-details" data-v-f98ed6e8><p class="author-name" data-v-f98ed6e8>${ssrInterpolate(author.team_id.First_Name)} ${ssrInterpolate(author.team_id.Last_Name)}</p>`);
            if (blog_item.authors.length > 1 && i < blog_item.authors.length - 1) {
              _push(`<p class="author-name" data-v-f98ed6e8>and</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></div></a></div>`);
        });
        _push(`<!--]--><a href="/all-blog-posts" class="btn btn-small btn-primary" data-v-f98ed6e8>Read All Posts</a></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(FooterComponent, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/blog-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const BlogPage = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-f98ed6e8"]]);
const _sfc_main = /* @__PURE__ */ defineComponent$1({
  __name: "all-blog-posts",
  __ssrInlineRender: true,
  setup(__props) {
    var _a;
    const directus = le("https://content.thegovlab.com").with(Fu());
    const route = typeof window !== "undefined" ? useRoute$1() : ref(null);
    const searchResultsFlag = ref(0);
    ref([]);
    const searchTerm = ref("");
    const searchTermDisplay = ref("");
    const debounceSearch = ref(null);
    const searchloader = ref(false);
    ref(false);
    ref(0);
    ref("");
    ref(0);
    ref(1);
    ref(2);
    ref(0);
    const blogData = ref([]);
    const blogDataSearch = ref([]);
    const modalData = ref([]);
    ref([]);
    ref(true);
    const showmodal = ref(false);
    ref(typeof window !== "undefined" ? (_a = route.value) == null ? void 0 : _a.fullPath : "");
    ref(1);
    ref(7e3);
    ref("");
    ref(false);
    ref(true);
    watch(
      () => {
        var _a2;
        return typeof window !== "undefined" ? (_a2 = route.value) == null ? void 0 : _a2.fullPath : "";
      },
      () => {
        loadModal();
      },
      { deep: true, immediate: true }
    );
    onMounted(() => {
      loadModal();
      fetchBlog();
      resetSearch();
      fillMeta();
      register();
    });
    debounceSearch.value = _.debounce(searchBlog, 500);
    function searchBlog() {
      searchloader.value = true;
      let searchTArray = searchTerm.value.split(" ");
      searchTArray = searchTArray.filter((item) => item);
      const searchObj = [];
      searchTArray.forEach((a) => {
        searchObj.push({ excerpt: { _contains: a } });
        searchObj.push({ title: { _contains: a } });
        searchObj.push({ content: { _contains: a } });
        searchObj.push({ authors: { team_id: { First_Name: { _contains: a } } } });
        searchObj.push({ authors: { team_id: { Last_Name: { _contains: a } } } });
        searchObj.push({ authors: { team_id: { Title: { _contains: a } } } });
      });
      if (searchTerm.value) {
        searchResultsFlag.value = 1;
      } else {
        searchResultsFlag.value = 0;
      }
      directus.request(
        Gs("reboot_democracy_blog", {
          limit: -1,
          filter: {
            _and: [
              { date: { _lte: "$NOW(-5 hours)" } },
              { status: { _eq: "published" } }
            ],
            _or: searchObj
          },
          sort: ["date"],
          fields: [
            "*.*",
            "authors.team_id.*",
            "authors.team_id.Headshot.*"
          ]
        })
      ).then((response) => {
        blogDataSearch.value = response;
        searchloader.value = false;
      }).catch((err) => {
        console.error("Error in searchBlog:", err);
        searchloader.value = false;
      });
    }
    function resetSearch() {
      blogDataSearch.value = [];
      searchResultsFlag.value = 0;
      searchTermDisplay.value = searchTerm.value;
      searchBlog();
    }
    function fillMeta() {
      useHead({
        title: "RebootDemocracy.AI",
        meta: [
          { name: "title", content: "RebootDemocracy.AI" },
          { property: "og:title", content: "RebootDemocracy.AI" },
          {
            property: "og:description",
            content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`
          },
          {
            property: "og:image",
            content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"
          },
          { property: "twitter:title", content: "RebootDemocracy.AI" },
          {
            property: "twitter:description",
            content: `RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`
          },
          {
            property: "twitter:image",
            content: "https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"
          },
          { property: "twitter:card", content: "summary_large_image" }
        ]
      });
    }
    function loadModal() {
      directus.request(
        Gs("innovate_us_modal", {
          meta: "total_count",
          limit: -1,
          fields: ["*.*"]
        })
      ).then((item) => {
        var _a2, _b, _c, _d;
        modalData.value = Array.isArray(item.data) ? item.data[0] : item.data;
        if (typeof window !== "undefined") {
          const campaignName = ((_b = (_a2 = modalData.value) == null ? void 0 : _a2.campaigns) == null ? void 0 : _b.campaign_name) || "ModalCampaign";
          const alreadyOff = localStorage.getItem(campaignName) === "off";
          showmodal.value = ((_c = modalData.value) == null ? void 0 : _c.status) === "published" && !alreadyOff;
        } else {
          showmodal.value = ((_d = modalData.value) == null ? void 0 : _d.status) === "published";
        }
      }).catch((err) => {
        console.error("Error loading modal:", err);
      });
    }
    function formatDateOnly(d1) {
      return format$1(d1, "MMMM d, yyyy");
    }
    function fetchBlog() {
      directus.request(
        Gs("reboot_democracy_blog", {
          meta: "total_count",
          limit: 50,
          filter: {
            status: { _eq: "published" }
          },
          fields: [
            "*.*",
            "authors.team_id.*",
            "authors.team_id.Headshot.*"
          ],
          sort: ["date"]
        })
      ).then((response) => {
        blogData.value = response;
        console.log("Fetched blogData:", blogData.value);
      }).catch((err) => {
        console.error("Error fetching blog data:", err);
      });
    }
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeaderComponent, null, null, _parent));
      _push(`<div class="blog-page-hero" data-v-a78956cc><h1 class="eyebrow" data-v-a78956cc>Reboot Democracy</h1><h1 data-v-a78956cc>All Posts</h1><div class="search-bar-section" data-v-a78956cc><input class="search-bar"${ssrRenderAttr("value", searchTerm.value)} type="text" placeholder="SEARCH" data-v-a78956cc><span type="submit" class="search-bar-cancel-btn material-symbols-outlined" data-v-a78956cc> cancel </span><span type="submit" class="search-bar-btn material-symbols-outlined" data-v-a78956cc> search </span></div><a href="/signup" class="btn btn-small btn-primary" data-v-a78956cc>Sign up</a></div>`);
      if (searchloader.value) {
        _push(`<div class="loader" data-v-a78956cc></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="blog-section-header" data-v-a78956cc>`);
      if (searchResultsFlag.value && searchTerm.value != "") {
        _push(`<h2 data-v-a78956cc> Searching for <i data-v-a78956cc>${ssrInterpolate(searchTermDisplay.value)}</i></h2>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="allposts-section" data-v-a78956cc>`);
      if (blogDataSearch.value) {
        _push(`<!--[-->`);
        ssrRenderList(blogDataSearch.value.slice().reverse(), (blog_item, index) => {
          _push(`<div class="allposts-post-row" data-v-a78956cc><a${ssrRenderAttr("href", "/blog/" + blog_item.slug)} data-v-a78956cc><div class="allposts-post-details" data-v-a78956cc><h3 data-v-a78956cc>${ssrInterpolate(blog_item.title)}</h3><p class="post-date" data-v-a78956cc> Published on ${ssrInterpolate(formatDateOnly(new Date(blog_item.date)))}</p><div class="author-list" data-v-a78956cc><p class="author-name" data-v-a78956cc>${ssrInterpolate(blog_item.authors.length > 0 ? "By" : "")}</p><!--[-->`);
          ssrRenderList(blog_item.authors, (author, i) => {
            _push(`<div class="author-item" data-v-a78956cc><div class="author-details" data-v-a78956cc><p class="author-name" data-v-a78956cc>${ssrInterpolate(author.team_id.First_Name)} ${ssrInterpolate(author.team_id.Last_Name)}</p>`);
            if (blog_item.authors.length > 1 && i < blog_item.authors.length - 1) {
              _push(`<p class="author-name" data-v-a78956cc> and </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></div>`);
          if (blog_item.image) {
            _push(`<img class="blog-list-img"${ssrRenderAttr(
              "src",
              "https://content.thegovlab.com/assets/" + blog_item.image.id + "?width=300"
            )} data-v-a78956cc>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</a></div>`);
        });
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><!--]-->`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/all-blog-posts.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const AllPosts = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-a78956cc"]]);
const routes = [
  { path: "/", component: BlogPage },
  { path: "/about", component: Home },
  { path: "/events", component: Events },
  { path: "/our-writing", component: Writing },
  { path: "/our-research", component: Research },
  { path: "/our-teaching", component: Teaching },
  { path: "/our-engagements", component: Engagement },
  { path: "/more-resources", component: Resources },
  { path: "/events/reboot-democracy", redirect: "/events?Reboot%20Democracy%20Lecture%20Series" },
  // { path:"/team", component:Team },
  // { path:"/signup", component:Signup },
  // { path:"/blog/:name", component: BlogPost, props:true },
  { path: "/blog", component: BlogPage },
  { path: "/all-blog-posts", component: AllPosts },
  // { path:"/pschat", component: PSChat },
  { path: "/:catchAll(.*)", redirect: "/" }
];
const router = createRouter({
  history: createWebHistory(),
  base: "./",
  routes
});
const firstDay = {
  "001": 1,
  AD: 1,
  AE: 6,
  AF: 6,
  AG: 0,
  AI: 1,
  AL: 1,
  AM: 1,
  AN: 1,
  AR: 1,
  AS: 0,
  AT: 1,
  AU: 1,
  AX: 1,
  AZ: 1,
  BA: 1,
  BD: 0,
  BE: 1,
  BG: 1,
  BH: 6,
  BM: 1,
  BN: 1,
  BR: 0,
  BS: 0,
  BT: 0,
  BW: 0,
  BY: 1,
  BZ: 0,
  CA: 0,
  CH: 1,
  CL: 1,
  CM: 1,
  CN: 1,
  CO: 0,
  CR: 1,
  CY: 1,
  CZ: 1,
  DE: 1,
  DJ: 6,
  DK: 1,
  DM: 0,
  DO: 0,
  DZ: 6,
  EC: 1,
  EE: 1,
  EG: 6,
  ES: 1,
  ET: 0,
  FI: 1,
  FJ: 1,
  FO: 1,
  FR: 1,
  GB: 1,
  "GB-alt-variant": 0,
  GE: 1,
  GF: 1,
  GP: 1,
  GR: 1,
  GT: 0,
  GU: 0,
  HK: 0,
  HN: 0,
  HR: 1,
  HU: 1,
  ID: 0,
  IE: 1,
  IL: 0,
  IN: 0,
  IQ: 6,
  IR: 6,
  IS: 1,
  IT: 1,
  JM: 0,
  JO: 6,
  JP: 0,
  KE: 0,
  KG: 1,
  KH: 0,
  KR: 0,
  KW: 6,
  KZ: 1,
  LA: 0,
  LB: 1,
  LI: 1,
  LK: 1,
  LT: 1,
  LU: 1,
  LV: 1,
  LY: 6,
  MC: 1,
  MD: 1,
  ME: 1,
  MH: 0,
  MK: 1,
  MM: 0,
  MN: 1,
  MO: 0,
  MQ: 1,
  MT: 0,
  MV: 5,
  MX: 0,
  MY: 1,
  MZ: 0,
  NI: 0,
  NL: 1,
  NO: 1,
  NP: 0,
  NZ: 1,
  OM: 6,
  PA: 0,
  PE: 0,
  PH: 0,
  PK: 0,
  PL: 1,
  PR: 0,
  PT: 0,
  PY: 0,
  QA: 6,
  RE: 1,
  RO: 1,
  RS: 1,
  RU: 1,
  SA: 0,
  SD: 6,
  SE: 1,
  SG: 0,
  SI: 1,
  SK: 1,
  SM: 1,
  SV: 0,
  SY: 6,
  TH: 0,
  TJ: 1,
  TM: 1,
  TR: 1,
  TT: 0,
  TW: 0,
  UA: 1,
  UM: 0,
  US: 0,
  UY: 1,
  UZ: 1,
  VA: 1,
  VE: 0,
  VI: 0,
  VN: 1,
  WS: 0,
  XK: 1,
  YE: 0,
  ZA: 0,
  ZW: 0
};
function getWeekArray(date2, locale, firstDayOfWeek) {
  const weeks = [];
  let currentWeek = [];
  const firstDayOfMonth = startOfMonth(date2);
  const lastDayOfMonth = endOfMonth(date2);
  const first = firstDayOfWeek ?? firstDay[locale.slice(-2).toUpperCase()] ?? 0;
  const firstDayWeekIndex = (firstDayOfMonth.getDay() - first + 7) % 7;
  const lastDayWeekIndex = (lastDayOfMonth.getDay() - first + 7) % 7;
  for (let i = 0; i < firstDayWeekIndex; i++) {
    const adjacentDay = new Date(firstDayOfMonth);
    adjacentDay.setDate(adjacentDay.getDate() - (firstDayWeekIndex - i));
    currentWeek.push(adjacentDay);
  }
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const day = new Date(date2.getFullYear(), date2.getMonth(), i);
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  for (let i = 1; i < 7 - lastDayWeekIndex; i++) {
    const adjacentDay = new Date(lastDayOfMonth);
    adjacentDay.setDate(adjacentDay.getDate() + i);
    currentWeek.push(adjacentDay);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  return weeks;
}
function startOfWeek(date2, locale, firstDayOfWeek) {
  const day = firstDayOfWeek ?? firstDay[locale.slice(-2).toUpperCase()] ?? 0;
  const d = new Date(date2);
  while (d.getDay() !== day) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}
function endOfWeek(date2, locale) {
  const d = new Date(date2);
  const lastDay = ((firstDay[locale.slice(-2).toUpperCase()] ?? 0) + 6) % 7;
  while (d.getDay() !== lastDay) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}
function startOfMonth(date2) {
  return new Date(date2.getFullYear(), date2.getMonth(), 1);
}
function endOfMonth(date2) {
  return new Date(date2.getFullYear(), date2.getMonth() + 1, 0);
}
function parseLocalDate(value) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}
const _YYYMMDD = /^([12]\d{3}-([1-9]|0[1-9]|1[0-2])-([1-9]|0[1-9]|[12]\d|3[01]))$/;
function date(value) {
  if (value == null) return /* @__PURE__ */ new Date();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    let parsed;
    if (_YYYMMDD.test(value)) {
      return parseLocalDate(value);
    } else {
      parsed = Date.parse(value);
    }
    if (!isNaN(parsed)) return new Date(parsed);
  }
  return null;
}
const sundayJanuarySecond2000 = new Date(2e3, 0, 2);
function getWeekdays(locale, firstDayOfWeek) {
  const daysFromSunday = firstDayOfWeek ?? firstDay[locale.slice(-2).toUpperCase()] ?? 0;
  return createRange(7).map((i) => {
    const weekday = new Date(sundayJanuarySecond2000);
    weekday.setDate(sundayJanuarySecond2000.getDate() + daysFromSunday + i);
    return new Intl.DateTimeFormat(locale, {
      weekday: "narrow"
    }).format(weekday);
  });
}
function format(value, formatString, locale, formats) {
  const newDate = date(value) ?? /* @__PURE__ */ new Date();
  const customFormat = formats == null ? void 0 : formats[formatString];
  if (typeof customFormat === "function") {
    return customFormat(newDate, formatString, locale);
  }
  let options = {};
  switch (formatString) {
    case "fullDate":
      options = {
        year: "numeric",
        month: "long",
        day: "numeric"
      };
      break;
    case "fullDateWithWeekday":
      options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      };
      break;
    case "normalDate":
      const day = newDate.getDate();
      const month = new Intl.DateTimeFormat(locale, {
        month: "long"
      }).format(newDate);
      return `${day} ${month}`;
    case "normalDateWithWeekday":
      options = {
        weekday: "short",
        day: "numeric",
        month: "short"
      };
      break;
    case "shortDate":
      options = {
        month: "short",
        day: "numeric"
      };
      break;
    case "year":
      options = {
        year: "numeric"
      };
      break;
    case "month":
      options = {
        month: "long"
      };
      break;
    case "monthShort":
      options = {
        month: "short"
      };
      break;
    case "monthAndYear":
      options = {
        month: "long",
        year: "numeric"
      };
      break;
    case "monthAndDate":
      options = {
        month: "long",
        day: "numeric"
      };
      break;
    case "weekday":
      options = {
        weekday: "long"
      };
      break;
    case "weekdayShort":
      options = {
        weekday: "short"
      };
      break;
    case "dayOfMonth":
      return new Intl.NumberFormat(locale).format(newDate.getDate());
    case "hours12h":
      options = {
        hour: "numeric",
        hour12: true
      };
      break;
    case "hours24h":
      options = {
        hour: "numeric",
        hour12: false
      };
      break;
    case "minutes":
      options = {
        minute: "numeric"
      };
      break;
    case "seconds":
      options = {
        second: "numeric"
      };
      break;
    case "fullTime":
      options = {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
      };
      break;
    case "fullTime12h":
      options = {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
      };
      break;
    case "fullTime24h":
      options = {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      };
      break;
    case "fullDateTime":
      options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
      };
      break;
    case "fullDateTime12h":
      options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
      };
      break;
    case "fullDateTime24h":
      options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      };
      break;
    case "keyboardDate":
      options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      };
      break;
    case "keyboardDateTime":
      options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      };
      break;
    case "keyboardDateTime12h":
      options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true
      };
      break;
    case "keyboardDateTime24h":
      options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
      };
      break;
    default:
      options = customFormat ?? {
        timeZone: "UTC",
        timeZoneName: "short"
      };
  }
  return new Intl.DateTimeFormat(locale, options).format(newDate);
}
function toISO(adapter, value) {
  const date2 = adapter.toJsDate(value);
  const year = date2.getFullYear();
  const month = padStart(String(date2.getMonth() + 1), 2, "0");
  const day = padStart(String(date2.getDate()), 2, "0");
  return `${year}-${month}-${day}`;
}
function parseISO(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function addMinutes(date2, amount) {
  const d = new Date(date2);
  d.setMinutes(d.getMinutes() + amount);
  return d;
}
function addHours(date2, amount) {
  const d = new Date(date2);
  d.setHours(d.getHours() + amount);
  return d;
}
function addDays(date2, amount) {
  const d = new Date(date2);
  d.setDate(d.getDate() + amount);
  return d;
}
function addWeeks(date2, amount) {
  const d = new Date(date2);
  d.setDate(d.getDate() + amount * 7);
  return d;
}
function addMonths(date2, amount) {
  const d = new Date(date2);
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  return d;
}
function getYear(date2) {
  return date2.getFullYear();
}
function getMonth(date2) {
  return date2.getMonth();
}
function getDate(date2) {
  return date2.getDate();
}
function getNextMonth(date2) {
  return new Date(date2.getFullYear(), date2.getMonth() + 1, 1);
}
function getPreviousMonth(date2) {
  return new Date(date2.getFullYear(), date2.getMonth() - 1, 1);
}
function getHours(date2) {
  return date2.getHours();
}
function getMinutes(date2) {
  return date2.getMinutes();
}
function startOfYear(date2) {
  return new Date(date2.getFullYear(), 0, 1);
}
function endOfYear(date2) {
  return new Date(date2.getFullYear(), 11, 31);
}
function isWithinRange(date2, range) {
  return isAfter(date2, range[0]) && isBefore(date2, range[1]);
}
function isValid(date2) {
  const d = new Date(date2);
  return d instanceof Date && !isNaN(d.getTime());
}
function isAfter(date2, comparing) {
  return date2.getTime() > comparing.getTime();
}
function isAfterDay(date2, comparing) {
  return isAfter(startOfDay(date2), startOfDay(comparing));
}
function isBefore(date2, comparing) {
  return date2.getTime() < comparing.getTime();
}
function isEqual(date2, comparing) {
  return date2.getTime() === comparing.getTime();
}
function isSameDay(date2, comparing) {
  return date2.getDate() === comparing.getDate() && date2.getMonth() === comparing.getMonth() && date2.getFullYear() === comparing.getFullYear();
}
function isSameMonth(date2, comparing) {
  return date2.getMonth() === comparing.getMonth() && date2.getFullYear() === comparing.getFullYear();
}
function isSameYear(date2, comparing) {
  return date2.getFullYear() === comparing.getFullYear();
}
function getDiff(date2, comparing, unit) {
  const d = new Date(date2);
  const c = new Date(comparing);
  switch (unit) {
    case "years":
      return d.getFullYear() - c.getFullYear();
    case "quarters":
      return Math.floor((d.getMonth() - c.getMonth() + (d.getFullYear() - c.getFullYear()) * 12) / 4);
    case "months":
      return d.getMonth() - c.getMonth() + (d.getFullYear() - c.getFullYear()) * 12;
    case "weeks":
      return Math.floor((d.getTime() - c.getTime()) / (1e3 * 60 * 60 * 24 * 7));
    case "days":
      return Math.floor((d.getTime() - c.getTime()) / (1e3 * 60 * 60 * 24));
    case "hours":
      return Math.floor((d.getTime() - c.getTime()) / (1e3 * 60 * 60));
    case "minutes":
      return Math.floor((d.getTime() - c.getTime()) / (1e3 * 60));
    case "seconds":
      return Math.floor((d.getTime() - c.getTime()) / 1e3);
    default: {
      return d.getTime() - c.getTime();
    }
  }
}
function setHours(date2, count) {
  const d = new Date(date2);
  d.setHours(count);
  return d;
}
function setMinutes(date2, count) {
  const d = new Date(date2);
  d.setMinutes(count);
  return d;
}
function setMonth(date2, count) {
  const d = new Date(date2);
  d.setMonth(count);
  return d;
}
function setDate(date2, day) {
  const d = new Date(date2);
  d.setDate(day);
  return d;
}
function setYear(date2, year) {
  const d = new Date(date2);
  d.setFullYear(year);
  return d;
}
function startOfDay(date2) {
  return new Date(date2.getFullYear(), date2.getMonth(), date2.getDate(), 0, 0, 0, 0);
}
function endOfDay(date2) {
  return new Date(date2.getFullYear(), date2.getMonth(), date2.getDate(), 23, 59, 59, 999);
}
class VuetifyDateAdapter {
  constructor(options) {
    this.locale = options.locale;
    this.formats = options.formats;
  }
  date(value) {
    return date(value);
  }
  toJsDate(date2) {
    return date2;
  }
  toISO(date2) {
    return toISO(this, date2);
  }
  parseISO(date2) {
    return parseISO(date2);
  }
  addMinutes(date2, amount) {
    return addMinutes(date2, amount);
  }
  addHours(date2, amount) {
    return addHours(date2, amount);
  }
  addDays(date2, amount) {
    return addDays(date2, amount);
  }
  addWeeks(date2, amount) {
    return addWeeks(date2, amount);
  }
  addMonths(date2, amount) {
    return addMonths(date2, amount);
  }
  getWeekArray(date2, firstDayOfWeek) {
    return getWeekArray(date2, this.locale, firstDayOfWeek ? Number(firstDayOfWeek) : void 0);
  }
  startOfWeek(date2, firstDayOfWeek) {
    return startOfWeek(date2, this.locale, firstDayOfWeek ? Number(firstDayOfWeek) : void 0);
  }
  endOfWeek(date2) {
    return endOfWeek(date2, this.locale);
  }
  startOfMonth(date2) {
    return startOfMonth(date2);
  }
  endOfMonth(date2) {
    return endOfMonth(date2);
  }
  format(date2, formatString) {
    return format(date2, formatString, this.locale, this.formats);
  }
  isEqual(date2, comparing) {
    return isEqual(date2, comparing);
  }
  isValid(date2) {
    return isValid(date2);
  }
  isWithinRange(date2, range) {
    return isWithinRange(date2, range);
  }
  isAfter(date2, comparing) {
    return isAfter(date2, comparing);
  }
  isAfterDay(date2, comparing) {
    return isAfterDay(date2, comparing);
  }
  isBefore(date2, comparing) {
    return !isAfter(date2, comparing) && !isEqual(date2, comparing);
  }
  isSameDay(date2, comparing) {
    return isSameDay(date2, comparing);
  }
  isSameMonth(date2, comparing) {
    return isSameMonth(date2, comparing);
  }
  isSameYear(date2, comparing) {
    return isSameYear(date2, comparing);
  }
  setMinutes(date2, count) {
    return setMinutes(date2, count);
  }
  setHours(date2, count) {
    return setHours(date2, count);
  }
  setMonth(date2, count) {
    return setMonth(date2, count);
  }
  setDate(date2, day) {
    return setDate(date2, day);
  }
  setYear(date2, year) {
    return setYear(date2, year);
  }
  getDiff(date2, comparing, unit) {
    return getDiff(date2, comparing, unit);
  }
  getWeekdays(firstDayOfWeek) {
    return getWeekdays(this.locale, firstDayOfWeek ? Number(firstDayOfWeek) : void 0);
  }
  getYear(date2) {
    return getYear(date2);
  }
  getMonth(date2) {
    return getMonth(date2);
  }
  getDate(date2) {
    return getDate(date2);
  }
  getNextMonth(date2) {
    return getNextMonth(date2);
  }
  getPreviousMonth(date2) {
    return getPreviousMonth(date2);
  }
  getHours(date2) {
    return getHours(date2);
  }
  getMinutes(date2) {
    return getMinutes(date2);
  }
  startOfDay(date2) {
    return startOfDay(date2);
  }
  endOfDay(date2) {
    return endOfDay(date2);
  }
  startOfYear(date2) {
    return startOfYear(date2);
  }
  endOfYear(date2) {
    return endOfYear(date2);
  }
}
const DateOptionsSymbol = Symbol.for("vuetify:date-options");
const DateAdapterSymbol = Symbol.for("vuetify:date-adapter");
function createDate(options, locale) {
  const _options = mergeDeep({
    adapter: VuetifyDateAdapter,
    locale: {
      af: "af-ZA",
      // ar: '', # not the same value for all variants
      bg: "bg-BG",
      ca: "ca-ES",
      ckb: "",
      cs: "cs-CZ",
      de: "de-DE",
      el: "el-GR",
      en: "en-US",
      // es: '', # not the same value for all variants
      et: "et-EE",
      fa: "fa-IR",
      fi: "fi-FI",
      // fr: '', #not the same value for all variants
      hr: "hr-HR",
      hu: "hu-HU",
      he: "he-IL",
      id: "id-ID",
      it: "it-IT",
      ja: "ja-JP",
      ko: "ko-KR",
      lv: "lv-LV",
      lt: "lt-LT",
      nl: "nl-NL",
      no: "no-NO",
      pl: "pl-PL",
      pt: "pt-PT",
      ro: "ro-RO",
      ru: "ru-RU",
      sk: "sk-SK",
      sl: "sl-SI",
      srCyrl: "sr-SP",
      srLatn: "sr-SP",
      sv: "sv-SE",
      th: "th-TH",
      tr: "tr-TR",
      az: "az-AZ",
      uk: "uk-UA",
      vi: "vi-VN",
      zhHans: "zh-CN",
      zhHant: "zh-TW"
    }
  }, options);
  return {
    options: _options,
    instance: createInstance(_options, locale)
  };
}
function createInstance(options, locale) {
  const instance = reactive(typeof options.adapter === "function" ? new options.adapter({
    locale: options.locale[locale.current.value] ?? locale.current.value,
    formats: options.formats
  }) : options.adapter);
  watch(locale.current, (value) => {
    instance.locale = options.locale[value] ?? value ?? instance.locale;
  });
  return instance;
}
const GoToSymbol = Symbol.for("vuetify:goto");
function genDefaults() {
  return {
    container: void 0,
    duration: 300,
    layout: false,
    offset: 0,
    easing: "easeInOutCubic",
    patterns: {
      linear: (t) => t,
      easeInQuad: (t) => t ** 2,
      easeOutQuad: (t) => t * (2 - t),
      easeInOutQuad: (t) => t < 0.5 ? 2 * t ** 2 : -1 + (4 - 2 * t) * t,
      easeInCubic: (t) => t ** 3,
      easeOutCubic: (t) => --t ** 3 + 1,
      easeInOutCubic: (t) => t < 0.5 ? 4 * t ** 3 : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      easeInQuart: (t) => t ** 4,
      easeOutQuart: (t) => 1 - --t ** 4,
      easeInOutQuart: (t) => t < 0.5 ? 8 * t ** 4 : 1 - 8 * --t ** 4,
      easeInQuint: (t) => t ** 5,
      easeOutQuint: (t) => 1 + --t ** 5,
      easeInOutQuint: (t) => t < 0.5 ? 16 * t ** 5 : 1 + 16 * --t ** 5
    }
  };
}
function createGoTo(options, locale) {
  return {
    rtl: locale.isRtl,
    options: mergeDeep(genDefaults(), options)
  };
}
function createVuetify() {
  let vuetify2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    blueprint,
    ...rest
  } = vuetify2;
  const options = mergeDeep(blueprint, rest);
  const {
    aliases: aliases2 = {},
    components = {},
    directives = {}
  } = options;
  const defaults = createDefaults(options.defaults);
  const display = createDisplay(options.display, options.ssr);
  const theme = createTheme(options.theme);
  const icons = createIcons(options.icons);
  const locale = createLocale(options.locale);
  const date2 = createDate(options.date, locale);
  const goTo = createGoTo(options.goTo, locale);
  const install = (app) => {
    for (const key in directives) {
      app.directive(key, directives[key]);
    }
    for (const key in components) {
      app.component(key, components[key]);
    }
    for (const key in aliases2) {
      app.component(key, defineComponent({
        ...aliases2[key],
        name: key,
        aliasName: aliases2[key].name
      }));
    }
    theme.install(app);
    app.provide(DefaultsSymbol, defaults);
    app.provide(DisplaySymbol, display);
    app.provide(ThemeSymbol, theme);
    app.provide(IconSymbol, icons);
    app.provide(LocaleSymbol, locale);
    app.provide(DateOptionsSymbol, date2.options);
    app.provide(DateAdapterSymbol, date2.instance);
    app.provide(GoToSymbol, goTo);
    if (IN_BROWSER && options.ssr) {
      if (app.$nuxt) {
        app.$nuxt.hook("app:suspense:resolve", () => {
          display.update();
        });
      } else {
        const {
          mount
        } = app;
        app.mount = function() {
          const vm = mount(...arguments);
          nextTick(() => display.update());
          app.mount = mount;
          return vm;
        };
      }
    }
    getUid.reset();
    {
      app.mixin({
        computed: {
          $vuetify() {
            return reactive({
              defaults: inject.call(this, DefaultsSymbol),
              display: inject.call(this, DisplaySymbol),
              theme: inject.call(this, ThemeSymbol),
              icons: inject.call(this, IconSymbol),
              locale: inject.call(this, LocaleSymbol),
              date: inject.call(this, DateAdapterSymbol)
            });
          }
        }
      });
    }
  };
  return {
    install,
    defaults,
    display,
    theme,
    icons,
    locale,
    date: date2,
    goTo
  };
}
const version = "3.7.4";
createVuetify.version = version;
function inject(key) {
  var _a, _b;
  const vm = this.$;
  const provides = ((_a = vm.parent) == null ? void 0 : _a.provides) ?? ((_b = vm.vnode.appContext) == null ? void 0 : _b.provides);
  if (provides && key in provides) {
    return provides[key];
  }
}
const vuetify = createVuetify({});
const createApp = ViteSSG(
  // Root component
  App,
  {
    // Pass the list of routes from your custom router to SSG
    routes: router.options.routes,
    base: "./"
  },
  (ctx) => {
    const head = createHead();
    ctx.app.use(head);
    ctx.app.use(vuetify);
    ctx.app.use(router);
    ctx.head = head;
  }
);
export {
  createApp
};
