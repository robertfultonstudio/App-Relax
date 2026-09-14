import { Directory, File, FileMode, Paths } from "expo-file-system";
import type {
  PrivateCatalogPort,
  PrivateFileStamp,
} from "./NativeCatalogStore";

/** Android SAF is used only to copy. Playback never depends on its permission. */
export class ExpoPrivateCatalogPort implements PrivateCatalogPort {
  private readonly directory = new Directory(
    Paths.document,
    "app-relax-audio-v1",
  );
  private file(key: string) {
    if (!/^[a-f0-9]{64}\.(flac|wav)(\.part|\.json)?$/.test(key))
      throw new Error("Invalid private audio key.");
    return new File(this.directory, key);
  }
  async initialize() {
    this.directory.create({ intermediates: true, idempotent: true });
  }
  async stat(key: string) {
    const f = this.file(key);
    return f.exists ? { bytes: f.size, modified: f.lastModified ?? NaN } : null;
  }
  async receipt(key: string): Promise<PrivateFileStamp | null> {
    const f = this.file(key + ".json");
    try {
      if (!f.exists || f.size > 512) return null;
      const data = JSON.parse(await f.text()) as PrivateFileStamp;
      return typeof data.bytes === "number" && typeof data.modified === "number"
        ? data
        : null;
    } catch {
      return null;
    }
  }
  async saveReceipt(key: string, stamp: PrivateFileStamp) {
    const f = this.file(key + ".json");
    f.write(JSON.stringify(stamp)); // A torn receipt fails closed and triggers reimport.
  }
  freeBytes() {
    return Paths.availableDiskSpace;
  }
  async copy(uri: string, key: string) {
    if (!/^(content|file):\/\//.test(uri))
      throw new Error("Choose a local audio folder.");
    const source = new File(uri),
      target = this.file(key);
    await source.copy(target, { overwrite: false });
    // Keep both shared objects alive across the asynchronous native operation.
    if (!source.uri || !target.exists) throw new Error("Audio copy failed.");
  }
  async read(key: string, offset: number, bytes: number) {
    const file = this.file(key),
      handle = file.open(FileMode.ReadOnly);
    try {
      handle.offset = offset;
      return handle.readBytes(bytes);
    } finally {
      handle.close();
    }
  }
  async move(from: string, to: string) {
    const source = this.file(from),
      target = this.file(to);
    await source.move(target, { overwrite: false });
    if (!source.uri || !target.exists)
      throw new Error("Audio promotion failed.");
  }
  async remove(key: string) {
    const f = this.file(key);
    if (f.exists) f.delete();
  }
  uri(key: string) {
    return this.file(key).uri;
  }
  yield() {
    return new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}
