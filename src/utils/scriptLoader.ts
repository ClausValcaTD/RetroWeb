/**
 * Utility to dynamically load script tags sequentially and avoid duplicates.
 */
const loadedScripts = new Set<string>();

export function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) {
    return Promise.resolve();
  }

  // Check if script tag already exists in DOM
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    loadedScripts.add(src);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };

    script.onerror = (err) => {
      reject(new Error(`Failed to load script: ${src} (${err})`));
    };

    document.head.appendChild(script);
  });
}

export async function ensureBrowserFS(): Promise<any> {
  if (window.BrowserFS) {
    return window.BrowserFS;
  }
  await loadScript('/emulator/browserfs.min.js');
  if (!window.BrowserFS) {
    throw new Error('BrowserFS failed to attach to window');
  }
  return window.BrowserFS;
}
