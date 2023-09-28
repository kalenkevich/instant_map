export const isChrome = () => userAgentContains('chrome');
export const isSafari = () => !isChrome && userAgentContains('safari');
export const isMobile = () => typeof orientation !== 'undefined' || userAgentContains('mobile');
export const isMac = () => window.navigator && window.navigator.platform.startsWith('Mac');
export const isLinux = () => window.navigator && window.navigator.platform.startsWith('Linux');

// @property pointer: Boolean
// `true` for all browsers supporting [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
export const isPointer = () => !!window.PointerEvent;

// @property touchNative: Boolean
// `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
// **This does not necessarily mean** that the browser is running in a computer with
// a touchscreen, it only means that the browser is capable of understanding
// touch events.
export const isTouchNative = () => 'ontouchstart' in window || !!window.TouchEvent;

// @property touch: Boolean
// `true` for all browsers supporting either [touch](#browser-touch) or [pointer](#browser-pointer) events.
// Note: pointer events will be preferred (if available), and processed for all `touch*` listeners.
export const touch = () => isTouchNative || isPointer;

// @property retina: Boolean
// `true` for browsers on a high-resolution "retina" screen or on any screen when browser's display zoom is more than 100%.
//@ts-ignore
export const isRetina = () => (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1;

function userAgentContains(str: string): boolean {
  return !!window.navigator && window.navigator.userAgent.toLowerCase().includes(str);
}
