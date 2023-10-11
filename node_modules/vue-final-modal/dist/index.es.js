import { ref as B, computed as V, watch as D, nextTick as Z, onBeforeUnmount as pe, reactive as fe, onMounted as Ae, defineComponent as re, inject as ne, toRef as qe, unref as v, withDirectives as ae, openBlock as L, createElementBlock as Y, normalizeClass as Ce, normalizeStyle as ge, withKeys as Je, withModifiers as Ve, createBlock as G, Transition as ke, mergeProps as U, toHandlers as Ee, withCtx as te, vShow as ue, createCommentVNode as $, createVNode as Fe, renderSlot as ve, createElementVNode as q, Teleport as Qe, normalizeProps as Re, guardReactiveProps as _e, getCurrentInstance as eo, shallowReactive as J, markRaw as _, useAttrs as oo, Fragment as no, renderList as Be, resolveDynamicComponent as de, createSlots as to } from "vue";
import { useEventListener as R, tryOnUnmounted as lo } from "@vueuse/core";
import { useFocusTrap as so } from "@vueuse/integrations/useFocusTrap";
const ro = (e) => (...o) => {
  e && (e == null || e(...o), e = null);
}, P = () => {
};
function Q(e, o, t) {
  return e > t ? t : e < o ? o : e;
}
const me = (e) => typeof e == "string", ye = {
  /**
   * @description An uniq name for the open/close a modal via vfm.open/vfm.close APIs.
   * @default `undefined`
   * @example Symbol: `Symbol('MyModal')`
   * @example String: `'AUniqString'`
   * @example Number: `300`
   */
  modalId: {
    type: [String, Number, Symbol],
    default: void 0
  },
  /**
   * @description Display the modal or not.
   * @default `undefined`
   * @example
   * ```js
   * const showModal = ref(false)
   * v-model="showModal"
   * ```
   */
  modelValue: {
    type: Boolean,
    default: void 0
  },
  /**
   * @description Render the modal via `if` or `show`.
   * @default `'if'`
   * @example
   * ```js
   * displayDirective: 'if'
   * ```
   * @example
   * ```js
   * displayDirective: 'show'
   * ```
   */
  displayDirective: {
    type: String,
    default: "if",
    validator: (e) => ["if", "show", "visible"].includes(e)
  },
  /**
   * @description Hide the overlay or not.
   * @default `undefined`
   * @example
   * ```js
   * hideOverlay="true"
   * ```
   */
  hideOverlay: {
    type: Boolean,
    default: void 0
  },
  /**
   * @description Customize the overlay transition.
   * @default `undefined`
   */
  overlayTransition: {
    type: [String, Object],
    default: void 0
  },
  /**
   * @description Customize the content transition.
   * @default `undefined`
   */
  contentTransition: {
    type: [String, Object],
    default: void 0
  },
  /**
   * @description Bind class to vfm__overlay.
   * @default `undefined`
   */
  overlayClass: {
    type: void 0,
    default: void 0
  },
  /**
   * @description Bind class to vfm__content.
   * @default `undefined`
   */
  contentClass: {
    type: void 0,
    default: void 0
  },
  /**
   * @description Bind style to vfm__overlay.
   * @default `undefined`
   */
  overlayStyle: {
    type: [String, Object, Array],
    default: void 0
  },
  /**
   * @description Bind style to vfm__content.
   * @default `undefined`
   */
  contentStyle: {
    type: [String, Object, Array],
    default: void 0
  },
  /**
   * @description Is it allow to close the modal by clicking the overlay.
   * @default `true`
   */
  clickToClose: {
    type: Boolean,
    default: !0
  },
  /**
   * @description Is it allow to close the modal by keypress `esc`.
   * @default `true`
   */
  escToClose: {
    type: Boolean,
    default: !0
  },
  /**
   * @description Is it allow to click outside of the vfm__content when the modal is opened
   * @default `'non-interactive'`
   */
  background: {
    type: String,
    default: "non-interactive",
    validator: (e) => ["interactive", "non-interactive"].includes(e)
  },
  /**
   * @description
   * * Use `{ disabled: true }` to disable the focusTrap.
   * * Checkout the createOptions type here https://github.com/focus-trap/focus-trap for more.
   * @default `{ allowOutsideClick: true }`
   */
  focusTrap: {
    type: [Boolean, Object],
    default: () => ({
      allowOutsideClick: !0
    })
  },
  /**
   * @description Lock body scroll or not when the modal is opened.
   * @default `true`
   */
  lockScroll: {
    type: Boolean,
    default: !0
  },
  /**
   * @description Creates a padding-right when scroll is locked to prevent the page from jumping
   * @default `true`
   */
  reserveScrollBarGap: {
    type: Boolean,
    default: !0
  },
  /**
   * @description Define how to increase the zIndex when there are nested modals
   * @default `({ index }) => 1000 + 2 * index`
   */
  zIndexFn: {
    type: Function,
    default: ({ index: e }) => 1e3 + 2 * e
  },
  /**
   * @description The direction of swiping to close the modal
   * @default `none`
   * @example
   * Set swipeToClose="none" to disable swiping to close
   * ```js
   * swipeToClose="none"
   * ```
   */
  swipeToClose: {
    type: String,
    default: "none",
    validator: (e) => ["none", "up", "right", "down", "left"].includes(e)
  },
  /**
   * @description Threshold for swipe to close
   * @default `0`
   */
  threshold: {
    type: Number,
    default: 0
  },
  /**
   * @description If set `:showSwipeBanner="true"`, only allow clicking `swipe-banner` slot to swipe to close
   * @default `undefined`
   * @example
   * ```js
   * swipeToClose="right"
   * :showSwipeBanner="true"
   * ```
   * ```html
   * <VueFinalModal
   *   ...
   *   swipeToClose="right"
   *   :showSwipeBanner="true"
   * >
   *   <template #swipe-banner>
   *     <div style="position: absolute; height: 100%; top: 0; left: 0; width: 10px;" />
   *   </template>
   *   ...modal content
   * </VueFinalModal>
   * ```
   */
  showSwipeBanner: {
    type: Boolean,
    default: void 0
  },
  /**
   * @description When set `:preventNavigationGestures="true"`, there will be two invisible bars for prevent navigation gestures including swiping back/forward on mobile webkit. For example: Safari mobile.
   * @default `undefined`
   * @example
   * Set preventNavigationGestures="true" to prevent Safari navigation gestures including swiping back/forward.
   * ```js
   * :preventNavigationGestures="true"
   * ```
   */
  preventNavigationGestures: {
    type: Boolean,
    default: void 0
  }
};
function Le(e = !1) {
  const o = B(e), t = B(o.value ? 0 : void 0);
  return [o, t, {
    beforeEnter() {
      t.value = 1;
    },
    afterEnter() {
      t.value = 0;
    },
    beforeLeave() {
      t.value = 3;
    },
    afterLeave() {
      t.value = 2;
    }
  }];
}
function io(e, o) {
  const { modelValueLocal: t, onEntering: s, onEnter: d, onLeaving: u, onLeave: r } = o, n = B(t.value), [l, a, y] = Le(n.value), [c, M, b] = Le(n.value), k = V(() => typeof e.contentTransition == "string" ? { name: e.contentTransition } : { ...e.contentTransition }), I = V(() => typeof e.overlayTransition == "string" ? { name: e.overlayTransition } : { ...e.overlayTransition }), E = V(
    () => (e.hideOverlay || M.value === 2) && a.value === 2
    /* Leave */
  );
  D(
    E,
    (C) => {
      C && (n.value = !1);
    }
  ), D(a, (C) => {
    if (C === 1) {
      if (!n.value)
        return;
      s == null || s();
    } else if (C === 0) {
      if (!n.value)
        return;
      d == null || d();
    } else
      C === 3 ? u == null || u() : C === 2 && (r == null || r());
  });
  async function T() {
    n.value = !0, await Z(), l.value = !0, c.value = !0;
  }
  function S() {
    l.value = !1, c.value = !1;
  }
  return {
    visible: n,
    contentVisible: l,
    contentListeners: y,
    contentTransition: k,
    overlayVisible: c,
    overlayListeners: b,
    overlayTransition: I,
    enterTransition: T,
    leaveTransition: S
  };
}
function ao(e, o, t) {
  const { vfmRootEl: s, vfmContentEl: d, visible: u, modelValueLocal: r } = t, n = B();
  function l() {
    u.value && e.escToClose && (r.value = !1);
  }
  function a(c) {
    n.value = c == null ? void 0 : c.target;
  }
  function y() {
    var c;
    n.value === s.value && (e.clickToClose ? r.value = !1 : ((c = d.value) == null || c.focus(), o("clickOutside")));
  }
  return {
    onEsc: l,
    onMouseupRoot: y,
    onMousedown: a
  };
}
function uo(e, o) {
  const t = B(!!e.modelValue);
  return D(() => e.modelValue, (s) => {
    t.value = !!s;
  }), D(t, (s) => {
    s !== e.modelValue && o("update:modelValue", s);
  }), {
    modelValueLocal: t
  };
}
function co(e, o) {
  if (e.focusTrap === !1)
    return {
      focus() {
      },
      blur() {
      }
    };
  const { focusEl: t } = o, { hasFocus: s, activate: d, deactivate: u } = so(t, e.focusTrap);
  function r() {
    requestAnimationFrame(() => {
      d();
    });
  }
  function n() {
    s.value && u();
  }
  return { focus: r, blur: n };
}
let he = !1;
if (typeof window < "u") {
  const e = {
    get passive() {
      he = !0;
    }
  };
  window.addEventListener("testPassive", null, e), window.removeEventListener("testPassive", null, e);
}
const xe = typeof window < "u" && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
let H = [], le = !1, ee = 0, He = -1, W, X;
const fo = (e) => {
  if (!e || e.nodeType !== Node.ELEMENT_NODE)
    return !1;
  const o = window.getComputedStyle(e);
  return ["auto", "scroll"].includes(o.overflowY) && e.scrollHeight > e.clientHeight;
}, vo = (e, o) => !(e.scrollTop === 0 && o < 0 || e.scrollTop + e.clientHeight + o >= e.scrollHeight && o > 0), po = (e) => {
  const o = [];
  for (; e; ) {
    if (o.push(e), e.classList.contains("vfm"))
      return o;
    e = e.parentElement;
  }
  return o;
}, mo = (e, o) => {
  let t = !1;
  return po(e).forEach((d) => {
    fo(d) && vo(d, o) && (t = !0);
  }), t;
}, Ne = (e) => H.some(() => mo(e, -ee)), se = (e) => {
  const o = e || window.event;
  return Ne(o.target) || o.touches.length > 1 ? !0 : (o.preventDefault && o.preventDefault(), !1);
}, yo = (e) => {
  if (X === void 0) {
    const o = !!e && e.reserveScrollBarGap === !0, t = window.innerWidth - document.documentElement.clientWidth;
    if (o && t > 0) {
      const s = parseInt(getComputedStyle(document.body).getPropertyValue("padding-right"), 10);
      X = document.body.style.paddingRight, document.body.style.paddingRight = `${s + t}px`;
    }
  }
  W === void 0 && (W = document.body.style.overflow, document.body.style.overflow = "hidden");
}, ho = () => {
  X !== void 0 && (document.body.style.paddingRight = X, X = void 0), W !== void 0 && (document.body.style.overflow = W, W = void 0);
}, wo = (e) => e ? e.scrollHeight - e.scrollTop <= e.clientHeight : !1, bo = (e, o) => (ee = e.targetTouches[0].clientY - He, Ne(e.target) ? !1 : o && o.scrollTop === 0 && ee > 0 || wo(o) && ee < 0 ? se(e) : (e.stopPropagation(), !0)), To = (e, o) => {
  if (!e) {
    console.error(
      "disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices."
    );
    return;
  }
  if (H.some((s) => s.targetElement === e))
    return;
  const t = {
    targetElement: e,
    options: o || {}
  };
  H = [...H, t], xe ? (e.ontouchstart = (s) => {
    s.targetTouches.length === 1 && (He = s.targetTouches[0].clientY);
  }, e.ontouchmove = (s) => {
    s.targetTouches.length === 1 && bo(s, e);
  }, le || (document.addEventListener("touchmove", se, he ? { passive: !1 } : void 0), le = !0)) : yo(o);
}, Mo = (e) => {
  if (!e) {
    console.error(
      "enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices."
    );
    return;
  }
  H = H.filter((o) => o.targetElement !== e), xe ? (e.ontouchstart = null, e.ontouchmove = null, le && H.length === 0 && (document.removeEventListener("touchmove", se, he ? { passive: !1 } : void 0), le = !1)) : H.length || ho();
};
function So(e, o) {
  const { lockScrollEl: t, modelValueLocal: s } = o;
  let d;
  D(t, (n) => {
    n && (d = n);
  }, { immediate: !0 }), D(() => e.lockScroll, (n) => {
    n ? r() : u();
  }), pe(() => {
    u();
  });
  function u() {
    d && Mo(d);
  }
  function r() {
    s.value && e.lockScroll && d && To(d, {
      reserveScrollBarGap: e.reserveScrollBarGap,
      allowTouchMove: (n) => {
        for (; n && n !== document.body; ) {
          if (n.getAttribute("vfm-scroll-lock-ignore") !== null)
            return !0;
          n = n.parentElement;
        }
        return !1;
      }
    });
  }
  return {
    enableBodyScroll: u,
    disableBodyScroll: r
  };
}
function Oo(e) {
  function o(t) {
    switch (t) {
      case "beforeOpen":
        e(t);
        break;
      case "beforeClose":
        e(t);
        break;
      case "opened":
        e(t);
        break;
      case "closed":
        e(t);
        break;
    }
  }
  return {
    emitEvent: o
  };
}
function Co(e) {
  const o = B();
  function t(d) {
    var u;
    o.value = (u = e.zIndexFn) == null ? void 0 : u.call(e, { index: d <= -1 ? 0 : d });
  }
  function s() {
    o.value = void 0;
  }
  return {
    zIndex: o,
    refreshZIndex: t,
    resetZIndex: s
  };
}
const ce = {
  beforeMount(e, { value: o }, { transition: t }) {
    e._vov = e.style.visibility === "hidden" ? "" : e.style.visibility, t && o ? t.beforeEnter(e) : z(e, o);
  },
  mounted(e, { value: o }, { transition: t }) {
    t && o && t.enter(e);
  },
  updated(e, { value: o, oldValue: t }, { transition: s }) {
    !o != !t && (s ? o ? (s.beforeEnter(e), z(e, !0), s.enter(e)) : s.leave(e, () => {
      z(e, !1);
    }) : z(e, o));
  },
  beforeUnmount(e, { value: o }) {
    z(e, o);
  }
};
function z(e, o) {
  e.style.visibility = o ? e._vov : "hidden";
}
const Ie = (e) => {
  if (e instanceof MouseEvent) {
    const { clientX: o, clientY: t } = e;
    return { x: o, y: t };
  } else {
    const { clientX: o, clientY: t } = e.targetTouches[0];
    return { x: o, y: t };
  }
};
function go(e) {
  if (!e)
    return !1;
  let o = !1;
  const t = {
    get passive() {
      return o = !0, !1;
    }
  };
  return e.addEventListener("x", P, t), e.removeEventListener("x", P), o;
}
function Vo(e, {
  threshold: o = 0,
  onSwipeStart: t,
  onSwipe: s,
  onSwipeEnd: d,
  passive: u = !0
}) {
  const r = fe({ x: 0, y: 0 }), n = fe({ x: 0, y: 0 }), l = V(() => r.x - n.x), a = V(() => r.y - n.y), { max: y, abs: c } = Math, M = V(
    () => y(c(l.value), c(a.value)) >= o
  ), b = B(!1), k = V(() => M.value ? c(l.value) > c(a.value) ? l.value > 0 ? "left" : "right" : a.value > 0 ? "up" : "down" : "none"), I = (p, h) => {
    r.x = p, r.y = h;
  }, E = (p, h) => {
    n.x = p, n.y = h;
  };
  let T, S;
  function C(p) {
    T.capture && !T.passive && p.preventDefault();
    const { x: h, y: F } = Ie(p);
    I(h, F), E(h, F), t == null || t(p), S = [
      R(e, "mousemove", N, T),
      R(e, "touchmove", N, T),
      R(e, "mouseup", i, T),
      R(e, "touchend", i, T),
      R(e, "touchcancel", i, T)
    ];
  }
  function N(p) {
    const { x: h, y: F } = Ie(p);
    E(h, F), !b.value && M.value && (b.value = !0), b.value && (s == null || s(p));
  }
  function i(p) {
    b.value && (d == null || d(p, k.value)), b.value = !1, S.forEach((h) => h());
  }
  let m = [];
  return Ae(() => {
    const p = go(window == null ? void 0 : window.document);
    u ? T = p ? { passive: !0 } : { capture: !1 } : T = p ? { passive: !1, capture: !0 } : { capture: !0 }, m = [
      R(e, "mousedown", C, T),
      R(e, "touchstart", C, T)
    ];
  }), {
    isSwiping: b,
    direction: k,
    coordsStart: r,
    coordsEnd: n,
    lengthX: l,
    lengthY: a,
    stop: () => {
      m.forEach((p) => p()), S.forEach((p) => p());
    }
  };
}
function ko(e, o) {
  const { vfmContentEl: t, modelValueLocal: s } = o, d = 0.1, u = 300, r = B(), n = V(() => {
    if (!(e.swipeToClose === void 0 || e.swipeToClose === "none"))
      return e.showSwipeBanner ? r.value : t.value;
  }), l = B(0), a = B(!0);
  let y = P, c = !0, M, b = !1;
  const { lengthX: k, lengthY: I, direction: E, isSwiping: T } = Vo(n, {
    threshold: e.threshold,
    onSwipeStart(i) {
      y = R(document, "selectionchange", () => {
        var m;
        a.value = (m = window.getSelection()) == null ? void 0 : m.isCollapsed;
      }), M = (/* @__PURE__ */ new Date()).getTime(), b = N(i == null ? void 0 : i.target);
    },
    onSwipe() {
      var i, m, g, p;
      if (b && a.value && E.value === e.swipeToClose) {
        if (E.value === "up") {
          const h = Q(Math.abs(I.value || 0), 0, ((i = n.value) == null ? void 0 : i.offsetHeight) || 0) - (e.threshold || 0);
          l.value = h;
        } else if (E.value === "down") {
          const h = Q(Math.abs(I.value || 0), 0, ((m = n.value) == null ? void 0 : m.offsetHeight) || 0) - (e.threshold || 0);
          l.value = -h;
        } else if (E.value === "right") {
          const h = Q(Math.abs(k.value || 0), 0, ((g = n.value) == null ? void 0 : g.offsetWidth) || 0) - (e.threshold || 0);
          l.value = -h;
        } else if (E.value === "left") {
          const h = Q(Math.abs(k.value || 0), 0, ((p = n.value) == null ? void 0 : p.offsetWidth) || 0) - (e.threshold || 0);
          l.value = h;
        }
      }
    },
    onSwipeEnd(i, m) {
      if (y(), !a.value) {
        a.value = !0;
        return;
      }
      const g = (/* @__PURE__ */ new Date()).getTime(), p = m === e.swipeToClose, h = (() => {
        var j, K;
        if (m === "up" || m === "down")
          return Math.abs((I == null ? void 0 : I.value) || 0) > d * (((j = n.value) == null ? void 0 : j.offsetHeight) || 0);
        if (m === "left" || m === "right")
          return Math.abs((k == null ? void 0 : k.value) || 0) > d * (((K = n.value) == null ? void 0 : K.offsetWidth) || 0);
      })(), F = g - M <= u;
      if (c && b && p && (h || F)) {
        s.value = !1;
        return;
      }
      l.value = 0;
    }
  }), S = V(() => {
    if (e.swipeToClose === "none")
      return;
    const i = (() => {
      switch (e.swipeToClose) {
        case "up":
        case "down":
          return "translateY";
        case "left":
        case "right":
          return "translateX";
      }
    })();
    return {
      class: { "vfm-bounce-back": !T.value },
      style: { transform: `${i}(${-l.value}px)` }
    };
  });
  D(
    () => a.value,
    (i) => {
      i || (l.value = 0);
    }
  ), D(
    () => s.value,
    (i) => {
      i && (l.value = 0);
    }
  ), D(
    () => l.value,
    (i, m) => {
      switch (e.swipeToClose) {
        case "down":
        case "right":
          c = i < m;
          break;
        case "up":
        case "left":
          c = i > m;
          break;
      }
    }
  );
  function C(i) {
    e.preventNavigationGestures && i.preventDefault();
  }
  function N(i) {
    const m = i == null ? void 0 : i.tagName;
    if (!m || ["INPUT", "TEXTAREA"].includes(m))
      return !1;
    const g = (() => {
      switch (e.swipeToClose) {
        case "up":
          return (i == null ? void 0 : i.scrollTop) + (i == null ? void 0 : i.clientHeight) === (i == null ? void 0 : i.scrollHeight);
        case "left":
          return (i == null ? void 0 : i.scrollLeft) + (i == null ? void 0 : i.clientWidth) === (i == null ? void 0 : i.scrollWidth);
        case "down":
          return (i == null ? void 0 : i.scrollTop) === 0;
        case "right":
          return (i == null ? void 0 : i.scrollLeft) === 0;
        default:
          return !1;
      }
    })();
    return i === n.value ? g : g && N(i == null ? void 0 : i.parentElement);
  }
  return {
    vfmContentEl: t,
    swipeBannerEl: r,
    bindSwipe: S,
    onTouchStartSwipeBanner: C
  };
}
const we = Symbol("vfm"), be = Symbol("internalVfm"), Eo = /* @__PURE__ */ re({
  __name: "CoreModal",
  props: ye,
  emits: ["update:modelValue", "beforeOpen", "opened", "beforeClose", "closed", "clickOutside"],
  setup(e, { emit: o }) {
    const t = e, { modals: s, openedModals: d } = ne(we, {
      modals: [],
      openedModals: []
    }), {
      openLastOverlay: u,
      moveToLastOpenedModals: r,
      deleteFromOpenedModals: n,
      moveToLastOpenedModalOverlays: l,
      deleteFromOpenedModalOverlays: a,
      deleteFromModals: y
    } = ne(be, {
      openLastOverlay: P,
      moveToLastOpenedModals: P,
      deleteFromOpenedModals: P,
      moveToLastOpenedModalOverlays: P,
      deleteFromOpenedModalOverlays: P,
      deleteFromModals: P
    }), c = B(), M = B(), { focus: b, blur: k } = co(t, { focusEl: c }), { zIndex: I, refreshZIndex: E, resetZIndex: T } = Co(t), { modelValueLocal: S } = uo(t, o), { enableBodyScroll: C, disableBodyScroll: N } = So(t, {
      lockScrollEl: c,
      modelValueLocal: S
    }), { emitEvent: i } = Oo(o);
    let m = P;
    const {
      visible: g,
      contentVisible: p,
      contentListeners: h,
      contentTransition: F,
      overlayVisible: j,
      overlayListeners: K,
      overlayTransition: je,
      enterTransition: Ye,
      leaveTransition: $e
    } = io(t, {
      modelValueLocal: S,
      onEntering() {
        Z(() => {
          N(), b();
        });
      },
      onEnter() {
        i("opened"), m("opened");
      },
      onLeave() {
        n(Xe()), T(), C(), i("closed"), m("closed");
      }
    }), { onEsc: ze, onMouseupRoot: Ge, onMousedown: Te } = ao(t, o, { vfmRootEl: c, vfmContentEl: M, visible: g, modelValueLocal: S }), {
      swipeBannerEl: Ue,
      bindSwipe: We,
      onTouchStartSwipeBanner: Me
    } = ko(t, { vfmContentEl: M, modelValueLocal: S }), Se = qe(t, "hideOverlay"), A = V(() => ({
      modalId: t.modalId,
      hideOverlay: Se,
      overlayVisible: j,
      focus: b,
      toggle(f) {
        return new Promise((w) => {
          m = ro((Ke) => w(Ke));
          const O = typeof f == "boolean" ? f : !S.value;
          S.value = O, o("update:modelValue", O);
        });
      }
    }));
    function Xe() {
      return A;
    }
    const ie = V(() => d.indexOf(A));
    D(() => [t.zIndexFn, ie.value], () => {
      g.value && E(ie.value);
    }), Ae(() => {
      s.push(A);
    }), S.value && Oe(), D(S, (f) => {
      f ? Oe() : Ze();
    });
    async function Oe() {
      i("beforeOpen"), r(A), l(A), E(ie.value), u(), Ye();
    }
    function Ze() {
      i("beforeClose"), a(A), u(), k(), $e();
    }
    return pe(() => {
      C(), y(A), n(A), a(A), k(), u();
    }), (f, w) => f.displayDirective !== "if" || v(g) ? ae((L(), Y("div", {
      key: 0,
      ref_key: "vfmRootEl",
      ref: c,
      class: Ce(["vfm vfm--fixed vfm--inset", { "vfm--prevent-none": f.background === "interactive" }]),
      style: ge({ zIndex: v(I) }),
      role: "dialog",
      "aria-modal": "true",
      onKeydown: w[7] || (w[7] = Je(() => v(ze)(), ["esc"])),
      onMouseup: w[8] || (w[8] = Ve(() => v(Ge)(), ["self"])),
      onMousedown: w[9] || (w[9] = Ve((O) => v(Te)(O), ["self"]))
    }, [
      Se.value ? $("", !0) : (L(), G(ke, U({ key: 0 }, v(je), { appear: !0 }, Ee(v(K))), {
        default: te(() => [
          f.displayDirective !== "if" || v(j) ? ae((L(), Y("div", {
            key: 0,
            class: Ce(["vfm__overlay vfm--overlay vfm--absolute vfm--inset vfm--prevent-none", f.overlayClass]),
            style: ge(f.overlayStyle),
            "aria-hidden": "true"
          }, null, 6)), [
            [ue, f.displayDirective !== "show" || v(j)],
            [v(ce), f.displayDirective !== "visible" || v(j)]
          ]) : $("", !0)
        ]),
        _: 1
      }, 16)),
      Fe(ke, U(v(F), { appear: !0 }, Ee(v(h))), {
        default: te(() => [
          f.displayDirective !== "if" || v(p) ? ae((L(), Y("div", U({
            key: 0,
            ref_key: "vfmContentEl",
            ref: M,
            class: ["vfm__content vfm--outline-none", [f.contentClass, { "vfm--prevent-auto": f.background === "interactive" }]],
            style: f.contentStyle,
            tabindex: "0"
          }, v(We), {
            onMousedown: w[6] || (w[6] = () => v(Te)())
          }), [
            ve(f.$slots, "default"),
            f.showSwipeBanner ? (L(), Y("div", {
              key: 0,
              ref_key: "swipeBannerEl",
              ref: Ue,
              class: "vfm-swipe-banner-container",
              onTouchstart: w[2] || (w[2] = (O) => v(Me)(O))
            }, [
              ve(f.$slots, "swipe-banner", {}, () => [
                q("div", {
                  class: "vfm-swipe-banner-back",
                  onTouchstart: w[0] || (w[0] = (O) => f.swipeToClose === "left" && O.preventDefault())
                }, null, 32),
                q("div", {
                  class: "vfm-swipe-banner-forward",
                  onTouchstart: w[1] || (w[1] = (O) => f.swipeToClose === "right" && O.preventDefault())
                }, null, 32)
              ])
            ], 544)) : !f.showSwipeBanner && f.preventNavigationGestures ? (L(), Y("div", {
              key: 1,
              class: "vfm-swipe-banner-container",
              onTouchstart: w[5] || (w[5] = (O) => v(Me)(O))
            }, [
              q("div", {
                class: "vfm-swipe-banner-back",
                onTouchstart: w[3] || (w[3] = (O) => f.swipeToClose === "left" && O.preventDefault())
              }, null, 32),
              q("div", {
                class: "vfm-swipe-banner-forward",
                onTouchstart: w[4] || (w[4] = (O) => f.swipeToClose === "right" && O.preventDefault())
              }, null, 32)
            ], 32)) : $("", !0)
          ], 16)), [
            [ue, f.displayDirective !== "show" || v(p)],
            [v(ce), f.displayDirective !== "visible" || v(p)]
          ]) : $("", !0)
        ]),
        _: 3
      }, 16)
    ], 38)), [
      [ue, f.displayDirective !== "show" || v(g)],
      [v(ce), f.displayDirective !== "visible" || v(g)]
    ]) : $("", !0);
  }
});
const Bo = {
  ...ye,
  /**
   * @description Set `null | false` to disable teleport.
   * @default `'body'`
   * @example
   * ```js
   * teleportTo: '#modals'
   * ```
   */
  teleportTo: {
    type: [String, null, Boolean, Object],
    default: "body"
  }
}, Lo = re({
  inheritAttrs: !1
}), Io = /* @__PURE__ */ re({
  ...Lo,
  __name: "VueFinalModal",
  props: Bo,
  emits: ["update:modelValue", "beforeOpen", "opened", "beforeClose", "closed", "clickOutside"],
  setup(e, { emit: o }) {
    const s = Ho({
      props: e,
      modalProps: ye,
      emit: o
    });
    return (d, u) => (L(), G(Qe, {
      to: d.teleportTo ? d.teleportTo : void 0,
      disabled: !d.teleportTo
    }, [
      Fe(Eo, Re(_e(v(s))), {
        default: te(() => [
          ve(d.$slots, "default")
        ]),
        _: 3
      }, 16)
    ], 8, ["to", "disabled"]));
  }
});
let x;
const Do = (e) => x = e, Po = () => eo() && ne(we) || x;
function zo() {
  const e = J([]), o = J([]), t = J([]), s = J([]), d = B([]), u = _({
    install(r) {
      r.provide(we, u), r.config.globalProperties.$vfm = u;
      const n = Ao(u);
      r.provide(be, n);
    },
    modals: e,
    openedModals: o,
    openedModalOverlays: t,
    dynamicModals: s,
    modalsContainers: d,
    get(r) {
      return e.find((n) => n.value.modalId && r === n.value.modalId);
    },
    toggle(r, n) {
      const l = u.get(r);
      return l == null ? void 0 : l.value.toggle(n);
    },
    open(r) {
      return u.toggle(r, !0);
    },
    close(r) {
      return u.toggle(r, !1);
    },
    closeAll() {
      return Promise.allSettled([o.map((r) => r.value.toggle(!1))]);
    }
  });
  return Do(u), u;
}
function Ao(e) {
  const { modals: o, openedModals: t, openedModalOverlays: s, dynamicModals: d } = e, u = {
    deleteFromModals(r) {
      const n = o.findIndex((l) => l.value === r.value);
      n !== -1 && o.splice(n, 1);
    },
    moveToLastOpenedModals(r) {
      u.deleteFromOpenedModals(r), t.push(r);
    },
    deleteFromOpenedModals(r) {
      const n = t.findIndex((l) => l.value === r.value);
      n !== -1 && t.splice(n, 1);
    },
    moveToLastOpenedModalOverlays(r) {
      u.deleteFromOpenedModalOverlays(r), s.push(r);
    },
    deleteFromOpenedModalOverlays(r) {
      const n = s.findIndex((l) => l.value === r.value);
      n !== -1 && s.splice(n, 1);
    },
    async openLastOverlay() {
      var r;
      if (await Z(), s.forEach((n) => n.value.overlayVisible.value = !1), s.length > 0) {
        const n = s[s.length - 1];
        !((r = n.value.hideOverlay) != null && r.value) && (n.value.overlayVisible.value = !0);
      }
    },
    resolvedClosed(r) {
      var n, l, a;
      (l = (n = d[r]) == null ? void 0 : n.resolveClosed) == null || l.call(n), (a = d[r]) != null && a.keepAlive || d.splice(r, 1);
    },
    resolvedOpened(r) {
      var n, l;
      (l = (n = d[r]) == null ? void 0 : n.resolveOpened) == null || l.call(n);
    }
  };
  return u;
}
function oe() {
  const e = Po();
  if (!e)
    throw new Error(
      `[Vue Final Modal]: getActiveVfm was called with no active Vfm. Did you forget to install vfm?
	const vfm = createVfm()
	app.use(vfm)
This will fail in production.`
    );
  return e;
}
function Fo() {
  return ne(be);
}
function De(e, o = Io) {
  const { component: t, slots: s, ...d } = e, u = typeof s > "u" ? {} : Object.fromEntries(Object.entries(s).map(([r, n]) => me(n) ? [r, n] : "component" in n ? [r, {
    ...n,
    component: _(n.component)
  }] : [r, _(n)]));
  return {
    ...d,
    component: _(t || o),
    slots: u
  };
}
function Go(e) {
  const o = fe({
    id: Symbol("useModal"),
    modelValue: !!(e != null && e.defaultModelValue),
    resolveOpened: () => {
    },
    resolveClosed: () => {
    },
    attrs: {},
    ...De(e)
  });
  lo(() => {
    o != null && o.keepAlive || n();
  }), o.modelValue === !0 && (x ? x == null || x.dynamicModals.push(o) : Z(() => {
    const l = oe();
    l == null || l.dynamicModals.push(o);
  }));
  async function t() {
    let l;
    return x ? l = x : (await Z(), l = oe()), o.modelValue ? Promise.resolve("[Vue Final Modal] modal is already opened.") : (n(), o.modelValue = !0, l.dynamicModals.push(o), new Promise((a) => {
      o.resolveOpened = () => a("opened");
    }));
  }
  function s() {
    return o.modelValue ? (o.modelValue = !1, new Promise((l) => {
      o.resolveClosed = () => l("closed");
    })) : Promise.resolve("[Vue Final Modal] modal is already closed.");
  }
  function d(l) {
    const { slots: a, ...y } = De(l, o.component);
    l.defaultModelValue !== void 0 && (o.defaultModelValue = l.defaultModelValue), (l == null ? void 0 : l.keepAlive) !== void 0 && (o.keepAlive = l == null ? void 0 : l.keepAlive), u(o, y), a && Object.entries(a).forEach(([c, M]) => {
      const b = o.slots[c];
      me(b) ? o.slots[c] = M : Pe(b) && Pe(M) ? u(b, M) : o.slots[c] = M;
    });
  }
  function u(l, a) {
    a.component && (l.component = a.component), a.attrs && r(l.attrs, a.attrs);
  }
  function r(l, a) {
    return Object.entries(a).forEach(([y, c]) => {
      l[y] = c;
    }), l;
  }
  function n() {
    const l = oe(), a = l.dynamicModals.indexOf(o);
    a !== -1 && l.dynamicModals.splice(a, 1);
  }
  return {
    options: o,
    open: t,
    close: s,
    patchOptions: d,
    destroy: n
  };
}
function Uo(e) {
  return e;
}
function Pe(e) {
  return "component" in e || "attrs" in e;
}
function Ro(e, o) {
  return Object.keys(o).reduce((t, s) => (t[s] = e[s], t), {});
}
function xo(e) {
  return e ? {
    "onUpdate:modelValue": (o) => e("update:modelValue", o),
    onBeforeClose: () => e("beforeClose"),
    onClosed: () => e("closed"),
    onBeforeOpen: () => e("beforeOpen"),
    onOpened: () => e("opened"),
    /** onClickOutside will only be emitted when clickToClose equal to `false` */
    onClickOutside: () => e("clickOutside")
  } : {};
}
function Ho(e) {
  const { props: o, modalProps: t, emit: s } = e, d = V(() => Ro(o, t)), u = xo(s), r = oo();
  return V(() => ({
    ...d.value,
    ...u,
    ...r
  }));
}
const No = ["innerHTML"], Wo = /* @__PURE__ */ re({
  __name: "ModalsContainer",
  setup(e) {
    const o = oe(), t = Fo(), s = Symbol("ModalsContainer"), d = V(() => {
      var u;
      return s === ((u = o.modalsContainers.value) == null ? void 0 : u[0]);
    });
    return o.modalsContainers.value.push(s), pe(() => {
      o.modalsContainers.value = o.modalsContainers.value.filter((u) => u !== s);
    }), (u, r) => d.value ? (L(!0), Y(no, { key: 0 }, Be(v(o).dynamicModals, (n, l) => (L(), G(de(n.component), U({
      key: n.id
    }, {
      displayDirective: n != null && n.keepAlive ? "show" : void 0,
      ...n.attrs
    }, {
      modelValue: n.modelValue,
      "onUpdate:modelValue": (a) => n.modelValue = a,
      onClosed: () => {
        var a, y;
        return (y = (a = v(t)).resolvedClosed) == null ? void 0 : y.call(a, l);
      },
      onOpened: () => {
        var a, y;
        return (y = (a = v(t)).resolvedOpened) == null ? void 0 : y.call(a, l);
      }
    }), to({ _: 2 }, [
      Be(n.slots, (a, y) => ({
        name: y,
        fn: te(() => [
          v(me)(a) ? (L(), Y("div", {
            key: 0,
            innerHTML: a
          }, null, 8, No)) : "component" in a ? (L(), G(de(a.component), Re(U({ key: 1 }, a.attrs)), null, 16)) : (L(), G(de(a), { key: 2 }))
        ])
      }))
    ]), 1040, ["modelValue", "onUpdate:modelValue", "onClosed", "onOpened"]))), 128)) : $("", !0);
  }
});
export {
  Eo as CoreModal,
  Wo as ModalsContainer,
  Io as VueFinalModal,
  x as activeVfm,
  ye as coreModalProps,
  zo as createVfm,
  Po as getActiveVfm,
  Do as setActiveVfm,
  Go as useModal,
  Uo as useModalSlot,
  oe as useVfm,
  Ho as useVfmAttrs,
  Bo as vueFinalModalProps
};
