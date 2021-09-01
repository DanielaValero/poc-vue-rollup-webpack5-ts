
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
  'use strict';

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   * IMPORTANT: all calls of this function must be prefixed with
   * \/\*#\_\_PURE\_\_\*\/
   * So that rollup can tree-shake them if necessary.
   */
  function makeMap(str, expectsLowerCase) {
      const map = Object.create(null);
      const list = str.split(',');
      for (let i = 0; i < list.length; i++) {
          map[list[i]] = true;
      }
      return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
  }

  /**
   * On the client we only need to offer special cases for boolean attributes that
   * have different names from their corresponding dom properties:
   * - itemscope -> N/A
   * - allowfullscreen -> allowFullscreen
   * - formnovalidate -> formNoValidate
   * - ismap -> isMap
   * - nomodule -> noModule
   * - novalidate -> noValidate
   * - readonly -> readOnly
   */
  const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
  const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs);
  /**
   * Boolean attributes should be included if the value is truthy or ''.
   * e.g. <select multiple> compiles to { multiple: '' }
   */
  function includeBooleanAttr(value) {
      return !!value || value === '';
  }

  function normalizeStyle(value) {
      if (isArray(value)) {
          const res = {};
          for (let i = 0; i < value.length; i++) {
              const item = value[i];
              const normalized = isString(item)
                  ? parseStringStyle(item)
                  : normalizeStyle(item);
              if (normalized) {
                  for (const key in normalized) {
                      res[key] = normalized[key];
                  }
              }
          }
          return res;
      }
      else if (isString(value)) {
          return value;
      }
      else if (isObject(value)) {
          return value;
      }
  }
  const listDelimiterRE = /;(?![^(]*\))/g;
  const propertyDelimiterRE = /:(.+)/;
  function parseStringStyle(cssText) {
      const ret = {};
      cssText.split(listDelimiterRE).forEach(item => {
          if (item) {
              const tmp = item.split(propertyDelimiterRE);
              tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
          }
      });
      return ret;
  }
  function normalizeClass(value) {
      let res = '';
      if (isString(value)) {
          res = value;
      }
      else if (isArray(value)) {
          for (let i = 0; i < value.length; i++) {
              const normalized = normalizeClass(value[i]);
              if (normalized) {
                  res += normalized + ' ';
              }
          }
      }
      else if (isObject(value)) {
          for (const name in value) {
              if (value[name]) {
                  res += name + ' ';
              }
          }
      }
      return res.trim();
  }

  // These tag configs are shared between compiler-dom and runtime-dom, so they
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element
  const HTML_TAGS = 'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
      'header,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,' +
      'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
      'data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,' +
      'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
      'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
      'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
      'option,output,progress,select,textarea,details,dialog,menu,' +
      'summary,template,blockquote,iframe,tfoot';
  // https://developer.mozilla.org/en-US/docs/Web/SVG/Element
  const SVG_TAGS = 'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,' +
      'defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,' +
      'feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,' +
      'feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,' +
      'feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,' +
      'fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,' +
      'foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,' +
      'mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,' +
      'polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,' +
      'text,textPath,title,tspan,unknown,use,view';
  const isHTMLTag = /*#__PURE__*/ makeMap(HTML_TAGS);
  const isSVGTag = /*#__PURE__*/ makeMap(SVG_TAGS);

  /**
   * For converting {{ interpolation }} values to displayed strings.
   * @private
   */
  const toDisplayString = (val) => {
      return val == null
          ? ''
          : isArray(val) ||
              (isObject(val) &&
                  (val.toString === objectToString || !isFunction(val.toString)))
              ? JSON.stringify(val, replacer, 2)
              : String(val);
  };
  const replacer = (_key, val) => {
      // can't use isRef here since @vue/shared has no deps
      if (val && val.__v_isRef) {
          return replacer(_key, val.value);
      }
      else if (isMap(val)) {
          return {
              [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val]) => {
                  entries[`${key} =>`] = val;
                  return entries;
              }, {})
          };
      }
      else if (isSet(val)) {
          return {
              [`Set(${val.size})`]: [...val.values()]
          };
      }
      else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
          return String(val);
      }
      return val;
  };

  const EMPTY_OBJ = Object.freeze({})
      ;
  const EMPTY_ARR = Object.freeze([]) ;
  const NOOP = () => { };
  /**
   * Always return false.
   */
  const NO = () => false;
  const onRE = /^on[^a-z]/;
  const isOn = (key) => onRE.test(key);
  const isModelListener = (key) => key.startsWith('onUpdate:');
  const extend = Object.assign;
  const remove = (arr, el) => {
      const i = arr.indexOf(el);
      if (i > -1) {
          arr.splice(i, 1);
      }
  };
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const isArray = Array.isArray;
  const isMap = (val) => toTypeString(val) === '[object Map]';
  const isSet = (val) => toTypeString(val) === '[object Set]';
  const isFunction = (val) => typeof val === 'function';
  const isString = (val) => typeof val === 'string';
  const isSymbol = (val) => typeof val === 'symbol';
  const isObject = (val) => val !== null && typeof val === 'object';
  const isPromise = (val) => {
      return isObject(val) && isFunction(val.then) && isFunction(val.catch);
  };
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const toRawType = (value) => {
      // extract "RawType" from strings like "[object RawType]"
      return toTypeString(value).slice(8, -1);
  };
  const isPlainObject = (val) => toTypeString(val) === '[object Object]';
  const isIntegerKey = (key) => isString(key) &&
      key !== 'NaN' &&
      key[0] !== '-' &&
      '' + parseInt(key, 10) === key;
  const isReservedProp = /*#__PURE__*/ makeMap(
  // the leading comma is intentional so empty string "" is also included
  ',key,ref,' +
      'onVnodeBeforeMount,onVnodeMounted,' +
      'onVnodeBeforeUpdate,onVnodeUpdated,' +
      'onVnodeBeforeUnmount,onVnodeUnmounted');
  const cacheStringFunction = (fn) => {
      const cache = Object.create(null);
      return ((str) => {
          const hit = cache[str];
          return hit || (cache[str] = fn(str));
      });
  };
  const camelizeRE = /-(\w)/g;
  /**
   * @private
   */
  const camelize = cacheStringFunction((str) => {
      return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
  });
  const hyphenateRE = /\B([A-Z])/g;
  /**
   * @private
   */
  const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase());
  /**
   * @private
   */
  const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
  /**
   * @private
   */
  const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
  // compare whether a value has changed, accounting for NaN.
  const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
  const invokeArrayFns = (fns, arg) => {
      for (let i = 0; i < fns.length; i++) {
          fns[i](arg);
      }
  };
  const def = (obj, key, value) => {
      Object.defineProperty(obj, key, {
          configurable: true,
          enumerable: false,
          value
      });
  };
  const toNumber = (val) => {
      const n = parseFloat(val);
      return isNaN(n) ? val : n;
  };
  let _globalThis;
  const getGlobalThis = () => {
      return (_globalThis ||
          (_globalThis =
              typeof globalThis !== 'undefined'
                  ? globalThis
                  : typeof self !== 'undefined'
                      ? self
                      : typeof window !== 'undefined'
                          ? window
                          : typeof global !== 'undefined'
                              ? global
                              : {}));
  };

  function warn(msg, ...args) {
      console.warn(`[Vue warn] ${msg}`, ...args);
  }

  let activeEffectScope;
  const effectScopeStack = [];
  class EffectScope {
      constructor(detached = false) {
          this.active = true;
          this.effects = [];
          this.cleanups = [];
          if (!detached && activeEffectScope) {
              this.parent = activeEffectScope;
              this.index =
                  (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
          }
      }
      run(fn) {
          if (this.active) {
              try {
                  this.on();
                  return fn();
              }
              finally {
                  this.off();
              }
          }
          else {
              warn(`cannot run an inactive effect scope.`);
          }
      }
      on() {
          if (this.active) {
              effectScopeStack.push(this);
              activeEffectScope = this;
          }
      }
      off() {
          if (this.active) {
              effectScopeStack.pop();
              activeEffectScope = effectScopeStack[effectScopeStack.length - 1];
          }
      }
      stop(fromParent) {
          if (this.active) {
              this.effects.forEach(e => e.stop());
              this.cleanups.forEach(cleanup => cleanup());
              if (this.scopes) {
                  this.scopes.forEach(e => e.stop(true));
              }
              // nested scope, dereference from parent to avoid memory leaks
              if (this.parent && !fromParent) {
                  // optimized O(1) removal
                  const last = this.parent.scopes.pop();
                  if (last && last !== this) {
                      this.parent.scopes[this.index] = last;
                      last.index = this.index;
                  }
              }
              this.active = false;
          }
      }
  }
  function recordEffectScope(effect, scope) {
      scope = scope || activeEffectScope;
      if (scope && scope.active) {
          scope.effects.push(effect);
      }
  }

  const createDep = (effects) => {
      const dep = new Set(effects);
      dep.w = 0;
      dep.n = 0;
      return dep;
  };
  const wasTracked = (dep) => (dep.w & trackOpBit) > 0;
  const newTracked = (dep) => (dep.n & trackOpBit) > 0;
  const initDepMarkers = ({ deps }) => {
      if (deps.length) {
          for (let i = 0; i < deps.length; i++) {
              deps[i].w |= trackOpBit; // set was tracked
          }
      }
  };
  const finalizeDepMarkers = (effect) => {
      const { deps } = effect;
      if (deps.length) {
          let ptr = 0;
          for (let i = 0; i < deps.length; i++) {
              const dep = deps[i];
              if (wasTracked(dep) && !newTracked(dep)) {
                  dep.delete(effect);
              }
              else {
                  deps[ptr++] = dep;
              }
              // clear bits
              dep.w &= ~trackOpBit;
              dep.n &= ~trackOpBit;
          }
          deps.length = ptr;
      }
  };

  const targetMap = new WeakMap();
  // The number of effects currently being tracked recursively.
  let effectTrackDepth = 0;
  let trackOpBit = 1;
  /**
   * The bitwise track markers support at most 30 levels op recursion.
   * This value is chosen to enable modern JS engines to use a SMI on all platforms.
   * When recursion depth is greater, fall back to using a full cleanup.
   */
  const maxMarkerBits = 30;
  const effectStack = [];
  let activeEffect;
  const ITERATE_KEY = Symbol('iterate' );
  const MAP_KEY_ITERATE_KEY = Symbol('Map key iterate' );
  class ReactiveEffect {
      constructor(fn, scheduler = null, scope) {
          this.fn = fn;
          this.scheduler = scheduler;
          this.active = true;
          this.deps = [];
          recordEffectScope(this, scope);
      }
      run() {
          if (!this.active) {
              return this.fn();
          }
          if (!effectStack.includes(this)) {
              try {
                  effectStack.push((activeEffect = this));
                  enableTracking();
                  trackOpBit = 1 << ++effectTrackDepth;
                  if (effectTrackDepth <= maxMarkerBits) {
                      initDepMarkers(this);
                  }
                  else {
                      cleanupEffect(this);
                  }
                  return this.fn();
              }
              finally {
                  if (effectTrackDepth <= maxMarkerBits) {
                      finalizeDepMarkers(this);
                  }
                  trackOpBit = 1 << --effectTrackDepth;
                  resetTracking();
                  effectStack.pop();
                  const n = effectStack.length;
                  activeEffect = n > 0 ? effectStack[n - 1] : undefined;
              }
          }
      }
      stop() {
          if (this.active) {
              cleanupEffect(this);
              if (this.onStop) {
                  this.onStop();
              }
              this.active = false;
          }
      }
  }
  function cleanupEffect(effect) {
      const { deps } = effect;
      if (deps.length) {
          for (let i = 0; i < deps.length; i++) {
              deps[i].delete(effect);
          }
          deps.length = 0;
      }
  }
  let shouldTrack = true;
  const trackStack = [];
  function pauseTracking() {
      trackStack.push(shouldTrack);
      shouldTrack = false;
  }
  function enableTracking() {
      trackStack.push(shouldTrack);
      shouldTrack = true;
  }
  function resetTracking() {
      const last = trackStack.pop();
      shouldTrack = last === undefined ? true : last;
  }
  function track(target, type, key) {
      if (!isTracking()) {
          return;
      }
      let depsMap = targetMap.get(target);
      if (!depsMap) {
          targetMap.set(target, (depsMap = new Map()));
      }
      let dep = depsMap.get(key);
      if (!dep) {
          depsMap.set(key, (dep = createDep()));
      }
      const eventInfo = { effect: activeEffect, target, type, key }
          ;
      trackEffects(dep, eventInfo);
  }
  function isTracking() {
      return shouldTrack && activeEffect !== undefined;
  }
  function trackEffects(dep, debuggerEventExtraInfo) {
      let shouldTrack = false;
      if (effectTrackDepth <= maxMarkerBits) {
          if (!newTracked(dep)) {
              dep.n |= trackOpBit; // set newly tracked
              shouldTrack = !wasTracked(dep);
          }
      }
      else {
          // Full cleanup mode.
          shouldTrack = !dep.has(activeEffect);
      }
      if (shouldTrack) {
          dep.add(activeEffect);
          activeEffect.deps.push(dep);
          if (activeEffect.onTrack) {
              activeEffect.onTrack(Object.assign({
                  effect: activeEffect
              }, debuggerEventExtraInfo));
          }
      }
  }
  function trigger(target, type, key, newValue, oldValue, oldTarget) {
      const depsMap = targetMap.get(target);
      if (!depsMap) {
          // never been tracked
          return;
      }
      let deps = [];
      if (type === "clear" /* CLEAR */) {
          // collection being cleared
          // trigger all effects for target
          deps = [...depsMap.values()];
      }
      else if (key === 'length' && isArray(target)) {
          depsMap.forEach((dep, key) => {
              if (key === 'length' || key >= newValue) {
                  deps.push(dep);
              }
          });
      }
      else {
          // schedule runs for SET | ADD | DELETE
          if (key !== void 0) {
              deps.push(depsMap.get(key));
          }
          // also run for iteration key on ADD | DELETE | Map.SET
          switch (type) {
              case "add" /* ADD */:
                  if (!isArray(target)) {
                      deps.push(depsMap.get(ITERATE_KEY));
                      if (isMap(target)) {
                          deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                      }
                  }
                  else if (isIntegerKey(key)) {
                      // new index added to array -> length changes
                      deps.push(depsMap.get('length'));
                  }
                  break;
              case "delete" /* DELETE */:
                  if (!isArray(target)) {
                      deps.push(depsMap.get(ITERATE_KEY));
                      if (isMap(target)) {
                          deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                      }
                  }
                  break;
              case "set" /* SET */:
                  if (isMap(target)) {
                      deps.push(depsMap.get(ITERATE_KEY));
                  }
                  break;
          }
      }
      const eventInfo = { target, type, key, newValue, oldValue, oldTarget }
          ;
      if (deps.length === 1) {
          if (deps[0]) {
              {
                  triggerEffects(deps[0], eventInfo);
              }
          }
      }
      else {
          const effects = [];
          for (const dep of deps) {
              if (dep) {
                  effects.push(...dep);
              }
          }
          {
              triggerEffects(createDep(effects), eventInfo);
          }
      }
  }
  function triggerEffects(dep, debuggerEventExtraInfo) {
      // spread into array for stabilization
      for (const effect of isArray(dep) ? dep : [...dep]) {
          if (effect !== activeEffect || effect.allowRecurse) {
              if (effect.onTrigger) {
                  effect.onTrigger(extend({ effect }, debuggerEventExtraInfo));
              }
              if (effect.scheduler) {
                  effect.scheduler();
              }
              else {
                  effect.run();
              }
          }
      }
  }

  const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`);
  const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
      .map(key => Symbol[key])
      .filter(isSymbol));
  const get = /*#__PURE__*/ createGetter();
  const shallowGet = /*#__PURE__*/ createGetter(false, true);
  const readonlyGet = /*#__PURE__*/ createGetter(true);
  const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);
  const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations();
  function createArrayInstrumentations() {
      const instrumentations = {};
      ['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
          instrumentations[key] = function (...args) {
              const arr = toRaw(this);
              for (let i = 0, l = this.length; i < l; i++) {
                  track(arr, "get" /* GET */, i + '');
              }
              // we run the method using the original args first (which may be reactive)
              const res = arr[key](...args);
              if (res === -1 || res === false) {
                  // if that didn't work, run it again using raw values.
                  return arr[key](...args.map(toRaw));
              }
              else {
                  return res;
              }
          };
      });
      ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
          instrumentations[key] = function (...args) {
              pauseTracking();
              const res = toRaw(this)[key].apply(this, args);
              resetTracking();
              return res;
          };
      });
      return instrumentations;
  }
  function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key, receiver) {
          if (key === "__v_isReactive" /* IS_REACTIVE */) {
              return !isReadonly;
          }
          else if (key === "__v_isReadonly" /* IS_READONLY */) {
              return isReadonly;
          }
          else if (key === "__v_raw" /* RAW */ &&
              receiver ===
                  (isReadonly
                      ? shallow
                          ? shallowReadonlyMap
                          : readonlyMap
                      : shallow
                          ? shallowReactiveMap
                          : reactiveMap).get(target)) {
              return target;
          }
          const targetIsArray = isArray(target);
          if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
              return Reflect.get(arrayInstrumentations, key, receiver);
          }
          const res = Reflect.get(target, key, receiver);
          if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
              return res;
          }
          if (!isReadonly) {
              track(target, "get" /* GET */, key);
          }
          if (shallow) {
              return res;
          }
          if (isRef(res)) {
              // ref unwrapping - does not apply for Array + integer key.
              const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
              return shouldUnwrap ? res.value : res;
          }
          if (isObject(res)) {
              // Convert returned value into a proxy as well. we do the isObject check
              // here to avoid invalid value warning. Also need to lazy access readonly
              // and reactive here to avoid circular dependency.
              return isReadonly ? readonly(res) : reactive(res);
          }
          return res;
      };
  }
  const set = /*#__PURE__*/ createSetter();
  const shallowSet = /*#__PURE__*/ createSetter(true);
  function createSetter(shallow = false) {
      return function set(target, key, value, receiver) {
          let oldValue = target[key];
          if (!shallow) {
              value = toRaw(value);
              oldValue = toRaw(oldValue);
              if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                  oldValue.value = value;
                  return true;
              }
          }
          const hadKey = isArray(target) && isIntegerKey(key)
              ? Number(key) < target.length
              : hasOwn(target, key);
          const result = Reflect.set(target, key, value, receiver);
          // don't trigger if target is something up in the prototype chain of original
          if (target === toRaw(receiver)) {
              if (!hadKey) {
                  trigger(target, "add" /* ADD */, key, value);
              }
              else if (hasChanged(value, oldValue)) {
                  trigger(target, "set" /* SET */, key, value, oldValue);
              }
          }
          return result;
      };
  }
  function deleteProperty(target, key) {
      const hadKey = hasOwn(target, key);
      const oldValue = target[key];
      const result = Reflect.deleteProperty(target, key);
      if (result && hadKey) {
          trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
      }
      return result;
  }
  function has(target, key) {
      const result = Reflect.has(target, key);
      if (!isSymbol(key) || !builtInSymbols.has(key)) {
          track(target, "has" /* HAS */, key);
      }
      return result;
  }
  function ownKeys(target) {
      track(target, "iterate" /* ITERATE */, isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
  }
  const mutableHandlers = {
      get,
      set,
      deleteProperty,
      has,
      ownKeys
  };
  const readonlyHandlers = {
      get: readonlyGet,
      set(target, key) {
          {
              console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
          }
          return true;
      },
      deleteProperty(target, key) {
          {
              console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
          }
          return true;
      }
  };
  const shallowReactiveHandlers = /*#__PURE__*/ extend({}, mutableHandlers, {
      get: shallowGet,
      set: shallowSet
  });
  // Props handlers are special in the sense that it should not unwrap top-level
  // refs (in order to allow refs to be explicitly passed down), but should
  // retain the reactivity of the normal readonly object.
  const shallowReadonlyHandlers = /*#__PURE__*/ extend({}, readonlyHandlers, {
      get: shallowReadonlyGet
  });

  const toReactive = (value) => isObject(value) ? reactive(value) : value;
  const toReadonly = (value) => isObject(value) ? readonly(value) : value;
  const toShallow = (value) => value;
  const getProto = (v) => Reflect.getPrototypeOf(v);
  function get$1(target, key, isReadonly = false, isShallow = false) {
      // #1772: readonly(reactive(Map)) should return readonly + reactive version
      // of the value
      target = target["__v_raw" /* RAW */];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (key !== rawKey) {
          !isReadonly && track(rawTarget, "get" /* GET */, key);
      }
      !isReadonly && track(rawTarget, "get" /* GET */, rawKey);
      const { has } = getProto(rawTarget);
      const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
      if (has.call(rawTarget, key)) {
          return wrap(target.get(key));
      }
      else if (has.call(rawTarget, rawKey)) {
          return wrap(target.get(rawKey));
      }
      else if (target !== rawTarget) {
          // #3602 readonly(reactive(Map))
          // ensure that the nested reactive `Map` can do tracking for itself
          target.get(key);
      }
  }
  function has$1(key, isReadonly = false) {
      const target = this["__v_raw" /* RAW */];
      const rawTarget = toRaw(target);
      const rawKey = toRaw(key);
      if (key !== rawKey) {
          !isReadonly && track(rawTarget, "has" /* HAS */, key);
      }
      !isReadonly && track(rawTarget, "has" /* HAS */, rawKey);
      return key === rawKey
          ? target.has(key)
          : target.has(key) || target.has(rawKey);
  }
  function size(target, isReadonly = false) {
      target = target["__v_raw" /* RAW */];
      !isReadonly && track(toRaw(target), "iterate" /* ITERATE */, ITERATE_KEY);
      return Reflect.get(target, 'size', target);
  }
  function add(value) {
      value = toRaw(value);
      const target = toRaw(this);
      const proto = getProto(target);
      const hadKey = proto.has.call(target, value);
      if (!hadKey) {
          target.add(value);
          trigger(target, "add" /* ADD */, value, value);
      }
      return this;
  }
  function set$1(key, value) {
      value = toRaw(value);
      const target = toRaw(this);
      const { has, get } = getProto(target);
      let hadKey = has.call(target, key);
      if (!hadKey) {
          key = toRaw(key);
          hadKey = has.call(target, key);
      }
      else {
          checkIdentityKeys(target, has, key);
      }
      const oldValue = get.call(target, key);
      target.set(key, value);
      if (!hadKey) {
          trigger(target, "add" /* ADD */, key, value);
      }
      else if (hasChanged(value, oldValue)) {
          trigger(target, "set" /* SET */, key, value, oldValue);
      }
      return this;
  }
  function deleteEntry(key) {
      const target = toRaw(this);
      const { has, get } = getProto(target);
      let hadKey = has.call(target, key);
      if (!hadKey) {
          key = toRaw(key);
          hadKey = has.call(target, key);
      }
      else {
          checkIdentityKeys(target, has, key);
      }
      const oldValue = get ? get.call(target, key) : undefined;
      // forward the operation before queueing reactions
      const result = target.delete(key);
      if (hadKey) {
          trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
      }
      return result;
  }
  function clear() {
      const target = toRaw(this);
      const hadItems = target.size !== 0;
      const oldTarget = isMap(target)
              ? new Map(target)
              : new Set(target)
          ;
      // forward the operation before queueing reactions
      const result = target.clear();
      if (hadItems) {
          trigger(target, "clear" /* CLEAR */, undefined, undefined, oldTarget);
      }
      return result;
  }
  function createForEach(isReadonly, isShallow) {
      return function forEach(callback, thisArg) {
          const observed = this;
          const target = observed["__v_raw" /* RAW */];
          const rawTarget = toRaw(target);
          const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
          !isReadonly && track(rawTarget, "iterate" /* ITERATE */, ITERATE_KEY);
          return target.forEach((value, key) => {
              // important: make sure the callback is
              // 1. invoked with the reactive map as `this` and 3rd arg
              // 2. the value received should be a corresponding reactive/readonly.
              return callback.call(thisArg, wrap(value), wrap(key), observed);
          });
      };
  }
  function createIterableMethod(method, isReadonly, isShallow) {
      return function (...args) {
          const target = this["__v_raw" /* RAW */];
          const rawTarget = toRaw(target);
          const targetIsMap = isMap(rawTarget);
          const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap);
          const isKeyOnly = method === 'keys' && targetIsMap;
          const innerIterator = target[method](...args);
          const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
          !isReadonly &&
              track(rawTarget, "iterate" /* ITERATE */, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
          // return a wrapped iterator which returns observed versions of the
          // values emitted from the real iterator
          return {
              // iterator protocol
              next() {
                  const { value, done } = innerIterator.next();
                  return done
                      ? { value, done }
                      : {
                          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                          done
                      };
              },
              // iterable protocol
              [Symbol.iterator]() {
                  return this;
              }
          };
      };
  }
  function createReadonlyMethod(type) {
      return function (...args) {
          {
              const key = args[0] ? `on key "${args[0]}" ` : ``;
              console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
          }
          return type === "delete" /* DELETE */ ? false : this;
      };
  }
  function createInstrumentations() {
      const mutableInstrumentations = {
          get(key) {
              return get$1(this, key);
          },
          get size() {
              return size(this);
          },
          has: has$1,
          add,
          set: set$1,
          delete: deleteEntry,
          clear,
          forEach: createForEach(false, false)
      };
      const shallowInstrumentations = {
          get(key) {
              return get$1(this, key, false, true);
          },
          get size() {
              return size(this);
          },
          has: has$1,
          add,
          set: set$1,
          delete: deleteEntry,
          clear,
          forEach: createForEach(false, true)
      };
      const readonlyInstrumentations = {
          get(key) {
              return get$1(this, key, true);
          },
          get size() {
              return size(this, true);
          },
          has(key) {
              return has$1.call(this, key, true);
          },
          add: createReadonlyMethod("add" /* ADD */),
          set: createReadonlyMethod("set" /* SET */),
          delete: createReadonlyMethod("delete" /* DELETE */),
          clear: createReadonlyMethod("clear" /* CLEAR */),
          forEach: createForEach(true, false)
      };
      const shallowReadonlyInstrumentations = {
          get(key) {
              return get$1(this, key, true, true);
          },
          get size() {
              return size(this, true);
          },
          has(key) {
              return has$1.call(this, key, true);
          },
          add: createReadonlyMethod("add" /* ADD */),
          set: createReadonlyMethod("set" /* SET */),
          delete: createReadonlyMethod("delete" /* DELETE */),
          clear: createReadonlyMethod("clear" /* CLEAR */),
          forEach: createForEach(true, true)
      };
      const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
      iteratorMethods.forEach(method => {
          mutableInstrumentations[method] = createIterableMethod(method, false, false);
          readonlyInstrumentations[method] = createIterableMethod(method, true, false);
          shallowInstrumentations[method] = createIterableMethod(method, false, true);
          shallowReadonlyInstrumentations[method] = createIterableMethod(method, true, true);
      });
      return [
          mutableInstrumentations,
          readonlyInstrumentations,
          shallowInstrumentations,
          shallowReadonlyInstrumentations
      ];
  }
  const [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* #__PURE__*/ createInstrumentations();
  function createInstrumentationGetter(isReadonly, shallow) {
      const instrumentations = shallow
          ? isReadonly
              ? shallowReadonlyInstrumentations
              : shallowInstrumentations
          : isReadonly
              ? readonlyInstrumentations
              : mutableInstrumentations;
      return (target, key, receiver) => {
          if (key === "__v_isReactive" /* IS_REACTIVE */) {
              return !isReadonly;
          }
          else if (key === "__v_isReadonly" /* IS_READONLY */) {
              return isReadonly;
          }
          else if (key === "__v_raw" /* RAW */) {
              return target;
          }
          return Reflect.get(hasOwn(instrumentations, key) && key in target
              ? instrumentations
              : target, key, receiver);
      };
  }
  const mutableCollectionHandlers = {
      get: /*#__PURE__*/ createInstrumentationGetter(false, false)
  };
  const shallowCollectionHandlers = {
      get: /*#__PURE__*/ createInstrumentationGetter(false, true)
  };
  const readonlyCollectionHandlers = {
      get: /*#__PURE__*/ createInstrumentationGetter(true, false)
  };
  const shallowReadonlyCollectionHandlers = {
      get: /*#__PURE__*/ createInstrumentationGetter(true, true)
  };
  function checkIdentityKeys(target, has, key) {
      const rawKey = toRaw(key);
      if (rawKey !== key && has.call(target, rawKey)) {
          const type = toRawType(target);
          console.warn(`Reactive ${type} contains both the raw and reactive ` +
              `versions of the same object${type === `Map` ? ` as keys` : ``}, ` +
              `which can lead to inconsistencies. ` +
              `Avoid differentiating between the raw and reactive versions ` +
              `of an object and only use the reactive version if possible.`);
      }
  }

  const reactiveMap = new WeakMap();
  const shallowReactiveMap = new WeakMap();
  const readonlyMap = new WeakMap();
  const shallowReadonlyMap = new WeakMap();
  function targetTypeMap(rawType) {
      switch (rawType) {
          case 'Object':
          case 'Array':
              return 1 /* COMMON */;
          case 'Map':
          case 'Set':
          case 'WeakMap':
          case 'WeakSet':
              return 2 /* COLLECTION */;
          default:
              return 0 /* INVALID */;
      }
  }
  function getTargetType(value) {
      return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
          ? 0 /* INVALID */
          : targetTypeMap(toRawType(value));
  }
  function reactive(target) {
      // if trying to observe a readonly proxy, return the readonly version.
      if (target && target["__v_isReadonly" /* IS_READONLY */]) {
          return target;
      }
      return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
  }
  /**
   * Return a shallowly-reactive copy of the original object, where only the root
   * level properties are reactive. It also does not auto-unwrap refs (even at the
   * root level).
   */
  function shallowReactive(target) {
      return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
  }
  /**
   * Creates a readonly copy of the original object. Note the returned copy is not
   * made reactive, but `readonly` can be called on an already reactive object.
   */
  function readonly(target) {
      return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
  }
  /**
   * Returns a reactive-copy of the original object, where only the root level
   * properties are readonly, and does NOT unwrap refs nor recursively convert
   * returned properties.
   * This is used for creating the props proxy object for stateful components.
   */
  function shallowReadonly(target) {
      return createReactiveObject(target, true, shallowReadonlyHandlers, shallowReadonlyCollectionHandlers, shallowReadonlyMap);
  }
  function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
      if (!isObject(target)) {
          {
              console.warn(`value cannot be made reactive: ${String(target)}`);
          }
          return target;
      }
      // target is already a Proxy, return it.
      // exception: calling readonly() on a reactive object
      if (target["__v_raw" /* RAW */] &&
          !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
          return target;
      }
      // target already has corresponding Proxy
      const existingProxy = proxyMap.get(target);
      if (existingProxy) {
          return existingProxy;
      }
      // only a whitelist of value types can be observed.
      const targetType = getTargetType(target);
      if (targetType === 0 /* INVALID */) {
          return target;
      }
      const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
      proxyMap.set(target, proxy);
      return proxy;
  }
  function isReactive(value) {
      if (isReadonly(value)) {
          return isReactive(value["__v_raw" /* RAW */]);
      }
      return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  function isReadonly(value) {
      return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
  }
  function isProxy(value) {
      return isReactive(value) || isReadonly(value);
  }
  function toRaw(observed) {
      const raw = observed && observed["__v_raw" /* RAW */];
      return raw ? toRaw(raw) : observed;
  }
  function markRaw(value) {
      def(value, "__v_skip" /* SKIP */, true);
      return value;
  }

  function trackRefValue(ref) {
      if (isTracking()) {
          ref = toRaw(ref);
          if (!ref.dep) {
              ref.dep = createDep();
          }
          {
              trackEffects(ref.dep, {
                  target: ref,
                  type: "get" /* GET */,
                  key: 'value'
              });
          }
      }
  }
  function triggerRefValue(ref, newVal) {
      ref = toRaw(ref);
      if (ref.dep) {
          {
              triggerEffects(ref.dep, {
                  target: ref,
                  type: "set" /* SET */,
                  key: 'value',
                  newValue: newVal
              });
          }
      }
  }
  const convert = (val) => isObject(val) ? reactive(val) : val;
  function isRef(r) {
      return Boolean(r && r.__v_isRef === true);
  }
  function ref(value) {
      return createRef(value, false);
  }
  class RefImpl {
      constructor(value, _shallow) {
          this._shallow = _shallow;
          this.dep = undefined;
          this.__v_isRef = true;
          this._rawValue = _shallow ? value : toRaw(value);
          this._value = _shallow ? value : convert(value);
      }
      get value() {
          trackRefValue(this);
          return this._value;
      }
      set value(newVal) {
          newVal = this._shallow ? newVal : toRaw(newVal);
          if (hasChanged(newVal, this._rawValue)) {
              this._rawValue = newVal;
              this._value = this._shallow ? newVal : convert(newVal);
              triggerRefValue(this, newVal);
          }
      }
  }
  function createRef(rawValue, shallow) {
      if (isRef(rawValue)) {
          return rawValue;
      }
      return new RefImpl(rawValue, shallow);
  }
  function unref(ref) {
      return isRef(ref) ? ref.value : ref;
  }
  const shallowUnwrapHandlers = {
      get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
      set: (target, key, value, receiver) => {
          const oldValue = target[key];
          if (isRef(oldValue) && !isRef(value)) {
              oldValue.value = value;
              return true;
          }
          else {
              return Reflect.set(target, key, value, receiver);
          }
      }
  };
  function proxyRefs(objectWithRefs) {
      return isReactive(objectWithRefs)
          ? objectWithRefs
          : new Proxy(objectWithRefs, shallowUnwrapHandlers);
  }

  class ComputedRefImpl {
      constructor(getter, _setter, isReadonly) {
          this._setter = _setter;
          this.dep = undefined;
          this._dirty = true;
          this.__v_isRef = true;
          this.effect = new ReactiveEffect(getter, () => {
              if (!this._dirty) {
                  this._dirty = true;
                  triggerRefValue(this);
              }
          });
          this["__v_isReadonly" /* IS_READONLY */] = isReadonly;
      }
      get value() {
          // the computed ref may get wrapped by other proxies e.g. readonly() #3376
          const self = toRaw(this);
          trackRefValue(self);
          if (self._dirty) {
              self._dirty = false;
              self._value = self.effect.run();
          }
          return self._value;
      }
      set value(newValue) {
          this._setter(newValue);
      }
  }
  function computed(getterOrOptions, debugOptions) {
      let getter;
      let setter;
      if (isFunction(getterOrOptions)) {
          getter = getterOrOptions;
          setter = () => {
                  console.warn('Write operation failed: computed value is readonly');
              }
              ;
      }
      else {
          getter = getterOrOptions.get;
          setter = getterOrOptions.set;
      }
      const cRef = new ComputedRefImpl(getter, setter, isFunction(getterOrOptions) || !getterOrOptions.set);
      if (debugOptions) {
          cRef.effect.onTrack = debugOptions.onTrack;
          cRef.effect.onTrigger = debugOptions.onTrigger;
      }
      return cRef;
  }

  /* eslint-disable no-restricted-globals */
  let isHmrUpdating = false;
  const hmrDirtyComponents = new Set();
  // Expose the HMR runtime on the global object
  // This makes it entirely tree-shakable without polluting the exports and makes
  // it easier to be used in toolings like vue-loader
  // Note: for a component to be eligible for HMR it also needs the __hmrId option
  // to be set so that its instances can be registered / removed.
  {
      const globalObject = typeof global !== 'undefined'
          ? global
          : typeof self !== 'undefined'
              ? self
              : typeof window !== 'undefined'
                  ? window
                  : {};
      globalObject.__VUE_HMR_RUNTIME__ = {
          createRecord: tryWrap(createRecord),
          rerender: tryWrap(rerender),
          reload: tryWrap(reload)
      };
  }
  const map = new Map();
  function registerHMR(instance) {
      const id = instance.type.__hmrId;
      let record = map.get(id);
      if (!record) {
          createRecord(id, instance.type);
          record = map.get(id);
      }
      record.instances.add(instance);
  }
  function unregisterHMR(instance) {
      map.get(instance.type.__hmrId).instances.delete(instance);
  }
  function createRecord(id, component) {
      if (!component) {
          warn$1(`HMR API usage is out of date.\n` +
              `Please upgrade vue-loader/vite/rollup-plugin-vue or other relevant ` +
              `dependency that handles Vue SFC compilation.`);
          component = {};
      }
      if (map.has(id)) {
          return false;
      }
      map.set(id, {
          component: isClassComponent(component) ? component.__vccOpts : component,
          instances: new Set()
      });
      return true;
  }
  function rerender(id, newRender) {
      const record = map.get(id);
      if (!record)
          return;
      if (newRender)
          record.component.render = newRender;
      // Array.from creates a snapshot which avoids the set being mutated during
      // updates
      Array.from(record.instances).forEach(instance => {
          if (newRender) {
              instance.render = newRender;
          }
          instance.renderCache = [];
          // this flag forces child components with slot content to update
          isHmrUpdating = true;
          instance.update();
          isHmrUpdating = false;
      });
  }
  function reload(id, newComp) {
      const record = map.get(id);
      if (!record)
          return;
      // Array.from creates a snapshot which avoids the set being mutated during
      // updates
      const { component, instances } = record;
      if (!hmrDirtyComponents.has(component)) {
          // 1. Update existing comp definition to match new one
          newComp = isClassComponent(newComp) ? newComp.__vccOpts : newComp;
          extend(component, newComp);
          for (const key in component) {
              if (key !== '__file' && !(key in newComp)) {
                  delete component[key];
              }
          }
          // 2. Mark component dirty. This forces the renderer to replace the component
          // on patch.
          hmrDirtyComponents.add(component);
          // 3. Make sure to unmark the component after the reload.
          queuePostFlushCb(() => {
              hmrDirtyComponents.delete(component);
          });
      }
      Array.from(instances).forEach(instance => {
          // invalidate options resolution cache
          instance.appContext.optionsCache.delete(instance.type);
          if (instance.ceReload) {
              // custom element
              hmrDirtyComponents.add(component);
              instance.ceReload(newComp.styles);
              hmrDirtyComponents.delete(component);
          }
          else if (instance.parent) {
              // 4. Force the parent instance to re-render. This will cause all updated
              // components to be unmounted and re-mounted. Queue the update so that we
              // don't end up forcing the same parent to re-render multiple times.
              queueJob(instance.parent.update);
              // instance is the inner component of an async custom element
              // invoke to reset styles
              if (instance.parent.type.__asyncLoader &&
                  instance.parent.ceReload) {
                  instance.parent.ceReload(newComp.styles);
              }
          }
          else if (instance.appContext.reload) {
              // root instance mounted via createApp() has a reload method
              instance.appContext.reload();
          }
          else if (typeof window !== 'undefined') {
              // root instance inside tree created via raw render(). Force reload.
              window.location.reload();
          }
          else {
              console.warn('[HMR] Root or manually mounted instance modified. Full reload required.');
          }
      });
  }
  function tryWrap(fn) {
      return (id, arg) => {
          try {
              return fn(id, arg);
          }
          catch (e) {
              console.error(e);
              console.warn(`[HMR] Something went wrong during Vue component hot-reload. ` +
                  `Full reload required.`);
          }
      };
  }

  let devtools;
  function setDevtoolsHook(hook) {
      devtools = hook;
  }
  function devtoolsInitApp(app, version) {
      // TODO queue if devtools is undefined
      if (!devtools)
          return;
      devtools.emit("app:init" /* APP_INIT */, app, version, {
          Fragment,
          Text,
          Comment: Comment$1,
          Static
      });
  }
  function devtoolsUnmountApp(app) {
      if (!devtools)
          return;
      devtools.emit("app:unmount" /* APP_UNMOUNT */, app);
  }
  const devtoolsComponentAdded = /*#__PURE__*/ createDevtoolsComponentHook("component:added" /* COMPONENT_ADDED */);
  const devtoolsComponentUpdated = 
  /*#__PURE__*/ createDevtoolsComponentHook("component:updated" /* COMPONENT_UPDATED */);
  const devtoolsComponentRemoved = 
  /*#__PURE__*/ createDevtoolsComponentHook("component:removed" /* COMPONENT_REMOVED */);
  function createDevtoolsComponentHook(hook) {
      return (component) => {
          if (!devtools)
              return;
          devtools.emit(hook, component.appContext.app, component.uid, component.parent ? component.parent.uid : undefined, component);
      };
  }
  const devtoolsPerfStart = /*#__PURE__*/ createDevtoolsPerformanceHook("perf:start" /* PERFORMANCE_START */);
  const devtoolsPerfEnd = /*#__PURE__*/ createDevtoolsPerformanceHook("perf:end" /* PERFORMANCE_END */);
  function createDevtoolsPerformanceHook(hook) {
      return (component, type, time) => {
          if (!devtools)
              return;
          devtools.emit(hook, component.appContext.app, component.uid, component, type, time);
      };
  }
  function devtoolsComponentEmit(component, event, params) {
      if (!devtools)
          return;
      devtools.emit("component:emit" /* COMPONENT_EMIT */, component.appContext.app, component, event, params);
  }
  const globalCompatConfig = {
      MODE: 2
  };
  function getCompatConfigForKey(key, instance) {
      const instanceConfig = instance && instance.type.compatConfig;
      if (instanceConfig && key in instanceConfig) {
          return instanceConfig[key];
      }
      return globalCompatConfig[key];
  }
  function isCompatEnabled(key, instance, enableForBuiltIn = false) {
      // skip compat for built-in components
      if (!enableForBuiltIn && instance && instance.type.__isBuiltIn) {
          return false;
      }
      const rawMode = getCompatConfigForKey('MODE', instance) || 2;
      const val = getCompatConfigForKey(key, instance);
      const mode = isFunction(rawMode)
          ? rawMode(instance && instance.type)
          : rawMode;
      if (mode === 2) {
          return val !== false;
      }
      else {
          return val === true || val === 'suppress-warning';
      }
  }

  function emit(instance, event, ...rawArgs) {
      const props = instance.vnode.props || EMPTY_OBJ;
      {
          const { emitsOptions, propsOptions: [propsOptions] } = instance;
          if (emitsOptions) {
              if (!(event in emitsOptions) &&
                  !(false )) {
                  if (!propsOptions || !(toHandlerKey(event) in propsOptions)) {
                      warn$1(`Component emitted event "${event}" but it is neither declared in ` +
                          `the emits option nor as an "${toHandlerKey(event)}" prop.`);
                  }
              }
              else {
                  const validator = emitsOptions[event];
                  if (isFunction(validator)) {
                      const isValid = validator(...rawArgs);
                      if (!isValid) {
                          warn$1(`Invalid event arguments: event validation failed for event "${event}".`);
                      }
                  }
              }
          }
      }
      let args = rawArgs;
      const isModelListener = event.startsWith('update:');
      // for v-model update:xxx events, apply modifiers on args
      const modelArg = isModelListener && event.slice(7);
      if (modelArg && modelArg in props) {
          const modifiersKey = `${modelArg === 'modelValue' ? 'model' : modelArg}Modifiers`;
          const { number, trim } = props[modifiersKey] || EMPTY_OBJ;
          if (trim) {
              args = rawArgs.map(a => a.trim());
          }
          else if (number) {
              args = rawArgs.map(toNumber);
          }
      }
      {
          devtoolsComponentEmit(instance, event, args);
      }
      {
          const lowerCaseEvent = event.toLowerCase();
          if (lowerCaseEvent !== event && props[toHandlerKey(lowerCaseEvent)]) {
              warn$1(`Event "${lowerCaseEvent}" is emitted in component ` +
                  `${formatComponentName(instance, instance.type)} but the handler is registered for "${event}". ` +
                  `Note that HTML attributes are case-insensitive and you cannot use ` +
                  `v-on to listen to camelCase events when using in-DOM templates. ` +
                  `You should probably use "${hyphenate(event)}" instead of "${event}".`);
          }
      }
      let handlerName;
      let handler = props[(handlerName = toHandlerKey(event))] ||
          // also try camelCase event handler (#2249)
          props[(handlerName = toHandlerKey(camelize(event)))];
      // for v-model update:xxx events, also trigger kebab-case equivalent
      // for props passed via kebab-case
      if (!handler && isModelListener) {
          handler = props[(handlerName = toHandlerKey(hyphenate(event)))];
      }
      if (handler) {
          callWithAsyncErrorHandling(handler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
      }
      const onceHandler = props[handlerName + `Once`];
      if (onceHandler) {
          if (!instance.emitted) {
              instance.emitted = {};
          }
          else if (instance.emitted[handlerName]) {
              return;
          }
          instance.emitted[handlerName] = true;
          callWithAsyncErrorHandling(onceHandler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
      }
  }
  function normalizeEmitsOptions(comp, appContext, asMixin = false) {
      const cache = appContext.emitsCache;
      const cached = cache.get(comp);
      if (cached !== undefined) {
          return cached;
      }
      const raw = comp.emits;
      let normalized = {};
      // apply mixin/extends props
      let hasExtends = false;
      if (!isFunction(comp)) {
          const extendEmits = (raw) => {
              const normalizedFromExtend = normalizeEmitsOptions(raw, appContext, true);
              if (normalizedFromExtend) {
                  hasExtends = true;
                  extend(normalized, normalizedFromExtend);
              }
          };
          if (!asMixin && appContext.mixins.length) {
              appContext.mixins.forEach(extendEmits);
          }
          if (comp.extends) {
              extendEmits(comp.extends);
          }
          if (comp.mixins) {
              comp.mixins.forEach(extendEmits);
          }
      }
      if (!raw && !hasExtends) {
          cache.set(comp, null);
          return null;
      }
      if (isArray(raw)) {
          raw.forEach(key => (normalized[key] = null));
      }
      else {
          extend(normalized, raw);
      }
      cache.set(comp, normalized);
      return normalized;
  }
  // Check if an incoming prop key is a declared emit event listener.
  // e.g. With `emits: { click: null }`, props named `onClick` and `onclick` are
  // both considered matched listeners.
  function isEmitListener(options, key) {
      if (!options || !isOn(key)) {
          return false;
      }
      key = key.slice(2).replace(/Once$/, '');
      return (hasOwn(options, key[0].toLowerCase() + key.slice(1)) ||
          hasOwn(options, hyphenate(key)) ||
          hasOwn(options, key));
  }

  /**
   * mark the current rendering instance for asset resolution (e.g.
   * resolveComponent, resolveDirective) during render
   */
  let currentRenderingInstance = null;
  let currentScopeId = null;
  /**
   * Note: rendering calls maybe nested. The function returns the parent rendering
   * instance if present, which should be restored after the render is done:
   *
   * ```js
   * const prev = setCurrentRenderingInstance(i)
   * // ...render
   * setCurrentRenderingInstance(prev)
   * ```
   */
  function setCurrentRenderingInstance(instance) {
      const prev = currentRenderingInstance;
      currentRenderingInstance = instance;
      currentScopeId = (instance && instance.type.__scopeId) || null;
      return prev;
  }
  /**
   * Wrap a slot function to memoize current rendering instance
   * @private compiler helper
   */
  function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot // false only
  ) {
      if (!ctx)
          return fn;
      // already normalized
      if (fn._n) {
          return fn;
      }
      const renderFnWithContext = (...args) => {
          // If a user calls a compiled slot inside a template expression (#1745), it
          // can mess up block tracking, so by default we disable block tracking and
          // force bail out when invoking a compiled slot (indicated by the ._d flag).
          // This isn't necessary if rendering a compiled `<slot>`, so we flip the
          // ._d flag off when invoking the wrapped fn inside `renderSlot`.
          if (renderFnWithContext._d) {
              setBlockTracking(-1);
          }
          const prevInstance = setCurrentRenderingInstance(ctx);
          const res = fn(...args);
          setCurrentRenderingInstance(prevInstance);
          if (renderFnWithContext._d) {
              setBlockTracking(1);
          }
          {
              devtoolsComponentUpdated(ctx);
          }
          return res;
      };
      // mark normalized to avoid duplicated wrapping
      renderFnWithContext._n = true;
      // mark this as compiled by default
      // this is used in vnode.ts -> normalizeChildren() to set the slot
      // rendering flag.
      renderFnWithContext._c = true;
      // disable block tracking by default
      renderFnWithContext._d = true;
      return renderFnWithContext;
  }

  /**
   * dev only flag to track whether $attrs was used during render.
   * If $attrs was used during render then the warning for failed attrs
   * fallthrough can be suppressed.
   */
  let accessedAttrs = false;
  function markAttrsAccessed() {
      accessedAttrs = true;
  }
  function renderComponentRoot(instance) {
      const { type: Component, vnode, proxy, withProxy, props, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, data, setupState, ctx, inheritAttrs } = instance;
      let result;
      const prev = setCurrentRenderingInstance(instance);
      {
          accessedAttrs = false;
      }
      try {
          let fallthroughAttrs;
          if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
              // withProxy is a proxy with a different `has` trap only for
              // runtime-compiled render functions using `with` block.
              const proxyToUse = withProxy || proxy;
              result = normalizeVNode(render.call(proxyToUse, proxyToUse, renderCache, props, setupState, data, ctx));
              fallthroughAttrs = attrs;
          }
          else {
              // functional
              const render = Component;
              // in dev, mark attrs accessed if optional props (attrs === props)
              if (true && attrs === props) {
                  markAttrsAccessed();
              }
              result = normalizeVNode(render.length > 1
                  ? render(props, true
                      ? {
                          get attrs() {
                              markAttrsAccessed();
                              return attrs;
                          },
                          slots,
                          emit
                      }
                      : { attrs, slots, emit })
                  : render(props, null /* we know it doesn't need it */));
              fallthroughAttrs = Component.props
                  ? attrs
                  : getFunctionalFallthrough(attrs);
          }
          // attr merging
          // in dev mode, comments are preserved, and it's possible for a template
          // to have comments along side the root element which makes it a fragment
          let root = result;
          let setRoot = undefined;
          if (true &&
              result.patchFlag > 0 &&
              result.patchFlag & 2048 /* DEV_ROOT_FRAGMENT */) {
              ;
              [root, setRoot] = getChildRoot(result);
          }
          if (fallthroughAttrs && inheritAttrs !== false) {
              const keys = Object.keys(fallthroughAttrs);
              const { shapeFlag } = root;
              if (keys.length) {
                  if (shapeFlag & (1 /* ELEMENT */ | 6 /* COMPONENT */)) {
                      if (propsOptions && keys.some(isModelListener)) {
                          // If a v-model listener (onUpdate:xxx) has a corresponding declared
                          // prop, it indicates this component expects to handle v-model and
                          // it should not fallthrough.
                          // related: #1543, #1643, #1989
                          fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
                      }
                      root = cloneVNode(root, fallthroughAttrs);
                  }
                  else if (true && !accessedAttrs && root.type !== Comment$1) {
                      const allAttrs = Object.keys(attrs);
                      const eventAttrs = [];
                      const extraAttrs = [];
                      for (let i = 0, l = allAttrs.length; i < l; i++) {
                          const key = allAttrs[i];
                          if (isOn(key)) {
                              // ignore v-model handlers when they fail to fallthrough
                              if (!isModelListener(key)) {
                                  // remove `on`, lowercase first letter to reflect event casing
                                  // accurately
                                  eventAttrs.push(key[2].toLowerCase() + key.slice(3));
                              }
                          }
                          else {
                              extraAttrs.push(key);
                          }
                      }
                      if (extraAttrs.length) {
                          warn$1(`Extraneous non-props attributes (` +
                              `${extraAttrs.join(', ')}) ` +
                              `were passed to component but could not be automatically inherited ` +
                              `because component renders fragment or text root nodes.`);
                      }
                      if (eventAttrs.length) {
                          warn$1(`Extraneous non-emits event listeners (` +
                              `${eventAttrs.join(', ')}) ` +
                              `were passed to component but could not be automatically inherited ` +
                              `because component renders fragment or text root nodes. ` +
                              `If the listener is intended to be a component custom event listener only, ` +
                              `declare it using the "emits" option.`);
                      }
                  }
              }
          }
          if (false &&
              isCompatEnabled("INSTANCE_ATTRS_CLASS_STYLE" /* INSTANCE_ATTRS_CLASS_STYLE */, instance) &&
              vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */ &&
              root.shapeFlag & (1 /* ELEMENT */ | 6 /* COMPONENT */)) ;
          // inherit directives
          if (vnode.dirs) {
              if (true && !isElementRoot(root)) {
                  warn$1(`Runtime directive used on component with non-element root node. ` +
                      `The directives will not function as intended.`);
              }
              root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
          }
          // inherit transition data
          if (vnode.transition) {
              if (true && !isElementRoot(root)) {
                  warn$1(`Component inside <Transition> renders non-element root node ` +
                      `that cannot be animated.`);
              }
              root.transition = vnode.transition;
          }
          if (true && setRoot) {
              setRoot(root);
          }
          else {
              result = root;
          }
      }
      catch (err) {
          blockStack.length = 0;
          handleError(err, instance, 1 /* RENDER_FUNCTION */);
          result = createVNode(Comment$1);
      }
      setCurrentRenderingInstance(prev);
      return result;
  }
  /**
   * dev only
   * In dev mode, template root level comments are rendered, which turns the
   * template into a fragment root, but we need to locate the single element
   * root for attrs and scope id processing.
   */
  const getChildRoot = (vnode) => {
      const rawChildren = vnode.children;
      const dynamicChildren = vnode.dynamicChildren;
      const childRoot = filterSingleRoot(rawChildren);
      if (!childRoot) {
          return [vnode, undefined];
      }
      const index = rawChildren.indexOf(childRoot);
      const dynamicIndex = dynamicChildren ? dynamicChildren.indexOf(childRoot) : -1;
      const setRoot = (updatedRoot) => {
          rawChildren[index] = updatedRoot;
          if (dynamicChildren) {
              if (dynamicIndex > -1) {
                  dynamicChildren[dynamicIndex] = updatedRoot;
              }
              else if (updatedRoot.patchFlag > 0) {
                  vnode.dynamicChildren = [...dynamicChildren, updatedRoot];
              }
          }
      };
      return [normalizeVNode(childRoot), setRoot];
  };
  function filterSingleRoot(children) {
      let singleRoot;
      for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (isVNode(child)) {
              // ignore user comment
              if (child.type !== Comment$1 || child.children === 'v-if') {
                  if (singleRoot) {
                      // has more than 1 non-comment child, return now
                      return;
                  }
                  else {
                      singleRoot = child;
                  }
              }
          }
          else {
              return;
          }
      }
      return singleRoot;
  }
  const getFunctionalFallthrough = (attrs) => {
      let res;
      for (const key in attrs) {
          if (key === 'class' || key === 'style' || isOn(key)) {
              (res || (res = {}))[key] = attrs[key];
          }
      }
      return res;
  };
  const filterModelListeners = (attrs, props) => {
      const res = {};
      for (const key in attrs) {
          if (!isModelListener(key) || !(key.slice(9) in props)) {
              res[key] = attrs[key];
          }
      }
      return res;
  };
  const isElementRoot = (vnode) => {
      return (vnode.shapeFlag & (6 /* COMPONENT */ | 1 /* ELEMENT */) ||
          vnode.type === Comment$1 // potential v-if branch switch
      );
  };
  function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
      const { props: prevProps, children: prevChildren, component } = prevVNode;
      const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
      const emits = component.emitsOptions;
      // Parent component's render function was hot-updated. Since this may have
      // caused the child component's slots content to have changed, we need to
      // force the child to update as well.
      if ((prevChildren || nextChildren) && isHmrUpdating) {
          return true;
      }
      // force child update for runtime directive or transition on component vnode.
      if (nextVNode.dirs || nextVNode.transition) {
          return true;
      }
      if (optimized && patchFlag >= 0) {
          if (patchFlag & 1024 /* DYNAMIC_SLOTS */) {
              // slot content that references values that might have changed,
              // e.g. in a v-for
              return true;
          }
          if (patchFlag & 16 /* FULL_PROPS */) {
              if (!prevProps) {
                  return !!nextProps;
              }
              // presence of this flag indicates props are always non-null
              return hasPropsChanged(prevProps, nextProps, emits);
          }
          else if (patchFlag & 8 /* PROPS */) {
              const dynamicProps = nextVNode.dynamicProps;
              for (let i = 0; i < dynamicProps.length; i++) {
                  const key = dynamicProps[i];
                  if (nextProps[key] !== prevProps[key] &&
                      !isEmitListener(emits, key)) {
                      return true;
                  }
              }
          }
      }
      else {
          // this path is only taken by manually written render functions
          // so presence of any children leads to a forced update
          if (prevChildren || nextChildren) {
              if (!nextChildren || !nextChildren.$stable) {
                  return true;
              }
          }
          if (prevProps === nextProps) {
              return false;
          }
          if (!prevProps) {
              return !!nextProps;
          }
          if (!nextProps) {
              return true;
          }
          return hasPropsChanged(prevProps, nextProps, emits);
      }
      return false;
  }
  function hasPropsChanged(prevProps, nextProps, emitsOptions) {
      const nextKeys = Object.keys(nextProps);
      if (nextKeys.length !== Object.keys(prevProps).length) {
          return true;
      }
      for (let i = 0; i < nextKeys.length; i++) {
          const key = nextKeys[i];
          if (nextProps[key] !== prevProps[key] &&
              !isEmitListener(emitsOptions, key)) {
              return true;
          }
      }
      return false;
  }
  function updateHOCHostEl({ vnode, parent }, el // HostNode
  ) {
      while (parent && parent.subTree === vnode) {
          (vnode = parent.vnode).el = el;
          parent = parent.parent;
      }
  }

  const isSuspense = (type) => type.__isSuspense;
  function queueEffectWithSuspense(fn, suspense) {
      if (suspense && suspense.pendingBranch) {
          if (isArray(fn)) {
              suspense.effects.push(...fn);
          }
          else {
              suspense.effects.push(fn);
          }
      }
      else {
          queuePostFlushCb(fn);
      }
  }

  function provide(key, value) {
      if (!currentInstance) {
          {
              warn$1(`provide() can only be used inside setup().`);
          }
      }
      else {
          let provides = currentInstance.provides;
          // by default an instance inherits its parent's provides object
          // but when it needs to provide values of its own, it creates its
          // own provides object using parent provides object as prototype.
          // this way in `inject` we can simply look up injections from direct
          // parent and let the prototype chain do the work.
          const parentProvides = currentInstance.parent && currentInstance.parent.provides;
          if (parentProvides === provides) {
              provides = currentInstance.provides = Object.create(parentProvides);
          }
          // TS doesn't allow symbol as index type
          provides[key] = value;
      }
  }
  function inject(key, defaultValue, treatDefaultAsFactory = false) {
      // fallback to `currentRenderingInstance` so that this can be called in
      // a functional component
      const instance = currentInstance || currentRenderingInstance;
      if (instance) {
          // #2400
          // to support `app.use` plugins,
          // fallback to appContext's `provides` if the intance is at root
          const provides = instance.parent == null
              ? instance.vnode.appContext && instance.vnode.appContext.provides
              : instance.parent.provides;
          if (provides && key in provides) {
              // TS doesn't allow symbol as index type
              return provides[key];
          }
          else if (arguments.length > 1) {
              return treatDefaultAsFactory && isFunction(defaultValue)
                  ? defaultValue.call(instance.proxy)
                  : defaultValue;
          }
          else {
              warn$1(`injection "${String(key)}" not found.`);
          }
      }
      else {
          warn$1(`inject() can only be used inside setup() or functional components.`);
      }
  }

  // implementation, close to no-op
  function defineComponent(options) {
      return isFunction(options) ? { setup: options, name: options.name } : options;
  }

  const isAsyncWrapper = (i) => !!i.type.__asyncLoader;

  const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
  function onActivated(hook, target) {
      registerKeepAliveHook(hook, "a" /* ACTIVATED */, target);
  }
  function onDeactivated(hook, target) {
      registerKeepAliveHook(hook, "da" /* DEACTIVATED */, target);
  }
  function registerKeepAliveHook(hook, type, target = currentInstance) {
      // cache the deactivate branch check wrapper for injected hooks so the same
      // hook can be properly deduped by the scheduler. "__wdc" stands for "with
      // deactivation check".
      const wrappedHook = hook.__wdc ||
          (hook.__wdc = () => {
              // only fire the hook if the target instance is NOT in a deactivated branch.
              let current = target;
              while (current) {
                  if (current.isDeactivated) {
                      return;
                  }
                  current = current.parent;
              }
              hook();
          });
      injectHook(type, wrappedHook, target);
      // In addition to registering it on the target instance, we walk up the parent
      // chain and register it on all ancestor instances that are keep-alive roots.
      // This avoids the need to walk the entire component tree when invoking these
      // hooks, and more importantly, avoids the need to track child components in
      // arrays.
      if (target) {
          let current = target.parent;
          while (current && current.parent) {
              if (isKeepAlive(current.parent.vnode)) {
                  injectToKeepAliveRoot(wrappedHook, type, target, current);
              }
              current = current.parent;
          }
      }
  }
  function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
      // injectHook wraps the original for error handling, so make sure to remove
      // the wrapped version.
      const injected = injectHook(type, hook, keepAliveRoot, true /* prepend */);
      onUnmounted(() => {
          remove(keepAliveRoot[type], injected);
      }, target);
  }

  function injectHook(type, hook, target = currentInstance, prepend = false) {
      if (target) {
          const hooks = target[type] || (target[type] = []);
          // cache the error handling wrapper for injected hooks so the same hook
          // can be properly deduped by the scheduler. "__weh" stands for "with error
          // handling".
          const wrappedHook = hook.__weh ||
              (hook.__weh = (...args) => {
                  if (target.isUnmounted) {
                      return;
                  }
                  // disable tracking inside all lifecycle hooks
                  // since they can potentially be called inside effects.
                  pauseTracking();
                  // Set currentInstance during hook invocation.
                  // This assumes the hook does not synchronously trigger other hooks, which
                  // can only be false when the user does something really funky.
                  setCurrentInstance(target);
                  const res = callWithAsyncErrorHandling(hook, target, type, args);
                  unsetCurrentInstance();
                  resetTracking();
                  return res;
              });
          if (prepend) {
              hooks.unshift(wrappedHook);
          }
          else {
              hooks.push(wrappedHook);
          }
          return wrappedHook;
      }
      else {
          const apiName = toHandlerKey(ErrorTypeStrings[type].replace(/ hook$/, ''));
          warn$1(`${apiName} is called when there is no active component instance to be ` +
              `associated with. ` +
              `Lifecycle injection APIs can only be used during execution of setup().` +
              (` If you are using async setup(), make sure to register lifecycle ` +
                      `hooks before the first await statement.`
                  ));
      }
  }
  const createHook = (lifecycle) => (hook, target = currentInstance) => 
  // post-create lifecycle registrations are noops during SSR (except for serverPrefetch)
  (!isInSSRComponentSetup || lifecycle === "sp" /* SERVER_PREFETCH */) &&
      injectHook(lifecycle, hook, target);
  const onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
  const onMounted = createHook("m" /* MOUNTED */);
  const onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
  const onUpdated = createHook("u" /* UPDATED */);
  const onBeforeUnmount = createHook("bum" /* BEFORE_UNMOUNT */);
  const onUnmounted = createHook("um" /* UNMOUNTED */);
  const onServerPrefetch = createHook("sp" /* SERVER_PREFETCH */);
  const onRenderTriggered = createHook("rtg" /* RENDER_TRIGGERED */);
  const onRenderTracked = createHook("rtc" /* RENDER_TRACKED */);
  function onErrorCaptured(hook, target = currentInstance) {
      injectHook("ec" /* ERROR_CAPTURED */, hook, target);
  }

  function createDuplicateChecker() {
      const cache = Object.create(null);
      return (type, key) => {
          if (cache[key]) {
              warn$1(`${type} property "${key}" is already defined in ${cache[key]}.`);
          }
          else {
              cache[key] = type;
          }
      };
  }
  let shouldCacheAccess = true;
  function applyOptions(instance) {
      const options = resolveMergedOptions(instance);
      const publicThis = instance.proxy;
      const ctx = instance.ctx;
      // do not cache property access on public proxy during state initialization
      shouldCacheAccess = false;
      // call beforeCreate first before accessing other options since
      // the hook may mutate resolved options (#2791)
      if (options.beforeCreate) {
          callHook(options.beforeCreate, instance, "bc" /* BEFORE_CREATE */);
      }
      const { 
      // state
      data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, 
      // lifecycle
      created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch, 
      // public API
      expose, inheritAttrs, 
      // assets
      components, directives, filters } = options;
      const checkDuplicateProperties = createDuplicateChecker() ;
      {
          const [propsOptions] = instance.propsOptions;
          if (propsOptions) {
              for (const key in propsOptions) {
                  checkDuplicateProperties("Props" /* PROPS */, key);
              }
          }
      }
      // options initialization order (to be consistent with Vue 2):
      // - props (already done outside of this function)
      // - inject
      // - methods
      // - data (deferred since it relies on `this` access)
      // - computed
      // - watch (deferred since it relies on `this` access)
      if (injectOptions) {
          resolveInjections(injectOptions, ctx, checkDuplicateProperties, instance.appContext.config.unwrapInjectedRef);
      }
      if (methods) {
          for (const key in methods) {
              const methodHandler = methods[key];
              if (isFunction(methodHandler)) {
                  // In dev mode, we use the `createRenderContext` function to define
                  // methods to the proxy target, and those are read-only but
                  // reconfigurable, so it needs to be redefined here
                  {
                      Object.defineProperty(ctx, key, {
                          value: methodHandler.bind(publicThis),
                          configurable: true,
                          enumerable: true,
                          writable: true
                      });
                  }
                  {
                      checkDuplicateProperties("Methods" /* METHODS */, key);
                  }
              }
              else {
                  warn$1(`Method "${key}" has type "${typeof methodHandler}" in the component definition. ` +
                      `Did you reference the function correctly?`);
              }
          }
      }
      if (dataOptions) {
          if (!isFunction(dataOptions)) {
              warn$1(`The data option must be a function. ` +
                  `Plain object usage is no longer supported.`);
          }
          const data = dataOptions.call(publicThis, publicThis);
          if (isPromise(data)) {
              warn$1(`data() returned a Promise - note data() cannot be async; If you ` +
                  `intend to perform data fetching before component renders, use ` +
                  `async setup() + <Suspense>.`);
          }
          if (!isObject(data)) {
              warn$1(`data() should return an object.`);
          }
          else {
              instance.data = reactive(data);
              {
                  for (const key in data) {
                      checkDuplicateProperties("Data" /* DATA */, key);
                      // expose data on ctx during dev
                      if (key[0] !== '$' && key[0] !== '_') {
                          Object.defineProperty(ctx, key, {
                              configurable: true,
                              enumerable: true,
                              get: () => data[key],
                              set: NOOP
                          });
                      }
                  }
              }
          }
      }
      // state initialization complete at this point - start caching access
      shouldCacheAccess = true;
      if (computedOptions) {
          for (const key in computedOptions) {
              const opt = computedOptions[key];
              const get = isFunction(opt)
                  ? opt.bind(publicThis, publicThis)
                  : isFunction(opt.get)
                      ? opt.get.bind(publicThis, publicThis)
                      : NOOP;
              if (get === NOOP) {
                  warn$1(`Computed property "${key}" has no getter.`);
              }
              const set = !isFunction(opt) && isFunction(opt.set)
                  ? opt.set.bind(publicThis)
                  : () => {
                          warn$1(`Write operation failed: computed property "${key}" is readonly.`);
                      }
                      ;
              const c = computed({
                  get,
                  set
              });
              Object.defineProperty(ctx, key, {
                  enumerable: true,
                  configurable: true,
                  get: () => c.value,
                  set: v => (c.value = v)
              });
              {
                  checkDuplicateProperties("Computed" /* COMPUTED */, key);
              }
          }
      }
      if (watchOptions) {
          for (const key in watchOptions) {
              createWatcher(watchOptions[key], ctx, publicThis, key);
          }
      }
      if (provideOptions) {
          const provides = isFunction(provideOptions)
              ? provideOptions.call(publicThis)
              : provideOptions;
          Reflect.ownKeys(provides).forEach(key => {
              provide(key, provides[key]);
          });
      }
      if (created) {
          callHook(created, instance, "c" /* CREATED */);
      }
      function registerLifecycleHook(register, hook) {
          if (isArray(hook)) {
              hook.forEach(_hook => register(_hook.bind(publicThis)));
          }
          else if (hook) {
              register(hook.bind(publicThis));
          }
      }
      registerLifecycleHook(onBeforeMount, beforeMount);
      registerLifecycleHook(onMounted, mounted);
      registerLifecycleHook(onBeforeUpdate, beforeUpdate);
      registerLifecycleHook(onUpdated, updated);
      registerLifecycleHook(onActivated, activated);
      registerLifecycleHook(onDeactivated, deactivated);
      registerLifecycleHook(onErrorCaptured, errorCaptured);
      registerLifecycleHook(onRenderTracked, renderTracked);
      registerLifecycleHook(onRenderTriggered, renderTriggered);
      registerLifecycleHook(onBeforeUnmount, beforeUnmount);
      registerLifecycleHook(onUnmounted, unmounted);
      registerLifecycleHook(onServerPrefetch, serverPrefetch);
      if (isArray(expose)) {
          if (expose.length) {
              const exposed = instance.exposed || (instance.exposed = {});
              expose.forEach(key => {
                  Object.defineProperty(exposed, key, {
                      get: () => publicThis[key],
                      set: val => (publicThis[key] = val)
                  });
              });
          }
          else if (!instance.exposed) {
              instance.exposed = {};
          }
      }
      // options that are handled when creating the instance but also need to be
      // applied from mixins
      if (render && instance.render === NOOP) {
          instance.render = render;
      }
      if (inheritAttrs != null) {
          instance.inheritAttrs = inheritAttrs;
      }
      // asset options.
      if (components)
          instance.components = components;
      if (directives)
          instance.directives = directives;
  }
  function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP, unwrapRef = false) {
      if (isArray(injectOptions)) {
          injectOptions = normalizeInject(injectOptions);
      }
      for (const key in injectOptions) {
          const opt = injectOptions[key];
          let injected;
          if (isObject(opt)) {
              if ('default' in opt) {
                  injected = inject(opt.from || key, opt.default, true /* treat default function as factory */);
              }
              else {
                  injected = inject(opt.from || key);
              }
          }
          else {
              injected = inject(opt);
          }
          if (isRef(injected)) {
              // TODO remove the check in 3.3
              if (unwrapRef) {
                  Object.defineProperty(ctx, key, {
                      enumerable: true,
                      configurable: true,
                      get: () => injected.value,
                      set: v => (injected.value = v)
                  });
              }
              else {
                  {
                      warn$1(`injected property "${key}" is a ref and will be auto-unwrapped ` +
                          `and no longer needs \`.value\` in the next minor release. ` +
                          `To opt-in to the new behavior now, ` +
                          `set \`app.config.unwrapInjectedRef = true\` (this config is ` +
                          `temporary and will not be needed in the future.)`);
                  }
                  ctx[key] = injected;
              }
          }
          else {
              ctx[key] = injected;
          }
          {
              checkDuplicateProperties("Inject" /* INJECT */, key);
          }
      }
  }
  function callHook(hook, instance, type) {
      callWithAsyncErrorHandling(isArray(hook)
          ? hook.map(h => h.bind(instance.proxy))
          : hook.bind(instance.proxy), instance, type);
  }
  function createWatcher(raw, ctx, publicThis, key) {
      const getter = key.includes('.')
          ? createPathGetter(publicThis, key)
          : () => publicThis[key];
      if (isString(raw)) {
          const handler = ctx[raw];
          if (isFunction(handler)) {
              watch(getter, handler);
          }
          else {
              warn$1(`Invalid watch handler specified by key "${raw}"`, handler);
          }
      }
      else if (isFunction(raw)) {
          watch(getter, raw.bind(publicThis));
      }
      else if (isObject(raw)) {
          if (isArray(raw)) {
              raw.forEach(r => createWatcher(r, ctx, publicThis, key));
          }
          else {
              const handler = isFunction(raw.handler)
                  ? raw.handler.bind(publicThis)
                  : ctx[raw.handler];
              if (isFunction(handler)) {
                  watch(getter, handler, raw);
              }
              else {
                  warn$1(`Invalid watch handler specified by key "${raw.handler}"`, handler);
              }
          }
      }
      else {
          warn$1(`Invalid watch option: "${key}"`, raw);
      }
  }
  /**
   * Resolve merged options and cache it on the component.
   * This is done only once per-component since the merging does not involve
   * instances.
   */
  function resolveMergedOptions(instance) {
      const base = instance.type;
      const { mixins, extends: extendsOptions } = base;
      const { mixins: globalMixins, optionsCache: cache, config: { optionMergeStrategies } } = instance.appContext;
      const cached = cache.get(base);
      let resolved;
      if (cached) {
          resolved = cached;
      }
      else if (!globalMixins.length && !mixins && !extendsOptions) {
          {
              resolved = base;
          }
      }
      else {
          resolved = {};
          if (globalMixins.length) {
              globalMixins.forEach(m => mergeOptions(resolved, m, optionMergeStrategies, true));
          }
          mergeOptions(resolved, base, optionMergeStrategies);
      }
      cache.set(base, resolved);
      return resolved;
  }
  function mergeOptions(to, from, strats, asMixin = false) {
      const { mixins, extends: extendsOptions } = from;
      if (extendsOptions) {
          mergeOptions(to, extendsOptions, strats, true);
      }
      if (mixins) {
          mixins.forEach((m) => mergeOptions(to, m, strats, true));
      }
      for (const key in from) {
          if (asMixin && key === 'expose') {
              warn$1(`"expose" option is ignored when declared in mixins or extends. ` +
                      `It should only be declared in the base component itself.`);
          }
          else {
              const strat = internalOptionMergeStrats[key] || (strats && strats[key]);
              to[key] = strat ? strat(to[key], from[key]) : from[key];
          }
      }
      return to;
  }
  const internalOptionMergeStrats = {
      data: mergeDataFn,
      props: mergeObjectOptions,
      emits: mergeObjectOptions,
      // objects
      methods: mergeObjectOptions,
      computed: mergeObjectOptions,
      // lifecycle
      beforeCreate: mergeAsArray,
      created: mergeAsArray,
      beforeMount: mergeAsArray,
      mounted: mergeAsArray,
      beforeUpdate: mergeAsArray,
      updated: mergeAsArray,
      beforeDestroy: mergeAsArray,
      destroyed: mergeAsArray,
      activated: mergeAsArray,
      deactivated: mergeAsArray,
      errorCaptured: mergeAsArray,
      serverPrefetch: mergeAsArray,
      // assets
      components: mergeObjectOptions,
      directives: mergeObjectOptions,
      // watch
      watch: mergeWatchOptions,
      // provide / inject
      provide: mergeDataFn,
      inject: mergeInject
  };
  function mergeDataFn(to, from) {
      if (!from) {
          return to;
      }
      if (!to) {
          return from;
      }
      return function mergedDataFn() {
          return (extend)(isFunction(to) ? to.call(this, this) : to, isFunction(from) ? from.call(this, this) : from);
      };
  }
  function mergeInject(to, from) {
      return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
  }
  function normalizeInject(raw) {
      if (isArray(raw)) {
          const res = {};
          for (let i = 0; i < raw.length; i++) {
              res[raw[i]] = raw[i];
          }
          return res;
      }
      return raw;
  }
  function mergeAsArray(to, from) {
      return to ? [...new Set([].concat(to, from))] : from;
  }
  function mergeObjectOptions(to, from) {
      return to ? extend(extend(Object.create(null), to), from) : from;
  }
  function mergeWatchOptions(to, from) {
      if (!to)
          return from;
      if (!from)
          return to;
      const merged = extend(Object.create(null), to);
      for (const key in from) {
          merged[key] = mergeAsArray(to[key], from[key]);
      }
      return merged;
  }

  function initProps(instance, rawProps, isStateful, // result of bitwise flag comparison
  isSSR = false) {
      const props = {};
      const attrs = {};
      def(attrs, InternalObjectKey, 1);
      instance.propsDefaults = Object.create(null);
      setFullProps(instance, rawProps, props, attrs);
      // ensure all declared prop keys are present
      for (const key in instance.propsOptions[0]) {
          if (!(key in props)) {
              props[key] = undefined;
          }
      }
      // validation
      {
          validateProps(rawProps || {}, props, instance);
      }
      if (isStateful) {
          // stateful
          instance.props = isSSR ? props : shallowReactive(props);
      }
      else {
          if (!instance.type.props) {
              // functional w/ optional props, props === attrs
              instance.props = attrs;
          }
          else {
              // functional w/ declared props
              instance.props = props;
          }
      }
      instance.attrs = attrs;
  }
  function updateProps(instance, rawProps, rawPrevProps, optimized) {
      const { props, attrs, vnode: { patchFlag } } = instance;
      const rawCurrentProps = toRaw(props);
      const [options] = instance.propsOptions;
      let hasAttrsChanged = false;
      if (
      // always force full diff in dev
      // - #1942 if hmr is enabled with sfc component
      // - vite#872 non-sfc component used by sfc component
      !((instance.type.__hmrId ||
              (instance.parent && instance.parent.type.__hmrId))) &&
          (optimized || patchFlag > 0) &&
          !(patchFlag & 16 /* FULL_PROPS */)) {
          if (patchFlag & 8 /* PROPS */) {
              // Compiler-generated props & no keys change, just set the updated
              // the props.
              const propsToUpdate = instance.vnode.dynamicProps;
              for (let i = 0; i < propsToUpdate.length; i++) {
                  let key = propsToUpdate[i];
                  // PROPS flag guarantees rawProps to be non-null
                  const value = rawProps[key];
                  if (options) {
                      // attr / props separation was done on init and will be consistent
                      // in this code path, so just check if attrs have it.
                      if (hasOwn(attrs, key)) {
                          if (value !== attrs[key]) {
                              attrs[key] = value;
                              hasAttrsChanged = true;
                          }
                      }
                      else {
                          const camelizedKey = camelize(key);
                          props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false /* isAbsent */);
                      }
                  }
                  else {
                      if (value !== attrs[key]) {
                          attrs[key] = value;
                          hasAttrsChanged = true;
                      }
                  }
              }
          }
      }
      else {
          // full props update.
          if (setFullProps(instance, rawProps, props, attrs)) {
              hasAttrsChanged = true;
          }
          // in case of dynamic props, check if we need to delete keys from
          // the props object
          let kebabKey;
          for (const key in rawCurrentProps) {
              if (!rawProps ||
                  // for camelCase
                  (!hasOwn(rawProps, key) &&
                      // it's possible the original props was passed in as kebab-case
                      // and converted to camelCase (#955)
                      ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey)))) {
                  if (options) {
                      if (rawPrevProps &&
                          // for camelCase
                          (rawPrevProps[key] !== undefined ||
                              // for kebab-case
                              rawPrevProps[kebabKey] !== undefined)) {
                          props[key] = resolvePropValue(options, rawCurrentProps, key, undefined, instance, true /* isAbsent */);
                      }
                  }
                  else {
                      delete props[key];
                  }
              }
          }
          // in the case of functional component w/o props declaration, props and
          // attrs point to the same object so it should already have been updated.
          if (attrs !== rawCurrentProps) {
              for (const key in attrs) {
                  if (!rawProps || !hasOwn(rawProps, key)) {
                      delete attrs[key];
                      hasAttrsChanged = true;
                  }
              }
          }
      }
      // trigger updates for $attrs in case it's used in component slots
      if (hasAttrsChanged) {
          trigger(instance, "set" /* SET */, '$attrs');
      }
      {
          validateProps(rawProps || {}, props, instance);
      }
  }
  function setFullProps(instance, rawProps, props, attrs) {
      const [options, needCastKeys] = instance.propsOptions;
      let hasAttrsChanged = false;
      let rawCastValues;
      if (rawProps) {
          for (let key in rawProps) {
              // key, ref are reserved and never passed down
              if (isReservedProp(key)) {
                  continue;
              }
              const value = rawProps[key];
              // prop option names are camelized during normalization, so to support
              // kebab -> camel conversion here we need to camelize the key.
              let camelKey;
              if (options && hasOwn(options, (camelKey = camelize(key)))) {
                  if (!needCastKeys || !needCastKeys.includes(camelKey)) {
                      props[camelKey] = value;
                  }
                  else {
                      (rawCastValues || (rawCastValues = {}))[camelKey] = value;
                  }
              }
              else if (!isEmitListener(instance.emitsOptions, key)) {
                  if (value !== attrs[key]) {
                      attrs[key] = value;
                      hasAttrsChanged = true;
                  }
              }
          }
      }
      if (needCastKeys) {
          const rawCurrentProps = toRaw(props);
          const castValues = rawCastValues || EMPTY_OBJ;
          for (let i = 0; i < needCastKeys.length; i++) {
              const key = needCastKeys[i];
              props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
          }
      }
      return hasAttrsChanged;
  }
  function resolvePropValue(options, props, key, value, instance, isAbsent) {
      const opt = options[key];
      if (opt != null) {
          const hasDefault = hasOwn(opt, 'default');
          // default values
          if (hasDefault && value === undefined) {
              const defaultValue = opt.default;
              if (opt.type !== Function && isFunction(defaultValue)) {
                  const { propsDefaults } = instance;
                  if (key in propsDefaults) {
                      value = propsDefaults[key];
                  }
                  else {
                      setCurrentInstance(instance);
                      value = propsDefaults[key] = defaultValue.call(null, props);
                      unsetCurrentInstance();
                  }
              }
              else {
                  value = defaultValue;
              }
          }
          // boolean casting
          if (opt[0 /* shouldCast */]) {
              if (isAbsent && !hasDefault) {
                  value = false;
              }
              else if (opt[1 /* shouldCastTrue */] &&
                  (value === '' || value === hyphenate(key))) {
                  value = true;
              }
          }
      }
      return value;
  }
  function normalizePropsOptions(comp, appContext, asMixin = false) {
      const cache = appContext.propsCache;
      const cached = cache.get(comp);
      if (cached) {
          return cached;
      }
      const raw = comp.props;
      const normalized = {};
      const needCastKeys = [];
      // apply mixin/extends props
      let hasExtends = false;
      if (!isFunction(comp)) {
          const extendProps = (raw) => {
              hasExtends = true;
              const [props, keys] = normalizePropsOptions(raw, appContext, true);
              extend(normalized, props);
              if (keys)
                  needCastKeys.push(...keys);
          };
          if (!asMixin && appContext.mixins.length) {
              appContext.mixins.forEach(extendProps);
          }
          if (comp.extends) {
              extendProps(comp.extends);
          }
          if (comp.mixins) {
              comp.mixins.forEach(extendProps);
          }
      }
      if (!raw && !hasExtends) {
          cache.set(comp, EMPTY_ARR);
          return EMPTY_ARR;
      }
      if (isArray(raw)) {
          for (let i = 0; i < raw.length; i++) {
              if (!isString(raw[i])) {
                  warn$1(`props must be strings when using array syntax.`, raw[i]);
              }
              const normalizedKey = camelize(raw[i]);
              if (validatePropName(normalizedKey)) {
                  normalized[normalizedKey] = EMPTY_OBJ;
              }
          }
      }
      else if (raw) {
          if (!isObject(raw)) {
              warn$1(`invalid props options`, raw);
          }
          for (const key in raw) {
              const normalizedKey = camelize(key);
              if (validatePropName(normalizedKey)) {
                  const opt = raw[key];
                  const prop = (normalized[normalizedKey] =
                      isArray(opt) || isFunction(opt) ? { type: opt } : opt);
                  if (prop) {
                      const booleanIndex = getTypeIndex(Boolean, prop.type);
                      const stringIndex = getTypeIndex(String, prop.type);
                      prop[0 /* shouldCast */] = booleanIndex > -1;
                      prop[1 /* shouldCastTrue */] =
                          stringIndex < 0 || booleanIndex < stringIndex;
                      // if the prop needs boolean casting or default value
                      if (booleanIndex > -1 || hasOwn(prop, 'default')) {
                          needCastKeys.push(normalizedKey);
                      }
                  }
              }
          }
      }
      const res = [normalized, needCastKeys];
      cache.set(comp, res);
      return res;
  }
  function validatePropName(key) {
      if (key[0] !== '$') {
          return true;
      }
      else {
          warn$1(`Invalid prop name: "${key}" is a reserved property.`);
      }
      return false;
  }
  // use function string name to check type constructors
  // so that it works across vms / iframes.
  function getType(ctor) {
      const match = ctor && ctor.toString().match(/^\s*function (\w+)/);
      return match ? match[1] : ctor === null ? 'null' : '';
  }
  function isSameType(a, b) {
      return getType(a) === getType(b);
  }
  function getTypeIndex(type, expectedTypes) {
      if (isArray(expectedTypes)) {
          return expectedTypes.findIndex(t => isSameType(t, type));
      }
      else if (isFunction(expectedTypes)) {
          return isSameType(expectedTypes, type) ? 0 : -1;
      }
      return -1;
  }
  /**
   * dev only
   */
  function validateProps(rawProps, props, instance) {
      const resolvedValues = toRaw(props);
      const options = instance.propsOptions[0];
      for (const key in options) {
          let opt = options[key];
          if (opt == null)
              continue;
          validateProp(key, resolvedValues[key], opt, !hasOwn(rawProps, key) && !hasOwn(rawProps, hyphenate(key)));
      }
  }
  /**
   * dev only
   */
  function validateProp(name, value, prop, isAbsent) {
      const { type, required, validator } = prop;
      // required!
      if (required && isAbsent) {
          warn$1('Missing required prop: "' + name + '"');
          return;
      }
      // missing but optional
      if (value == null && !prop.required) {
          return;
      }
      // type check
      if (type != null && type !== true) {
          let isValid = false;
          const types = isArray(type) ? type : [type];
          const expectedTypes = [];
          // value is valid as long as one of the specified types match
          for (let i = 0; i < types.length && !isValid; i++) {
              const { valid, expectedType } = assertType(value, types[i]);
              expectedTypes.push(expectedType || '');
              isValid = valid;
          }
          if (!isValid) {
              warn$1(getInvalidTypeMessage(name, value, expectedTypes));
              return;
          }
      }
      // custom validator
      if (validator && !validator(value)) {
          warn$1('Invalid prop: custom validator check failed for prop "' + name + '".');
      }
  }
  const isSimpleType = /*#__PURE__*/ makeMap('String,Number,Boolean,Function,Symbol,BigInt');
  /**
   * dev only
   */
  function assertType(value, type) {
      let valid;
      const expectedType = getType(type);
      if (isSimpleType(expectedType)) {
          const t = typeof value;
          valid = t === expectedType.toLowerCase();
          // for primitive wrapper objects
          if (!valid && t === 'object') {
              valid = value instanceof type;
          }
      }
      else if (expectedType === 'Object') {
          valid = isObject(value);
      }
      else if (expectedType === 'Array') {
          valid = isArray(value);
      }
      else if (expectedType === 'null') {
          valid = value === null;
      }
      else {
          valid = value instanceof type;
      }
      return {
          valid,
          expectedType
      };
  }
  /**
   * dev only
   */
  function getInvalidTypeMessage(name, value, expectedTypes) {
      let message = `Invalid prop: type check failed for prop "${name}".` +
          ` Expected ${expectedTypes.map(capitalize).join(' | ')}`;
      const expectedType = expectedTypes[0];
      const receivedType = toRawType(value);
      const expectedValue = styleValue(value, expectedType);
      const receivedValue = styleValue(value, receivedType);
      // check if we need to specify expected value
      if (expectedTypes.length === 1 &&
          isExplicable(expectedType) &&
          !isBoolean(expectedType, receivedType)) {
          message += ` with value ${expectedValue}`;
      }
      message += `, got ${receivedType} `;
      // check if we need to specify received value
      if (isExplicable(receivedType)) {
          message += `with value ${receivedValue}.`;
      }
      return message;
  }
  /**
   * dev only
   */
  function styleValue(value, type) {
      if (type === 'String') {
          return `"${value}"`;
      }
      else if (type === 'Number') {
          return `${Number(value)}`;
      }
      else {
          return `${value}`;
      }
  }
  /**
   * dev only
   */
  function isExplicable(type) {
      const explicitTypes = ['string', 'number', 'boolean'];
      return explicitTypes.some(elem => type.toLowerCase() === elem);
  }
  /**
   * dev only
   */
  function isBoolean(...args) {
      return args.some(elem => elem.toLowerCase() === 'boolean');
  }

  const isInternalKey = (key) => key[0] === '_' || key === '$stable';
  const normalizeSlotValue = (value) => isArray(value)
      ? value.map(normalizeVNode)
      : [normalizeVNode(value)];
  const normalizeSlot = (key, rawSlot, ctx) => {
      const normalized = withCtx((...args) => {
          if (currentInstance) {
              warn$1(`Slot "${key}" invoked outside of the render function: ` +
                  `this will not track dependencies used in the slot. ` +
                  `Invoke the slot function inside the render function instead.`);
          }
          return normalizeSlotValue(rawSlot(...args));
      }, ctx);
      normalized._c = false;
      return normalized;
  };
  const normalizeObjectSlots = (rawSlots, slots, instance) => {
      const ctx = rawSlots._ctx;
      for (const key in rawSlots) {
          if (isInternalKey(key))
              continue;
          const value = rawSlots[key];
          if (isFunction(value)) {
              slots[key] = normalizeSlot(key, value, ctx);
          }
          else if (value != null) {
              {
                  warn$1(`Non-function value encountered for slot "${key}". ` +
                      `Prefer function slots for better performance.`);
              }
              const normalized = normalizeSlotValue(value);
              slots[key] = () => normalized;
          }
      }
  };
  const normalizeVNodeSlots = (instance, children) => {
      if (!isKeepAlive(instance.vnode) &&
          !(false )) {
          warn$1(`Non-function value encountered for default slot. ` +
              `Prefer function slots for better performance.`);
      }
      const normalized = normalizeSlotValue(children);
      instance.slots.default = () => normalized;
  };
  const initSlots = (instance, children) => {
      if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
          const type = children._;
          if (type) {
              // users can get the shallow readonly version of the slots object through `this.$slots`,
              // we should avoid the proxy object polluting the slots of the internal instance
              instance.slots = toRaw(children);
              // make compiler marker non-enumerable
              def(children, '_', type);
          }
          else {
              normalizeObjectSlots(children, (instance.slots = {}));
          }
      }
      else {
          instance.slots = {};
          if (children) {
              normalizeVNodeSlots(instance, children);
          }
      }
      def(instance.slots, InternalObjectKey, 1);
  };
  const updateSlots = (instance, children, optimized) => {
      const { vnode, slots } = instance;
      let needDeletionCheck = true;
      let deletionComparisonTarget = EMPTY_OBJ;
      if (vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
          const type = children._;
          if (type) {
              // compiled slots.
              if (isHmrUpdating) {
                  // Parent was HMR updated so slot content may have changed.
                  // force update slots and mark instance for hmr as well
                  extend(slots, children);
              }
              else if (optimized && type === 1 /* STABLE */) {
                  // compiled AND stable.
                  // no need to update, and skip stale slots removal.
                  needDeletionCheck = false;
              }
              else {
                  // compiled but dynamic (v-if/v-for on slots) - update slots, but skip
                  // normalization.
                  extend(slots, children);
                  // #2893
                  // when rendering the optimized slots by manually written render function,
                  // we need to delete the `slots._` flag if necessary to make subsequent updates reliable,
                  // i.e. let the `renderSlot` create the bailed Fragment
                  if (!optimized && type === 1 /* STABLE */) {
                      delete slots._;
                  }
              }
          }
          else {
              needDeletionCheck = !children.$stable;
              normalizeObjectSlots(children, slots);
          }
          deletionComparisonTarget = children;
      }
      else if (children) {
          // non slot object children (direct value) passed to a component
          normalizeVNodeSlots(instance, children);
          deletionComparisonTarget = { default: 1 };
      }
      // delete stale slots
      if (needDeletionCheck) {
          for (const key in slots) {
              if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
                  delete slots[key];
              }
          }
      }
  };

  /**
  Runtime helper for applying directives to a vnode. Example usage:

  const comp = resolveComponent('comp')
  const foo = resolveDirective('foo')
  const bar = resolveDirective('bar')

  return withDirectives(h(comp), [
    [foo, this.x],
    [bar, this.y]
  ])
  */
  const isBuiltInDirective = /*#__PURE__*/ makeMap('bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text');
  function validateDirectiveName(name) {
      if (isBuiltInDirective(name)) {
          warn$1('Do not use built-in directive ids as custom directive id: ' + name);
      }
  }
  function invokeDirectiveHook(vnode, prevVNode, instance, name) {
      const bindings = vnode.dirs;
      const oldBindings = prevVNode && prevVNode.dirs;
      for (let i = 0; i < bindings.length; i++) {
          const binding = bindings[i];
          if (oldBindings) {
              binding.oldValue = oldBindings[i].value;
          }
          let hook = binding.dir[name];
          if (hook) {
              // disable tracking inside all lifecycle hooks
              // since they can potentially be called inside effects.
              pauseTracking();
              callWithAsyncErrorHandling(hook, instance, 8 /* DIRECTIVE_HOOK */, [
                  vnode.el,
                  binding,
                  vnode,
                  prevVNode
              ]);
              resetTracking();
          }
      }
  }

  function createAppContext() {
      return {
          app: null,
          config: {
              isNativeTag: NO,
              performance: false,
              globalProperties: {},
              optionMergeStrategies: {},
              errorHandler: undefined,
              warnHandler: undefined,
              compilerOptions: {}
          },
          mixins: [],
          components: {},
          directives: {},
          provides: Object.create(null),
          optionsCache: new WeakMap(),
          propsCache: new WeakMap(),
          emitsCache: new WeakMap()
      };
  }
  let uid = 0;
  function createAppAPI(render, hydrate) {
      return function createApp(rootComponent, rootProps = null) {
          if (rootProps != null && !isObject(rootProps)) {
              warn$1(`root props passed to app.mount() must be an object.`);
              rootProps = null;
          }
          const context = createAppContext();
          const installedPlugins = new Set();
          let isMounted = false;
          const app = (context.app = {
              _uid: uid++,
              _component: rootComponent,
              _props: rootProps,
              _container: null,
              _context: context,
              _instance: null,
              version,
              get config() {
                  return context.config;
              },
              set config(v) {
                  {
                      warn$1(`app.config cannot be replaced. Modify individual options instead.`);
                  }
              },
              use(plugin, ...options) {
                  if (installedPlugins.has(plugin)) {
                      warn$1(`Plugin has already been applied to target app.`);
                  }
                  else if (plugin && isFunction(plugin.install)) {
                      installedPlugins.add(plugin);
                      plugin.install(app, ...options);
                  }
                  else if (isFunction(plugin)) {
                      installedPlugins.add(plugin);
                      plugin(app, ...options);
                  }
                  else {
                      warn$1(`A plugin must either be a function or an object with an "install" ` +
                          `function.`);
                  }
                  return app;
              },
              mixin(mixin) {
                  {
                      if (!context.mixins.includes(mixin)) {
                          context.mixins.push(mixin);
                      }
                      else {
                          warn$1('Mixin has already been applied to target app' +
                              (mixin.name ? `: ${mixin.name}` : ''));
                      }
                  }
                  return app;
              },
              component(name, component) {
                  {
                      validateComponentName(name, context.config);
                  }
                  if (!component) {
                      return context.components[name];
                  }
                  if (context.components[name]) {
                      warn$1(`Component "${name}" has already been registered in target app.`);
                  }
                  context.components[name] = component;
                  return app;
              },
              directive(name, directive) {
                  {
                      validateDirectiveName(name);
                  }
                  if (!directive) {
                      return context.directives[name];
                  }
                  if (context.directives[name]) {
                      warn$1(`Directive "${name}" has already been registered in target app.`);
                  }
                  context.directives[name] = directive;
                  return app;
              },
              mount(rootContainer, isHydrate, isSVG) {
                  if (!isMounted) {
                      const vnode = createVNode(rootComponent, rootProps);
                      // store app context on the root VNode.
                      // this will be set on the root instance on initial mount.
                      vnode.appContext = context;
                      // HMR root reload
                      {
                          context.reload = () => {
                              render(cloneVNode(vnode), rootContainer, isSVG);
                          };
                      }
                      if (isHydrate && hydrate) {
                          hydrate(vnode, rootContainer);
                      }
                      else {
                          render(vnode, rootContainer, isSVG);
                      }
                      isMounted = true;
                      app._container = rootContainer;
                      rootContainer.__vue_app__ = app;
                      {
                          app._instance = vnode.component;
                          devtoolsInitApp(app, version);
                      }
                      return vnode.component.proxy;
                  }
                  else {
                      warn$1(`App has already been mounted.\n` +
                          `If you want to remount the same app, move your app creation logic ` +
                          `into a factory function and create fresh app instances for each ` +
                          `mount - e.g. \`const createMyApp = () => createApp(App)\``);
                  }
              },
              unmount() {
                  if (isMounted) {
                      render(null, app._container);
                      {
                          app._instance = null;
                          devtoolsUnmountApp(app);
                      }
                      delete app._container.__vue_app__;
                  }
                  else {
                      warn$1(`Cannot unmount an app that is not mounted.`);
                  }
              },
              provide(key, value) {
                  if (key in context.provides) {
                      warn$1(`App already provides property with key "${String(key)}". ` +
                          `It will be overwritten with the new value.`);
                  }
                  // TypeScript doesn't allow symbols as index type
                  // https://github.com/Microsoft/TypeScript/issues/24587
                  context.provides[key] = value;
                  return app;
              }
          });
          return app;
      };
  }

  let supported;
  let perf;
  function startMeasure(instance, type) {
      if (instance.appContext.config.performance && isSupported()) {
          perf.mark(`vue-${type}-${instance.uid}`);
      }
      {
          devtoolsPerfStart(instance, type, supported ? perf.now() : Date.now());
      }
  }
  function endMeasure(instance, type) {
      if (instance.appContext.config.performance && isSupported()) {
          const startTag = `vue-${type}-${instance.uid}`;
          const endTag = startTag + `:end`;
          perf.mark(endTag);
          perf.measure(`<${formatComponentName(instance, instance.type)}> ${type}`, startTag, endTag);
          perf.clearMarks(startTag);
          perf.clearMarks(endTag);
      }
      {
          devtoolsPerfEnd(instance, type, supported ? perf.now() : Date.now());
      }
  }
  function isSupported() {
      if (supported !== undefined) {
          return supported;
      }
      /* eslint-disable no-restricted-globals */
      if (typeof window !== 'undefined' && window.performance) {
          supported = true;
          perf = window.performance;
      }
      else {
          supported = false;
      }
      /* eslint-enable no-restricted-globals */
      return supported;
  }

  const queuePostRenderEffect = queueEffectWithSuspense
      ;
  /**
   * The createRenderer function accepts two generic arguments:
   * HostNode and HostElement, corresponding to Node and Element types in the
   * host environment. For example, for runtime-dom, HostNode would be the DOM
   * `Node` interface and HostElement would be the DOM `Element` interface.
   *
   * Custom renderers can pass in the platform specific types like this:
   *
   * ``` js
   * const { render, createApp } = createRenderer<Node, Element>({
   *   patchProp,
   *   ...nodeOps
   * })
   * ```
   */
  function createRenderer(options) {
      return baseCreateRenderer(options);
  }
  // implementation
  function baseCreateRenderer(options, createHydrationFns) {
      {
          const target = getGlobalThis();
          target.__VUE__ = true;
          setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__);
      }
      const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, cloneNode: hostCloneNode, insertStaticContent: hostInsertStaticContent } = options;
      // Note: functions inside this closure should use `const xxx = () => {}`
      // style in order to prevent being inlined by minifiers.
      const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, slotScopeIds = null, optimized = isHmrUpdating ? false : !!n2.dynamicChildren) => {
          if (n1 === n2) {
              return;
          }
          // patching & not same type, unmount old tree
          if (n1 && !isSameVNodeType(n1, n2)) {
              anchor = getNextHostNode(n1);
              unmount(n1, parentComponent, parentSuspense, true);
              n1 = null;
          }
          if (n2.patchFlag === -2 /* BAIL */) {
              optimized = false;
              n2.dynamicChildren = null;
          }
          const { type, ref, shapeFlag } = n2;
          switch (type) {
              case Text:
                  processText(n1, n2, container, anchor);
                  break;
              case Comment$1:
                  processCommentNode(n1, n2, container, anchor);
                  break;
              case Static:
                  if (n1 == null) {
                      mountStaticNode(n2, container, anchor, isSVG);
                  }
                  else {
                      patchStaticNode(n1, n2, container, isSVG);
                  }
                  break;
              case Fragment:
                  processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  break;
              default:
                  if (shapeFlag & 1 /* ELEMENT */) {
                      processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  }
                  else if (shapeFlag & 6 /* COMPONENT */) {
                      processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  }
                  else if (shapeFlag & 64 /* TELEPORT */) {
                      type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
                  }
                  else if (shapeFlag & 128 /* SUSPENSE */) {
                      type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
                  }
                  else {
                      warn$1('Invalid VNode type:', type, `(${typeof type})`);
                  }
          }
          // set ref
          if (ref != null && parentComponent) {
              setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
          }
      };
      const processText = (n1, n2, container, anchor) => {
          if (n1 == null) {
              hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
          }
          else {
              const el = (n2.el = n1.el);
              if (n2.children !== n1.children) {
                  hostSetText(el, n2.children);
              }
          }
      };
      const processCommentNode = (n1, n2, container, anchor) => {
          if (n1 == null) {
              hostInsert((n2.el = hostCreateComment(n2.children || '')), container, anchor);
          }
          else {
              // there's no support for dynamic comments
              n2.el = n1.el;
          }
      };
      const mountStaticNode = (n2, container, anchor, isSVG) => {
          [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG);
      };
      /**
       * Dev / HMR only
       */
      const patchStaticNode = (n1, n2, container, isSVG) => {
          // static nodes are only patched during dev for HMR
          if (n2.children !== n1.children) {
              const anchor = hostNextSibling(n1.anchor);
              // remove existing
              removeStaticNode(n1);
              [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG);
          }
          else {
              n2.el = n1.el;
              n2.anchor = n1.anchor;
          }
      };
      const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
          let next;
          while (el && el !== anchor) {
              next = hostNextSibling(el);
              hostInsert(el, container, nextSibling);
              el = next;
          }
          hostInsert(anchor, container, nextSibling);
      };
      const removeStaticNode = ({ el, anchor }) => {
          let next;
          while (el && el !== anchor) {
              next = hostNextSibling(el);
              hostRemove(el);
              el = next;
          }
          hostRemove(anchor);
      };
      const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
          isSVG = isSVG || n2.type === 'svg';
          if (n1 == null) {
              mountElement(n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
          }
          else {
              patchElement(n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
          }
      };
      const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
          let el;
          let vnodeHook;
          const { type, props, shapeFlag, transition, patchFlag, dirs } = vnode;
          {
              el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is, props);
              // mount children first, since some props may rely on child content
              // being already rendered, e.g. `<select value>`
              if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                  hostSetElementText(el, vnode.children);
              }
              else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                  mountChildren(vnode.children, el, null, parentComponent, parentSuspense, isSVG && type !== 'foreignObject', slotScopeIds, optimized);
              }
              if (dirs) {
                  invokeDirectiveHook(vnode, null, parentComponent, 'created');
              }
              // props
              if (props) {
                  for (const key in props) {
                      if (key !== 'value' && !isReservedProp(key)) {
                          hostPatchProp(el, key, null, props[key], isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                      }
                  }
                  /**
                   * Special case for setting value on DOM elements:
                   * - it can be order-sensitive (e.g. should be set *after* min/max, #2325, #4024)
                   * - it needs to be forced (#1471)
                   * #2353 proposes adding another renderer option to configure this, but
                   * the properties affects are so finite it is worth special casing it
                   * here to reduce the complexity. (Special casing it also should not
                   * affect non-DOM renderers)
                   */
                  if ('value' in props) {
                      hostPatchProp(el, 'value', null, props.value);
                  }
                  if ((vnodeHook = props.onVnodeBeforeMount)) {
                      invokeVNodeHook(vnodeHook, parentComponent, vnode);
                  }
              }
              // scopeId
              setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
          }
          {
              Object.defineProperty(el, '__vnode', {
                  value: vnode,
                  enumerable: false
              });
              Object.defineProperty(el, '__vueParentComponent', {
                  value: parentComponent,
                  enumerable: false
              });
          }
          if (dirs) {
              invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
          }
          // #1583 For inside suspense + suspense not resolved case, enter hook should call when suspense resolved
          // #1689 For inside suspense + suspense resolved case, just call it
          const needCallTransitionHooks = (!parentSuspense || (parentSuspense && !parentSuspense.pendingBranch)) &&
              transition &&
              !transition.persisted;
          if (needCallTransitionHooks) {
              transition.beforeEnter(el);
          }
          hostInsert(el, container, anchor);
          if ((vnodeHook = props && props.onVnodeMounted) ||
              needCallTransitionHooks ||
              dirs) {
              queuePostRenderEffect(() => {
                  vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                  needCallTransitionHooks && transition.enter(el);
                  dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
              }, parentSuspense);
          }
      };
      const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
          if (scopeId) {
              hostSetScopeId(el, scopeId);
          }
          if (slotScopeIds) {
              for (let i = 0; i < slotScopeIds.length; i++) {
                  hostSetScopeId(el, slotScopeIds[i]);
              }
          }
          if (parentComponent) {
              let subTree = parentComponent.subTree;
              if (subTree.patchFlag > 0 &&
                  subTree.patchFlag & 2048 /* DEV_ROOT_FRAGMENT */) {
                  subTree =
                      filterSingleRoot(subTree.children) || subTree;
              }
              if (vnode === subTree) {
                  const parentVNode = parentComponent.vnode;
                  setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
              }
          }
      };
      const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, start = 0) => {
          for (let i = start; i < children.length; i++) {
              const child = (children[i] = optimized
                  ? cloneIfMounted(children[i])
                  : normalizeVNode(children[i]));
              patch(null, child, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
          }
      };
      const patchElement = (n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
          const el = (n2.el = n1.el);
          let { patchFlag, dynamicChildren, dirs } = n2;
          // #1426 take the old vnode's patch flag into account since user may clone a
          // compiler-generated vnode, which de-opts to FULL_PROPS
          patchFlag |= n1.patchFlag & 16 /* FULL_PROPS */;
          const oldProps = n1.props || EMPTY_OBJ;
          const newProps = n2.props || EMPTY_OBJ;
          let vnodeHook;
          if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
              invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
          }
          if (dirs) {
              invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
          }
          if (isHmrUpdating) {
              // HMR updated, force full diff
              patchFlag = 0;
              optimized = false;
              dynamicChildren = null;
          }
          const areChildrenSVG = isSVG && n2.type !== 'foreignObject';
          if (dynamicChildren) {
              patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds);
              if (parentComponent && parentComponent.type.__hmrId) {
                  traverseStaticChildren(n1, n2);
              }
          }
          else if (!optimized) {
              // full diff
              patchChildren(n1, n2, el, null, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds, false);
          }
          if (patchFlag > 0) {
              // the presence of a patchFlag means this element's render code was
              // generated by the compiler and can take the fast path.
              // in this path old node and new node are guaranteed to have the same shape
              // (i.e. at the exact same position in the source template)
              if (patchFlag & 16 /* FULL_PROPS */) {
                  // element props contain dynamic keys, full diff needed
                  patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
              }
              else {
                  // class
                  // this flag is matched when the element has dynamic class bindings.
                  if (patchFlag & 2 /* CLASS */) {
                      if (oldProps.class !== newProps.class) {
                          hostPatchProp(el, 'class', null, newProps.class, isSVG);
                      }
                  }
                  // style
                  // this flag is matched when the element has dynamic style bindings
                  if (patchFlag & 4 /* STYLE */) {
                      hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG);
                  }
                  // props
                  // This flag is matched when the element has dynamic prop/attr bindings
                  // other than class and style. The keys of dynamic prop/attrs are saved for
                  // faster iteration.
                  // Note dynamic keys like :[foo]="bar" will cause this optimization to
                  // bail out and go through a full diff because we need to unset the old key
                  if (patchFlag & 8 /* PROPS */) {
                      // if the flag is present then dynamicProps must be non-null
                      const propsToUpdate = n2.dynamicProps;
                      for (let i = 0; i < propsToUpdate.length; i++) {
                          const key = propsToUpdate[i];
                          const prev = oldProps[key];
                          const next = newProps[key];
                          // #1471 force patch value
                          if (next !== prev || key === 'value') {
                              hostPatchProp(el, key, prev, next, isSVG, n1.children, parentComponent, parentSuspense, unmountChildren);
                          }
                      }
                  }
              }
              // text
              // This flag is matched when the element has only dynamic text children.
              if (patchFlag & 1 /* TEXT */) {
                  if (n1.children !== n2.children) {
                      hostSetElementText(el, n2.children);
                  }
              }
          }
          else if (!optimized && dynamicChildren == null) {
              // unoptimized, full diff
              patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
          }
          if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
              queuePostRenderEffect(() => {
                  vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
                  dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated');
              }, parentSuspense);
          }
      };
      // The fast path for blocks.
      const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, isSVG, slotScopeIds) => {
          for (let i = 0; i < newChildren.length; i++) {
              const oldVNode = oldChildren[i];
              const newVNode = newChildren[i];
              // Determine the container (parent element) for the patch.
              const container = 
              // oldVNode may be an errored async setup() component inside Suspense
              // which will not have a mounted element
              oldVNode.el &&
                  // - In the case of a Fragment, we need to provide the actual parent
                  // of the Fragment itself so it can move its children.
                  (oldVNode.type === Fragment ||
                      // - In the case of different nodes, there is going to be a replacement
                      // which also requires the correct parent container
                      !isSameVNodeType(oldVNode, newVNode) ||
                      // - In the case of a component, it could contain anything.
                      oldVNode.shapeFlag & (6 /* COMPONENT */ | 64 /* TELEPORT */))
                  ? hostParentNode(oldVNode.el)
                  : // In other cases, the parent container is not actually used so we
                      // just pass the block element here to avoid a DOM parentNode call.
                      fallbackContainer;
              patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, true);
          }
      };
      const patchProps = (el, vnode, oldProps, newProps, parentComponent, parentSuspense, isSVG) => {
          if (oldProps !== newProps) {
              for (const key in newProps) {
                  // empty string is not valid prop
                  if (isReservedProp(key))
                      continue;
                  const next = newProps[key];
                  const prev = oldProps[key];
                  // defer patching value
                  if (next !== prev && key !== 'value') {
                      hostPatchProp(el, key, prev, next, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                  }
              }
              if (oldProps !== EMPTY_OBJ) {
                  for (const key in oldProps) {
                      if (!isReservedProp(key) && !(key in newProps)) {
                          hostPatchProp(el, key, oldProps[key], null, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                      }
                  }
              }
              if ('value' in newProps) {
                  hostPatchProp(el, 'value', oldProps.value, newProps.value);
              }
          }
      };
      const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
          const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
          const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));
          let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
          if (isHmrUpdating) {
              // HMR updated, force full diff
              patchFlag = 0;
              optimized = false;
              dynamicChildren = null;
          }
          // check if this is a slot fragment with :slotted scope ids
          if (fragmentSlotScopeIds) {
              slotScopeIds = slotScopeIds
                  ? slotScopeIds.concat(fragmentSlotScopeIds)
                  : fragmentSlotScopeIds;
          }
          if (n1 == null) {
              hostInsert(fragmentStartAnchor, container, anchor);
              hostInsert(fragmentEndAnchor, container, anchor);
              // a fragment can only have array children
              // since they are either generated by the compiler, or implicitly created
              // from arrays.
              mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
          }
          else {
              if (patchFlag > 0 &&
                  patchFlag & 64 /* STABLE_FRAGMENT */ &&
                  dynamicChildren &&
                  // #2715 the previous fragment could've been a BAILed one as a result
                  // of renderSlot() with no valid children
                  n1.dynamicChildren) {
                  // a stable fragment (template root or <template v-for>) doesn't need to
                  // patch children order, but it may contain dynamicChildren.
                  patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG, slotScopeIds);
                  if (parentComponent && parentComponent.type.__hmrId) {
                      traverseStaticChildren(n1, n2);
                  }
                  else if (
                  // #2080 if the stable fragment has a key, it's a <template v-for> that may
                  //  get moved around. Make sure all root level vnodes inherit el.
                  // #2134 or if it's a component root, it may also get moved around
                  // as the component is being moved.
                  n2.key != null ||
                      (parentComponent && n2 === parentComponent.subTree)) {
                      traverseStaticChildren(n1, n2, true /* shallow */);
                  }
              }
              else {
                  // keyed / unkeyed, or manual fragments.
                  // for keyed & unkeyed, since they are compiler generated from v-for,
                  // each child is guaranteed to be a block so the fragment will never
                  // have dynamicChildren.
                  patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
              }
          }
      };
      const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
          n2.slotScopeIds = slotScopeIds;
          if (n1 == null) {
              if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
                  parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized);
              }
              else {
                  mountComponent(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
              }
          }
          else {
              updateComponent(n1, n2, optimized);
          }
      };
      const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
          const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense));
          if (instance.type.__hmrId) {
              registerHMR(instance);
          }
          {
              pushWarningContext(initialVNode);
              startMeasure(instance, `mount`);
          }
          // inject renderer internals for keepAlive
          if (isKeepAlive(initialVNode)) {
              instance.ctx.renderer = internals;
          }
          // resolve props and slots for setup context
          {
              {
                  startMeasure(instance, `init`);
              }
              setupComponent(instance);
              {
                  endMeasure(instance, `init`);
              }
          }
          // setup() is async. This component relies on async logic to be resolved
          // before proceeding
          if (instance.asyncDep) {
              parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
              // Give it a placeholder if this is not hydration
              // TODO handle self-defined fallback
              if (!initialVNode.el) {
                  const placeholder = (instance.subTree = createVNode(Comment$1));
                  processCommentNode(null, placeholder, container, anchor);
              }
              return;
          }
          setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized);
          {
              popWarningContext();
              endMeasure(instance, `mount`);
          }
      };
      const updateComponent = (n1, n2, optimized) => {
          const instance = (n2.component = n1.component);
          if (shouldUpdateComponent(n1, n2, optimized)) {
              if (instance.asyncDep &&
                  !instance.asyncResolved) {
                  // async & still pending - just update props and slots
                  // since the component's reactive effect for render isn't set-up yet
                  {
                      pushWarningContext(n2);
                  }
                  updateComponentPreRender(instance, n2, optimized);
                  {
                      popWarningContext();
                  }
                  return;
              }
              else {
                  // normal update
                  instance.next = n2;
                  // in case the child component is also queued, remove it to avoid
                  // double updating the same child component in the same flush.
                  invalidateJob(instance.update);
                  // instance.update is the reactive effect.
                  instance.update();
              }
          }
          else {
              // no update needed. just copy over properties
              n2.component = n1.component;
              n2.el = n1.el;
              instance.vnode = n2;
          }
      };
      const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized) => {
          const componentUpdateFn = () => {
              if (!instance.isMounted) {
                  let vnodeHook;
                  const { el, props } = initialVNode;
                  const { bm, m, parent } = instance;
                  const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
                  effect.allowRecurse = false;
                  // beforeMount hook
                  if (bm) {
                      invokeArrayFns(bm);
                  }
                  // onVnodeBeforeMount
                  if (!isAsyncWrapperVNode &&
                      (vnodeHook = props && props.onVnodeBeforeMount)) {
                      invokeVNodeHook(vnodeHook, parent, initialVNode);
                  }
                  effect.allowRecurse = true;
                  if (el && hydrateNode) {
                      // vnode has adopted host node - perform hydration instead of mount.
                      const hydrateSubTree = () => {
                          {
                              startMeasure(instance, `render`);
                          }
                          instance.subTree = renderComponentRoot(instance);
                          {
                              endMeasure(instance, `render`);
                          }
                          {
                              startMeasure(instance, `hydrate`);
                          }
                          hydrateNode(el, instance.subTree, instance, parentSuspense, null);
                          {
                              endMeasure(instance, `hydrate`);
                          }
                      };
                      if (isAsyncWrapperVNode) {
                          initialVNode.type.__asyncLoader().then(
                          // note: we are moving the render call into an async callback,
                          // which means it won't track dependencies - but it's ok because
                          // a server-rendered async wrapper is already in resolved state
                          // and it will never need to change.
                          () => !instance.isUnmounted && hydrateSubTree());
                      }
                      else {
                          hydrateSubTree();
                      }
                  }
                  else {
                      {
                          startMeasure(instance, `render`);
                      }
                      const subTree = (instance.subTree = renderComponentRoot(instance));
                      {
                          endMeasure(instance, `render`);
                      }
                      {
                          startMeasure(instance, `patch`);
                      }
                      patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
                      {
                          endMeasure(instance, `patch`);
                      }
                      initialVNode.el = subTree.el;
                  }
                  // mounted hook
                  if (m) {
                      queuePostRenderEffect(m, parentSuspense);
                  }
                  // onVnodeMounted
                  if (!isAsyncWrapperVNode &&
                      (vnodeHook = props && props.onVnodeMounted)) {
                      const scopedInitialVNode = initialVNode;
                      queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
                  }
                  // activated hook for keep-alive roots.
                  // #1742 activated hook must be accessed after first render
                  // since the hook may be injected by a child keep-alive
                  if (initialVNode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
                      instance.a && queuePostRenderEffect(instance.a, parentSuspense);
                  }
                  instance.isMounted = true;
                  {
                      devtoolsComponentAdded(instance);
                  }
                  // #2458: deference mount-only object parameters to prevent memleaks
                  initialVNode = container = anchor = null;
              }
              else {
                  // updateComponent
                  // This is triggered by mutation of component's own state (next: null)
                  // OR parent calling processComponent (next: VNode)
                  let { next, bu, u, parent, vnode } = instance;
                  let originNext = next;
                  let vnodeHook;
                  {
                      pushWarningContext(next || instance.vnode);
                  }
                  // Disallow component effect recursion during pre-lifecycle hooks.
                  effect.allowRecurse = false;
                  if (next) {
                      next.el = vnode.el;
                      updateComponentPreRender(instance, next, optimized);
                  }
                  else {
                      next = vnode;
                  }
                  // beforeUpdate hook
                  if (bu) {
                      invokeArrayFns(bu);
                  }
                  // onVnodeBeforeUpdate
                  if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
                      invokeVNodeHook(vnodeHook, parent, next, vnode);
                  }
                  effect.allowRecurse = true;
                  // render
                  {
                      startMeasure(instance, `render`);
                  }
                  const nextTree = renderComponentRoot(instance);
                  {
                      endMeasure(instance, `render`);
                  }
                  const prevTree = instance.subTree;
                  instance.subTree = nextTree;
                  {
                      startMeasure(instance, `patch`);
                  }
                  patch(prevTree, nextTree, 
                  // parent may have changed if it's in a teleport
                  hostParentNode(prevTree.el), 
                  // anchor may have changed if it's in a fragment
                  getNextHostNode(prevTree), instance, parentSuspense, isSVG);
                  {
                      endMeasure(instance, `patch`);
                  }
                  next.el = nextTree.el;
                  if (originNext === null) {
                      // self-triggered update. In case of HOC, update parent component
                      // vnode el. HOC is indicated by parent instance's subTree pointing
                      // to child component's vnode
                      updateHOCHostEl(instance, nextTree.el);
                  }
                  // updated hook
                  if (u) {
                      queuePostRenderEffect(u, parentSuspense);
                  }
                  // onVnodeUpdated
                  if ((vnodeHook = next.props && next.props.onVnodeUpdated)) {
                      queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
                  }
                  {
                      devtoolsComponentUpdated(instance);
                  }
                  {
                      popWarningContext();
                  }
              }
          };
          // create reactive effect for rendering
          const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update), instance.scope // track it in component's effect scope
          );
          const update = (instance.update = effect.run.bind(effect));
          update.id = instance.uid;
          // allowRecurse
          // #1801, #2043 component render effects should allow recursive updates
          effect.allowRecurse = update.allowRecurse = true;
          {
              effect.onTrack = instance.rtc
                  ? e => invokeArrayFns(instance.rtc, e)
                  : void 0;
              effect.onTrigger = instance.rtg
                  ? e => invokeArrayFns(instance.rtg, e)
                  : void 0;
              // @ts-ignore (for scheduler)
              update.ownerInstance = instance;
          }
          update();
      };
      const updateComponentPreRender = (instance, nextVNode, optimized) => {
          nextVNode.component = instance;
          const prevProps = instance.vnode.props;
          instance.vnode = nextVNode;
          instance.next = null;
          updateProps(instance, nextVNode.props, prevProps, optimized);
          updateSlots(instance, nextVNode.children, optimized);
          pauseTracking();
          // props update may have triggered pre-flush watchers.
          // flush them before the render update.
          flushPreFlushCbs(undefined, instance.update);
          resetTracking();
      };
      const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized = false) => {
          const c1 = n1 && n1.children;
          const prevShapeFlag = n1 ? n1.shapeFlag : 0;
          const c2 = n2.children;
          const { patchFlag, shapeFlag } = n2;
          // fast path
          if (patchFlag > 0) {
              if (patchFlag & 128 /* KEYED_FRAGMENT */) {
                  // this could be either fully-keyed or mixed (some keyed some not)
                  // presence of patchFlag means children are guaranteed to be arrays
                  patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  return;
              }
              else if (patchFlag & 256 /* UNKEYED_FRAGMENT */) {
                  // unkeyed
                  patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  return;
              }
          }
          // children has 3 possibilities: text, array or no children.
          if (shapeFlag & 8 /* TEXT_CHILDREN */) {
              // text children fast path
              if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                  unmountChildren(c1, parentComponent, parentSuspense);
              }
              if (c2 !== c1) {
                  hostSetElementText(container, c2);
              }
          }
          else {
              if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                  // prev children was array
                  if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                      // two arrays, cannot assume anything, do full diff
                      patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  }
                  else {
                      // no new children, just unmount old
                      unmountChildren(c1, parentComponent, parentSuspense, true);
                  }
              }
              else {
                  // prev children was text OR null
                  // new children is array OR null
                  if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
                      hostSetElementText(container, '');
                  }
                  // mount new if array
                  if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                      mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  }
              }
          }
      };
      const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
          c1 = c1 || EMPTY_ARR;
          c2 = c2 || EMPTY_ARR;
          const oldLength = c1.length;
          const newLength = c2.length;
          const commonLength = Math.min(oldLength, newLength);
          let i;
          for (i = 0; i < commonLength; i++) {
              const nextChild = (c2[i] = optimized
                  ? cloneIfMounted(c2[i])
                  : normalizeVNode(c2[i]));
              patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
          }
          if (oldLength > newLength) {
              // remove old
              unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
          }
          else {
              // mount new
              mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, commonLength);
          }
      };
      // can be all-keyed or mixed
      const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
          let i = 0;
          const l2 = c2.length;
          let e1 = c1.length - 1; // prev ending index
          let e2 = l2 - 1; // next ending index
          // 1. sync from start
          // (a b) c
          // (a b) d e
          while (i <= e1 && i <= e2) {
              const n1 = c1[i];
              const n2 = (c2[i] = optimized
                  ? cloneIfMounted(c2[i])
                  : normalizeVNode(c2[i]));
              if (isSameVNodeType(n1, n2)) {
                  patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
              }
              else {
                  break;
              }
              i++;
          }
          // 2. sync from end
          // a (b c)
          // d e (b c)
          while (i <= e1 && i <= e2) {
              const n1 = c1[e1];
              const n2 = (c2[e2] = optimized
                  ? cloneIfMounted(c2[e2])
                  : normalizeVNode(c2[e2]));
              if (isSameVNodeType(n1, n2)) {
                  patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
              }
              else {
                  break;
              }
              e1--;
              e2--;
          }
          // 3. common sequence + mount
          // (a b)
          // (a b) c
          // i = 2, e1 = 1, e2 = 2
          // (a b)
          // c (a b)
          // i = 0, e1 = -1, e2 = 0
          if (i > e1) {
              if (i <= e2) {
                  const nextPos = e2 + 1;
                  const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
                  while (i <= e2) {
                      patch(null, (c2[i] = optimized
                          ? cloneIfMounted(c2[i])
                          : normalizeVNode(c2[i])), container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                      i++;
                  }
              }
          }
          // 4. common sequence + unmount
          // (a b) c
          // (a b)
          // i = 2, e1 = 2, e2 = 1
          // a (b c)
          // (b c)
          // i = 0, e1 = 0, e2 = -1
          else if (i > e2) {
              while (i <= e1) {
                  unmount(c1[i], parentComponent, parentSuspense, true);
                  i++;
              }
          }
          // 5. unknown sequence
          // [i ... e1 + 1]: a b [c d e] f g
          // [i ... e2 + 1]: a b [e d c h] f g
          // i = 2, e1 = 4, e2 = 5
          else {
              const s1 = i; // prev starting index
              const s2 = i; // next starting index
              // 5.1 build key:index map for newChildren
              const keyToNewIndexMap = new Map();
              for (i = s2; i <= e2; i++) {
                  const nextChild = (c2[i] = optimized
                      ? cloneIfMounted(c2[i])
                      : normalizeVNode(c2[i]));
                  if (nextChild.key != null) {
                      if (keyToNewIndexMap.has(nextChild.key)) {
                          warn$1(`Duplicate keys found during update:`, JSON.stringify(nextChild.key), `Make sure keys are unique.`);
                      }
                      keyToNewIndexMap.set(nextChild.key, i);
                  }
              }
              // 5.2 loop through old children left to be patched and try to patch
              // matching nodes & remove nodes that are no longer present
              let j;
              let patched = 0;
              const toBePatched = e2 - s2 + 1;
              let moved = false;
              // used to track whether any node has moved
              let maxNewIndexSoFar = 0;
              // works as Map<newIndex, oldIndex>
              // Note that oldIndex is offset by +1
              // and oldIndex = 0 is a special value indicating the new node has
              // no corresponding old node.
              // used for determining longest stable subsequence
              const newIndexToOldIndexMap = new Array(toBePatched);
              for (i = 0; i < toBePatched; i++)
                  newIndexToOldIndexMap[i] = 0;
              for (i = s1; i <= e1; i++) {
                  const prevChild = c1[i];
                  if (patched >= toBePatched) {
                      // all new children have been patched so this can only be a removal
                      unmount(prevChild, parentComponent, parentSuspense, true);
                      continue;
                  }
                  let newIndex;
                  if (prevChild.key != null) {
                      newIndex = keyToNewIndexMap.get(prevChild.key);
                  }
                  else {
                      // key-less node, try to locate a key-less node of the same type
                      for (j = s2; j <= e2; j++) {
                          if (newIndexToOldIndexMap[j - s2] === 0 &&
                              isSameVNodeType(prevChild, c2[j])) {
                              newIndex = j;
                              break;
                          }
                      }
                  }
                  if (newIndex === undefined) {
                      unmount(prevChild, parentComponent, parentSuspense, true);
                  }
                  else {
                      newIndexToOldIndexMap[newIndex - s2] = i + 1;
                      if (newIndex >= maxNewIndexSoFar) {
                          maxNewIndexSoFar = newIndex;
                      }
                      else {
                          moved = true;
                      }
                      patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                      patched++;
                  }
              }
              // 5.3 move and mount
              // generate longest stable subsequence only when nodes have moved
              const increasingNewIndexSequence = moved
                  ? getSequence(newIndexToOldIndexMap)
                  : EMPTY_ARR;
              j = increasingNewIndexSequence.length - 1;
              // looping backwards so that we can use last patched node as anchor
              for (i = toBePatched - 1; i >= 0; i--) {
                  const nextIndex = s2 + i;
                  const nextChild = c2[nextIndex];
                  const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
                  if (newIndexToOldIndexMap[i] === 0) {
                      // mount new
                      patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                  }
                  else if (moved) {
                      // move if:
                      // There is no stable subsequence (e.g. a reverse)
                      // OR current node is not among the stable sequence
                      if (j < 0 || i !== increasingNewIndexSequence[j]) {
                          move(nextChild, container, anchor, 2 /* REORDER */);
                      }
                      else {
                          j--;
                      }
                  }
              }
          }
      };
      const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
          const { el, type, transition, children, shapeFlag } = vnode;
          if (shapeFlag & 6 /* COMPONENT */) {
              move(vnode.component.subTree, container, anchor, moveType);
              return;
          }
          if (shapeFlag & 128 /* SUSPENSE */) {
              vnode.suspense.move(container, anchor, moveType);
              return;
          }
          if (shapeFlag & 64 /* TELEPORT */) {
              type.move(vnode, container, anchor, internals);
              return;
          }
          if (type === Fragment) {
              hostInsert(el, container, anchor);
              for (let i = 0; i < children.length; i++) {
                  move(children[i], container, anchor, moveType);
              }
              hostInsert(vnode.anchor, container, anchor);
              return;
          }
          if (type === Static) {
              moveStaticNode(vnode, container, anchor);
              return;
          }
          // single nodes
          const needTransition = moveType !== 2 /* REORDER */ &&
              shapeFlag & 1 /* ELEMENT */ &&
              transition;
          if (needTransition) {
              if (moveType === 0 /* ENTER */) {
                  transition.beforeEnter(el);
                  hostInsert(el, container, anchor);
                  queuePostRenderEffect(() => transition.enter(el), parentSuspense);
              }
              else {
                  const { leave, delayLeave, afterLeave } = transition;
                  const remove = () => hostInsert(el, container, anchor);
                  const performLeave = () => {
                      leave(el, () => {
                          remove();
                          afterLeave && afterLeave();
                      });
                  };
                  if (delayLeave) {
                      delayLeave(el, remove, performLeave);
                  }
                  else {
                      performLeave();
                  }
              }
          }
          else {
              hostInsert(el, container, anchor);
          }
      };
      const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
          const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs } = vnode;
          // unset ref
          if (ref != null) {
              setRef(ref, null, parentSuspense, vnode, true);
          }
          if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
              parentComponent.ctx.deactivate(vnode);
              return;
          }
          const shouldInvokeDirs = shapeFlag & 1 /* ELEMENT */ && dirs;
          const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
          let vnodeHook;
          if (shouldInvokeVnodeHook &&
              (vnodeHook = props && props.onVnodeBeforeUnmount)) {
              invokeVNodeHook(vnodeHook, parentComponent, vnode);
          }
          if (shapeFlag & 6 /* COMPONENT */) {
              unmountComponent(vnode.component, parentSuspense, doRemove);
          }
          else {
              if (shapeFlag & 128 /* SUSPENSE */) {
                  vnode.suspense.unmount(parentSuspense, doRemove);
                  return;
              }
              if (shouldInvokeDirs) {
                  invokeDirectiveHook(vnode, null, parentComponent, 'beforeUnmount');
              }
              if (shapeFlag & 64 /* TELEPORT */) {
                  vnode.type.remove(vnode, parentComponent, parentSuspense, optimized, internals, doRemove);
              }
              else if (dynamicChildren &&
                  // #1153: fast path should not be taken for non-stable (v-for) fragments
                  (type !== Fragment ||
                      (patchFlag > 0 && patchFlag & 64 /* STABLE_FRAGMENT */))) {
                  // fast path for block nodes: only need to unmount dynamic children.
                  unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
              }
              else if ((type === Fragment &&
                  patchFlag &
                      (128 /* KEYED_FRAGMENT */ | 256 /* UNKEYED_FRAGMENT */)) ||
                  (!optimized && shapeFlag & 16 /* ARRAY_CHILDREN */)) {
                  unmountChildren(children, parentComponent, parentSuspense);
              }
              if (doRemove) {
                  remove(vnode);
              }
          }
          if ((shouldInvokeVnodeHook &&
              (vnodeHook = props && props.onVnodeUnmounted)) ||
              shouldInvokeDirs) {
              queuePostRenderEffect(() => {
                  vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                  shouldInvokeDirs &&
                      invokeDirectiveHook(vnode, null, parentComponent, 'unmounted');
              }, parentSuspense);
          }
      };
      const remove = vnode => {
          const { type, el, anchor, transition } = vnode;
          if (type === Fragment) {
              removeFragment(el, anchor);
              return;
          }
          if (type === Static) {
              removeStaticNode(vnode);
              return;
          }
          const performRemove = () => {
              hostRemove(el);
              if (transition && !transition.persisted && transition.afterLeave) {
                  transition.afterLeave();
              }
          };
          if (vnode.shapeFlag & 1 /* ELEMENT */ &&
              transition &&
              !transition.persisted) {
              const { leave, delayLeave } = transition;
              const performLeave = () => leave(el, performRemove);
              if (delayLeave) {
                  delayLeave(vnode.el, performRemove, performLeave);
              }
              else {
                  performLeave();
              }
          }
          else {
              performRemove();
          }
      };
      const removeFragment = (cur, end) => {
          // For fragments, directly remove all contained DOM nodes.
          // (fragment child nodes cannot have transition)
          let next;
          while (cur !== end) {
              next = hostNextSibling(cur);
              hostRemove(cur);
              cur = next;
          }
          hostRemove(end);
      };
      const unmountComponent = (instance, parentSuspense, doRemove) => {
          if (instance.type.__hmrId) {
              unregisterHMR(instance);
          }
          const { bum, scope, update, subTree, um } = instance;
          // beforeUnmount hook
          if (bum) {
              invokeArrayFns(bum);
          }
          // stop effects in component scope
          scope.stop();
          // update may be null if a component is unmounted before its async
          // setup has resolved.
          if (update) {
              // so that scheduler will no longer invoke it
              update.active = false;
              unmount(subTree, instance, parentSuspense, doRemove);
          }
          // unmounted hook
          if (um) {
              queuePostRenderEffect(um, parentSuspense);
          }
          queuePostRenderEffect(() => {
              instance.isUnmounted = true;
          }, parentSuspense);
          // A component with async dep inside a pending suspense is unmounted before
          // its async dep resolves. This should remove the dep from the suspense, and
          // cause the suspense to resolve immediately if that was the last dep.
          if (parentSuspense &&
              parentSuspense.pendingBranch &&
              !parentSuspense.isUnmounted &&
              instance.asyncDep &&
              !instance.asyncResolved &&
              instance.suspenseId === parentSuspense.pendingId) {
              parentSuspense.deps--;
              if (parentSuspense.deps === 0) {
                  parentSuspense.resolve();
              }
          }
          {
              devtoolsComponentRemoved(instance);
          }
      };
      const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
          for (let i = start; i < children.length; i++) {
              unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
          }
      };
      const getNextHostNode = vnode => {
          if (vnode.shapeFlag & 6 /* COMPONENT */) {
              return getNextHostNode(vnode.component.subTree);
          }
          if (vnode.shapeFlag & 128 /* SUSPENSE */) {
              return vnode.suspense.next();
          }
          return hostNextSibling((vnode.anchor || vnode.el));
      };
      const render = (vnode, container, isSVG) => {
          if (vnode == null) {
              if (container._vnode) {
                  unmount(container._vnode, null, null, true);
              }
          }
          else {
              patch(container._vnode || null, vnode, container, null, null, null, isSVG);
          }
          flushPostFlushCbs();
          container._vnode = vnode;
      };
      const internals = {
          p: patch,
          um: unmount,
          m: move,
          r: remove,
          mt: mountComponent,
          mc: mountChildren,
          pc: patchChildren,
          pbc: patchBlockChildren,
          n: getNextHostNode,
          o: options
      };
      let hydrate;
      let hydrateNode;
      if (createHydrationFns) {
          [hydrate, hydrateNode] = createHydrationFns(internals);
      }
      return {
          render,
          hydrate,
          createApp: createAppAPI(render, hydrate)
      };
  }
  function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
      if (isArray(rawRef)) {
          rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
          return;
      }
      if (isAsyncWrapper(vnode) && !isUnmount) {
          // when mounting async components, nothing needs to be done,
          // because the template ref is forwarded to inner component
          return;
      }
      const refValue = vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */
          ? getExposeProxy(vnode.component) || vnode.component.proxy
          : vnode.el;
      const value = isUnmount ? null : refValue;
      const { i: owner, r: ref } = rawRef;
      if (!owner) {
          warn$1(`Missing ref owner context. ref cannot be used on hoisted vnodes. ` +
              `A vnode with ref must be created inside the render function.`);
          return;
      }
      const oldRef = oldRawRef && oldRawRef.r;
      const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs;
      const setupState = owner.setupState;
      // dynamic ref changed. unset old ref
      if (oldRef != null && oldRef !== ref) {
          if (isString(oldRef)) {
              refs[oldRef] = null;
              if (hasOwn(setupState, oldRef)) {
                  setupState[oldRef] = null;
              }
          }
          else if (isRef(oldRef)) {
              oldRef.value = null;
          }
      }
      if (isString(ref)) {
          const doSet = () => {
              {
                  refs[ref] = value;
              }
              if (hasOwn(setupState, ref)) {
                  setupState[ref] = value;
              }
          };
          // #1789: for non-null values, set them after render
          // null values means this is unmount and it should not overwrite another
          // ref with the same key
          if (value) {
              doSet.id = -1;
              queuePostRenderEffect(doSet, parentSuspense);
          }
          else {
              doSet();
          }
      }
      else if (isRef(ref)) {
          const doSet = () => {
              ref.value = value;
          };
          if (value) {
              doSet.id = -1;
              queuePostRenderEffect(doSet, parentSuspense);
          }
          else {
              doSet();
          }
      }
      else if (isFunction(ref)) {
          callWithErrorHandling(ref, owner, 12 /* FUNCTION_REF */, [value, refs]);
      }
      else {
          warn$1('Invalid template ref type:', value, `(${typeof value})`);
      }
  }
  function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
      callWithAsyncErrorHandling(hook, instance, 7 /* VNODE_HOOK */, [
          vnode,
          prevVNode
      ]);
  }
  /**
   * #1156
   * When a component is HMR-enabled, we need to make sure that all static nodes
   * inside a block also inherit the DOM element from the previous tree so that
   * HMR updates (which are full updates) can retrieve the element for patching.
   *
   * #2080
   * Inside keyed `template` fragment static children, if a fragment is moved,
   * the children will always moved so that need inherit el form previous nodes
   * to ensure correct moved position.
   */
  function traverseStaticChildren(n1, n2, shallow = false) {
      const ch1 = n1.children;
      const ch2 = n2.children;
      if (isArray(ch1) && isArray(ch2)) {
          for (let i = 0; i < ch1.length; i++) {
              // this is only called in the optimized path so array children are
              // guaranteed to be vnodes
              const c1 = ch1[i];
              let c2 = ch2[i];
              if (c2.shapeFlag & 1 /* ELEMENT */ && !c2.dynamicChildren) {
                  if (c2.patchFlag <= 0 || c2.patchFlag === 32 /* HYDRATE_EVENTS */) {
                      c2 = ch2[i] = cloneIfMounted(ch2[i]);
                      c2.el = c1.el;
                  }
                  if (!shallow)
                      traverseStaticChildren(c1, c2);
              }
              // also inherit for comment nodes, but not placeholders (e.g. v-if which
              // would have received .el during block patch)
              if (c2.type === Comment$1 && !c2.el) {
                  c2.el = c1.el;
              }
          }
      }
  }
  // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
  function getSequence(arr) {
      const p = arr.slice();
      const result = [0];
      let i, j, u, v, c;
      const len = arr.length;
      for (i = 0; i < len; i++) {
          const arrI = arr[i];
          if (arrI !== 0) {
              j = result[result.length - 1];
              if (arr[j] < arrI) {
                  p[i] = j;
                  result.push(i);
                  continue;
              }
              u = 0;
              v = result.length - 1;
              while (u < v) {
                  c = (u + v) >> 1;
                  if (arr[result[c]] < arrI) {
                      u = c + 1;
                  }
                  else {
                      v = c;
                  }
              }
              if (arrI < arr[result[u]]) {
                  if (u > 0) {
                      p[i] = result[u - 1];
                  }
                  result[u] = i;
              }
          }
      }
      u = result.length;
      v = result[u - 1];
      while (u-- > 0) {
          result[u] = v;
          v = p[v];
      }
      return result;
  }

  const isTeleport = (type) => type.__isTeleport;

  const COMPONENTS = 'components';
  /**
   * @private
   */
  function resolveComponent(name, maybeSelfReference) {
      return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
  }
  const NULL_DYNAMIC_COMPONENT = Symbol();
  // implementation
  function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
      const instance = currentRenderingInstance || currentInstance;
      if (instance) {
          const Component = instance.type;
          // explicit self name has highest priority
          if (type === COMPONENTS) {
              const selfName = getComponentName(Component);
              if (selfName &&
                  (selfName === name ||
                      selfName === camelize(name) ||
                      selfName === capitalize(camelize(name)))) {
                  return Component;
              }
          }
          const res = 
          // local registration
          // check instance[type] first which is resolved for options API
          resolve(instance[type] || Component[type], name) ||
              // global registration
              resolve(instance.appContext[type], name);
          if (!res && maybeSelfReference) {
              // fallback to implicit self-reference
              return Component;
          }
          if (warnMissing && !res) {
              warn$1(`Failed to resolve ${type.slice(0, -1)}: ${name}`);
          }
          return res;
      }
      else {
          warn$1(`resolve${capitalize(type.slice(0, -1))} ` +
              `can only be used in render() or setup().`);
      }
  }
  function resolve(registry, name) {
      return (registry &&
          (registry[name] ||
              registry[camelize(name)] ||
              registry[capitalize(camelize(name))]));
  }

  const Fragment = Symbol('Fragment' );
  const Text = Symbol('Text' );
  const Comment$1 = Symbol('Comment' );
  const Static = Symbol('Static' );
  // Since v-if and v-for are the two possible ways node structure can dynamically
  // change, once we consider v-if branches and each v-for fragment a block, we
  // can divide a template into nested blocks, and within each block the node
  // structure would be stable. This allows us to skip most children diffing
  // and only worry about the dynamic nodes (indicated by patch flags).
  const blockStack = [];
  let currentBlock = null;
  /**
   * Open a block.
   * This must be called before `createBlock`. It cannot be part of `createBlock`
   * because the children of the block are evaluated before `createBlock` itself
   * is called. The generated code typically looks like this:
   *
   * ```js
   * function render() {
   *   return (openBlock(),createBlock('div', null, [...]))
   * }
   * ```
   * disableTracking is true when creating a v-for fragment block, since a v-for
   * fragment always diffs its children.
   *
   * @private
   */
  function openBlock(disableTracking = false) {
      blockStack.push((currentBlock = disableTracking ? null : []));
  }
  function closeBlock() {
      blockStack.pop();
      currentBlock = blockStack[blockStack.length - 1] || null;
  }
  // Whether we should be tracking dynamic child nodes inside a block.
  // Only tracks when this value is > 0
  // We are not using a simple boolean because this value may need to be
  // incremented/decremented by nested usage of v-once (see below)
  let isBlockTreeEnabled = 1;
  /**
   * Block tracking sometimes needs to be disabled, for example during the
   * creation of a tree that needs to be cached by v-once. The compiler generates
   * code like this:
   *
   * ``` js
   * _cache[1] || (
   *   setBlockTracking(-1),
   *   _cache[1] = createVNode(...),
   *   setBlockTracking(1),
   *   _cache[1]
   * )
   * ```
   *
   * @private
   */
  function setBlockTracking(value) {
      isBlockTreeEnabled += value;
  }
  function setupBlock(vnode) {
      // save current block children on the block vnode
      vnode.dynamicChildren =
          isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
      // close block
      closeBlock();
      // a block is always going to be patched, so track it as a child of its
      // parent block
      if (isBlockTreeEnabled > 0 && currentBlock) {
          currentBlock.push(vnode);
      }
      return vnode;
  }
  /**
   * @private
   */
  function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
      return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true /* isBlock */));
  }
  function isVNode(value) {
      return value ? value.__v_isVNode === true : false;
  }
  function isSameVNodeType(n1, n2) {
      if (n2.shapeFlag & 6 /* COMPONENT */ &&
          hmrDirtyComponents.has(n2.type)) {
          // HMR only: if the component has been hot-updated, force a reload.
          return false;
      }
      return n1.type === n2.type && n1.key === n2.key;
  }
  const createVNodeWithArgsTransform = (...args) => {
      return _createVNode(...(args));
  };
  const InternalObjectKey = `__vInternal`;
  const normalizeKey = ({ key }) => key != null ? key : null;
  const normalizeRef = ({ ref }) => {
      return (ref != null
          ? isString(ref) || isRef(ref) || isFunction(ref)
              ? { i: currentRenderingInstance, r: ref }
              : ref
          : null);
  };
  function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1 /* ELEMENT */, isBlockNode = false, needFullChildrenNormalization = false) {
      const vnode = {
          __v_isVNode: true,
          __v_skip: true,
          type,
          props,
          key: props && normalizeKey(props),
          ref: props && normalizeRef(props),
          scopeId: currentScopeId,
          slotScopeIds: null,
          children,
          component: null,
          suspense: null,
          ssContent: null,
          ssFallback: null,
          dirs: null,
          transition: null,
          el: null,
          anchor: null,
          target: null,
          targetAnchor: null,
          staticCount: 0,
          shapeFlag,
          patchFlag,
          dynamicProps,
          dynamicChildren: null,
          appContext: null
      };
      if (needFullChildrenNormalization) {
          normalizeChildren(vnode, children);
          // normalize suspense children
          if (shapeFlag & 128 /* SUSPENSE */) {
              type.normalize(vnode);
          }
      }
      else if (children) {
          // compiled element vnode - if children is passed, only possible types are
          // string or Array.
          vnode.shapeFlag |= isString(children)
              ? 8 /* TEXT_CHILDREN */
              : 16 /* ARRAY_CHILDREN */;
      }
      // validate key
      if (vnode.key !== vnode.key) {
          warn$1(`VNode created with invalid key (NaN). VNode type:`, vnode.type);
      }
      // track vnode for block tree
      if (isBlockTreeEnabled > 0 &&
          // avoid a block node from tracking itself
          !isBlockNode &&
          // has current parent block
          currentBlock &&
          // presence of a patch flag indicates this node needs patching on updates.
          // component nodes also should always be patched, because even if the
          // component doesn't need to update, it needs to persist the instance on to
          // the next vnode so that it can be properly unmounted later.
          (vnode.patchFlag > 0 || shapeFlag & 6 /* COMPONENT */) &&
          // the EVENTS flag is only for hydration and if it is the only flag, the
          // vnode should not be considered dynamic due to handler caching.
          vnode.patchFlag !== 32 /* HYDRATE_EVENTS */) {
          currentBlock.push(vnode);
      }
      return vnode;
  }
  const createVNode = (createVNodeWithArgsTransform );
  function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
      if (!type || type === NULL_DYNAMIC_COMPONENT) {
          if (!type) {
              warn$1(`Invalid vnode type when creating vnode: ${type}.`);
          }
          type = Comment$1;
      }
      if (isVNode(type)) {
          // createVNode receiving an existing vnode. This happens in cases like
          // <component :is="vnode"/>
          // #2078 make sure to merge refs during the clone instead of overwriting it
          const cloned = cloneVNode(type, props, true /* mergeRef: true */);
          if (children) {
              normalizeChildren(cloned, children);
          }
          return cloned;
      }
      // class component normalization.
      if (isClassComponent(type)) {
          type = type.__vccOpts;
      }
      // class & style normalization.
      if (props) {
          // for reactive or proxy objects, we need to clone it to enable mutation.
          props = guardReactiveProps(props);
          let { class: klass, style } = props;
          if (klass && !isString(klass)) {
              props.class = normalizeClass(klass);
          }
          if (isObject(style)) {
              // reactive state objects need to be cloned since they are likely to be
              // mutated
              if (isProxy(style) && !isArray(style)) {
                  style = extend({}, style);
              }
              props.style = normalizeStyle(style);
          }
      }
      // encode the vnode type information into a bitmap
      const shapeFlag = isString(type)
          ? 1 /* ELEMENT */
          : isSuspense(type)
              ? 128 /* SUSPENSE */
              : isTeleport(type)
                  ? 64 /* TELEPORT */
                  : isObject(type)
                      ? 4 /* STATEFUL_COMPONENT */
                      : isFunction(type)
                          ? 2 /* FUNCTIONAL_COMPONENT */
                          : 0;
      if (shapeFlag & 4 /* STATEFUL_COMPONENT */ && isProxy(type)) {
          type = toRaw(type);
          warn$1(`Vue received a Component which was made a reactive object. This can ` +
              `lead to unnecessary performance overhead, and should be avoided by ` +
              `marking the component with \`markRaw\` or using \`shallowRef\` ` +
              `instead of \`ref\`.`, `\nComponent that was made reactive: `, type);
      }
      return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
  }
  function guardReactiveProps(props) {
      if (!props)
          return null;
      return isProxy(props) || InternalObjectKey in props
          ? extend({}, props)
          : props;
  }
  function cloneVNode(vnode, extraProps, mergeRef = false) {
      // This is intentionally NOT using spread or extend to avoid the runtime
      // key enumeration cost.
      const { props, ref, patchFlag, children } = vnode;
      const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
      const cloned = {
          __v_isVNode: true,
          __v_skip: true,
          type: vnode.type,
          props: mergedProps,
          key: mergedProps && normalizeKey(mergedProps),
          ref: extraProps && extraProps.ref
              ? // #2078 in the case of <component :is="vnode" ref="extra"/>
                  // if the vnode itself already has a ref, cloneVNode will need to merge
                  // the refs so the single vnode can be set on multiple refs
                  mergeRef && ref
                      ? isArray(ref)
                          ? ref.concat(normalizeRef(extraProps))
                          : [ref, normalizeRef(extraProps)]
                      : normalizeRef(extraProps)
              : ref,
          scopeId: vnode.scopeId,
          slotScopeIds: vnode.slotScopeIds,
          children: patchFlag === -1 /* HOISTED */ && isArray(children)
              ? children.map(deepCloneVNode)
              : children,
          target: vnode.target,
          targetAnchor: vnode.targetAnchor,
          staticCount: vnode.staticCount,
          shapeFlag: vnode.shapeFlag,
          // if the vnode is cloned with extra props, we can no longer assume its
          // existing patch flag to be reliable and need to add the FULL_PROPS flag.
          // note: perserve flag for fragments since they use the flag for children
          // fast paths only.
          patchFlag: extraProps && vnode.type !== Fragment
              ? patchFlag === -1 // hoisted node
                  ? 16 /* FULL_PROPS */
                  : patchFlag | 16 /* FULL_PROPS */
              : patchFlag,
          dynamicProps: vnode.dynamicProps,
          dynamicChildren: vnode.dynamicChildren,
          appContext: vnode.appContext,
          dirs: vnode.dirs,
          transition: vnode.transition,
          // These should technically only be non-null on mounted VNodes. However,
          // they *should* be copied for kept-alive vnodes. So we just always copy
          // them since them being non-null during a mount doesn't affect the logic as
          // they will simply be overwritten.
          component: vnode.component,
          suspense: vnode.suspense,
          ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
          ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
          el: vnode.el,
          anchor: vnode.anchor
      };
      return cloned;
  }
  /**
   * Dev only, for HMR of hoisted vnodes reused in v-for
   * https://github.com/vitejs/vite/issues/2022
   */
  function deepCloneVNode(vnode) {
      const cloned = cloneVNode(vnode);
      if (isArray(vnode.children)) {
          cloned.children = vnode.children.map(deepCloneVNode);
      }
      return cloned;
  }
  /**
   * @private
   */
  function createTextVNode(text = ' ', flag = 0) {
      return createVNode(Text, null, text, flag);
  }
  function normalizeVNode(child) {
      if (child == null || typeof child === 'boolean') {
          // empty placeholder
          return createVNode(Comment$1);
      }
      else if (isArray(child)) {
          // fragment
          return createVNode(Fragment, null, 
          // #3666, avoid reference pollution when reusing vnode
          child.slice());
      }
      else if (typeof child === 'object') {
          // already vnode, this should be the most common since compiled templates
          // always produce all-vnode children arrays
          return cloneIfMounted(child);
      }
      else {
          // strings and numbers
          return createVNode(Text, null, String(child));
      }
  }
  // optimized normalization for template-compiled render fns
  function cloneIfMounted(child) {
      return child.el === null || child.memo ? child : cloneVNode(child);
  }
  function normalizeChildren(vnode, children) {
      let type = 0;
      const { shapeFlag } = vnode;
      if (children == null) {
          children = null;
      }
      else if (isArray(children)) {
          type = 16 /* ARRAY_CHILDREN */;
      }
      else if (typeof children === 'object') {
          if (shapeFlag & (1 /* ELEMENT */ | 64 /* TELEPORT */)) {
              // Normalize slot to plain children for plain element and Teleport
              const slot = children.default;
              if (slot) {
                  // _c marker is added by withCtx() indicating this is a compiled slot
                  slot._c && (slot._d = false);
                  normalizeChildren(vnode, slot());
                  slot._c && (slot._d = true);
              }
              return;
          }
          else {
              type = 32 /* SLOTS_CHILDREN */;
              const slotFlag = children._;
              if (!slotFlag && !(InternalObjectKey in children)) {
                  children._ctx = currentRenderingInstance;
              }
              else if (slotFlag === 3 /* FORWARDED */ && currentRenderingInstance) {
                  // a child component receives forwarded slots from the parent.
                  // its slot type is determined by its parent's slot type.
                  if (currentRenderingInstance.slots._ === 1 /* STABLE */) {
                      children._ = 1 /* STABLE */;
                  }
                  else {
                      children._ = 2 /* DYNAMIC */;
                      vnode.patchFlag |= 1024 /* DYNAMIC_SLOTS */;
                  }
              }
          }
      }
      else if (isFunction(children)) {
          children = { default: children, _ctx: currentRenderingInstance };
          type = 32 /* SLOTS_CHILDREN */;
      }
      else {
          children = String(children);
          // force teleport children to array so it can be moved around
          if (shapeFlag & 64 /* TELEPORT */) {
              type = 16 /* ARRAY_CHILDREN */;
              children = [createTextVNode(children)];
          }
          else {
              type = 8 /* TEXT_CHILDREN */;
          }
      }
      vnode.children = children;
      vnode.shapeFlag |= type;
  }
  function mergeProps(...args) {
      const ret = {};
      for (let i = 0; i < args.length; i++) {
          const toMerge = args[i];
          for (const key in toMerge) {
              if (key === 'class') {
                  if (ret.class !== toMerge.class) {
                      ret.class = normalizeClass([ret.class, toMerge.class]);
                  }
              }
              else if (key === 'style') {
                  ret.style = normalizeStyle([ret.style, toMerge.style]);
              }
              else if (isOn(key)) {
                  const existing = ret[key];
                  const incoming = toMerge[key];
                  if (existing !== incoming) {
                      ret[key] = existing
                          ? [].concat(existing, incoming)
                          : incoming;
                  }
              }
              else if (key !== '') {
                  ret[key] = toMerge[key];
              }
          }
      }
      return ret;
  }

  /**
   * #2437 In Vue 3, functional components do not have a public instance proxy but
   * they exist in the internal parent chain. For code that relies on traversing
   * public $parent chains, skip functional ones and go to the parent instead.
   */
  const getPublicInstance = (i) => {
      if (!i)
          return null;
      if (isStatefulComponent(i))
          return getExposeProxy(i) || i.proxy;
      return getPublicInstance(i.parent);
  };
  const publicPropertiesMap = extend(Object.create(null), {
      $: i => i,
      $el: i => i.vnode.el,
      $data: i => i.data,
      $props: i => (shallowReadonly(i.props) ),
      $attrs: i => (shallowReadonly(i.attrs) ),
      $slots: i => (shallowReadonly(i.slots) ),
      $refs: i => (shallowReadonly(i.refs) ),
      $parent: i => getPublicInstance(i.parent),
      $root: i => getPublicInstance(i.root),
      $emit: i => i.emit,
      $options: i => (resolveMergedOptions(i) ),
      $forceUpdate: i => () => queueJob(i.update),
      $nextTick: i => nextTick.bind(i.proxy),
      $watch: i => (instanceWatch.bind(i) )
  });
  const PublicInstanceProxyHandlers = {
      get({ _: instance }, key) {
          const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
          // for internal formatters to know that this is a Vue instance
          if (key === '__isVue') {
              return true;
          }
          // prioritize <script setup> bindings during dev.
          // this allows even properties that start with _ or $ to be used - so that
          // it aligns with the production behavior where the render fn is inlined and
          // indeed has access to all declared variables.
          if (setupState !== EMPTY_OBJ &&
              setupState.__isScriptSetup &&
              hasOwn(setupState, key)) {
              return setupState[key];
          }
          // data / props / ctx
          // This getter gets called for every property access on the render context
          // during render and is a major hotspot. The most expensive part of this
          // is the multiple hasOwn() calls. It's much faster to do a simple property
          // access on a plain object, so we use an accessCache object (with null
          // prototype) to memoize what access type a key corresponds to.
          let normalizedProps;
          if (key[0] !== '$') {
              const n = accessCache[key];
              if (n !== undefined) {
                  switch (n) {
                      case 0 /* SETUP */:
                          return setupState[key];
                      case 1 /* DATA */:
                          return data[key];
                      case 3 /* CONTEXT */:
                          return ctx[key];
                      case 2 /* PROPS */:
                          return props[key];
                      // default: just fallthrough
                  }
              }
              else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                  accessCache[key] = 0 /* SETUP */;
                  return setupState[key];
              }
              else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                  accessCache[key] = 1 /* DATA */;
                  return data[key];
              }
              else if (
              // only cache other properties when instance has declared (thus stable)
              // props
              (normalizedProps = instance.propsOptions[0]) &&
                  hasOwn(normalizedProps, key)) {
                  accessCache[key] = 2 /* PROPS */;
                  return props[key];
              }
              else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                  accessCache[key] = 3 /* CONTEXT */;
                  return ctx[key];
              }
              else if (shouldCacheAccess) {
                  accessCache[key] = 4 /* OTHER */;
              }
          }
          const publicGetter = publicPropertiesMap[key];
          let cssModule, globalProperties;
          // public $xxx properties
          if (publicGetter) {
              if (key === '$attrs') {
                  track(instance, "get" /* GET */, key);
                  markAttrsAccessed();
              }
              return publicGetter(instance);
          }
          else if (
          // css module (injected by vue-loader)
          (cssModule = type.__cssModules) &&
              (cssModule = cssModule[key])) {
              return cssModule;
          }
          else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
              // user may set custom properties to `this` that start with `$`
              accessCache[key] = 3 /* CONTEXT */;
              return ctx[key];
          }
          else if (
          // global properties
          ((globalProperties = appContext.config.globalProperties),
              hasOwn(globalProperties, key))) {
              {
                  return globalProperties[key];
              }
          }
          else if (currentRenderingInstance &&
              (!isString(key) ||
                  // #1091 avoid internal isRef/isVNode checks on component instance leading
                  // to infinite warning loop
                  key.indexOf('__v') !== 0)) {
              if (data !== EMPTY_OBJ &&
                  (key[0] === '$' || key[0] === '_') &&
                  hasOwn(data, key)) {
                  warn$1(`Property ${JSON.stringify(key)} must be accessed via $data because it starts with a reserved ` +
                      `character ("$" or "_") and is not proxied on the render context.`);
              }
              else if (instance === currentRenderingInstance) {
                  warn$1(`Property ${JSON.stringify(key)} was accessed during render ` +
                      `but is not defined on instance.`);
              }
          }
      },
      set({ _: instance }, key, value) {
          const { data, setupState, ctx } = instance;
          if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
              setupState[key] = value;
          }
          else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
              data[key] = value;
          }
          else if (hasOwn(instance.props, key)) {
              warn$1(`Attempting to mutate prop "${key}". Props are readonly.`, instance);
              return false;
          }
          if (key[0] === '$' && key.slice(1) in instance) {
              warn$1(`Attempting to mutate public property "${key}". ` +
                      `Properties starting with $ are reserved and readonly.`, instance);
              return false;
          }
          else {
              if (key in instance.appContext.config.globalProperties) {
                  Object.defineProperty(ctx, key, {
                      enumerable: true,
                      configurable: true,
                      value
                  });
              }
              else {
                  ctx[key] = value;
              }
          }
          return true;
      },
      has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
          let normalizedProps;
          return (accessCache[key] !== undefined ||
              (data !== EMPTY_OBJ && hasOwn(data, key)) ||
              (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
              ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
              hasOwn(ctx, key) ||
              hasOwn(publicPropertiesMap, key) ||
              hasOwn(appContext.config.globalProperties, key));
      }
  };
  {
      PublicInstanceProxyHandlers.ownKeys = (target) => {
          warn$1(`Avoid app logic that relies on enumerating keys on a component instance. ` +
              `The keys will be empty in production mode to avoid performance overhead.`);
          return Reflect.ownKeys(target);
      };
  }
  // dev only
  // In dev mode, the proxy target exposes the same properties as seen on `this`
  // for easier console inspection. In prod mode it will be an empty object so
  // these properties definitions can be skipped.
  function createDevRenderContext(instance) {
      const target = {};
      // expose internal instance for proxy handlers
      Object.defineProperty(target, `_`, {
          configurable: true,
          enumerable: false,
          get: () => instance
      });
      // expose public properties
      Object.keys(publicPropertiesMap).forEach(key => {
          Object.defineProperty(target, key, {
              configurable: true,
              enumerable: false,
              get: () => publicPropertiesMap[key](instance),
              // intercepted by the proxy so no need for implementation,
              // but needed to prevent set errors
              set: NOOP
          });
      });
      return target;
  }
  // dev only
  function exposePropsOnRenderContext(instance) {
      const { ctx, propsOptions: [propsOptions] } = instance;
      if (propsOptions) {
          Object.keys(propsOptions).forEach(key => {
              Object.defineProperty(ctx, key, {
                  enumerable: true,
                  configurable: true,
                  get: () => instance.props[key],
                  set: NOOP
              });
          });
      }
  }
  // dev only
  function exposeSetupStateOnRenderContext(instance) {
      const { ctx, setupState } = instance;
      Object.keys(toRaw(setupState)).forEach(key => {
          if (!setupState.__isScriptSetup && (key[0] === '$' || key[0] === '_')) {
              warn$1(`setup() return property ${JSON.stringify(key)} should not start with "$" or "_" ` +
                  `which are reserved prefixes for Vue internals.`);
              return;
          }
          Object.defineProperty(ctx, key, {
              enumerable: true,
              configurable: true,
              get: () => setupState[key],
              set: NOOP
          });
      });
  }

  const emptyAppContext = createAppContext();
  let uid$1 = 0;
  function createComponentInstance(vnode, parent, suspense) {
      const type = vnode.type;
      // inherit parent app context - or - if root, adopt from root vnode
      const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
      const instance = {
          uid: uid$1++,
          vnode,
          type,
          parent,
          appContext,
          root: null,
          next: null,
          subTree: null,
          update: null,
          scope: new EffectScope(true /* detached */),
          render: null,
          proxy: null,
          exposed: null,
          exposeProxy: null,
          withProxy: null,
          provides: parent ? parent.provides : Object.create(appContext.provides),
          accessCache: null,
          renderCache: [],
          // local resovled assets
          components: null,
          directives: null,
          // resolved props and emits options
          propsOptions: normalizePropsOptions(type, appContext),
          emitsOptions: normalizeEmitsOptions(type, appContext),
          // emit
          emit: null,
          emitted: null,
          // props default value
          propsDefaults: EMPTY_OBJ,
          // inheritAttrs
          inheritAttrs: type.inheritAttrs,
          // state
          ctx: EMPTY_OBJ,
          data: EMPTY_OBJ,
          props: EMPTY_OBJ,
          attrs: EMPTY_OBJ,
          slots: EMPTY_OBJ,
          refs: EMPTY_OBJ,
          setupState: EMPTY_OBJ,
          setupContext: null,
          // suspense related
          suspense,
          suspenseId: suspense ? suspense.pendingId : 0,
          asyncDep: null,
          asyncResolved: false,
          // lifecycle hooks
          // not using enums here because it results in computed properties
          isMounted: false,
          isUnmounted: false,
          isDeactivated: false,
          bc: null,
          c: null,
          bm: null,
          m: null,
          bu: null,
          u: null,
          um: null,
          bum: null,
          da: null,
          a: null,
          rtg: null,
          rtc: null,
          ec: null,
          sp: null
      };
      {
          instance.ctx = createDevRenderContext(instance);
      }
      instance.root = parent ? parent.root : instance;
      instance.emit = emit.bind(null, instance);
      // apply custom element special handling
      if (vnode.ce) {
          vnode.ce(instance);
      }
      return instance;
  }
  let currentInstance = null;
  const setCurrentInstance = (instance) => {
      currentInstance = instance;
      instance.scope.on();
  };
  const unsetCurrentInstance = () => {
      currentInstance && currentInstance.scope.off();
      currentInstance = null;
  };
  const isBuiltInTag = /*#__PURE__*/ makeMap('slot,component');
  function validateComponentName(name, config) {
      const appIsNativeTag = config.isNativeTag || NO;
      if (isBuiltInTag(name) || appIsNativeTag(name)) {
          warn$1('Do not use built-in or reserved HTML elements as component id: ' + name);
      }
  }
  function isStatefulComponent(instance) {
      return instance.vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
  }
  let isInSSRComponentSetup = false;
  function setupComponent(instance, isSSR = false) {
      isInSSRComponentSetup = isSSR;
      const { props, children } = instance.vnode;
      const isStateful = isStatefulComponent(instance);
      initProps(instance, props, isStateful, isSSR);
      initSlots(instance, children);
      const setupResult = isStateful
          ? setupStatefulComponent(instance, isSSR)
          : undefined;
      isInSSRComponentSetup = false;
      return setupResult;
  }
  function setupStatefulComponent(instance, isSSR) {
      const Component = instance.type;
      {
          if (Component.name) {
              validateComponentName(Component.name, instance.appContext.config);
          }
          if (Component.components) {
              const names = Object.keys(Component.components);
              for (let i = 0; i < names.length; i++) {
                  validateComponentName(names[i], instance.appContext.config);
              }
          }
          if (Component.directives) {
              const names = Object.keys(Component.directives);
              for (let i = 0; i < names.length; i++) {
                  validateDirectiveName(names[i]);
              }
          }
          if (Component.compilerOptions && isRuntimeOnly()) {
              warn$1(`"compilerOptions" is only supported when using a build of Vue that ` +
                  `includes the runtime compiler. Since you are using a runtime-only ` +
                  `build, the options should be passed via your build tool config instead.`);
          }
      }
      // 0. create render proxy property access cache
      instance.accessCache = Object.create(null);
      // 1. create public instance / render proxy
      // also mark it raw so it's never observed
      instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers));
      {
          exposePropsOnRenderContext(instance);
      }
      // 2. call setup()
      const { setup } = Component;
      if (setup) {
          const setupContext = (instance.setupContext =
              setup.length > 1 ? createSetupContext(instance) : null);
          setCurrentInstance(instance);
          pauseTracking();
          const setupResult = callWithErrorHandling(setup, instance, 0 /* SETUP_FUNCTION */, [shallowReadonly(instance.props) , setupContext]);
          resetTracking();
          unsetCurrentInstance();
          if (isPromise(setupResult)) {
              setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
              if (isSSR) {
                  // return the promise so server-renderer can wait on it
                  return setupResult
                      .then((resolvedResult) => {
                      handleSetupResult(instance, resolvedResult, isSSR);
                  })
                      .catch(e => {
                      handleError(e, instance, 0 /* SETUP_FUNCTION */);
                  });
              }
              else {
                  // async setup returned Promise.
                  // bail here and wait for re-entry.
                  instance.asyncDep = setupResult;
              }
          }
          else {
              handleSetupResult(instance, setupResult, isSSR);
          }
      }
      else {
          finishComponentSetup(instance, isSSR);
      }
  }
  function handleSetupResult(instance, setupResult, isSSR) {
      if (isFunction(setupResult)) {
          // setup returned an inline render function
          {
              instance.render = setupResult;
          }
      }
      else if (isObject(setupResult)) {
          if (isVNode(setupResult)) {
              warn$1(`setup() should not return VNodes directly - ` +
                  `return a render function instead.`);
          }
          // setup returned bindings.
          // assuming a render function compiled from template is present.
          {
              instance.devtoolsRawSetupState = setupResult;
          }
          instance.setupState = proxyRefs(setupResult);
          {
              exposeSetupStateOnRenderContext(instance);
          }
      }
      else if (setupResult !== undefined) {
          warn$1(`setup() should return an object. Received: ${setupResult === null ? 'null' : typeof setupResult}`);
      }
      finishComponentSetup(instance, isSSR);
  }
  let compile;
  // dev only
  const isRuntimeOnly = () => !compile;
  function finishComponentSetup(instance, isSSR, skipOptions) {
      const Component = instance.type;
      // template / render function normalization
      if (!instance.render) {
          instance.render = (Component.render || NOOP);
      }
      // support for 2.x options
      {
          setCurrentInstance(instance);
          pauseTracking();
          applyOptions(instance);
          resetTracking();
          unsetCurrentInstance();
      }
      // warn missing template/render
      // the runtime compilation of template in SSR is done by server-render
      if (!Component.render && instance.render === NOOP && !isSSR) {
          /* istanbul ignore if */
          if (Component.template) {
              warn$1(`Component provided template option but ` +
                  `runtime compilation is not supported in this build of Vue.` +
                  (` Use "vue.esm-browser.js" instead.`
                          ) /* should not happen */);
          }
          else {
              warn$1(`Component is missing template or render function.`);
          }
      }
  }
  function createAttrsProxy(instance) {
      return new Proxy(instance.attrs, {
              get(target, key) {
                  markAttrsAccessed();
                  track(instance, "get" /* GET */, '$attrs');
                  return target[key];
              },
              set() {
                  warn$1(`setupContext.attrs is readonly.`);
                  return false;
              },
              deleteProperty() {
                  warn$1(`setupContext.attrs is readonly.`);
                  return false;
              }
          }
          );
  }
  function createSetupContext(instance) {
      const expose = exposed => {
          if (instance.exposed) {
              warn$1(`expose() should be called only once per setup().`);
          }
          instance.exposed = exposed || {};
      };
      let attrs;
      {
          // We use getters in dev in case libs like test-utils overwrite instance
          // properties (overwrites should not be done in prod)
          return Object.freeze({
              get attrs() {
                  return attrs || (attrs = createAttrsProxy(instance));
              },
              get slots() {
                  return shallowReadonly(instance.slots);
              },
              get emit() {
                  return (event, ...args) => instance.emit(event, ...args);
              },
              expose
          });
      }
  }
  function getExposeProxy(instance) {
      if (instance.exposed) {
          return (instance.exposeProxy ||
              (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
                  get(target, key) {
                      if (key in target) {
                          return target[key];
                      }
                      else if (key in publicPropertiesMap) {
                          return publicPropertiesMap[key](instance);
                      }
                  }
              })));
      }
  }
  const classifyRE = /(?:^|[-_])(\w)/g;
  const classify = (str) => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '');
  function getComponentName(Component) {
      return isFunction(Component)
          ? Component.displayName || Component.name
          : Component.name;
  }
  /* istanbul ignore next */
  function formatComponentName(instance, Component, isRoot = false) {
      let name = getComponentName(Component);
      if (!name && Component.__file) {
          const match = Component.__file.match(/([^/\\]+)\.\w+$/);
          if (match) {
              name = match[1];
          }
      }
      if (!name && instance && instance.parent) {
          // try to infer the name based on reverse resolution
          const inferFromRegistry = (registry) => {
              for (const key in registry) {
                  if (registry[key] === Component) {
                      return key;
                  }
              }
          };
          name =
              inferFromRegistry(instance.components ||
                  instance.parent.type.components) || inferFromRegistry(instance.appContext.components);
      }
      return name ? classify(name) : isRoot ? `App` : `Anonymous`;
  }
  function isClassComponent(value) {
      return isFunction(value) && '__vccOpts' in value;
  }

  const stack = [];
  function pushWarningContext(vnode) {
      stack.push(vnode);
  }
  function popWarningContext() {
      stack.pop();
  }
  function warn$1(msg, ...args) {
      // avoid props formatting or warn handler tracking deps that might be mutated
      // during patch, leading to infinite recursion.
      pauseTracking();
      const instance = stack.length ? stack[stack.length - 1].component : null;
      const appWarnHandler = instance && instance.appContext.config.warnHandler;
      const trace = getComponentTrace();
      if (appWarnHandler) {
          callWithErrorHandling(appWarnHandler, instance, 11 /* APP_WARN_HANDLER */, [
              msg + args.join(''),
              instance && instance.proxy,
              trace
                  .map(({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`)
                  .join('\n'),
              trace
          ]);
      }
      else {
          const warnArgs = [`[Vue warn]: ${msg}`, ...args];
          /* istanbul ignore if */
          if (trace.length &&
              // avoid spamming console during tests
              !false) {
              warnArgs.push(`\n`, ...formatTrace(trace));
          }
          console.warn(...warnArgs);
      }
      resetTracking();
  }
  function getComponentTrace() {
      let currentVNode = stack[stack.length - 1];
      if (!currentVNode) {
          return [];
      }
      // we can't just use the stack because it will be incomplete during updates
      // that did not start from the root. Re-construct the parent chain using
      // instance parent pointers.
      const normalizedStack = [];
      while (currentVNode) {
          const last = normalizedStack[0];
          if (last && last.vnode === currentVNode) {
              last.recurseCount++;
          }
          else {
              normalizedStack.push({
                  vnode: currentVNode,
                  recurseCount: 0
              });
          }
          const parentInstance = currentVNode.component && currentVNode.component.parent;
          currentVNode = parentInstance && parentInstance.vnode;
      }
      return normalizedStack;
  }
  /* istanbul ignore next */
  function formatTrace(trace) {
      const logs = [];
      trace.forEach((entry, i) => {
          logs.push(...(i === 0 ? [] : [`\n`]), ...formatTraceEntry(entry));
      });
      return logs;
  }
  function formatTraceEntry({ vnode, recurseCount }) {
      const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
      const isRoot = vnode.component ? vnode.component.parent == null : false;
      const open = ` at <${formatComponentName(vnode.component, vnode.type, isRoot)}`;
      const close = `>` + postfix;
      return vnode.props
          ? [open, ...formatProps(vnode.props), close]
          : [open + close];
  }
  /* istanbul ignore next */
  function formatProps(props) {
      const res = [];
      const keys = Object.keys(props);
      keys.slice(0, 3).forEach(key => {
          res.push(...formatProp(key, props[key]));
      });
      if (keys.length > 3) {
          res.push(` ...`);
      }
      return res;
  }
  /* istanbul ignore next */
  function formatProp(key, value, raw) {
      if (isString(value)) {
          value = JSON.stringify(value);
          return raw ? value : [`${key}=${value}`];
      }
      else if (typeof value === 'number' ||
          typeof value === 'boolean' ||
          value == null) {
          return raw ? value : [`${key}=${value}`];
      }
      else if (isRef(value)) {
          value = formatProp(key, toRaw(value.value), true);
          return raw ? value : [`${key}=Ref<`, value, `>`];
      }
      else if (isFunction(value)) {
          return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
      }
      else {
          value = toRaw(value);
          return raw ? value : [`${key}=`, value];
      }
  }

  const ErrorTypeStrings = {
      ["sp" /* SERVER_PREFETCH */]: 'serverPrefetch hook',
      ["bc" /* BEFORE_CREATE */]: 'beforeCreate hook',
      ["c" /* CREATED */]: 'created hook',
      ["bm" /* BEFORE_MOUNT */]: 'beforeMount hook',
      ["m" /* MOUNTED */]: 'mounted hook',
      ["bu" /* BEFORE_UPDATE */]: 'beforeUpdate hook',
      ["u" /* UPDATED */]: 'updated',
      ["bum" /* BEFORE_UNMOUNT */]: 'beforeUnmount hook',
      ["um" /* UNMOUNTED */]: 'unmounted hook',
      ["a" /* ACTIVATED */]: 'activated hook',
      ["da" /* DEACTIVATED */]: 'deactivated hook',
      ["ec" /* ERROR_CAPTURED */]: 'errorCaptured hook',
      ["rtc" /* RENDER_TRACKED */]: 'renderTracked hook',
      ["rtg" /* RENDER_TRIGGERED */]: 'renderTriggered hook',
      [0 /* SETUP_FUNCTION */]: 'setup function',
      [1 /* RENDER_FUNCTION */]: 'render function',
      [2 /* WATCH_GETTER */]: 'watcher getter',
      [3 /* WATCH_CALLBACK */]: 'watcher callback',
      [4 /* WATCH_CLEANUP */]: 'watcher cleanup function',
      [5 /* NATIVE_EVENT_HANDLER */]: 'native event handler',
      [6 /* COMPONENT_EVENT_HANDLER */]: 'component event handler',
      [7 /* VNODE_HOOK */]: 'vnode hook',
      [8 /* DIRECTIVE_HOOK */]: 'directive hook',
      [9 /* TRANSITION_HOOK */]: 'transition hook',
      [10 /* APP_ERROR_HANDLER */]: 'app errorHandler',
      [11 /* APP_WARN_HANDLER */]: 'app warnHandler',
      [12 /* FUNCTION_REF */]: 'ref function',
      [13 /* ASYNC_COMPONENT_LOADER */]: 'async component loader',
      [14 /* SCHEDULER */]: 'scheduler flush. This is likely a Vue internals bug. ' +
          'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/vue-next'
  };
  function callWithErrorHandling(fn, instance, type, args) {
      let res;
      try {
          res = args ? fn(...args) : fn();
      }
      catch (err) {
          handleError(err, instance, type);
      }
      return res;
  }
  function callWithAsyncErrorHandling(fn, instance, type, args) {
      if (isFunction(fn)) {
          const res = callWithErrorHandling(fn, instance, type, args);
          if (res && isPromise(res)) {
              res.catch(err => {
                  handleError(err, instance, type);
              });
          }
          return res;
      }
      const values = [];
      for (let i = 0; i < fn.length; i++) {
          values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
      }
      return values;
  }
  function handleError(err, instance, type, throwInDev = true) {
      const contextVNode = instance ? instance.vnode : null;
      if (instance) {
          let cur = instance.parent;
          // the exposed instance is the render proxy to keep it consistent with 2.x
          const exposedInstance = instance.proxy;
          // in production the hook receives only the error code
          const errorInfo = ErrorTypeStrings[type] ;
          while (cur) {
              const errorCapturedHooks = cur.ec;
              if (errorCapturedHooks) {
                  for (let i = 0; i < errorCapturedHooks.length; i++) {
                      if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
                          return;
                      }
                  }
              }
              cur = cur.parent;
          }
          // app-level handling
          const appErrorHandler = instance.appContext.config.errorHandler;
          if (appErrorHandler) {
              callWithErrorHandling(appErrorHandler, null, 10 /* APP_ERROR_HANDLER */, [err, exposedInstance, errorInfo]);
              return;
          }
      }
      logError(err, type, contextVNode, throwInDev);
  }
  function logError(err, type, contextVNode, throwInDev = true) {
      {
          const info = ErrorTypeStrings[type];
          if (contextVNode) {
              pushWarningContext(contextVNode);
          }
          warn$1(`Unhandled error${info ? ` during execution of ${info}` : ``}`);
          if (contextVNode) {
              popWarningContext();
          }
          // crash in dev by default so it's more noticeable
          if (throwInDev) {
              throw err;
          }
          else {
              console.error(err);
          }
      }
  }

  let isFlushing = false;
  let isFlushPending = false;
  const queue = [];
  let flushIndex = 0;
  const pendingPreFlushCbs = [];
  let activePreFlushCbs = null;
  let preFlushIndex = 0;
  const pendingPostFlushCbs = [];
  let activePostFlushCbs = null;
  let postFlushIndex = 0;
  const resolvedPromise = Promise.resolve();
  let currentFlushPromise = null;
  let currentPreFlushParentJob = null;
  const RECURSION_LIMIT = 100;
  function nextTick(fn) {
      const p = currentFlushPromise || resolvedPromise;
      return fn ? p.then(this ? fn.bind(this) : fn) : p;
  }
  // #2768
  // Use binary-search to find a suitable position in the queue,
  // so that the queue maintains the increasing order of job's id,
  // which can prevent the job from being skipped and also can avoid repeated patching.
  function findInsertionIndex(id) {
      // the start index should be `flushIndex + 1`
      let start = flushIndex + 1;
      let end = queue.length;
      while (start < end) {
          const middle = (start + end) >>> 1;
          const middleJobId = getId(queue[middle]);
          middleJobId < id ? (start = middle + 1) : (end = middle);
      }
      return start;
  }
  function queueJob(job) {
      // the dedupe search uses the startIndex argument of Array.includes()
      // by default the search index includes the current job that is being run
      // so it cannot recursively trigger itself again.
      // if the job is a watch() callback, the search will start with a +1 index to
      // allow it recursively trigger itself - it is the user's responsibility to
      // ensure it doesn't end up in an infinite loop.
      if ((!queue.length ||
          !queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)) &&
          job !== currentPreFlushParentJob) {
          if (job.id == null) {
              queue.push(job);
          }
          else {
              queue.splice(findInsertionIndex(job.id), 0, job);
          }
          queueFlush();
      }
  }
  function queueFlush() {
      if (!isFlushing && !isFlushPending) {
          isFlushPending = true;
          currentFlushPromise = resolvedPromise.then(flushJobs);
      }
  }
  function invalidateJob(job) {
      const i = queue.indexOf(job);
      if (i > flushIndex) {
          queue.splice(i, 1);
      }
  }
  function queueCb(cb, activeQueue, pendingQueue, index) {
      if (!isArray(cb)) {
          if (!activeQueue ||
              !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)) {
              pendingQueue.push(cb);
          }
      }
      else {
          // if cb is an array, it is a component lifecycle hook which can only be
          // triggered by a job, which is already deduped in the main queue, so
          // we can skip duplicate check here to improve perf
          pendingQueue.push(...cb);
      }
      queueFlush();
  }
  function queuePreFlushCb(cb) {
      queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
  }
  function queuePostFlushCb(cb) {
      queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
  }
  function flushPreFlushCbs(seen, parentJob = null) {
      if (pendingPreFlushCbs.length) {
          currentPreFlushParentJob = parentJob;
          activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
          pendingPreFlushCbs.length = 0;
          {
              seen = seen || new Map();
          }
          for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
              if (checkRecursiveUpdates(seen, activePreFlushCbs[preFlushIndex])) {
                  continue;
              }
              activePreFlushCbs[preFlushIndex]();
          }
          activePreFlushCbs = null;
          preFlushIndex = 0;
          currentPreFlushParentJob = null;
          // recursively flush until it drains
          flushPreFlushCbs(seen, parentJob);
      }
  }
  function flushPostFlushCbs(seen) {
      if (pendingPostFlushCbs.length) {
          const deduped = [...new Set(pendingPostFlushCbs)];
          pendingPostFlushCbs.length = 0;
          // #1947 already has active queue, nested flushPostFlushCbs call
          if (activePostFlushCbs) {
              activePostFlushCbs.push(...deduped);
              return;
          }
          activePostFlushCbs = deduped;
          {
              seen = seen || new Map();
          }
          activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
          for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
              if (checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex])) {
                  continue;
              }
              activePostFlushCbs[postFlushIndex]();
          }
          activePostFlushCbs = null;
          postFlushIndex = 0;
      }
  }
  const getId = (job) => job.id == null ? Infinity : job.id;
  function flushJobs(seen) {
      isFlushPending = false;
      isFlushing = true;
      {
          seen = seen || new Map();
      }
      flushPreFlushCbs(seen);
      // Sort queue before flush.
      // This ensures that:
      // 1. Components are updated from parent to child. (because parent is always
      //    created before the child so its render effect will have smaller
      //    priority number)
      // 2. If a component is unmounted during a parent component's update,
      //    its update can be skipped.
      queue.sort((a, b) => getId(a) - getId(b));
      try {
          for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
              const job = queue[flushIndex];
              if (job && job.active !== false) {
                  if (true && checkRecursiveUpdates(seen, job)) {
                      continue;
                  }
                  // console.log(`running:`, job.id)
                  callWithErrorHandling(job, null, 14 /* SCHEDULER */);
              }
          }
      }
      finally {
          flushIndex = 0;
          queue.length = 0;
          flushPostFlushCbs(seen);
          isFlushing = false;
          currentFlushPromise = null;
          // some postFlushCb queued jobs!
          // keep flushing until it drains.
          if (queue.length ||
              pendingPreFlushCbs.length ||
              pendingPostFlushCbs.length) {
              flushJobs(seen);
          }
      }
  }
  function checkRecursiveUpdates(seen, fn) {
      if (!seen.has(fn)) {
          seen.set(fn, 1);
      }
      else {
          const count = seen.get(fn);
          if (count > RECURSION_LIMIT) {
              const instance = fn.ownerInstance;
              const componentName = instance && getComponentName(instance.type);
              warn$1(`Maximum recursive updates exceeded${componentName ? ` in component <${componentName}>` : ``}. ` +
                  `This means you have a reactive effect that is mutating its own ` +
                  `dependencies and thus recursively triggering itself. Possible sources ` +
                  `include component template, render function, updated hook or ` +
                  `watcher source function.`);
              return true;
          }
          else {
              seen.set(fn, count + 1);
          }
      }
  }
  // initial value for watchers to trigger on undefined initial values
  const INITIAL_WATCHER_VALUE = {};
  // implementation
  function watch(source, cb, options) {
      if (!isFunction(cb)) {
          warn$1(`\`watch(fn, options?)\` signature has been moved to a separate API. ` +
              `Use \`watchEffect(fn, options?)\` instead. \`watch\` now only ` +
              `supports \`watch(source, cb, options?) signature.`);
      }
      return doWatch(source, cb, options);
  }
  function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ) {
      if (!cb) {
          if (immediate !== undefined) {
              warn$1(`watch() "immediate" option is only respected when using the ` +
                  `watch(source, callback, options?) signature.`);
          }
          if (deep !== undefined) {
              warn$1(`watch() "deep" option is only respected when using the ` +
                  `watch(source, callback, options?) signature.`);
          }
      }
      const warnInvalidSource = (s) => {
          warn$1(`Invalid watch source: `, s, `A watch source can only be a getter/effect function, a ref, ` +
              `a reactive object, or an array of these types.`);
      };
      const instance = currentInstance;
      let getter;
      let forceTrigger = false;
      let isMultiSource = false;
      if (isRef(source)) {
          getter = () => source.value;
          forceTrigger = !!source._shallow;
      }
      else if (isReactive(source)) {
          getter = () => source;
          deep = true;
      }
      else if (isArray(source)) {
          isMultiSource = true;
          forceTrigger = source.some(isReactive);
          getter = () => source.map(s => {
              if (isRef(s)) {
                  return s.value;
              }
              else if (isReactive(s)) {
                  return traverse(s);
              }
              else if (isFunction(s)) {
                  return callWithErrorHandling(s, instance, 2 /* WATCH_GETTER */);
              }
              else {
                  warnInvalidSource(s);
              }
          });
      }
      else if (isFunction(source)) {
          if (cb) {
              // getter with cb
              getter = () => callWithErrorHandling(source, instance, 2 /* WATCH_GETTER */);
          }
          else {
              // no cb -> simple effect
              getter = () => {
                  if (instance && instance.isUnmounted) {
                      return;
                  }
                  if (cleanup) {
                      cleanup();
                  }
                  return callWithAsyncErrorHandling(source, instance, 3 /* WATCH_CALLBACK */, [onInvalidate]);
              };
          }
      }
      else {
          getter = NOOP;
          warnInvalidSource(source);
      }
      if (cb && deep) {
          const baseGetter = getter;
          getter = () => traverse(baseGetter());
      }
      let cleanup;
      let onInvalidate = (fn) => {
          cleanup = effect.onStop = () => {
              callWithErrorHandling(fn, instance, 4 /* WATCH_CLEANUP */);
          };
      };
      let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE;
      const job = () => {
          if (!effect.active) {
              return;
          }
          if (cb) {
              // watch(source, cb)
              const newValue = effect.run();
              if (deep ||
                  forceTrigger ||
                  (isMultiSource
                      ? newValue.some((v, i) => hasChanged(v, oldValue[i]))
                      : hasChanged(newValue, oldValue)) ||
                  (false  )) {
                  // cleanup before running cb again
                  if (cleanup) {
                      cleanup();
                  }
                  callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
                      newValue,
                      // pass undefined as the old value when it's changed for the first time
                      oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                      onInvalidate
                  ]);
                  oldValue = newValue;
              }
          }
          else {
              // watchEffect
              effect.run();
          }
      };
      // important: mark the job as a watcher callback so that scheduler knows
      // it is allowed to self-trigger (#1727)
      job.allowRecurse = !!cb;
      let scheduler;
      if (flush === 'sync') {
          scheduler = job; // the scheduler function gets called directly
      }
      else if (flush === 'post') {
          scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
      }
      else {
          // default: 'pre'
          scheduler = () => {
              if (!instance || instance.isMounted) {
                  queuePreFlushCb(job);
              }
              else {
                  // with 'pre' option, the first call must happen before
                  // the component is mounted so it is called synchronously.
                  job();
              }
          };
      }
      const effect = new ReactiveEffect(getter, scheduler);
      {
          effect.onTrack = onTrack;
          effect.onTrigger = onTrigger;
      }
      // initial run
      if (cb) {
          if (immediate) {
              job();
          }
          else {
              oldValue = effect.run();
          }
      }
      else if (flush === 'post') {
          queuePostRenderEffect(effect.run.bind(effect), instance && instance.suspense);
      }
      else {
          effect.run();
      }
      return () => {
          effect.stop();
          if (instance && instance.scope) {
              remove(instance.scope.effects, effect);
          }
      };
  }
  // this.$watch
  function instanceWatch(source, value, options) {
      const publicThis = this.proxy;
      const getter = isString(source)
          ? source.includes('.')
              ? createPathGetter(publicThis, source)
              : () => publicThis[source]
          : source.bind(publicThis, publicThis);
      let cb;
      if (isFunction(value)) {
          cb = value;
      }
      else {
          cb = value.handler;
          options = value;
      }
      const cur = currentInstance;
      setCurrentInstance(this);
      const res = doWatch(getter, cb.bind(publicThis), options);
      if (cur) {
          setCurrentInstance(cur);
      }
      else {
          unsetCurrentInstance();
      }
      return res;
  }
  function createPathGetter(ctx, path) {
      const segments = path.split('.');
      return () => {
          let cur = ctx;
          for (let i = 0; i < segments.length && cur; i++) {
              cur = cur[segments[i]];
          }
          return cur;
      };
  }
  function traverse(value, seen = new Set()) {
      if (!isObject(value) || value["__v_skip" /* SKIP */]) {
          return value;
      }
      seen = seen || new Set();
      if (seen.has(value)) {
          return value;
      }
      seen.add(value);
      if (isRef(value)) {
          traverse(value.value, seen);
      }
      else if (isArray(value)) {
          for (let i = 0; i < value.length; i++) {
              traverse(value[i], seen);
          }
      }
      else if (isSet(value) || isMap(value)) {
          value.forEach((v) => {
              traverse(v, seen);
          });
      }
      else if (isPlainObject(value)) {
          for (const key in value) {
              traverse(value[key], seen);
          }
      }
      return value;
  }

  function initCustomFormatter() {
      /* eslint-disable no-restricted-globals */
      if (typeof window === 'undefined') {
          return;
      }
      const vueStyle = { style: 'color:#3ba776' };
      const numberStyle = { style: 'color:#0b1bc9' };
      const stringStyle = { style: 'color:#b62e24' };
      const keywordStyle = { style: 'color:#9d288c' };
      // custom formatter for Chrome
      // https://www.mattzeunert.com/2016/02/19/custom-chrome-devtools-object-formatters.html
      const formatter = {
          header(obj) {
              // TODO also format ComponentPublicInstance & ctx.slots/attrs in setup
              if (!isObject(obj)) {
                  return null;
              }
              if (obj.__isVue) {
                  return ['div', vueStyle, `VueInstance`];
              }
              else if (isRef(obj)) {
                  return [
                      'div',
                      {},
                      ['span', vueStyle, genRefFlag(obj)],
                      '<',
                      formatValue(obj.value),
                      `>`
                  ];
              }
              else if (isReactive(obj)) {
                  return [
                      'div',
                      {},
                      ['span', vueStyle, 'Reactive'],
                      '<',
                      formatValue(obj),
                      `>${isReadonly(obj) ? ` (readonly)` : ``}`
                  ];
              }
              else if (isReadonly(obj)) {
                  return [
                      'div',
                      {},
                      ['span', vueStyle, 'Readonly'],
                      '<',
                      formatValue(obj),
                      '>'
                  ];
              }
              return null;
          },
          hasBody(obj) {
              return obj && obj.__isVue;
          },
          body(obj) {
              if (obj && obj.__isVue) {
                  return [
                      'div',
                      {},
                      ...formatInstance(obj.$)
                  ];
              }
          }
      };
      function formatInstance(instance) {
          const blocks = [];
          if (instance.type.props && instance.props) {
              blocks.push(createInstanceBlock('props', toRaw(instance.props)));
          }
          if (instance.setupState !== EMPTY_OBJ) {
              blocks.push(createInstanceBlock('setup', instance.setupState));
          }
          if (instance.data !== EMPTY_OBJ) {
              blocks.push(createInstanceBlock('data', toRaw(instance.data)));
          }
          const computed = extractKeys(instance, 'computed');
          if (computed) {
              blocks.push(createInstanceBlock('computed', computed));
          }
          const injected = extractKeys(instance, 'inject');
          if (injected) {
              blocks.push(createInstanceBlock('injected', injected));
          }
          blocks.push([
              'div',
              {},
              [
                  'span',
                  {
                      style: keywordStyle.style + ';opacity:0.66'
                  },
                  '$ (internal): '
              ],
              ['object', { object: instance }]
          ]);
          return blocks;
      }
      function createInstanceBlock(type, target) {
          target = extend({}, target);
          if (!Object.keys(target).length) {
              return ['span', {}];
          }
          return [
              'div',
              { style: 'line-height:1.25em;margin-bottom:0.6em' },
              [
                  'div',
                  {
                      style: 'color:#476582'
                  },
                  type
              ],
              [
                  'div',
                  {
                      style: 'padding-left:1.25em'
                  },
                  ...Object.keys(target).map(key => {
                      return [
                          'div',
                          {},
                          ['span', keywordStyle, key + ': '],
                          formatValue(target[key], false)
                      ];
                  })
              ]
          ];
      }
      function formatValue(v, asRaw = true) {
          if (typeof v === 'number') {
              return ['span', numberStyle, v];
          }
          else if (typeof v === 'string') {
              return ['span', stringStyle, JSON.stringify(v)];
          }
          else if (typeof v === 'boolean') {
              return ['span', keywordStyle, v];
          }
          else if (isObject(v)) {
              return ['object', { object: asRaw ? toRaw(v) : v }];
          }
          else {
              return ['span', stringStyle, String(v)];
          }
      }
      function extractKeys(instance, type) {
          const Comp = instance.type;
          if (isFunction(Comp)) {
              return;
          }
          const extracted = {};
          for (const key in instance.ctx) {
              if (isKeyOfType(Comp, key, type)) {
                  extracted[key] = instance.ctx[key];
              }
          }
          return extracted;
      }
      function isKeyOfType(Comp, key, type) {
          const opts = Comp[type];
          if ((isArray(opts) && opts.includes(key)) ||
              (isObject(opts) && key in opts)) {
              return true;
          }
          if (Comp.extends && isKeyOfType(Comp.extends, key, type)) {
              return true;
          }
          if (Comp.mixins && Comp.mixins.some(m => isKeyOfType(m, key, type))) {
              return true;
          }
      }
      function genRefFlag(v) {
          if (v._shallow) {
              return `ShallowRef`;
          }
          if (v.effect) {
              return `ComputedRef`;
          }
          return `Ref`;
      }
      if (window.devtoolsFormatters) {
          window.devtoolsFormatters.push(formatter);
      }
      else {
          window.devtoolsFormatters = [formatter];
      }
  }

  // Core API ------------------------------------------------------------------
  const version = "3.2.6";

  const svgNS = 'http://www.w3.org/2000/svg';
  const doc = (typeof document !== 'undefined' ? document : null);
  const staticTemplateCache = new Map();
  const nodeOps = {
      insert: (child, parent, anchor) => {
          parent.insertBefore(child, anchor || null);
      },
      remove: child => {
          const parent = child.parentNode;
          if (parent) {
              parent.removeChild(child);
          }
      },
      createElement: (tag, isSVG, is, props) => {
          const el = isSVG
              ? doc.createElementNS(svgNS, tag)
              : doc.createElement(tag, is ? { is } : undefined);
          if (tag === 'select' && props && props.multiple != null) {
              el.setAttribute('multiple', props.multiple);
          }
          return el;
      },
      createText: text => doc.createTextNode(text),
      createComment: text => doc.createComment(text),
      setText: (node, text) => {
          node.nodeValue = text;
      },
      setElementText: (el, text) => {
          el.textContent = text;
      },
      parentNode: node => node.parentNode,
      nextSibling: node => node.nextSibling,
      querySelector: selector => doc.querySelector(selector),
      setScopeId(el, id) {
          el.setAttribute(id, '');
      },
      cloneNode(el) {
          const cloned = el.cloneNode(true);
          // #3072
          // - in `patchDOMProp`, we store the actual value in the `el._value` property.
          // - normally, elements using `:value` bindings will not be hoisted, but if
          //   the bound value is a constant, e.g. `:value="true"` - they do get
          //   hoisted.
          // - in production, hoisted nodes are cloned when subsequent inserts, but
          //   cloneNode() does not copy the custom property we attached.
          // - This may need to account for other custom DOM properties we attach to
          //   elements in addition to `_value` in the future.
          if (`_value` in el) {
              cloned._value = el._value;
          }
          return cloned;
      },
      // __UNSAFE__
      // Reason: innerHTML.
      // Static content here can only come from compiled templates.
      // As long as the user only uses trusted templates, this is safe.
      insertStaticContent(content, parent, anchor, isSVG) {
          // <parent> before | first ... last | anchor </parent>
          const before = anchor ? anchor.previousSibling : parent.lastChild;
          let template = staticTemplateCache.get(content);
          if (!template) {
              const t = doc.createElement('template');
              t.innerHTML = isSVG ? `<svg>${content}</svg>` : content;
              template = t.content;
              if (isSVG) {
                  // remove outer svg wrapper
                  const wrapper = template.firstChild;
                  while (wrapper.firstChild) {
                      template.appendChild(wrapper.firstChild);
                  }
                  template.removeChild(wrapper);
              }
              staticTemplateCache.set(content, template);
          }
          parent.insertBefore(template.cloneNode(true), anchor);
          return [
              // first
              before ? before.nextSibling : parent.firstChild,
              // last
              anchor ? anchor.previousSibling : parent.lastChild
          ];
      }
  };

  // compiler should normalize class + :class bindings on the same element
  // into a single binding ['staticClass', dynamic]
  function patchClass(el, value, isSVG) {
      // directly setting className should be faster than setAttribute in theory
      // if this is an element during a transition, take the temporary transition
      // classes into account.
      const transitionClasses = el._vtc;
      if (transitionClasses) {
          value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(' ');
      }
      if (value == null) {
          el.removeAttribute('class');
      }
      else if (isSVG) {
          el.setAttribute('class', value);
      }
      else {
          el.className = value;
      }
  }

  function patchStyle(el, prev, next) {
      const style = el.style;
      if (!next) {
          el.removeAttribute('style');
      }
      else if (isString(next)) {
          if (prev !== next) {
              const current = style.display;
              style.cssText = next;
              // indicates that the `display` of the element is controlled by `v-show`,
              // so we always keep the current `display` value regardless of the `style` value,
              // thus handing over control to `v-show`.
              if ('_vod' in el) {
                  style.display = current;
              }
          }
      }
      else {
          for (const key in next) {
              setStyle(style, key, next[key]);
          }
          if (prev && !isString(prev)) {
              for (const key in prev) {
                  if (next[key] == null) {
                      setStyle(style, key, '');
                  }
              }
          }
      }
  }
  const importantRE = /\s*!important$/;
  function setStyle(style, name, val) {
      if (isArray(val)) {
          val.forEach(v => setStyle(style, name, v));
      }
      else {
          if (name.startsWith('--')) {
              // custom property definition
              style.setProperty(name, val);
          }
          else {
              const prefixed = autoPrefix(style, name);
              if (importantRE.test(val)) {
                  // !important
                  style.setProperty(hyphenate(prefixed), val.replace(importantRE, ''), 'important');
              }
              else {
                  style[prefixed] = val;
              }
          }
      }
  }
  const prefixes = ['Webkit', 'Moz', 'ms'];
  const prefixCache = {};
  function autoPrefix(style, rawName) {
      const cached = prefixCache[rawName];
      if (cached) {
          return cached;
      }
      let name = camelize(rawName);
      if (name !== 'filter' && name in style) {
          return (prefixCache[rawName] = name);
      }
      name = capitalize(name);
      for (let i = 0; i < prefixes.length; i++) {
          const prefixed = prefixes[i] + name;
          if (prefixed in style) {
              return (prefixCache[rawName] = prefixed);
          }
      }
      return rawName;
  }

  const xlinkNS = 'http://www.w3.org/1999/xlink';
  function patchAttr(el, key, value, isSVG, instance) {
      if (isSVG && key.startsWith('xlink:')) {
          if (value == null) {
              el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
          }
          else {
              el.setAttributeNS(xlinkNS, key, value);
          }
      }
      else {
          // note we are only checking boolean attributes that don't have a
          // corresponding dom prop of the same name here.
          const isBoolean = isSpecialBooleanAttr(key);
          if (value == null || (isBoolean && !includeBooleanAttr(value))) {
              el.removeAttribute(key);
          }
          else {
              el.setAttribute(key, isBoolean ? '' : value);
          }
      }
  }

  // __UNSAFE__
  // functions. The user is responsible for using them with only trusted content.
  function patchDOMProp(el, key, value, 
  // the following args are passed only due to potential innerHTML/textContent
  // overriding existing VNodes, in which case the old tree must be properly
  // unmounted.
  prevChildren, parentComponent, parentSuspense, unmountChildren) {
      if (key === 'innerHTML' || key === 'textContent') {
          if (prevChildren) {
              unmountChildren(prevChildren, parentComponent, parentSuspense);
          }
          el[key] = value == null ? '' : value;
          return;
      }
      if (key === 'value' && el.tagName !== 'PROGRESS') {
          // store value as _value as well since
          // non-string values will be stringified.
          el._value = value;
          const newValue = value == null ? '' : value;
          if (el.value !== newValue) {
              el.value = newValue;
          }
          if (value == null) {
              el.removeAttribute(key);
          }
          return;
      }
      if (value === '' || value == null) {
          const type = typeof el[key];
          if (type === 'boolean') {
              // e.g. <select multiple> compiles to { multiple: '' }
              el[key] = includeBooleanAttr(value);
              return;
          }
          else if (value == null && type === 'string') {
              // e.g. <div :id="null">
              el[key] = '';
              el.removeAttribute(key);
              return;
          }
          else if (type === 'number') {
              // e.g. <img :width="null">
              // the value of some IDL attr must be greater than 0, e.g. input.size = 0 -> error
              try {
                  el[key] = 0;
              }
              catch (_a) { }
              el.removeAttribute(key);
              return;
          }
      }
      // some properties perform value validation and throw
      try {
          el[key] = value;
      }
      catch (e) {
          {
              warn$1(`Failed setting prop "${key}" on <${el.tagName.toLowerCase()}>: ` +
                  `value ${value} is invalid.`, e);
          }
      }
  }

  // Async edge case fix requires storing an event listener's attach timestamp.
  let _getNow = Date.now;
  let skipTimestampCheck = false;
  if (typeof window !== 'undefined') {
      // Determine what event timestamp the browser is using. Annoyingly, the
      // timestamp can either be hi-res (relative to page load) or low-res
      // (relative to UNIX epoch), so in order to compare time we have to use the
      // same timestamp type when saving the flush timestamp.
      if (_getNow() > document.createEvent('Event').timeStamp) {
          // if the low-res timestamp which is bigger than the event timestamp
          // (which is evaluated AFTER) it means the event is using a hi-res timestamp,
          // and we need to use the hi-res version for event listeners as well.
          _getNow = () => performance.now();
      }
      // #3485: Firefox <= 53 has incorrect Event.timeStamp implementation
      // and does not fire microtasks in between event propagation, so safe to exclude.
      const ffMatch = navigator.userAgent.match(/firefox\/(\d+)/i);
      skipTimestampCheck = !!(ffMatch && Number(ffMatch[1]) <= 53);
  }
  // To avoid the overhead of repeatedly calling performance.now(), we cache
  // and use the same timestamp for all event listeners attached in the same tick.
  let cachedNow = 0;
  const p = Promise.resolve();
  const reset = () => {
      cachedNow = 0;
  };
  const getNow = () => cachedNow || (p.then(reset), (cachedNow = _getNow()));
  function addEventListener(el, event, handler, options) {
      el.addEventListener(event, handler, options);
  }
  function removeEventListener(el, event, handler, options) {
      el.removeEventListener(event, handler, options);
  }
  function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
      // vei = vue event invokers
      const invokers = el._vei || (el._vei = {});
      const existingInvoker = invokers[rawName];
      if (nextValue && existingInvoker) {
          // patch
          existingInvoker.value = nextValue;
      }
      else {
          const [name, options] = parseName(rawName);
          if (nextValue) {
              // add
              const invoker = (invokers[rawName] = createInvoker(nextValue, instance));
              addEventListener(el, name, invoker, options);
          }
          else if (existingInvoker) {
              // remove
              removeEventListener(el, name, existingInvoker, options);
              invokers[rawName] = undefined;
          }
      }
  }
  const optionsModifierRE = /(?:Once|Passive|Capture)$/;
  function parseName(name) {
      let options;
      if (optionsModifierRE.test(name)) {
          options = {};
          let m;
          while ((m = name.match(optionsModifierRE))) {
              name = name.slice(0, name.length - m[0].length);
              options[m[0].toLowerCase()] = true;
          }
      }
      return [hyphenate(name.slice(2)), options];
  }
  function createInvoker(initialValue, instance) {
      const invoker = (e) => {
          // async edge case #6566: inner click event triggers patch, event handler
          // attached to outer element during patch, and triggered again. This
          // happens because browsers fire microtask ticks between event propagation.
          // the solution is simple: we save the timestamp when a handler is attached,
          // and the handler would only fire if the event passed to it was fired
          // AFTER it was attached.
          const timeStamp = e.timeStamp || _getNow();
          if (skipTimestampCheck || timeStamp >= invoker.attached - 1) {
              callWithAsyncErrorHandling(patchStopImmediatePropagation(e, invoker.value), instance, 5 /* NATIVE_EVENT_HANDLER */, [e]);
          }
      };
      invoker.value = initialValue;
      invoker.attached = getNow();
      return invoker;
  }
  function patchStopImmediatePropagation(e, value) {
      if (isArray(value)) {
          const originalStop = e.stopImmediatePropagation;
          e.stopImmediatePropagation = () => {
              originalStop.call(e);
              e._stopped = true;
          };
          return value.map(fn => (e) => !e._stopped && fn(e));
      }
      else {
          return value;
      }
  }

  const nativeOnRE = /^on[a-z]/;
  const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
      if (key === 'class') {
          patchClass(el, nextValue, isSVG);
      }
      else if (key === 'style') {
          patchStyle(el, prevValue, nextValue);
      }
      else if (isOn(key)) {
          // ignore v-model listeners
          if (!isModelListener(key)) {
              patchEvent(el, key, prevValue, nextValue, parentComponent);
          }
      }
      else if (key[0] === '.'
          ? ((key = key.slice(1)), true)
          : key[0] === '^'
              ? ((key = key.slice(1)), false)
              : shouldSetAsProp(el, key, nextValue, isSVG)) {
          patchDOMProp(el, key, nextValue, prevChildren, parentComponent, parentSuspense, unmountChildren);
      }
      else {
          // special case for <input v-model type="checkbox"> with
          // :true-value & :false-value
          // store value as dom properties since non-string values will be
          // stringified.
          if (key === 'true-value') {
              el._trueValue = nextValue;
          }
          else if (key === 'false-value') {
              el._falseValue = nextValue;
          }
          patchAttr(el, key, nextValue, isSVG);
      }
  };
  function shouldSetAsProp(el, key, value, isSVG) {
      if (isSVG) {
          // most keys must be set as attribute on svg elements to work
          // ...except innerHTML & textContent
          if (key === 'innerHTML' || key === 'textContent') {
              return true;
          }
          // or native onclick with function values
          if (key in el && nativeOnRE.test(key) && isFunction(value)) {
              return true;
          }
          return false;
      }
      // spellcheck and draggable are numerated attrs, however their
      // corresponding DOM properties are actually booleans - this leads to
      // setting it with a string "false" value leading it to be coerced to
      // `true`, so we need to always treat them as attributes.
      // Note that `contentEditable` doesn't have this problem: its DOM
      // property is also enumerated string values.
      if (key === 'spellcheck' || key === 'draggable') {
          return false;
      }
      // #1787, #2840 form property on form elements is readonly and must be set as
      // attribute.
      if (key === 'form') {
          return false;
      }
      // #1526 <input list> must be set as attribute
      if (key === 'list' && el.tagName === 'INPUT') {
          return false;
      }
      // #2766 <textarea type> must be set as attribute
      if (key === 'type' && el.tagName === 'TEXTAREA') {
          return false;
      }
      // native onclick with string value, must be set as attribute
      if (nativeOnRE.test(key) && isString(value)) {
          return false;
      }
      return key in el;
  }

  const rendererOptions = extend({ patchProp }, nodeOps);
  // lazy create the renderer - this makes core renderer logic tree-shakable
  // in case the user only imports reactivity utilities from Vue.
  let renderer;
  function ensureRenderer() {
      return (renderer ||
          (renderer = createRenderer(rendererOptions)));
  }
  const createApp = ((...args) => {
      const app = ensureRenderer().createApp(...args);
      {
          injectNativeTagCheck(app);
          injectCompilerOptionsCheck(app);
      }
      const { mount } = app;
      app.mount = (containerOrSelector) => {
          const container = normalizeContainer(containerOrSelector);
          if (!container)
              return;
          const component = app._component;
          if (!isFunction(component) && !component.render && !component.template) {
              // __UNSAFE__
              // Reason: potential execution of JS expressions in in-DOM template.
              // The user must make sure the in-DOM template is trusted. If it's
              // rendered by the server, the template should not contain any user data.
              component.template = container.innerHTML;
          }
          // clear content before mounting
          container.innerHTML = '';
          const proxy = mount(container, false, container instanceof SVGElement);
          if (container instanceof Element) {
              container.removeAttribute('v-cloak');
              container.setAttribute('data-v-app', '');
          }
          return proxy;
      };
      return app;
  });
  function injectNativeTagCheck(app) {
      // Inject `isNativeTag`
      // this is used for component name validation (dev only)
      Object.defineProperty(app.config, 'isNativeTag', {
          value: (tag) => isHTMLTag(tag) || isSVGTag(tag),
          writable: false
      });
  }
  // dev only
  function injectCompilerOptionsCheck(app) {
      {
          const isCustomElement = app.config.isCustomElement;
          Object.defineProperty(app.config, 'isCustomElement', {
              get() {
                  return isCustomElement;
              },
              set() {
                  warn$1(`The \`isCustomElement\` config option is deprecated. Use ` +
                      `\`compilerOptions.isCustomElement\` instead.`);
              }
          });
          const compilerOptions = app.config.compilerOptions;
          const msg = `The \`compilerOptions\` config option is only respected when using ` +
              `a build of Vue.js that includes the runtime compiler (aka "full build"). ` +
              `Since you are using the runtime-only build, \`compilerOptions\` ` +
              `must be passed to \`@vue/compiler-dom\` in the build setup instead.\n` +
              `- For vue-loader: pass it via vue-loader's \`compilerOptions\` loader option.\n` +
              `- For vue-cli: see https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-loader\n` +
              `- For vite: pass it via @vitejs/plugin-vue options. See https://github.com/vitejs/vite/tree/main/packages/plugin-vue#example-for-passing-options-to-vuecompiler-dom`;
          Object.defineProperty(app.config, 'compilerOptions', {
              get() {
                  warn$1(msg);
                  return compilerOptions;
              },
              set() {
                  warn$1(msg);
              }
          });
      }
  }
  function normalizeContainer(container) {
      if (isString(container)) {
          const res = document.querySelector(container);
          if (!res) {
              warn$1(`Failed to mount app: mount target selector "${container}" returned null.`);
          }
          return res;
      }
      if (window.ShadowRoot &&
          container instanceof window.ShadowRoot &&
          container.mode === 'closed') {
          warn$1(`mounting on a ShadowRoot with \`{mode: "closed"}\` may lead to unpredictable bugs`);
      }
      return container;
  }

  function initDev() {
      {
          {
              console.info(`You are running a development build of Vue.\n` +
                  `Make sure to use the production build (*.prod.js) when deploying for production.`);
          }
          initCustomFormatter();
      }
  }

  // This entry exports the runtime only, and is built as
  {
      initDev();
  }

  var script$1 = defineComponent({
      name: "HelloWorld",
      props: {
          msg: {
              type: String,
              required: true
          }
      },
      setup: () => {
          const count = ref(0);
          return { count };
      }
  });

  function render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return (openBlock(), createElementBlock(Fragment, null, [
      createBaseVNode("h1", null, toDisplayString(_ctx.msg), 1 /* TEXT */),
      createBaseVNode("button", {
        class: "btn btn-primary",
        onClick: _cache[0] || (_cache[0] = $event => (_ctx.count++))
      }, "Count is: " + toDisplayString(_ctx.count), 1 /* TEXT */)
    ], 64 /* STABLE_FRAGMENT */))
  }

  script$1.render = render$1;
  script$1.__scopeId = "data-v-469af010";
  script$1.__file = "src/components/HelloWorld.vue";

  var script = defineComponent({
      name: "App",
      components: {
          HelloWorld: script$1
      },
      setup() {
          const test = ref("test variable");
          const changeVariable = () => {
              test.value = "variable changed";
          };
          return {
              test,
              changeVariable
          };
      }
  });

  const _hoisted_1 = { class: "container mt-5" };
  const _hoisted_2 = { class: "row" };
  const _hoisted_3 = { class: "col text-center" };
  const _hoisted_4 = /*#__PURE__*/createBaseVNode("img", {
    src: "assets/img/vue-logo.png",
    class: "logo"
  }, null, -1 /* HOISTED */);
  const _hoisted_5 = { class: "mt-2" };

  function render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_HelloWorld = resolveComponent("HelloWorld");

    return (openBlock(), createElementBlock("div", _hoisted_1, [
      createBaseVNode("div", _hoisted_2, [
        createBaseVNode("div", _hoisted_3, [
          _hoisted_4,
          createVNode(_component_HelloWorld, { msg: "Vue 3 + Rollup + Bootstrap 5 + Livereload" }),
          createBaseVNode("p", _hoisted_5, "Test Variable: " + toDisplayString(_ctx.test), 1 /* TEXT */),
          createBaseVNode("button", {
            class: "btn btn-danger",
            onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.changeVariable && _ctx.changeVariable(...args)))
          }, "Change Variable")
        ])
      ])
    ]))
  }

  script.render = render;
  script.__file = "src/App.vue";

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var bootstrap_bundle_min = {exports: {}};

  /*!
    * Bootstrap v5.1.0 (https://getbootstrap.com/)
    * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
    * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
    */

  (function (module, exports) {
  !function(t,e){module.exports=e();}(commonjsGlobal,(function(){const t=t=>{let e=t.getAttribute("data-bs-target");if(!e||"#"===e){let i=t.getAttribute("href");if(!i||!i.includes("#")&&!i.startsWith("."))return null;i.includes("#")&&!i.startsWith("#")&&(i="#"+i.split("#")[1]),e=i&&"#"!==i?i.trim():null;}return e},e=e=>{const i=t(e);return i&&document.querySelector(i)?i:null},i=e=>{const i=t(e);return i?document.querySelector(i):null},n=t=>{t.dispatchEvent(new Event("transitionend"));},s=t=>!(!t||"object"!=typeof t)&&(void 0!==t.jquery&&(t=t[0]),void 0!==t.nodeType),o=t=>s(t)?t.jquery?t[0]:t:"string"==typeof t&&t.length>0?document.querySelector(t):null,r=(t,e,i)=>{Object.keys(i).forEach(n=>{const o=i[n],r=e[n],a=r&&s(r)?"element":null==(l=r)?""+l:{}.toString.call(l).match(/\s([a-z]+)/i)[1].toLowerCase();var l;if(!new RegExp(o).test(a))throw new TypeError(`${t.toUpperCase()}: Option "${n}" provided type "${a}" but expected type "${o}".`)});},a=t=>!(!s(t)||0===t.getClientRects().length)&&"visible"===getComputedStyle(t).getPropertyValue("visibility"),l=t=>!t||t.nodeType!==Node.ELEMENT_NODE||!!t.classList.contains("disabled")||(void 0!==t.disabled?t.disabled:t.hasAttribute("disabled")&&"false"!==t.getAttribute("disabled")),c=t=>{if(!document.documentElement.attachShadow)return null;if("function"==typeof t.getRootNode){const e=t.getRootNode();return e instanceof ShadowRoot?e:null}return t instanceof ShadowRoot?t:t.parentNode?c(t.parentNode):null},h=()=>{},d=t=>{t.offsetHeight;},u=()=>{const{jQuery:t}=window;return t&&!document.body.hasAttribute("data-bs-no-jquery")?t:null},f=[],p=()=>"rtl"===document.documentElement.dir,m=t=>{var e;e=()=>{const e=u();if(e){const i=t.NAME,n=e.fn[i];e.fn[i]=t.jQueryInterface,e.fn[i].Constructor=t,e.fn[i].noConflict=()=>(e.fn[i]=n,t.jQueryInterface);}},"loading"===document.readyState?(f.length||document.addEventListener("DOMContentLoaded",()=>{f.forEach(t=>t());}),f.push(e)):e();},g=t=>{"function"==typeof t&&t();},_=(t,e,i=!0)=>{if(!i)return void g(t);const s=(t=>{if(!t)return 0;let{transitionDuration:e,transitionDelay:i}=window.getComputedStyle(t);const n=Number.parseFloat(e),s=Number.parseFloat(i);return n||s?(e=e.split(",")[0],i=i.split(",")[0],1e3*(Number.parseFloat(e)+Number.parseFloat(i))):0})(e)+5;let o=!1;const r=({target:i})=>{i===e&&(o=!0,e.removeEventListener("transitionend",r),g(t));};e.addEventListener("transitionend",r),setTimeout(()=>{o||n(e);},s);},b=(t,e,i,n)=>{let s=t.indexOf(e);if(-1===s)return t[!i&&n?t.length-1:0];const o=t.length;return s+=i?1:-1,n&&(s=(s+o)%o),t[Math.max(0,Math.min(s,o-1))]},v=/[^.]*(?=\..*)\.|.*/,y=/\..*/,w=/::\d+$/,E={};let A=1;const T={mouseenter:"mouseover",mouseleave:"mouseout"},O=/^(mouseenter|mouseleave)/i,C=new Set(["click","dblclick","mouseup","mousedown","contextmenu","mousewheel","DOMMouseScroll","mouseover","mouseout","mousemove","selectstart","selectend","keydown","keypress","keyup","orientationchange","touchstart","touchmove","touchend","touchcancel","pointerdown","pointermove","pointerup","pointerleave","pointercancel","gesturestart","gesturechange","gestureend","focus","blur","change","reset","select","submit","focusin","focusout","load","unload","beforeunload","resize","move","DOMContentLoaded","readystatechange","error","abort","scroll"]);function k(t,e){return e&&`${e}::${A++}`||t.uidEvent||A++}function L(t){const e=k(t);return t.uidEvent=e,E[e]=E[e]||{},E[e]}function x(t,e,i=null){const n=Object.keys(t);for(let s=0,o=n.length;s<o;s++){const o=t[n[s]];if(o.originalHandler===e&&o.delegationSelector===i)return o}return null}function D(t,e,i){const n="string"==typeof e,s=n?i:e;let o=I(t);return C.has(o)||(o=t),[n,s,o]}function S(t,e,i,n,s){if("string"!=typeof e||!t)return;if(i||(i=n,n=null),O.test(e)){const t=t=>function(e){if(!e.relatedTarget||e.relatedTarget!==e.delegateTarget&&!e.delegateTarget.contains(e.relatedTarget))return t.call(this,e)};n?n=t(n):i=t(i);}const[o,r,a]=D(e,i,n),l=L(t),c=l[a]||(l[a]={}),h=x(c,r,o?i:null);if(h)return void(h.oneOff=h.oneOff&&s);const d=k(r,e.replace(v,"")),u=o?function(t,e,i){return function n(s){const o=t.querySelectorAll(e);for(let{target:r}=s;r&&r!==this;r=r.parentNode)for(let a=o.length;a--;)if(o[a]===r)return s.delegateTarget=r,n.oneOff&&P.off(t,s.type,e,i),i.apply(r,[s]);return null}}(t,i,n):function(t,e){return function i(n){return n.delegateTarget=t,i.oneOff&&P.off(t,n.type,e),e.apply(t,[n])}}(t,i);u.delegationSelector=o?i:null,u.originalHandler=r,u.oneOff=s,u.uidEvent=d,c[d]=u,t.addEventListener(a,u,o);}function N(t,e,i,n,s){const o=x(e[i],n,s);o&&(t.removeEventListener(i,o,Boolean(s)),delete e[i][o.uidEvent]);}function I(t){return t=t.replace(y,""),T[t]||t}const P={on(t,e,i,n){S(t,e,i,n,!1);},one(t,e,i,n){S(t,e,i,n,!0);},off(t,e,i,n){if("string"!=typeof e||!t)return;const[s,o,r]=D(e,i,n),a=r!==e,l=L(t),c=e.startsWith(".");if(void 0!==o){if(!l||!l[r])return;return void N(t,l,r,o,s?i:null)}c&&Object.keys(l).forEach(i=>{!function(t,e,i,n){const s=e[i]||{};Object.keys(s).forEach(o=>{if(o.includes(n)){const n=s[o];N(t,e,i,n.originalHandler,n.delegationSelector);}});}(t,l,i,e.slice(1));});const h=l[r]||{};Object.keys(h).forEach(i=>{const n=i.replace(w,"");if(!a||e.includes(n)){const e=h[i];N(t,l,r,e.originalHandler,e.delegationSelector);}});},trigger(t,e,i){if("string"!=typeof e||!t)return null;const n=u(),s=I(e),o=e!==s,r=C.has(s);let a,l=!0,c=!0,h=!1,d=null;return o&&n&&(a=n.Event(e,i),n(t).trigger(a),l=!a.isPropagationStopped(),c=!a.isImmediatePropagationStopped(),h=a.isDefaultPrevented()),r?(d=document.createEvent("HTMLEvents"),d.initEvent(s,l,!0)):d=new CustomEvent(e,{bubbles:l,cancelable:!0}),void 0!==i&&Object.keys(i).forEach(t=>{Object.defineProperty(d,t,{get:()=>i[t]});}),h&&d.preventDefault(),c&&t.dispatchEvent(d),d.defaultPrevented&&void 0!==a&&a.preventDefault(),d}},j=new Map;var M={set(t,e,i){j.has(t)||j.set(t,new Map);const n=j.get(t);n.has(e)||0===n.size?n.set(e,i):console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(n.keys())[0]}.`);},get:(t,e)=>j.has(t)&&j.get(t).get(e)||null,remove(t,e){if(!j.has(t))return;const i=j.get(t);i.delete(e),0===i.size&&j.delete(t);}};class H{constructor(t){(t=o(t))&&(this._element=t,M.set(this._element,this.constructor.DATA_KEY,this));}dispose(){M.remove(this._element,this.constructor.DATA_KEY),P.off(this._element,this.constructor.EVENT_KEY),Object.getOwnPropertyNames(this).forEach(t=>{this[t]=null;});}_queueCallback(t,e,i=!0){_(t,e,i);}static getInstance(t){return M.get(o(t),this.DATA_KEY)}static getOrCreateInstance(t,e={}){return this.getInstance(t)||new this(t,"object"==typeof e?e:null)}static get VERSION(){return "5.1.0"}static get NAME(){throw new Error('You have to implement the static method "NAME", for each component!')}static get DATA_KEY(){return "bs."+this.NAME}static get EVENT_KEY(){return "."+this.DATA_KEY}}const B=(t,e="hide")=>{const n="click.dismiss"+t.EVENT_KEY,s=t.NAME;P.on(document,n,`[data-bs-dismiss="${s}"]`,(function(n){if(["A","AREA"].includes(this.tagName)&&n.preventDefault(),l(this))return;const o=i(this)||this.closest("."+s);t.getOrCreateInstance(o)[e]();}));};class R extends H{static get NAME(){return "alert"}close(){if(P.trigger(this._element,"close.bs.alert").defaultPrevented)return;this._element.classList.remove("show");const t=this._element.classList.contains("fade");this._queueCallback(()=>this._destroyElement(),this._element,t);}_destroyElement(){this._element.remove(),P.trigger(this._element,"closed.bs.alert"),this.dispose();}static jQueryInterface(t){return this.each((function(){const e=R.getOrCreateInstance(this);if("string"==typeof t){if(void 0===e[t]||t.startsWith("_")||"constructor"===t)throw new TypeError(`No method named "${t}"`);e[t](this);}}))}}B(R,"close"),m(R);class W extends H{static get NAME(){return "button"}toggle(){this._element.setAttribute("aria-pressed",this._element.classList.toggle("active"));}static jQueryInterface(t){return this.each((function(){const e=W.getOrCreateInstance(this);"toggle"===t&&e[t]();}))}}function z(t){return "true"===t||"false"!==t&&(t===Number(t).toString()?Number(t):""===t||"null"===t?null:t)}function q(t){return t.replace(/[A-Z]/g,t=>"-"+t.toLowerCase())}P.on(document,"click.bs.button.data-api",'[data-bs-toggle="button"]',t=>{t.preventDefault();const e=t.target.closest('[data-bs-toggle="button"]');W.getOrCreateInstance(e).toggle();}),m(W);const F={setDataAttribute(t,e,i){t.setAttribute("data-bs-"+q(e),i);},removeDataAttribute(t,e){t.removeAttribute("data-bs-"+q(e));},getDataAttributes(t){if(!t)return {};const e={};return Object.keys(t.dataset).filter(t=>t.startsWith("bs")).forEach(i=>{let n=i.replace(/^bs/,"");n=n.charAt(0).toLowerCase()+n.slice(1,n.length),e[n]=z(t.dataset[i]);}),e},getDataAttribute:(t,e)=>z(t.getAttribute("data-bs-"+q(e))),offset(t){const e=t.getBoundingClientRect();return {top:e.top+window.pageYOffset,left:e.left+window.pageXOffset}},position:t=>({top:t.offsetTop,left:t.offsetLeft})},U={find:(t,e=document.documentElement)=>[].concat(...Element.prototype.querySelectorAll.call(e,t)),findOne:(t,e=document.documentElement)=>Element.prototype.querySelector.call(e,t),children:(t,e)=>[].concat(...t.children).filter(t=>t.matches(e)),parents(t,e){const i=[];let n=t.parentNode;for(;n&&n.nodeType===Node.ELEMENT_NODE&&3!==n.nodeType;)n.matches(e)&&i.push(n),n=n.parentNode;return i},prev(t,e){let i=t.previousElementSibling;for(;i;){if(i.matches(e))return [i];i=i.previousElementSibling;}return []},next(t,e){let i=t.nextElementSibling;for(;i;){if(i.matches(e))return [i];i=i.nextElementSibling;}return []},focusableChildren(t){const e=["a","button","input","textarea","select","details","[tabindex]",'[contenteditable="true"]'].map(t=>t+':not([tabindex^="-"])').join(", ");return this.find(e,t).filter(t=>!l(t)&&a(t))}},$={interval:5e3,keyboard:!0,slide:!1,pause:"hover",wrap:!0,touch:!0},V={interval:"(number|boolean)",keyboard:"boolean",slide:"(boolean|string)",pause:"(string|boolean)",wrap:"boolean",touch:"boolean"},K="next",X="prev",Y="left",Q="right",G={ArrowLeft:Q,ArrowRight:Y};class Z extends H{constructor(t,e){super(t),this._items=null,this._interval=null,this._activeElement=null,this._isPaused=!1,this._isSliding=!1,this.touchTimeout=null,this.touchStartX=0,this.touchDeltaX=0,this._config=this._getConfig(e),this._indicatorsElement=U.findOne(".carousel-indicators",this._element),this._touchSupported="ontouchstart"in document.documentElement||navigator.maxTouchPoints>0,this._pointerEvent=Boolean(window.PointerEvent),this._addEventListeners();}static get Default(){return $}static get NAME(){return "carousel"}next(){this._slide(K);}nextWhenVisible(){!document.hidden&&a(this._element)&&this.next();}prev(){this._slide(X);}pause(t){t||(this._isPaused=!0),U.findOne(".carousel-item-next, .carousel-item-prev",this._element)&&(n(this._element),this.cycle(!0)),clearInterval(this._interval),this._interval=null;}cycle(t){t||(this._isPaused=!1),this._interval&&(clearInterval(this._interval),this._interval=null),this._config&&this._config.interval&&!this._isPaused&&(this._updateInterval(),this._interval=setInterval((document.visibilityState?this.nextWhenVisible:this.next).bind(this),this._config.interval));}to(t){this._activeElement=U.findOne(".active.carousel-item",this._element);const e=this._getItemIndex(this._activeElement);if(t>this._items.length-1||t<0)return;if(this._isSliding)return void P.one(this._element,"slid.bs.carousel",()=>this.to(t));if(e===t)return this.pause(),void this.cycle();const i=t>e?K:X;this._slide(i,this._items[t]);}_getConfig(t){return t={...$,...F.getDataAttributes(this._element),..."object"==typeof t?t:{}},r("carousel",t,V),t}_handleSwipe(){const t=Math.abs(this.touchDeltaX);if(t<=40)return;const e=t/this.touchDeltaX;this.touchDeltaX=0,e&&this._slide(e>0?Q:Y);}_addEventListeners(){this._config.keyboard&&P.on(this._element,"keydown.bs.carousel",t=>this._keydown(t)),"hover"===this._config.pause&&(P.on(this._element,"mouseenter.bs.carousel",t=>this.pause(t)),P.on(this._element,"mouseleave.bs.carousel",t=>this.cycle(t))),this._config.touch&&this._touchSupported&&this._addTouchEventListeners();}_addTouchEventListeners(){const t=t=>{!this._pointerEvent||"pen"!==t.pointerType&&"touch"!==t.pointerType?this._pointerEvent||(this.touchStartX=t.touches[0].clientX):this.touchStartX=t.clientX;},e=t=>{this.touchDeltaX=t.touches&&t.touches.length>1?0:t.touches[0].clientX-this.touchStartX;},i=t=>{!this._pointerEvent||"pen"!==t.pointerType&&"touch"!==t.pointerType||(this.touchDeltaX=t.clientX-this.touchStartX),this._handleSwipe(),"hover"===this._config.pause&&(this.pause(),this.touchTimeout&&clearTimeout(this.touchTimeout),this.touchTimeout=setTimeout(t=>this.cycle(t),500+this._config.interval));};U.find(".carousel-item img",this._element).forEach(t=>{P.on(t,"dragstart.bs.carousel",t=>t.preventDefault());}),this._pointerEvent?(P.on(this._element,"pointerdown.bs.carousel",e=>t(e)),P.on(this._element,"pointerup.bs.carousel",t=>i(t)),this._element.classList.add("pointer-event")):(P.on(this._element,"touchstart.bs.carousel",e=>t(e)),P.on(this._element,"touchmove.bs.carousel",t=>e(t)),P.on(this._element,"touchend.bs.carousel",t=>i(t)));}_keydown(t){if(/input|textarea/i.test(t.target.tagName))return;const e=G[t.key];e&&(t.preventDefault(),this._slide(e));}_getItemIndex(t){return this._items=t&&t.parentNode?U.find(".carousel-item",t.parentNode):[],this._items.indexOf(t)}_getItemByOrder(t,e){const i=t===K;return b(this._items,e,i,this._config.wrap)}_triggerSlideEvent(t,e){const i=this._getItemIndex(t),n=this._getItemIndex(U.findOne(".active.carousel-item",this._element));return P.trigger(this._element,"slide.bs.carousel",{relatedTarget:t,direction:e,from:n,to:i})}_setActiveIndicatorElement(t){if(this._indicatorsElement){const e=U.findOne(".active",this._indicatorsElement);e.classList.remove("active"),e.removeAttribute("aria-current");const i=U.find("[data-bs-target]",this._indicatorsElement);for(let e=0;e<i.length;e++)if(Number.parseInt(i[e].getAttribute("data-bs-slide-to"),10)===this._getItemIndex(t)){i[e].classList.add("active"),i[e].setAttribute("aria-current","true");break}}}_updateInterval(){const t=this._activeElement||U.findOne(".active.carousel-item",this._element);if(!t)return;const e=Number.parseInt(t.getAttribute("data-bs-interval"),10);e?(this._config.defaultInterval=this._config.defaultInterval||this._config.interval,this._config.interval=e):this._config.interval=this._config.defaultInterval||this._config.interval;}_slide(t,e){const i=this._directionToOrder(t),n=U.findOne(".active.carousel-item",this._element),s=this._getItemIndex(n),o=e||this._getItemByOrder(i,n),r=this._getItemIndex(o),a=Boolean(this._interval),l=i===K,c=l?"carousel-item-start":"carousel-item-end",h=l?"carousel-item-next":"carousel-item-prev",u=this._orderToDirection(i);if(o&&o.classList.contains("active"))return void(this._isSliding=!1);if(this._isSliding)return;if(this._triggerSlideEvent(o,u).defaultPrevented)return;if(!n||!o)return;this._isSliding=!0,a&&this.pause(),this._setActiveIndicatorElement(o),this._activeElement=o;const f=()=>{P.trigger(this._element,"slid.bs.carousel",{relatedTarget:o,direction:u,from:s,to:r});};if(this._element.classList.contains("slide")){o.classList.add(h),d(o),n.classList.add(c),o.classList.add(c);const t=()=>{o.classList.remove(c,h),o.classList.add("active"),n.classList.remove("active",h,c),this._isSliding=!1,setTimeout(f,0);};this._queueCallback(t,n,!0);}else n.classList.remove("active"),o.classList.add("active"),this._isSliding=!1,f();a&&this.cycle();}_directionToOrder(t){return [Q,Y].includes(t)?p()?t===Y?X:K:t===Y?K:X:t}_orderToDirection(t){return [K,X].includes(t)?p()?t===X?Y:Q:t===X?Q:Y:t}static carouselInterface(t,e){const i=Z.getOrCreateInstance(t,e);let{_config:n}=i;"object"==typeof e&&(n={...n,...e});const s="string"==typeof e?e:n.slide;if("number"==typeof e)i.to(e);else if("string"==typeof s){if(void 0===i[s])throw new TypeError(`No method named "${s}"`);i[s]();}else n.interval&&n.ride&&(i.pause(),i.cycle());}static jQueryInterface(t){return this.each((function(){Z.carouselInterface(this,t);}))}static dataApiClickHandler(t){const e=i(this);if(!e||!e.classList.contains("carousel"))return;const n={...F.getDataAttributes(e),...F.getDataAttributes(this)},s=this.getAttribute("data-bs-slide-to");s&&(n.interval=!1),Z.carouselInterface(e,n),s&&Z.getInstance(e).to(s),t.preventDefault();}}P.on(document,"click.bs.carousel.data-api","[data-bs-slide], [data-bs-slide-to]",Z.dataApiClickHandler),P.on(window,"load.bs.carousel.data-api",()=>{const t=U.find('[data-bs-ride="carousel"]');for(let e=0,i=t.length;e<i;e++)Z.carouselInterface(t[e],Z.getInstance(t[e]));}),m(Z);const J={toggle:!0,parent:null},tt={toggle:"boolean",parent:"(null|element)"};class et extends H{constructor(t,i){super(t),this._isTransitioning=!1,this._config=this._getConfig(i),this._triggerArray=[];const n=U.find('[data-bs-toggle="collapse"]');for(let t=0,i=n.length;t<i;t++){const i=n[t],s=e(i),o=U.find(s).filter(t=>t===this._element);null!==s&&o.length&&(this._selector=s,this._triggerArray.push(i));}this._initializeChildren(),this._config.parent||this._addAriaAndCollapsedClass(this._triggerArray,this._isShown()),this._config.toggle&&this.toggle();}static get Default(){return J}static get NAME(){return "collapse"}toggle(){this._isShown()?this.hide():this.show();}show(){if(this._isTransitioning||this._isShown())return;let t,e=[];if(this._config.parent){const t=U.find(".collapse .collapse",this._config.parent);e=U.find(".show, .collapsing",this._config.parent).filter(e=>!t.includes(e));}const i=U.findOne(this._selector);if(e.length){const n=e.find(t=>i!==t);if(t=n?et.getInstance(n):null,t&&t._isTransitioning)return}if(P.trigger(this._element,"show.bs.collapse").defaultPrevented)return;e.forEach(e=>{i!==e&&et.getOrCreateInstance(e,{toggle:!1}).hide(),t||M.set(e,"bs.collapse",null);});const n=this._getDimension();this._element.classList.remove("collapse"),this._element.classList.add("collapsing"),this._element.style[n]=0,this._addAriaAndCollapsedClass(this._triggerArray,!0),this._isTransitioning=!0;const s="scroll"+(n[0].toUpperCase()+n.slice(1));this._queueCallback(()=>{this._isTransitioning=!1,this._element.classList.remove("collapsing"),this._element.classList.add("collapse","show"),this._element.style[n]="",P.trigger(this._element,"shown.bs.collapse");},this._element,!0),this._element.style[n]=this._element[s]+"px";}hide(){if(this._isTransitioning||!this._isShown())return;if(P.trigger(this._element,"hide.bs.collapse").defaultPrevented)return;const t=this._getDimension();this._element.style[t]=this._element.getBoundingClientRect()[t]+"px",d(this._element),this._element.classList.add("collapsing"),this._element.classList.remove("collapse","show");const e=this._triggerArray.length;for(let t=0;t<e;t++){const e=this._triggerArray[t],n=i(e);n&&!this._isShown(n)&&this._addAriaAndCollapsedClass([e],!1);}this._isTransitioning=!0,this._element.style[t]="",this._queueCallback(()=>{this._isTransitioning=!1,this._element.classList.remove("collapsing"),this._element.classList.add("collapse"),P.trigger(this._element,"hidden.bs.collapse");},this._element,!0);}_isShown(t=this._element){return t.classList.contains("show")}_getConfig(t){return (t={...J,...F.getDataAttributes(this._element),...t}).toggle=Boolean(t.toggle),t.parent=o(t.parent),r("collapse",t,tt),t}_getDimension(){return this._element.classList.contains("collapse-horizontal")?"width":"height"}_initializeChildren(){if(!this._config.parent)return;const t=U.find(".collapse .collapse",this._config.parent);U.find('[data-bs-toggle="collapse"]',this._config.parent).filter(e=>!t.includes(e)).forEach(t=>{const e=i(t);e&&this._addAriaAndCollapsedClass([t],this._isShown(e));});}_addAriaAndCollapsedClass(t,e){t.length&&t.forEach(t=>{e?t.classList.remove("collapsed"):t.classList.add("collapsed"),t.setAttribute("aria-expanded",e);});}static jQueryInterface(t){return this.each((function(){const e={};"string"==typeof t&&/show|hide/.test(t)&&(e.toggle=!1);const i=et.getOrCreateInstance(this,e);if("string"==typeof t){if(void 0===i[t])throw new TypeError(`No method named "${t}"`);i[t]();}}))}}P.on(document,"click.bs.collapse.data-api",'[data-bs-toggle="collapse"]',(function(t){("A"===t.target.tagName||t.delegateTarget&&"A"===t.delegateTarget.tagName)&&t.preventDefault();const i=e(this);U.find(i).forEach(t=>{et.getOrCreateInstance(t,{toggle:!1}).toggle();});})),m(et);var it="top",nt="bottom",st="right",ot="left",rt=[it,nt,st,ot],at=rt.reduce((function(t,e){return t.concat([e+"-start",e+"-end"])}),[]),lt=[].concat(rt,["auto"]).reduce((function(t,e){return t.concat([e,e+"-start",e+"-end"])}),[]),ct=["beforeRead","read","afterRead","beforeMain","main","afterMain","beforeWrite","write","afterWrite"];function ht(t){return t?(t.nodeName||"").toLowerCase():null}function dt(t){if(null==t)return window;if("[object Window]"!==t.toString()){var e=t.ownerDocument;return e&&e.defaultView||window}return t}function ut(t){return t instanceof dt(t).Element||t instanceof Element}function ft(t){return t instanceof dt(t).HTMLElement||t instanceof HTMLElement}function pt(t){return "undefined"!=typeof ShadowRoot&&(t instanceof dt(t).ShadowRoot||t instanceof ShadowRoot)}var mt={name:"applyStyles",enabled:!0,phase:"write",fn:function(t){var e=t.state;Object.keys(e.elements).forEach((function(t){var i=e.styles[t]||{},n=e.attributes[t]||{},s=e.elements[t];ft(s)&&ht(s)&&(Object.assign(s.style,i),Object.keys(n).forEach((function(t){var e=n[t];!1===e?s.removeAttribute(t):s.setAttribute(t,!0===e?"":e);})));}));},effect:function(t){var e=t.state,i={popper:{position:e.options.strategy,left:"0",top:"0",margin:"0"},arrow:{position:"absolute"},reference:{}};return Object.assign(e.elements.popper.style,i.popper),e.styles=i,e.elements.arrow&&Object.assign(e.elements.arrow.style,i.arrow),function(){Object.keys(e.elements).forEach((function(t){var n=e.elements[t],s=e.attributes[t]||{},o=Object.keys(e.styles.hasOwnProperty(t)?e.styles[t]:i[t]).reduce((function(t,e){return t[e]="",t}),{});ft(n)&&ht(n)&&(Object.assign(n.style,o),Object.keys(s).forEach((function(t){n.removeAttribute(t);})));}));}},requires:["computeStyles"]};function gt(t){return t.split("-")[0]}var _t=Math.round;function bt(t,e){void 0===e&&(e=!1);var i=t.getBoundingClientRect(),n=1,s=1;return ft(t)&&e&&(n=i.width/t.offsetWidth||1,s=i.height/t.offsetHeight||1),{width:_t(i.width/n),height:_t(i.height/s),top:_t(i.top/s),right:_t(i.right/n),bottom:_t(i.bottom/s),left:_t(i.left/n),x:_t(i.left/n),y:_t(i.top/s)}}function vt(t){var e=bt(t),i=t.offsetWidth,n=t.offsetHeight;return Math.abs(e.width-i)<=1&&(i=e.width),Math.abs(e.height-n)<=1&&(n=e.height),{x:t.offsetLeft,y:t.offsetTop,width:i,height:n}}function yt(t,e){var i=e.getRootNode&&e.getRootNode();if(t.contains(e))return !0;if(i&&pt(i)){var n=e;do{if(n&&t.isSameNode(n))return !0;n=n.parentNode||n.host;}while(n)}return !1}function wt(t){return dt(t).getComputedStyle(t)}function Et(t){return ["table","td","th"].indexOf(ht(t))>=0}function At(t){return ((ut(t)?t.ownerDocument:t.document)||window.document).documentElement}function Tt(t){return "html"===ht(t)?t:t.assignedSlot||t.parentNode||(pt(t)?t.host:null)||At(t)}function Ot(t){return ft(t)&&"fixed"!==wt(t).position?t.offsetParent:null}function Ct(t){for(var e=dt(t),i=Ot(t);i&&Et(i)&&"static"===wt(i).position;)i=Ot(i);return i&&("html"===ht(i)||"body"===ht(i)&&"static"===wt(i).position)?e:i||function(t){var e=-1!==navigator.userAgent.toLowerCase().indexOf("firefox");if(-1!==navigator.userAgent.indexOf("Trident")&&ft(t)&&"fixed"===wt(t).position)return null;for(var i=Tt(t);ft(i)&&["html","body"].indexOf(ht(i))<0;){var n=wt(i);if("none"!==n.transform||"none"!==n.perspective||"paint"===n.contain||-1!==["transform","perspective"].indexOf(n.willChange)||e&&"filter"===n.willChange||e&&n.filter&&"none"!==n.filter)return i;i=i.parentNode;}return null}(t)||e}function kt(t){return ["top","bottom"].indexOf(t)>=0?"x":"y"}var Lt=Math.max,xt=Math.min,Dt=Math.round;function St(t,e,i){return Lt(t,xt(e,i))}function Nt(t){return Object.assign({},{top:0,right:0,bottom:0,left:0},t)}function It(t,e){return e.reduce((function(e,i){return e[i]=t,e}),{})}var Pt={name:"arrow",enabled:!0,phase:"main",fn:function(t){var e,i=t.state,n=t.name,s=t.options,o=i.elements.arrow,r=i.modifiersData.popperOffsets,a=gt(i.placement),l=kt(a),c=[ot,st].indexOf(a)>=0?"height":"width";if(o&&r){var h=function(t,e){return Nt("number"!=typeof(t="function"==typeof t?t(Object.assign({},e.rects,{placement:e.placement})):t)?t:It(t,rt))}(s.padding,i),d=vt(o),u="y"===l?it:ot,f="y"===l?nt:st,p=i.rects.reference[c]+i.rects.reference[l]-r[l]-i.rects.popper[c],m=r[l]-i.rects.reference[l],g=Ct(o),_=g?"y"===l?g.clientHeight||0:g.clientWidth||0:0,b=p/2-m/2,v=h[u],y=_-d[c]-h[f],w=_/2-d[c]/2+b,E=St(v,w,y),A=l;i.modifiersData[n]=((e={})[A]=E,e.centerOffset=E-w,e);}},effect:function(t){var e=t.state,i=t.options.element,n=void 0===i?"[data-popper-arrow]":i;null!=n&&("string"!=typeof n||(n=e.elements.popper.querySelector(n)))&&yt(e.elements.popper,n)&&(e.elements.arrow=n);},requires:["popperOffsets"],requiresIfExists:["preventOverflow"]},jt={top:"auto",right:"auto",bottom:"auto",left:"auto"};function Mt(t){var e,i=t.popper,n=t.popperRect,s=t.placement,o=t.offsets,r=t.position,a=t.gpuAcceleration,l=t.adaptive,c=t.roundOffsets,h=!0===c?function(t){var e=t.x,i=t.y,n=window.devicePixelRatio||1;return {x:Dt(Dt(e*n)/n)||0,y:Dt(Dt(i*n)/n)||0}}(o):"function"==typeof c?c(o):o,d=h.x,u=void 0===d?0:d,f=h.y,p=void 0===f?0:f,m=o.hasOwnProperty("x"),g=o.hasOwnProperty("y"),_=ot,b=it,v=window;if(l){var y=Ct(i),w="clientHeight",E="clientWidth";y===dt(i)&&"static"!==wt(y=At(i)).position&&(w="scrollHeight",E="scrollWidth"),y=y,s===it&&(b=nt,p-=y[w]-n.height,p*=a?1:-1),s===ot&&(_=st,u-=y[E]-n.width,u*=a?1:-1);}var A,T=Object.assign({position:r},l&&jt);return a?Object.assign({},T,((A={})[b]=g?"0":"",A[_]=m?"0":"",A.transform=(v.devicePixelRatio||1)<2?"translate("+u+"px, "+p+"px)":"translate3d("+u+"px, "+p+"px, 0)",A)):Object.assign({},T,((e={})[b]=g?p+"px":"",e[_]=m?u+"px":"",e.transform="",e))}var Ht={name:"computeStyles",enabled:!0,phase:"beforeWrite",fn:function(t){var e=t.state,i=t.options,n=i.gpuAcceleration,s=void 0===n||n,o=i.adaptive,r=void 0===o||o,a=i.roundOffsets,l=void 0===a||a,c={placement:gt(e.placement),popper:e.elements.popper,popperRect:e.rects.popper,gpuAcceleration:s};null!=e.modifiersData.popperOffsets&&(e.styles.popper=Object.assign({},e.styles.popper,Mt(Object.assign({},c,{offsets:e.modifiersData.popperOffsets,position:e.options.strategy,adaptive:r,roundOffsets:l})))),null!=e.modifiersData.arrow&&(e.styles.arrow=Object.assign({},e.styles.arrow,Mt(Object.assign({},c,{offsets:e.modifiersData.arrow,position:"absolute",adaptive:!1,roundOffsets:l})))),e.attributes.popper=Object.assign({},e.attributes.popper,{"data-popper-placement":e.placement});},data:{}},Bt={passive:!0},Rt={name:"eventListeners",enabled:!0,phase:"write",fn:function(){},effect:function(t){var e=t.state,i=t.instance,n=t.options,s=n.scroll,o=void 0===s||s,r=n.resize,a=void 0===r||r,l=dt(e.elements.popper),c=[].concat(e.scrollParents.reference,e.scrollParents.popper);return o&&c.forEach((function(t){t.addEventListener("scroll",i.update,Bt);})),a&&l.addEventListener("resize",i.update,Bt),function(){o&&c.forEach((function(t){t.removeEventListener("scroll",i.update,Bt);})),a&&l.removeEventListener("resize",i.update,Bt);}},data:{}},Wt={left:"right",right:"left",bottom:"top",top:"bottom"};function zt(t){return t.replace(/left|right|bottom|top/g,(function(t){return Wt[t]}))}var qt={start:"end",end:"start"};function Ft(t){return t.replace(/start|end/g,(function(t){return qt[t]}))}function Ut(t){var e=dt(t);return {scrollLeft:e.pageXOffset,scrollTop:e.pageYOffset}}function $t(t){return bt(At(t)).left+Ut(t).scrollLeft}function Vt(t){var e=wt(t),i=e.overflow,n=e.overflowX,s=e.overflowY;return /auto|scroll|overlay|hidden/.test(i+s+n)}function Kt(t,e){var i;void 0===e&&(e=[]);var n=function t(e){return ["html","body","#document"].indexOf(ht(e))>=0?e.ownerDocument.body:ft(e)&&Vt(e)?e:t(Tt(e))}(t),s=n===(null==(i=t.ownerDocument)?void 0:i.body),o=dt(n),r=s?[o].concat(o.visualViewport||[],Vt(n)?n:[]):n,a=e.concat(r);return s?a:a.concat(Kt(Tt(r)))}function Xt(t){return Object.assign({},t,{left:t.x,top:t.y,right:t.x+t.width,bottom:t.y+t.height})}function Yt(t,e){return "viewport"===e?Xt(function(t){var e=dt(t),i=At(t),n=e.visualViewport,s=i.clientWidth,o=i.clientHeight,r=0,a=0;return n&&(s=n.width,o=n.height,/^((?!chrome|android).)*safari/i.test(navigator.userAgent)||(r=n.offsetLeft,a=n.offsetTop)),{width:s,height:o,x:r+$t(t),y:a}}(t)):ft(e)?function(t){var e=bt(t);return e.top=e.top+t.clientTop,e.left=e.left+t.clientLeft,e.bottom=e.top+t.clientHeight,e.right=e.left+t.clientWidth,e.width=t.clientWidth,e.height=t.clientHeight,e.x=e.left,e.y=e.top,e}(e):Xt(function(t){var e,i=At(t),n=Ut(t),s=null==(e=t.ownerDocument)?void 0:e.body,o=Lt(i.scrollWidth,i.clientWidth,s?s.scrollWidth:0,s?s.clientWidth:0),r=Lt(i.scrollHeight,i.clientHeight,s?s.scrollHeight:0,s?s.clientHeight:0),a=-n.scrollLeft+$t(t),l=-n.scrollTop;return "rtl"===wt(s||i).direction&&(a+=Lt(i.clientWidth,s?s.clientWidth:0)-o),{width:o,height:r,x:a,y:l}}(At(t)))}function Qt(t){return t.split("-")[1]}function Gt(t){var e,i=t.reference,n=t.element,s=t.placement,o=s?gt(s):null,r=s?Qt(s):null,a=i.x+i.width/2-n.width/2,l=i.y+i.height/2-n.height/2;switch(o){case it:e={x:a,y:i.y-n.height};break;case nt:e={x:a,y:i.y+i.height};break;case st:e={x:i.x+i.width,y:l};break;case ot:e={x:i.x-n.width,y:l};break;default:e={x:i.x,y:i.y};}var c=o?kt(o):null;if(null!=c){var h="y"===c?"height":"width";switch(r){case"start":e[c]=e[c]-(i[h]/2-n[h]/2);break;case"end":e[c]=e[c]+(i[h]/2-n[h]/2);}}return e}function Zt(t,e){void 0===e&&(e={});var i=e,n=i.placement,s=void 0===n?t.placement:n,o=i.boundary,r=void 0===o?"clippingParents":o,a=i.rootBoundary,l=void 0===a?"viewport":a,c=i.elementContext,h=void 0===c?"popper":c,d=i.altBoundary,u=void 0!==d&&d,f=i.padding,p=void 0===f?0:f,m=Nt("number"!=typeof p?p:It(p,rt)),g="popper"===h?"reference":"popper",_=t.elements.reference,b=t.rects.popper,v=t.elements[u?g:h],y=function(t,e,i){var n="clippingParents"===e?function(t){var e=Kt(Tt(t)),i=["absolute","fixed"].indexOf(wt(t).position)>=0&&ft(t)?Ct(t):t;return ut(i)?e.filter((function(t){return ut(t)&&yt(t,i)&&"body"!==ht(t)})):[]}(t):[].concat(e),s=[].concat(n,[i]),o=s[0],r=s.reduce((function(e,i){var n=Yt(t,i);return e.top=Lt(n.top,e.top),e.right=xt(n.right,e.right),e.bottom=xt(n.bottom,e.bottom),e.left=Lt(n.left,e.left),e}),Yt(t,o));return r.width=r.right-r.left,r.height=r.bottom-r.top,r.x=r.left,r.y=r.top,r}(ut(v)?v:v.contextElement||At(t.elements.popper),r,l),w=bt(_),E=Gt({reference:w,element:b,strategy:"absolute",placement:s}),A=Xt(Object.assign({},b,E)),T="popper"===h?A:w,O={top:y.top-T.top+m.top,bottom:T.bottom-y.bottom+m.bottom,left:y.left-T.left+m.left,right:T.right-y.right+m.right},C=t.modifiersData.offset;if("popper"===h&&C){var k=C[s];Object.keys(O).forEach((function(t){var e=[st,nt].indexOf(t)>=0?1:-1,i=[it,nt].indexOf(t)>=0?"y":"x";O[t]+=k[i]*e;}));}return O}function Jt(t,e){void 0===e&&(e={});var i=e,n=i.placement,s=i.boundary,o=i.rootBoundary,r=i.padding,a=i.flipVariations,l=i.allowedAutoPlacements,c=void 0===l?lt:l,h=Qt(n),d=h?a?at:at.filter((function(t){return Qt(t)===h})):rt,u=d.filter((function(t){return c.indexOf(t)>=0}));0===u.length&&(u=d);var f=u.reduce((function(e,i){return e[i]=Zt(t,{placement:i,boundary:s,rootBoundary:o,padding:r})[gt(i)],e}),{});return Object.keys(f).sort((function(t,e){return f[t]-f[e]}))}var te={name:"flip",enabled:!0,phase:"main",fn:function(t){var e=t.state,i=t.options,n=t.name;if(!e.modifiersData[n]._skip){for(var s=i.mainAxis,o=void 0===s||s,r=i.altAxis,a=void 0===r||r,l=i.fallbackPlacements,c=i.padding,h=i.boundary,d=i.rootBoundary,u=i.altBoundary,f=i.flipVariations,p=void 0===f||f,m=i.allowedAutoPlacements,g=e.options.placement,_=gt(g),b=l||(_!==g&&p?function(t){if("auto"===gt(t))return [];var e=zt(t);return [Ft(t),e,Ft(e)]}(g):[zt(g)]),v=[g].concat(b).reduce((function(t,i){return t.concat("auto"===gt(i)?Jt(e,{placement:i,boundary:h,rootBoundary:d,padding:c,flipVariations:p,allowedAutoPlacements:m}):i)}),[]),y=e.rects.reference,w=e.rects.popper,E=new Map,A=!0,T=v[0],O=0;O<v.length;O++){var C=v[O],k=gt(C),L="start"===Qt(C),x=[it,nt].indexOf(k)>=0,D=x?"width":"height",S=Zt(e,{placement:C,boundary:h,rootBoundary:d,altBoundary:u,padding:c}),N=x?L?st:ot:L?nt:it;y[D]>w[D]&&(N=zt(N));var I=zt(N),P=[];if(o&&P.push(S[k]<=0),a&&P.push(S[N]<=0,S[I]<=0),P.every((function(t){return t}))){T=C,A=!1;break}E.set(C,P);}if(A)for(var j=function(t){var e=v.find((function(e){var i=E.get(e);if(i)return i.slice(0,t).every((function(t){return t}))}));if(e)return T=e,"break"},M=p?3:1;M>0&&"break"!==j(M);M--);e.placement!==T&&(e.modifiersData[n]._skip=!0,e.placement=T,e.reset=!0);}},requiresIfExists:["offset"],data:{_skip:!1}};function ee(t,e,i){return void 0===i&&(i={x:0,y:0}),{top:t.top-e.height-i.y,right:t.right-e.width+i.x,bottom:t.bottom-e.height+i.y,left:t.left-e.width-i.x}}function ie(t){return [it,st,nt,ot].some((function(e){return t[e]>=0}))}var ne={name:"hide",enabled:!0,phase:"main",requiresIfExists:["preventOverflow"],fn:function(t){var e=t.state,i=t.name,n=e.rects.reference,s=e.rects.popper,o=e.modifiersData.preventOverflow,r=Zt(e,{elementContext:"reference"}),a=Zt(e,{altBoundary:!0}),l=ee(r,n),c=ee(a,s,o),h=ie(l),d=ie(c);e.modifiersData[i]={referenceClippingOffsets:l,popperEscapeOffsets:c,isReferenceHidden:h,hasPopperEscaped:d},e.attributes.popper=Object.assign({},e.attributes.popper,{"data-popper-reference-hidden":h,"data-popper-escaped":d});}},se={name:"offset",enabled:!0,phase:"main",requires:["popperOffsets"],fn:function(t){var e=t.state,i=t.options,n=t.name,s=i.offset,o=void 0===s?[0,0]:s,r=lt.reduce((function(t,i){return t[i]=function(t,e,i){var n=gt(t),s=[ot,it].indexOf(n)>=0?-1:1,o="function"==typeof i?i(Object.assign({},e,{placement:t})):i,r=o[0],a=o[1];return r=r||0,a=(a||0)*s,[ot,st].indexOf(n)>=0?{x:a,y:r}:{x:r,y:a}}(i,e.rects,o),t}),{}),a=r[e.placement],l=a.x,c=a.y;null!=e.modifiersData.popperOffsets&&(e.modifiersData.popperOffsets.x+=l,e.modifiersData.popperOffsets.y+=c),e.modifiersData[n]=r;}},oe={name:"popperOffsets",enabled:!0,phase:"read",fn:function(t){var e=t.state,i=t.name;e.modifiersData[i]=Gt({reference:e.rects.reference,element:e.rects.popper,strategy:"absolute",placement:e.placement});},data:{}},re={name:"preventOverflow",enabled:!0,phase:"main",fn:function(t){var e=t.state,i=t.options,n=t.name,s=i.mainAxis,o=void 0===s||s,r=i.altAxis,a=void 0!==r&&r,l=i.boundary,c=i.rootBoundary,h=i.altBoundary,d=i.padding,u=i.tether,f=void 0===u||u,p=i.tetherOffset,m=void 0===p?0:p,g=Zt(e,{boundary:l,rootBoundary:c,padding:d,altBoundary:h}),_=gt(e.placement),b=Qt(e.placement),v=!b,y=kt(_),w="x"===y?"y":"x",E=e.modifiersData.popperOffsets,A=e.rects.reference,T=e.rects.popper,O="function"==typeof m?m(Object.assign({},e.rects,{placement:e.placement})):m,C={x:0,y:0};if(E){if(o||a){var k="y"===y?it:ot,L="y"===y?nt:st,x="y"===y?"height":"width",D=E[y],S=E[y]+g[k],N=E[y]-g[L],I=f?-T[x]/2:0,P="start"===b?A[x]:T[x],j="start"===b?-T[x]:-A[x],M=e.elements.arrow,H=f&&M?vt(M):{width:0,height:0},B=e.modifiersData["arrow#persistent"]?e.modifiersData["arrow#persistent"].padding:{top:0,right:0,bottom:0,left:0},R=B[k],W=B[L],z=St(0,A[x],H[x]),q=v?A[x]/2-I-z-R-O:P-z-R-O,F=v?-A[x]/2+I+z+W+O:j+z+W+O,U=e.elements.arrow&&Ct(e.elements.arrow),$=U?"y"===y?U.clientTop||0:U.clientLeft||0:0,V=e.modifiersData.offset?e.modifiersData.offset[e.placement][y]:0,K=E[y]+q-V-$,X=E[y]+F-V;if(o){var Y=St(f?xt(S,K):S,D,f?Lt(N,X):N);E[y]=Y,C[y]=Y-D;}if(a){var Q="x"===y?it:ot,G="x"===y?nt:st,Z=E[w],J=Z+g[Q],tt=Z-g[G],et=St(f?xt(J,K):J,Z,f?Lt(tt,X):tt);E[w]=et,C[w]=et-Z;}}e.modifiersData[n]=C;}},requiresIfExists:["offset"]};function ae(t,e,i){void 0===i&&(i=!1);var n,s,o=ft(e),r=ft(e)&&function(t){var e=t.getBoundingClientRect(),i=e.width/t.offsetWidth||1,n=e.height/t.offsetHeight||1;return 1!==i||1!==n}(e),a=At(e),l=bt(t,r),c={scrollLeft:0,scrollTop:0},h={x:0,y:0};return (o||!o&&!i)&&(("body"!==ht(e)||Vt(a))&&(c=(n=e)!==dt(n)&&ft(n)?{scrollLeft:(s=n).scrollLeft,scrollTop:s.scrollTop}:Ut(n)),ft(e)?((h=bt(e,!0)).x+=e.clientLeft,h.y+=e.clientTop):a&&(h.x=$t(a))),{x:l.left+c.scrollLeft-h.x,y:l.top+c.scrollTop-h.y,width:l.width,height:l.height}}var le={placement:"bottom",modifiers:[],strategy:"absolute"};function ce(){for(var t=arguments.length,e=new Array(t),i=0;i<t;i++)e[i]=arguments[i];return !e.some((function(t){return !(t&&"function"==typeof t.getBoundingClientRect)}))}function he(t){void 0===t&&(t={});var e=t,i=e.defaultModifiers,n=void 0===i?[]:i,s=e.defaultOptions,o=void 0===s?le:s;return function(t,e,i){void 0===i&&(i=o);var s,r,a={placement:"bottom",orderedModifiers:[],options:Object.assign({},le,o),modifiersData:{},elements:{reference:t,popper:e},attributes:{},styles:{}},l=[],c=!1,h={state:a,setOptions:function(i){d(),a.options=Object.assign({},o,a.options,i),a.scrollParents={reference:ut(t)?Kt(t):t.contextElement?Kt(t.contextElement):[],popper:Kt(e)};var s,r,c=function(t){var e=function(t){var e=new Map,i=new Set,n=[];return t.forEach((function(t){e.set(t.name,t);})),t.forEach((function(t){i.has(t.name)||function t(s){i.add(s.name),[].concat(s.requires||[],s.requiresIfExists||[]).forEach((function(n){if(!i.has(n)){var s=e.get(n);s&&t(s);}})),n.push(s);}(t);})),n}(t);return ct.reduce((function(t,i){return t.concat(e.filter((function(t){return t.phase===i})))}),[])}((s=[].concat(n,a.options.modifiers),r=s.reduce((function(t,e){var i=t[e.name];return t[e.name]=i?Object.assign({},i,e,{options:Object.assign({},i.options,e.options),data:Object.assign({},i.data,e.data)}):e,t}),{}),Object.keys(r).map((function(t){return r[t]}))));return a.orderedModifiers=c.filter((function(t){return t.enabled})),a.orderedModifiers.forEach((function(t){var e=t.name,i=t.options,n=void 0===i?{}:i,s=t.effect;if("function"==typeof s){var o=s({state:a,name:e,instance:h,options:n});l.push(o||function(){});}})),h.update()},forceUpdate:function(){if(!c){var t=a.elements,e=t.reference,i=t.popper;if(ce(e,i)){a.rects={reference:ae(e,Ct(i),"fixed"===a.options.strategy),popper:vt(i)},a.reset=!1,a.placement=a.options.placement,a.orderedModifiers.forEach((function(t){return a.modifiersData[t.name]=Object.assign({},t.data)}));for(var n=0;n<a.orderedModifiers.length;n++)if(!0!==a.reset){var s=a.orderedModifiers[n],o=s.fn,r=s.options,l=void 0===r?{}:r,d=s.name;"function"==typeof o&&(a=o({state:a,options:l,name:d,instance:h})||a);}else a.reset=!1,n=-1;}}},update:(s=function(){return new Promise((function(t){h.forceUpdate(),t(a);}))},function(){return r||(r=new Promise((function(t){Promise.resolve().then((function(){r=void 0,t(s());}));}))),r}),destroy:function(){d(),c=!0;}};if(!ce(t,e))return h;function d(){l.forEach((function(t){return t()})),l=[];}return h.setOptions(i).then((function(t){!c&&i.onFirstUpdate&&i.onFirstUpdate(t);})),h}}var de=he(),ue=he({defaultModifiers:[Rt,oe,Ht,mt]}),fe=he({defaultModifiers:[Rt,oe,Ht,mt,se,te,re,Pt,ne]}),pe=Object.freeze({__proto__:null,popperGenerator:he,detectOverflow:Zt,createPopperBase:de,createPopper:fe,createPopperLite:ue,top:it,bottom:nt,right:st,left:ot,auto:"auto",basePlacements:rt,start:"start",end:"end",clippingParents:"clippingParents",viewport:"viewport",popper:"popper",reference:"reference",variationPlacements:at,placements:lt,beforeRead:"beforeRead",read:"read",afterRead:"afterRead",beforeMain:"beforeMain",main:"main",afterMain:"afterMain",beforeWrite:"beforeWrite",write:"write",afterWrite:"afterWrite",modifierPhases:ct,applyStyles:mt,arrow:Pt,computeStyles:Ht,eventListeners:Rt,flip:te,hide:ne,offset:se,popperOffsets:oe,preventOverflow:re});const me=new RegExp("ArrowUp|ArrowDown|Escape"),ge=p()?"top-end":"top-start",_e=p()?"top-start":"top-end",be=p()?"bottom-end":"bottom-start",ve=p()?"bottom-start":"bottom-end",ye=p()?"left-start":"right-start",we=p()?"right-start":"left-start",Ee={offset:[0,2],boundary:"clippingParents",reference:"toggle",display:"dynamic",popperConfig:null,autoClose:!0},Ae={offset:"(array|string|function)",boundary:"(string|element)",reference:"(string|element|object)",display:"string",popperConfig:"(null|object|function)",autoClose:"(boolean|string)"};class Te extends H{constructor(t,e){super(t),this._popper=null,this._config=this._getConfig(e),this._menu=this._getMenuElement(),this._inNavbar=this._detectNavbar();}static get Default(){return Ee}static get DefaultType(){return Ae}static get NAME(){return "dropdown"}toggle(){return this._isShown()?this.hide():this.show()}show(){if(l(this._element)||this._isShown(this._menu))return;const t={relatedTarget:this._element};if(P.trigger(this._element,"show.bs.dropdown",t).defaultPrevented)return;const e=Te.getParentFromElement(this._element);this._inNavbar?F.setDataAttribute(this._menu,"popper","none"):this._createPopper(e),"ontouchstart"in document.documentElement&&!e.closest(".navbar-nav")&&[].concat(...document.body.children).forEach(t=>P.on(t,"mouseover",h)),this._element.focus(),this._element.setAttribute("aria-expanded",!0),this._menu.classList.add("show"),this._element.classList.add("show"),P.trigger(this._element,"shown.bs.dropdown",t);}hide(){if(l(this._element)||!this._isShown(this._menu))return;const t={relatedTarget:this._element};this._completeHide(t);}dispose(){this._popper&&this._popper.destroy(),super.dispose();}update(){this._inNavbar=this._detectNavbar(),this._popper&&this._popper.update();}_completeHide(t){P.trigger(this._element,"hide.bs.dropdown",t).defaultPrevented||("ontouchstart"in document.documentElement&&[].concat(...document.body.children).forEach(t=>P.off(t,"mouseover",h)),this._popper&&this._popper.destroy(),this._menu.classList.remove("show"),this._element.classList.remove("show"),this._element.setAttribute("aria-expanded","false"),F.removeDataAttribute(this._menu,"popper"),P.trigger(this._element,"hidden.bs.dropdown",t));}_getConfig(t){if(t={...this.constructor.Default,...F.getDataAttributes(this._element),...t},r("dropdown",t,this.constructor.DefaultType),"object"==typeof t.reference&&!s(t.reference)&&"function"!=typeof t.reference.getBoundingClientRect)throw new TypeError("dropdown".toUpperCase()+': Option "reference" provided type "object" without a required "getBoundingClientRect" method.');return t}_createPopper(t){if(void 0===pe)throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org)");let e=this._element;"parent"===this._config.reference?e=t:s(this._config.reference)?e=o(this._config.reference):"object"==typeof this._config.reference&&(e=this._config.reference);const i=this._getPopperConfig(),n=i.modifiers.find(t=>"applyStyles"===t.name&&!1===t.enabled);this._popper=fe(e,this._menu,i),n&&F.setDataAttribute(this._menu,"popper","static");}_isShown(t=this._element){return t.classList.contains("show")}_getMenuElement(){return U.next(this._element,".dropdown-menu")[0]}_getPlacement(){const t=this._element.parentNode;if(t.classList.contains("dropend"))return ye;if(t.classList.contains("dropstart"))return we;const e="end"===getComputedStyle(this._menu).getPropertyValue("--bs-position").trim();return t.classList.contains("dropup")?e?_e:ge:e?ve:be}_detectNavbar(){return null!==this._element.closest(".navbar")}_getOffset(){const{offset:t}=this._config;return "string"==typeof t?t.split(",").map(t=>Number.parseInt(t,10)):"function"==typeof t?e=>t(e,this._element):t}_getPopperConfig(){const t={placement:this._getPlacement(),modifiers:[{name:"preventOverflow",options:{boundary:this._config.boundary}},{name:"offset",options:{offset:this._getOffset()}}]};return "static"===this._config.display&&(t.modifiers=[{name:"applyStyles",enabled:!1}]),{...t,..."function"==typeof this._config.popperConfig?this._config.popperConfig(t):this._config.popperConfig}}_selectMenuItem({key:t,target:e}){const i=U.find(".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)",this._menu).filter(a);i.length&&b(i,e,"ArrowDown"===t,!i.includes(e)).focus();}static jQueryInterface(t){return this.each((function(){const e=Te.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]();}}))}static clearMenus(t){if(t&&(2===t.button||"keyup"===t.type&&"Tab"!==t.key))return;const e=U.find('[data-bs-toggle="dropdown"]');for(let i=0,n=e.length;i<n;i++){const n=Te.getInstance(e[i]);if(!n||!1===n._config.autoClose)continue;if(!n._isShown())continue;const s={relatedTarget:n._element};if(t){const e=t.composedPath(),i=e.includes(n._menu);if(e.includes(n._element)||"inside"===n._config.autoClose&&!i||"outside"===n._config.autoClose&&i)continue;if(n._menu.contains(t.target)&&("keyup"===t.type&&"Tab"===t.key||/input|select|option|textarea|form/i.test(t.target.tagName)))continue;"click"===t.type&&(s.clickEvent=t);}n._completeHide(s);}}static getParentFromElement(t){return i(t)||t.parentNode}static dataApiKeydownHandler(t){if(/input|textarea/i.test(t.target.tagName)?"Space"===t.key||"Escape"!==t.key&&("ArrowDown"!==t.key&&"ArrowUp"!==t.key||t.target.closest(".dropdown-menu")):!me.test(t.key))return;const e=this.classList.contains("show");if(!e&&"Escape"===t.key)return;if(t.preventDefault(),t.stopPropagation(),l(this))return;const i=this.matches('[data-bs-toggle="dropdown"]')?this:U.prev(this,'[data-bs-toggle="dropdown"]')[0],n=Te.getOrCreateInstance(i);if("Escape"!==t.key)return "ArrowUp"===t.key||"ArrowDown"===t.key?(e||n.show(),void n._selectMenuItem(t)):void(e&&"Space"!==t.key||Te.clearMenus());n.hide();}}P.on(document,"keydown.bs.dropdown.data-api",'[data-bs-toggle="dropdown"]',Te.dataApiKeydownHandler),P.on(document,"keydown.bs.dropdown.data-api",".dropdown-menu",Te.dataApiKeydownHandler),P.on(document,"click.bs.dropdown.data-api",Te.clearMenus),P.on(document,"keyup.bs.dropdown.data-api",Te.clearMenus),P.on(document,"click.bs.dropdown.data-api",'[data-bs-toggle="dropdown"]',(function(t){t.preventDefault(),Te.getOrCreateInstance(this).toggle();})),m(Te);class Oe{constructor(){this._element=document.body;}getWidth(){const t=document.documentElement.clientWidth;return Math.abs(window.innerWidth-t)}hide(){const t=this.getWidth();this._disableOverFlow(),this._setElementAttributes(this._element,"paddingRight",e=>e+t),this._setElementAttributes(".fixed-top, .fixed-bottom, .is-fixed, .sticky-top","paddingRight",e=>e+t),this._setElementAttributes(".sticky-top","marginRight",e=>e-t);}_disableOverFlow(){this._saveInitialAttribute(this._element,"overflow"),this._element.style.overflow="hidden";}_setElementAttributes(t,e,i){const n=this.getWidth();this._applyManipulationCallback(t,t=>{if(t!==this._element&&window.innerWidth>t.clientWidth+n)return;this._saveInitialAttribute(t,e);const s=window.getComputedStyle(t)[e];t.style[e]=i(Number.parseFloat(s))+"px";});}reset(){this._resetElementAttributes(this._element,"overflow"),this._resetElementAttributes(this._element,"paddingRight"),this._resetElementAttributes(".fixed-top, .fixed-bottom, .is-fixed, .sticky-top","paddingRight"),this._resetElementAttributes(".sticky-top","marginRight");}_saveInitialAttribute(t,e){const i=t.style[e];i&&F.setDataAttribute(t,e,i);}_resetElementAttributes(t,e){this._applyManipulationCallback(t,t=>{const i=F.getDataAttribute(t,e);void 0===i?t.style.removeProperty(e):(F.removeDataAttribute(t,e),t.style[e]=i);});}_applyManipulationCallback(t,e){s(t)?e(t):U.find(t,this._element).forEach(e);}isOverflowing(){return this.getWidth()>0}}const Ce={className:"modal-backdrop",isVisible:!0,isAnimated:!1,rootElement:"body",clickCallback:null},ke={className:"string",isVisible:"boolean",isAnimated:"boolean",rootElement:"(element|string)",clickCallback:"(function|null)"};class Le{constructor(t){this._config=this._getConfig(t),this._isAppended=!1,this._element=null;}show(t){this._config.isVisible?(this._append(),this._config.isAnimated&&d(this._getElement()),this._getElement().classList.add("show"),this._emulateAnimation(()=>{g(t);})):g(t);}hide(t){this._config.isVisible?(this._getElement().classList.remove("show"),this._emulateAnimation(()=>{this.dispose(),g(t);})):g(t);}_getElement(){if(!this._element){const t=document.createElement("div");t.className=this._config.className,this._config.isAnimated&&t.classList.add("fade"),this._element=t;}return this._element}_getConfig(t){return (t={...Ce,..."object"==typeof t?t:{}}).rootElement=o(t.rootElement),r("backdrop",t,ke),t}_append(){this._isAppended||(this._config.rootElement.append(this._getElement()),P.on(this._getElement(),"mousedown.bs.backdrop",()=>{g(this._config.clickCallback);}),this._isAppended=!0);}dispose(){this._isAppended&&(P.off(this._element,"mousedown.bs.backdrop"),this._element.remove(),this._isAppended=!1);}_emulateAnimation(t){_(t,this._getElement(),this._config.isAnimated);}}const xe={trapElement:null,autofocus:!0},De={trapElement:"element",autofocus:"boolean"};class Se{constructor(t){this._config=this._getConfig(t),this._isActive=!1,this._lastTabNavDirection=null;}activate(){const{trapElement:t,autofocus:e}=this._config;this._isActive||(e&&t.focus(),P.off(document,".bs.focustrap"),P.on(document,"focusin.bs.focustrap",t=>this._handleFocusin(t)),P.on(document,"keydown.tab.bs.focustrap",t=>this._handleKeydown(t)),this._isActive=!0);}deactivate(){this._isActive&&(this._isActive=!1,P.off(document,".bs.focustrap"));}_handleFocusin(t){const{target:e}=t,{trapElement:i}=this._config;if(e===document||e===i||i.contains(e))return;const n=U.focusableChildren(i);0===n.length?i.focus():"backward"===this._lastTabNavDirection?n[n.length-1].focus():n[0].focus();}_handleKeydown(t){"Tab"===t.key&&(this._lastTabNavDirection=t.shiftKey?"backward":"forward");}_getConfig(t){return t={...xe,..."object"==typeof t?t:{}},r("focustrap",t,De),t}}const Ne={backdrop:!0,keyboard:!0,focus:!0},Ie={backdrop:"(boolean|string)",keyboard:"boolean",focus:"boolean"};class Pe extends H{constructor(t,e){super(t),this._config=this._getConfig(e),this._dialog=U.findOne(".modal-dialog",this._element),this._backdrop=this._initializeBackDrop(),this._focustrap=this._initializeFocusTrap(),this._isShown=!1,this._ignoreBackdropClick=!1,this._isTransitioning=!1,this._scrollBar=new Oe;}static get Default(){return Ne}static get NAME(){return "modal"}toggle(t){return this._isShown?this.hide():this.show(t)}show(t){this._isShown||this._isTransitioning||P.trigger(this._element,"show.bs.modal",{relatedTarget:t}).defaultPrevented||(this._isShown=!0,this._isAnimated()&&(this._isTransitioning=!0),this._scrollBar.hide(),document.body.classList.add("modal-open"),this._adjustDialog(),this._setEscapeEvent(),this._setResizeEvent(),P.on(this._dialog,"mousedown.dismiss.bs.modal",()=>{P.one(this._element,"mouseup.dismiss.bs.modal",t=>{t.target===this._element&&(this._ignoreBackdropClick=!0);});}),this._showBackdrop(()=>this._showElement(t)));}hide(){if(!this._isShown||this._isTransitioning)return;if(P.trigger(this._element,"hide.bs.modal").defaultPrevented)return;this._isShown=!1;const t=this._isAnimated();t&&(this._isTransitioning=!0),this._setEscapeEvent(),this._setResizeEvent(),this._focustrap.deactivate(),this._element.classList.remove("show"),P.off(this._element,"click.dismiss.bs.modal"),P.off(this._dialog,"mousedown.dismiss.bs.modal"),this._queueCallback(()=>this._hideModal(),this._element,t);}dispose(){[window,this._dialog].forEach(t=>P.off(t,".bs.modal")),this._backdrop.dispose(),this._focustrap.deactivate(),super.dispose();}handleUpdate(){this._adjustDialog();}_initializeBackDrop(){return new Le({isVisible:Boolean(this._config.backdrop),isAnimated:this._isAnimated()})}_initializeFocusTrap(){return new Se({trapElement:this._element})}_getConfig(t){return t={...Ne,...F.getDataAttributes(this._element),..."object"==typeof t?t:{}},r("modal",t,Ie),t}_showElement(t){const e=this._isAnimated(),i=U.findOne(".modal-body",this._dialog);this._element.parentNode&&this._element.parentNode.nodeType===Node.ELEMENT_NODE||document.body.append(this._element),this._element.style.display="block",this._element.removeAttribute("aria-hidden"),this._element.setAttribute("aria-modal",!0),this._element.setAttribute("role","dialog"),this._element.scrollTop=0,i&&(i.scrollTop=0),e&&d(this._element),this._element.classList.add("show"),this._queueCallback(()=>{this._config.focus&&this._focustrap.activate(),this._isTransitioning=!1,P.trigger(this._element,"shown.bs.modal",{relatedTarget:t});},this._dialog,e);}_setEscapeEvent(){this._isShown?P.on(this._element,"keydown.dismiss.bs.modal",t=>{this._config.keyboard&&"Escape"===t.key?(t.preventDefault(),this.hide()):this._config.keyboard||"Escape"!==t.key||this._triggerBackdropTransition();}):P.off(this._element,"keydown.dismiss.bs.modal");}_setResizeEvent(){this._isShown?P.on(window,"resize.bs.modal",()=>this._adjustDialog()):P.off(window,"resize.bs.modal");}_hideModal(){this._element.style.display="none",this._element.setAttribute("aria-hidden",!0),this._element.removeAttribute("aria-modal"),this._element.removeAttribute("role"),this._isTransitioning=!1,this._backdrop.hide(()=>{document.body.classList.remove("modal-open"),this._resetAdjustments(),this._scrollBar.reset(),P.trigger(this._element,"hidden.bs.modal");});}_showBackdrop(t){P.on(this._element,"click.dismiss.bs.modal",t=>{this._ignoreBackdropClick?this._ignoreBackdropClick=!1:t.target===t.currentTarget&&(!0===this._config.backdrop?this.hide():"static"===this._config.backdrop&&this._triggerBackdropTransition());}),this._backdrop.show(t);}_isAnimated(){return this._element.classList.contains("fade")}_triggerBackdropTransition(){if(P.trigger(this._element,"hidePrevented.bs.modal").defaultPrevented)return;const{classList:t,scrollHeight:e,style:i}=this._element,n=e>document.documentElement.clientHeight;!n&&"hidden"===i.overflowY||t.contains("modal-static")||(n||(i.overflowY="hidden"),t.add("modal-static"),this._queueCallback(()=>{t.remove("modal-static"),n||this._queueCallback(()=>{i.overflowY="";},this._dialog);},this._dialog),this._element.focus());}_adjustDialog(){const t=this._element.scrollHeight>document.documentElement.clientHeight,e=this._scrollBar.getWidth(),i=e>0;(!i&&t&&!p()||i&&!t&&p())&&(this._element.style.paddingLeft=e+"px"),(i&&!t&&!p()||!i&&t&&p())&&(this._element.style.paddingRight=e+"px");}_resetAdjustments(){this._element.style.paddingLeft="",this._element.style.paddingRight="";}static jQueryInterface(t,e){return this.each((function(){const i=Pe.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===i[t])throw new TypeError(`No method named "${t}"`);i[t](e);}}))}}P.on(document,"click.bs.modal.data-api",'[data-bs-toggle="modal"]',(function(t){const e=i(this);["A","AREA"].includes(this.tagName)&&t.preventDefault(),P.one(e,"show.bs.modal",t=>{t.defaultPrevented||P.one(e,"hidden.bs.modal",()=>{a(this)&&this.focus();});}),Pe.getOrCreateInstance(e).toggle(this);})),B(Pe),m(Pe);const je={backdrop:!0,keyboard:!0,scroll:!1},Me={backdrop:"boolean",keyboard:"boolean",scroll:"boolean"};class He extends H{constructor(t,e){super(t),this._config=this._getConfig(e),this._isShown=!1,this._backdrop=this._initializeBackDrop(),this._focustrap=this._initializeFocusTrap(),this._addEventListeners();}static get NAME(){return "offcanvas"}static get Default(){return je}toggle(t){return this._isShown?this.hide():this.show(t)}show(t){this._isShown||P.trigger(this._element,"show.bs.offcanvas",{relatedTarget:t}).defaultPrevented||(this._isShown=!0,this._element.style.visibility="visible",this._backdrop.show(),this._config.scroll||(new Oe).hide(),this._element.removeAttribute("aria-hidden"),this._element.setAttribute("aria-modal",!0),this._element.setAttribute("role","dialog"),this._element.classList.add("show"),this._queueCallback(()=>{this._config.scroll||this._focustrap.activate(),P.trigger(this._element,"shown.bs.offcanvas",{relatedTarget:t});},this._element,!0));}hide(){this._isShown&&(P.trigger(this._element,"hide.bs.offcanvas").defaultPrevented||(this._focustrap.deactivate(),this._element.blur(),this._isShown=!1,this._element.classList.remove("show"),this._backdrop.hide(),this._queueCallback(()=>{this._element.setAttribute("aria-hidden",!0),this._element.removeAttribute("aria-modal"),this._element.removeAttribute("role"),this._element.style.visibility="hidden",this._config.scroll||(new Oe).reset(),P.trigger(this._element,"hidden.bs.offcanvas");},this._element,!0)));}dispose(){this._backdrop.dispose(),this._focustrap.deactivate(),super.dispose();}_getConfig(t){return t={...je,...F.getDataAttributes(this._element),..."object"==typeof t?t:{}},r("offcanvas",t,Me),t}_initializeBackDrop(){return new Le({className:"offcanvas-backdrop",isVisible:this._config.backdrop,isAnimated:!0,rootElement:this._element.parentNode,clickCallback:()=>this.hide()})}_initializeFocusTrap(){return new Se({trapElement:this._element})}_addEventListeners(){P.on(this._element,"keydown.dismiss.bs.offcanvas",t=>{this._config.keyboard&&"Escape"===t.key&&this.hide();});}static jQueryInterface(t){return this.each((function(){const e=He.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t]||t.startsWith("_")||"constructor"===t)throw new TypeError(`No method named "${t}"`);e[t](this);}}))}}P.on(document,"click.bs.offcanvas.data-api",'[data-bs-toggle="offcanvas"]',(function(t){const e=i(this);if(["A","AREA"].includes(this.tagName)&&t.preventDefault(),l(this))return;P.one(e,"hidden.bs.offcanvas",()=>{a(this)&&this.focus();});const n=U.findOne(".offcanvas.show");n&&n!==e&&He.getInstance(n).hide(),He.getOrCreateInstance(e).toggle(this);})),P.on(window,"load.bs.offcanvas.data-api",()=>U.find(".offcanvas.show").forEach(t=>He.getOrCreateInstance(t).show())),B(He),m(He);const Be=new Set(["background","cite","href","itemtype","longdesc","poster","src","xlink:href"]),Re=/^(?:(?:https?|mailto|ftp|tel|file):|[^#&/:?]*(?:[#/?]|$))/i,We=/^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[\d+/a-z]+=*$/i,ze=(t,e)=>{const i=t.nodeName.toLowerCase();if(e.includes(i))return !Be.has(i)||Boolean(Re.test(t.nodeValue)||We.test(t.nodeValue));const n=e.filter(t=>t instanceof RegExp);for(let t=0,e=n.length;t<e;t++)if(n[t].test(i))return !0;return !1};function qe(t,e,i){if(!t.length)return t;if(i&&"function"==typeof i)return i(t);const n=(new window.DOMParser).parseFromString(t,"text/html"),s=Object.keys(e),o=[].concat(...n.body.querySelectorAll("*"));for(let t=0,i=o.length;t<i;t++){const i=o[t],n=i.nodeName.toLowerCase();if(!s.includes(n)){i.remove();continue}const r=[].concat(...i.attributes),a=[].concat(e["*"]||[],e[n]||[]);r.forEach(t=>{ze(t,a)||i.removeAttribute(t.nodeName);});}return n.body.innerHTML}const Fe=new Set(["sanitize","allowList","sanitizeFn"]),Ue={animation:"boolean",template:"string",title:"(string|element|function)",trigger:"string",delay:"(number|object)",html:"boolean",selector:"(string|boolean)",placement:"(string|function)",offset:"(array|string|function)",container:"(string|element|boolean)",fallbackPlacements:"array",boundary:"(string|element)",customClass:"(string|function)",sanitize:"boolean",sanitizeFn:"(null|function)",allowList:"object",popperConfig:"(null|object|function)"},$e={AUTO:"auto",TOP:"top",RIGHT:p()?"left":"right",BOTTOM:"bottom",LEFT:p()?"right":"left"},Ve={animation:!0,template:'<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,selector:!1,placement:"top",offset:[0,0],container:!1,fallbackPlacements:["top","right","bottom","left"],boundary:"clippingParents",customClass:"",sanitize:!0,sanitizeFn:null,allowList:{"*":["class","dir","id","lang","role",/^aria-[\w-]*$/i],a:["target","href","title","rel"],area:[],b:[],br:[],col:[],code:[],div:[],em:[],hr:[],h1:[],h2:[],h3:[],h4:[],h5:[],h6:[],i:[],img:["src","srcset","alt","title","width","height"],li:[],ol:[],p:[],pre:[],s:[],small:[],span:[],sub:[],sup:[],strong:[],u:[],ul:[]},popperConfig:null},Ke={HIDE:"hide.bs.tooltip",HIDDEN:"hidden.bs.tooltip",SHOW:"show.bs.tooltip",SHOWN:"shown.bs.tooltip",INSERTED:"inserted.bs.tooltip",CLICK:"click.bs.tooltip",FOCUSIN:"focusin.bs.tooltip",FOCUSOUT:"focusout.bs.tooltip",MOUSEENTER:"mouseenter.bs.tooltip",MOUSELEAVE:"mouseleave.bs.tooltip"};class Xe extends H{constructor(t,e){if(void 0===pe)throw new TypeError("Bootstrap's tooltips require Popper (https://popper.js.org)");super(t),this._isEnabled=!0,this._timeout=0,this._hoverState="",this._activeTrigger={},this._popper=null,this._config=this._getConfig(e),this.tip=null,this._setListeners();}static get Default(){return Ve}static get NAME(){return "tooltip"}static get Event(){return Ke}static get DefaultType(){return Ue}enable(){this._isEnabled=!0;}disable(){this._isEnabled=!1;}toggleEnabled(){this._isEnabled=!this._isEnabled;}toggle(t){if(this._isEnabled)if(t){const e=this._initializeOnDelegatedTarget(t);e._activeTrigger.click=!e._activeTrigger.click,e._isWithActiveTrigger()?e._enter(null,e):e._leave(null,e);}else {if(this.getTipElement().classList.contains("show"))return void this._leave(null,this);this._enter(null,this);}}dispose(){clearTimeout(this._timeout),P.off(this._element.closest(".modal"),"hide.bs.modal",this._hideModalHandler),this.tip&&this.tip.remove(),this._popper&&this._popper.destroy(),super.dispose();}show(){if("none"===this._element.style.display)throw new Error("Please use show on visible elements");if(!this.isWithContent()||!this._isEnabled)return;const t=P.trigger(this._element,this.constructor.Event.SHOW),e=c(this._element),i=null===e?this._element.ownerDocument.documentElement.contains(this._element):e.contains(this._element);if(t.defaultPrevented||!i)return;const n=this.getTipElement(),s=(t=>{do{t+=Math.floor(1e6*Math.random());}while(document.getElementById(t));return t})(this.constructor.NAME);n.setAttribute("id",s),this._element.setAttribute("aria-describedby",s),this._config.animation&&n.classList.add("fade");const o="function"==typeof this._config.placement?this._config.placement.call(this,n,this._element):this._config.placement,r=this._getAttachment(o);this._addAttachmentClass(r);const{container:a}=this._config;M.set(n,this.constructor.DATA_KEY,this),this._element.ownerDocument.documentElement.contains(this.tip)||(a.append(n),P.trigger(this._element,this.constructor.Event.INSERTED)),this._popper?this._popper.update():this._popper=fe(this._element,n,this._getPopperConfig(r)),n.classList.add("show");const l=this._resolvePossibleFunction(this._config.customClass);l&&n.classList.add(...l.split(" ")),"ontouchstart"in document.documentElement&&[].concat(...document.body.children).forEach(t=>{P.on(t,"mouseover",h);});const d=this.tip.classList.contains("fade");this._queueCallback(()=>{const t=this._hoverState;this._hoverState=null,P.trigger(this._element,this.constructor.Event.SHOWN),"out"===t&&this._leave(null,this);},this.tip,d);}hide(){if(!this._popper)return;const t=this.getTipElement();if(P.trigger(this._element,this.constructor.Event.HIDE).defaultPrevented)return;t.classList.remove("show"),"ontouchstart"in document.documentElement&&[].concat(...document.body.children).forEach(t=>P.off(t,"mouseover",h)),this._activeTrigger.click=!1,this._activeTrigger.focus=!1,this._activeTrigger.hover=!1;const e=this.tip.classList.contains("fade");this._queueCallback(()=>{this._isWithActiveTrigger()||("show"!==this._hoverState&&t.remove(),this._cleanTipClass(),this._element.removeAttribute("aria-describedby"),P.trigger(this._element,this.constructor.Event.HIDDEN),this._popper&&(this._popper.destroy(),this._popper=null));},this.tip,e),this._hoverState="";}update(){null!==this._popper&&this._popper.update();}isWithContent(){return Boolean(this.getTitle())}getTipElement(){if(this.tip)return this.tip;const t=document.createElement("div");t.innerHTML=this._config.template;const e=t.children[0];return this.setContent(e),e.classList.remove("fade","show"),this.tip=e,this.tip}setContent(t){this._sanitizeAndSetContent(t,this.getTitle(),".tooltip-inner");}_sanitizeAndSetContent(t,e,i){const n=U.findOne(i,t);e||!n?this.setElementContent(n,e):n.remove();}setElementContent(t,e){if(null!==t)return s(e)?(e=o(e),void(this._config.html?e.parentNode!==t&&(t.innerHTML="",t.append(e)):t.textContent=e.textContent)):void(this._config.html?(this._config.sanitize&&(e=qe(e,this._config.allowList,this._config.sanitizeFn)),t.innerHTML=e):t.textContent=e)}getTitle(){const t=this._element.getAttribute("data-bs-original-title")||this._config.title;return this._resolvePossibleFunction(t)}updateAttachment(t){return "right"===t?"end":"left"===t?"start":t}_initializeOnDelegatedTarget(t,e){return e||this.constructor.getOrCreateInstance(t.delegateTarget,this._getDelegateConfig())}_getOffset(){const{offset:t}=this._config;return "string"==typeof t?t.split(",").map(t=>Number.parseInt(t,10)):"function"==typeof t?e=>t(e,this._element):t}_resolvePossibleFunction(t){return "function"==typeof t?t.call(this._element):t}_getPopperConfig(t){const e={placement:t,modifiers:[{name:"flip",options:{fallbackPlacements:this._config.fallbackPlacements}},{name:"offset",options:{offset:this._getOffset()}},{name:"preventOverflow",options:{boundary:this._config.boundary}},{name:"arrow",options:{element:`.${this.constructor.NAME}-arrow`}},{name:"onChange",enabled:!0,phase:"afterWrite",fn:t=>this._handlePopperPlacementChange(t)}],onFirstUpdate:t=>{t.options.placement!==t.placement&&this._handlePopperPlacementChange(t);}};return {...e,..."function"==typeof this._config.popperConfig?this._config.popperConfig(e):this._config.popperConfig}}_addAttachmentClass(t){this.getTipElement().classList.add(`${this._getBasicClassPrefix()}-${this.updateAttachment(t)}`);}_getAttachment(t){return $e[t.toUpperCase()]}_setListeners(){this._config.trigger.split(" ").forEach(t=>{if("click"===t)P.on(this._element,this.constructor.Event.CLICK,this._config.selector,t=>this.toggle(t));else if("manual"!==t){const e="hover"===t?this.constructor.Event.MOUSEENTER:this.constructor.Event.FOCUSIN,i="hover"===t?this.constructor.Event.MOUSELEAVE:this.constructor.Event.FOCUSOUT;P.on(this._element,e,this._config.selector,t=>this._enter(t)),P.on(this._element,i,this._config.selector,t=>this._leave(t));}}),this._hideModalHandler=()=>{this._element&&this.hide();},P.on(this._element.closest(".modal"),"hide.bs.modal",this._hideModalHandler),this._config.selector?this._config={...this._config,trigger:"manual",selector:""}:this._fixTitle();}_fixTitle(){const t=this._element.getAttribute("title"),e=typeof this._element.getAttribute("data-bs-original-title");(t||"string"!==e)&&(this._element.setAttribute("data-bs-original-title",t||""),!t||this._element.getAttribute("aria-label")||this._element.textContent||this._element.setAttribute("aria-label",t),this._element.setAttribute("title",""));}_enter(t,e){e=this._initializeOnDelegatedTarget(t,e),t&&(e._activeTrigger["focusin"===t.type?"focus":"hover"]=!0),e.getTipElement().classList.contains("show")||"show"===e._hoverState?e._hoverState="show":(clearTimeout(e._timeout),e._hoverState="show",e._config.delay&&e._config.delay.show?e._timeout=setTimeout(()=>{"show"===e._hoverState&&e.show();},e._config.delay.show):e.show());}_leave(t,e){e=this._initializeOnDelegatedTarget(t,e),t&&(e._activeTrigger["focusout"===t.type?"focus":"hover"]=e._element.contains(t.relatedTarget)),e._isWithActiveTrigger()||(clearTimeout(e._timeout),e._hoverState="out",e._config.delay&&e._config.delay.hide?e._timeout=setTimeout(()=>{"out"===e._hoverState&&e.hide();},e._config.delay.hide):e.hide());}_isWithActiveTrigger(){for(const t in this._activeTrigger)if(this._activeTrigger[t])return !0;return !1}_getConfig(t){const e=F.getDataAttributes(this._element);return Object.keys(e).forEach(t=>{Fe.has(t)&&delete e[t];}),(t={...this.constructor.Default,...e,..."object"==typeof t&&t?t:{}}).container=!1===t.container?document.body:o(t.container),"number"==typeof t.delay&&(t.delay={show:t.delay,hide:t.delay}),"number"==typeof t.title&&(t.title=t.title.toString()),"number"==typeof t.content&&(t.content=t.content.toString()),r("tooltip",t,this.constructor.DefaultType),t.sanitize&&(t.template=qe(t.template,t.allowList,t.sanitizeFn)),t}_getDelegateConfig(){const t={};for(const e in this._config)this.constructor.Default[e]!==this._config[e]&&(t[e]=this._config[e]);return t}_cleanTipClass(){const t=this.getTipElement(),e=new RegExp(`(^|\\s)${this._getBasicClassPrefix()}\\S+`,"g"),i=t.getAttribute("class").match(e);null!==i&&i.length>0&&i.map(t=>t.trim()).forEach(e=>t.classList.remove(e));}_getBasicClassPrefix(){return "bs-tooltip"}_handlePopperPlacementChange(t){const{state:e}=t;e&&(this.tip=e.elements.popper,this._cleanTipClass(),this._addAttachmentClass(this._getAttachment(e.placement)));}static jQueryInterface(t){return this.each((function(){const e=Xe.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]();}}))}}m(Xe);const Ye={...Xe.Default,placement:"right",offset:[0,8],trigger:"click",content:"",template:'<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'},Qe={...Xe.DefaultType,content:"(string|element|function)"},Ge={HIDE:"hide.bs.popover",HIDDEN:"hidden.bs.popover",SHOW:"show.bs.popover",SHOWN:"shown.bs.popover",INSERTED:"inserted.bs.popover",CLICK:"click.bs.popover",FOCUSIN:"focusin.bs.popover",FOCUSOUT:"focusout.bs.popover",MOUSEENTER:"mouseenter.bs.popover",MOUSELEAVE:"mouseleave.bs.popover"};class Ze extends Xe{static get Default(){return Ye}static get NAME(){return "popover"}static get Event(){return Ge}static get DefaultType(){return Qe}isWithContent(){return this.getTitle()||this._getContent()}setContent(t){this._sanitizeAndSetContent(t,this.getTitle(),".popover-header"),this._sanitizeAndSetContent(t,this._getContent(),".popover-body");}_getContent(){return this._resolvePossibleFunction(this._config.content)}_getBasicClassPrefix(){return "bs-popover"}static jQueryInterface(t){return this.each((function(){const e=Ze.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]();}}))}}m(Ze);const Je={offset:10,method:"auto",target:""},ti={offset:"number",method:"string",target:"(string|element)"},ei=".nav-link, .list-group-item, .dropdown-item";class ii extends H{constructor(t,e){super(t),this._scrollElement="BODY"===this._element.tagName?window:this._element,this._config=this._getConfig(e),this._offsets=[],this._targets=[],this._activeTarget=null,this._scrollHeight=0,P.on(this._scrollElement,"scroll.bs.scrollspy",()=>this._process()),this.refresh(),this._process();}static get Default(){return Je}static get NAME(){return "scrollspy"}refresh(){const t=this._scrollElement===this._scrollElement.window?"offset":"position",i="auto"===this._config.method?t:this._config.method,n="position"===i?this._getScrollTop():0;this._offsets=[],this._targets=[],this._scrollHeight=this._getScrollHeight(),U.find(ei,this._config.target).map(t=>{const s=e(t),o=s?U.findOne(s):null;if(o){const t=o.getBoundingClientRect();if(t.width||t.height)return [F[i](o).top+n,s]}return null}).filter(t=>t).sort((t,e)=>t[0]-e[0]).forEach(t=>{this._offsets.push(t[0]),this._targets.push(t[1]);});}dispose(){P.off(this._scrollElement,".bs.scrollspy"),super.dispose();}_getConfig(t){return (t={...Je,...F.getDataAttributes(this._element),..."object"==typeof t&&t?t:{}}).target=o(t.target)||document.documentElement,r("scrollspy",t,ti),t}_getScrollTop(){return this._scrollElement===window?this._scrollElement.pageYOffset:this._scrollElement.scrollTop}_getScrollHeight(){return this._scrollElement.scrollHeight||Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)}_getOffsetHeight(){return this._scrollElement===window?window.innerHeight:this._scrollElement.getBoundingClientRect().height}_process(){const t=this._getScrollTop()+this._config.offset,e=this._getScrollHeight(),i=this._config.offset+e-this._getOffsetHeight();if(this._scrollHeight!==e&&this.refresh(),t>=i){const t=this._targets[this._targets.length-1];this._activeTarget!==t&&this._activate(t);}else {if(this._activeTarget&&t<this._offsets[0]&&this._offsets[0]>0)return this._activeTarget=null,void this._clear();for(let e=this._offsets.length;e--;)this._activeTarget!==this._targets[e]&&t>=this._offsets[e]&&(void 0===this._offsets[e+1]||t<this._offsets[e+1])&&this._activate(this._targets[e]);}}_activate(t){this._activeTarget=t,this._clear();const e=ei.split(",").map(e=>`${e}[data-bs-target="${t}"],${e}[href="${t}"]`),i=U.findOne(e.join(","),this._config.target);i.classList.add("active"),i.classList.contains("dropdown-item")?U.findOne(".dropdown-toggle",i.closest(".dropdown")).classList.add("active"):U.parents(i,".nav, .list-group").forEach(t=>{U.prev(t,".nav-link, .list-group-item").forEach(t=>t.classList.add("active")),U.prev(t,".nav-item").forEach(t=>{U.children(t,".nav-link").forEach(t=>t.classList.add("active"));});}),P.trigger(this._scrollElement,"activate.bs.scrollspy",{relatedTarget:t});}_clear(){U.find(ei,this._config.target).filter(t=>t.classList.contains("active")).forEach(t=>t.classList.remove("active"));}static jQueryInterface(t){return this.each((function(){const e=ii.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]();}}))}}P.on(window,"load.bs.scrollspy.data-api",()=>{U.find('[data-bs-spy="scroll"]').forEach(t=>new ii(t));}),m(ii);class ni extends H{static get NAME(){return "tab"}show(){if(this._element.parentNode&&this._element.parentNode.nodeType===Node.ELEMENT_NODE&&this._element.classList.contains("active"))return;let t;const e=i(this._element),n=this._element.closest(".nav, .list-group");if(n){const e="UL"===n.nodeName||"OL"===n.nodeName?":scope > li > .active":".active";t=U.find(e,n),t=t[t.length-1];}const s=t?P.trigger(t,"hide.bs.tab",{relatedTarget:this._element}):null;if(P.trigger(this._element,"show.bs.tab",{relatedTarget:t}).defaultPrevented||null!==s&&s.defaultPrevented)return;this._activate(this._element,n);const o=()=>{P.trigger(t,"hidden.bs.tab",{relatedTarget:this._element}),P.trigger(this._element,"shown.bs.tab",{relatedTarget:t});};e?this._activate(e,e.parentNode,o):o();}_activate(t,e,i){const n=(!e||"UL"!==e.nodeName&&"OL"!==e.nodeName?U.children(e,".active"):U.find(":scope > li > .active",e))[0],s=i&&n&&n.classList.contains("fade"),o=()=>this._transitionComplete(t,n,i);n&&s?(n.classList.remove("show"),this._queueCallback(o,t,!0)):o();}_transitionComplete(t,e,i){if(e){e.classList.remove("active");const t=U.findOne(":scope > .dropdown-menu .active",e.parentNode);t&&t.classList.remove("active"),"tab"===e.getAttribute("role")&&e.setAttribute("aria-selected",!1);}t.classList.add("active"),"tab"===t.getAttribute("role")&&t.setAttribute("aria-selected",!0),d(t),t.classList.contains("fade")&&t.classList.add("show");let n=t.parentNode;if(n&&"LI"===n.nodeName&&(n=n.parentNode),n&&n.classList.contains("dropdown-menu")){const e=t.closest(".dropdown");e&&U.find(".dropdown-toggle",e).forEach(t=>t.classList.add("active")),t.setAttribute("aria-expanded",!0);}i&&i();}static jQueryInterface(t){return this.each((function(){const e=ni.getOrCreateInstance(this);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t]();}}))}}P.on(document,"click.bs.tab.data-api",'[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]',(function(t){["A","AREA"].includes(this.tagName)&&t.preventDefault(),l(this)||ni.getOrCreateInstance(this).show();})),m(ni);const si={animation:"boolean",autohide:"boolean",delay:"number"},oi={animation:!0,autohide:!0,delay:5e3};class ri extends H{constructor(t,e){super(t),this._config=this._getConfig(e),this._timeout=null,this._hasMouseInteraction=!1,this._hasKeyboardInteraction=!1,this._setListeners();}static get DefaultType(){return si}static get Default(){return oi}static get NAME(){return "toast"}show(){P.trigger(this._element,"show.bs.toast").defaultPrevented||(this._clearTimeout(),this._config.animation&&this._element.classList.add("fade"),this._element.classList.remove("hide"),d(this._element),this._element.classList.add("show"),this._element.classList.add("showing"),this._queueCallback(()=>{this._element.classList.remove("showing"),P.trigger(this._element,"shown.bs.toast"),this._maybeScheduleHide();},this._element,this._config.animation));}hide(){this._element.classList.contains("show")&&(P.trigger(this._element,"hide.bs.toast").defaultPrevented||(this._element.classList.add("showing"),this._queueCallback(()=>{this._element.classList.add("hide"),this._element.classList.remove("showing"),this._element.classList.remove("show"),P.trigger(this._element,"hidden.bs.toast");},this._element,this._config.animation)));}dispose(){this._clearTimeout(),this._element.classList.contains("show")&&this._element.classList.remove("show"),super.dispose();}_getConfig(t){return t={...oi,...F.getDataAttributes(this._element),..."object"==typeof t&&t?t:{}},r("toast",t,this.constructor.DefaultType),t}_maybeScheduleHide(){this._config.autohide&&(this._hasMouseInteraction||this._hasKeyboardInteraction||(this._timeout=setTimeout(()=>{this.hide();},this._config.delay)));}_onInteraction(t,e){switch(t.type){case"mouseover":case"mouseout":this._hasMouseInteraction=e;break;case"focusin":case"focusout":this._hasKeyboardInteraction=e;}if(e)return void this._clearTimeout();const i=t.relatedTarget;this._element===i||this._element.contains(i)||this._maybeScheduleHide();}_setListeners(){P.on(this._element,"mouseover.bs.toast",t=>this._onInteraction(t,!0)),P.on(this._element,"mouseout.bs.toast",t=>this._onInteraction(t,!1)),P.on(this._element,"focusin.bs.toast",t=>this._onInteraction(t,!0)),P.on(this._element,"focusout.bs.toast",t=>this._onInteraction(t,!1));}_clearTimeout(){clearTimeout(this._timeout),this._timeout=null;}static jQueryInterface(t){return this.each((function(){const e=ri.getOrCreateInstance(this,t);if("string"==typeof t){if(void 0===e[t])throw new TypeError(`No method named "${t}"`);e[t](this);}}))}}return B(ri),m(ri),{Alert:R,Button:W,Carousel:Z,Collapse:et,Dropdown:Te,Modal:Pe,Offcanvas:He,Popover:Ze,ScrollSpy:ii,Tab:ni,Toast:ri,Tooltip:Xe}}));

  }(bootstrap_bundle_min));

  createApp(script).mount("#app");

}());
//# sourceMappingURL=index.js.map
