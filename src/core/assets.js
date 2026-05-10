export function fileLabel(path) {
  const fileName = decodeURIComponent(String(path).split("/").pop() || path);
  return fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ");
}

export function emptyJarramplasFrames() {
  return { down: [], left: [], right: [], up: [] };
}

export function createImageFrameLoader({ onProgress } = {}) {
  return function loadImageFrame(path, label = null) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        onProgress?.(path);
        resolve({
          img,
          w: img.naturalWidth,
          h: img.naturalHeight,
          path,
          name: label || fileLabel(path),
        });
      };
      img.onerror = () => {
        onProgress?.(path);
        reject(new Error(`No se pudo cargar ${path}`));
      };
      img.src = path;
    });
  };
}

export function loadImageFrames(paths, loadImageFrame) {
  return Promise.all(paths.map(loadImageFrame));
}

export async function loadOptionalImage(path, loadImageFrame, label = null) {
  try {
    return await loadImageFrame(path, label);
  } catch {
    return null;
  }
}

export async function loadJarramplasFrameSet(framePaths, loadImageFrame) {
  if (Array.isArray(framePaths)) {
    const frames = await loadImageFrames(framePaths, loadImageFrame);
    return { down: frames, left: frames, right: frames, up: frames };
  }
  const loaded = await Promise.all(Object.entries(framePaths).map(async ([direction, paths]) => [
    direction,
    await loadImageFrames(paths, loadImageFrame),
  ]));
  return { ...emptyJarramplasFrames(), ...Object.fromEntries(loaded) };
}
