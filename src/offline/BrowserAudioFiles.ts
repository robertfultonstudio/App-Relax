import type { AudioStagingSink } from "@/domain/offline/types";

export interface AudioFilePort {
  open(name: string): Promise<AudioStagingSink>;
  read(name: string): Promise<Blob | null>;
  remove(name: string): Promise<void>;
  list(): Promise<string[]>;
  freeBytes(): Promise<number>;
  lease(name: string): Promise<() => void>;
  removeIfUnused(name: string): Promise<boolean>;
}

export class BrowserAudioFiles implements AudioFilePort {
  private worker: Worker | null = null;
  private sequence = 0;
  private readonly pending = new Map<
    number,
    {
      resolve(): void;
      reject(error: Error): void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  async open(name: string): Promise<AudioStagingSink> {
    await this.rpc("open", name);
    return {
      write: (chunk) => this.rpc("write", name, chunk),
      close: () => this.rpc("close", name),
      abort: () => this.rpc("abort", name),
    };
  }

  async read(name: string): Promise<Blob | null> {
    try {
      return await (
        await (await this.directory()).getFileHandle(name)
      ).getFile();
    } catch (error) {
      if (error instanceof Error && error.name === "NotFoundError") return null;
      throw error;
    }
  }

  async remove(name: string) {
    try {
      await (await this.directory()).removeEntry(name);
    } catch (error) {
      if (!(error instanceof Error && error.name === "NotFoundError"))
        throw error;
    }
  }

  async list(): Promise<string[]> {
    const dir = await this.directory();
    const names: string[] = [];
    // DOM lib omits iterable handles on some TypeScript/Expo combinations.
    const iterable = dir as FileSystemDirectoryHandle & {
      keys(): AsyncIterableIterator<string>;
    };
    for await (const name of iterable.keys())
      if (/^[a-f0-9-]+\.audio$/.test(name)) names.push(name);
    return names;
  }

  async freeBytes() {
    const estimate = await navigator.storage.estimate();
    if (
      typeof estimate.quota !== "number" ||
      typeof estimate.usage !== "number"
    )
      throw new Error("Available browser storage cannot be estimated.");
    return Math.max(0, estimate.quota - estimate.usage);
  }

  async lease(name: string): Promise<() => void> {
    if (!navigator.locks)
      throw new Error("Safe offline playback requires browser file locks.");
    return new Promise((resolve, reject) => {
      void navigator.locks
        .request(
          `app-relax-audio:${name}`,
          { mode: "shared" },
          () => new Promise<void>((release) => resolve(release)),
        )
        .catch(reject);
    });
  }

  async removeIfUnused(name: string): Promise<boolean> {
    if (!navigator.locks)
      throw new Error("Safe removal requires browser file locks.");
    return navigator.locks.request(
      `app-relax-audio:${name}`,
      { ifAvailable: true },
      async (lock) => {
        if (!lock) return false;
        await this.remove(name);
        return true;
      },
    );
  }

  private async directory() {
    return (await navigator.storage.getDirectory()).getDirectoryHandle(
      "app-relax-audio-v1",
      { create: true },
    );
  }

  private rpc(
    operation: string,
    name: string,
    chunk?: Uint8Array,
  ): Promise<void> {
    if (!this.worker) {
      this.worker = new Worker("/offline-file-worker.js");
      this.worker.onmessage = ({
        data,
      }: MessageEvent<{
        id: number;
        ok: boolean;
        error?: string;
        name?: string;
      }>) => {
        const pending = this.pending.get(data.id);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pending.delete(data.id);
        if (data.ok) pending.resolve();
        else {
          const error = new Error(data.error ?? "Offline file write failed.");
          error.name = data.name ?? "Error";
          pending.reject(error);
        }
      };
      this.worker.onerror = () =>
        this.failWorker(
          new Error("Offline storage worker failed. Retry the download."),
        );
    }
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          this.failWorker(
            new Error("Offline storage timed out. Retry the download."),
          ),
        30_000,
      );
      this.pending.set(id, { resolve, reject, timer });
      // A bounded copy avoids detaching a fetch-owned buffer and waits for ACK.
      const copy = chunk?.slice();
      this.worker!.postMessage(
        { id, operation, name, chunk: copy },
        copy ? [copy.buffer] : [],
      );
    });
  }

  private failWorker(error: Error) {
    this.worker?.terminate();
    this.worker = null;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}
