// Run against a Chrome CDP port, including an adb-forwarded Android Chrome.
import assert from 'node:assert/strict';
import { once } from 'node:events';

const endpoint = process.env.CDP_URL || 'http://127.0.0.1:9227';
const appUrl = process.env.APP_URL || 'http://localhost:5173/';
const pages = await (await fetch(`${endpoint}/json/list`)).json();
const page = pages.find(page => page.type === 'page' && page.url === appUrl);
assert.ok(page, `Open ${appUrl} in the connected Chrome first`);
const socket = new WebSocket(page.webSocketDebuggerUrl);
await once(socket, 'open');
let sequence = 0;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  pending.get(message.id)?.(message);
});
async function evaluate(fn) {
  const id = ++sequence;
  const response = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error('CDP timed out')); }, 15000);
    pending.set(id, message => { clearTimeout(timeout); pending.delete(id); resolve(message); });
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: {
      expression: `(${fn.toString()})()`, awaitPromise: true, returnByValue: true, userGesture: true,
    } }));
  });
  assert.ok(!response.error && !response.result.exceptionDetails, JSON.stringify(response));
  return response.result.result.value;
}
try {
  const result = await evaluate(async () => {
    const viewport = document.querySelector('#viewport');
    const button = document.querySelector('#fullscreen');
    const wait = async condition => {
      const deadline = performance.now() + 5000;
      while (!condition()) {
        if (performance.now() > deadline) throw new Error('Fullscreen state did not settle');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };
    if (document.fullscreenElement || viewport.classList.contains('expanded')) throw new Error('Exit fullscreen before testing');
    if (!document.fullscreenEnabled) throw new Error('Native fullscreen support is required for this check');
    button.click();
    await wait(() => document.fullscreenElement === viewport && viewport.classList.contains('expanded'));
    const scene = document.querySelector('#scene').getBoundingClientRect();
    if (Math.abs(scene.width - innerWidth) > 1 || Math.abs(scene.height - innerHeight) > 1) throw new Error('Canvas does not fill the viewport');
    if (getComputedStyle(document.querySelector('.camera-preview')).display !== 'none') throw new Error('Tracking overlay leaked into fullscreen');
    button.click();
    await wait(() => !document.fullscreenElement && !viewport.classList.contains('expanded'));
    // Exercise the iPhone/non-supporting-browser path on the same real device.
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
    try {
      button.click();
      if (!viewport.classList.contains('expanded') || document.fullscreenElement) throw new Error('Fallback did not expand');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      if (viewport.classList.contains('expanded')) throw new Error('Escape did not leave fallback');
      button.click();
      button.click();
      if (viewport.classList.contains('expanded') || button.getAttribute('aria-pressed') !== 'false') throw new Error('Fallback button did not restore');
    } finally { delete document.fullscreenEnabled; }
    return { secure: isSecureContext, native: true, fallback: true, restored: button.getAttribute('aria-pressed') === 'false' };
  });
  assert.ok(result.secure && result.native && result.fallback && result.restored);
  console.log('Fullscreen checks passed:', result);
} finally { socket.close(); }
