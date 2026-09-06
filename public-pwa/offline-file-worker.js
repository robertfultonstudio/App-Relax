/* Dedicated OPFS writer: one acknowledged chunk at a time, no whole-file buffer. */
const handles = new Map();
const directory = () =>
  navigator.storage
    .getDirectory()
    .then((root) =>
      root.getDirectoryHandle("app-relax-audio-v1", { create: true }),
    );
let queue = Promise.resolve();
self.addEventListener("message", ({ data }) => {
  queue = queue.then(async () => {
    const { id, operation, name, chunk } = data;
    try {
      if (!/^[a-f0-9-]+\.audio$/.test(name))
        throw new Error("Invalid private audio filename.");
      const dir = await directory();
      if (operation === "open") {
        if (handles.has(name))
          throw new Error("Audio staging file is already open.");
        const file = await dir.getFileHandle(name, { create: true });
        const handle = await file.createSyncAccessHandle();
        handle.truncate(0);
        handles.set(name, { handle, offset: 0 });
      } else if (operation === "write") {
        const state = handles.get(name);
        if (
          !state ||
          !(chunk instanceof Uint8Array) ||
          chunk.byteLength > 256 * 1024
        )
          throw new Error("Invalid staging chunk.");
        const written = state.handle.write(chunk, { at: state.offset });
        if (written !== chunk.byteLength)
          throw new Error("Incomplete staging write.");
        state.offset += written;
      } else if (operation === "close" || operation === "abort") {
        const state = handles.get(name);
        if (state) {
          try {
            if (operation === "close") state.handle.flush();
          } finally {
            state.handle.close();
            handles.delete(name);
          }
        }
        if (operation === "abort")
          await dir.removeEntry(name).catch((error) => {
            if (error.name !== "NotFoundError") throw error;
          });
      } else throw new Error("Unknown staging operation.");
      self.postMessage({ id, ok: true });
    } catch (error) {
      self.postMessage({
        id,
        ok: false,
        error: error.message,
        name: error.name,
      });
    }
  });
});
