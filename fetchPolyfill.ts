/**
 * Guard against environments where `window.fetch` is defined with only a getter.
 * Libraries such as formdata-polyfill, gaxios, or test harnesses attempt to set
 * `global.fetch = ...`, which throws:
 * "TypeError: Cannot set property fetch of #<Window> which has only a getter"
 * This polyfill redefines `fetch` on `window` (and `Window.prototype` if needed)
 * to provide a setter alongside the getter, preventing the runtime TypeError.
 */
(function setupFetchGetterSetter() {
  if (typeof window === 'undefined') return;

  function makePropertySettable(target: any, prop: string) {
    if (!target) return;
    try {
      let currentVal = target[prop];
      Object.defineProperty(target, prop, {
        get() {
          return currentVal;
        },
        set(newVal) {
          currentVal = newVal;
        },
        configurable: true,
        enumerable: true,
      });
    } catch (e) {
      // If direct definition on target fails, attempt on prototype
      try {
        const proto = Object.getPrototypeOf(target);
        if (proto) {
          let protoVal = proto[prop];
          Object.defineProperty(proto, prop, {
            get() {
              return protoVal;
            },
            set(newVal) {
              protoVal = newVal;
            },
            configurable: true,
            enumerable: true,
          });
        }
      } catch (_) {}
    }
  }

  // Ensure window.fetch has both getter and setter
  makePropertySettable(window, 'fetch');

  if (typeof Window !== 'undefined' && Window.prototype) {
    makePropertySettable(Window.prototype, 'fetch');
  }

  // Also ensure FormData.prototype.keys exists so formdata-polyfill doesn't attempt monkey-patching
  try {
    if (typeof FormData !== 'undefined' && !FormData.prototype.keys) {
      (FormData.prototype as any).keys = function* () {
        for (const entry of (this as any).entries()) {
          yield entry[0];
        }
      };
    }
  } catch (_) {}
})();
