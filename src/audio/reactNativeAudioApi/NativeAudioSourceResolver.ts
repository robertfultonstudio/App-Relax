/** A lease over bytes verified by the storage adapter immediately before acquire.
 * The adapter must match SHA-256/size against its trusted manifest and prevent
 * deletion/replacement until release. A filename or availability flag is not proof.
 */
export interface VerifiedNativeAudioFile {
  readonly uri: string;
  readonly workId: string;
  readonly sha256: string;
  readonly byteSize: number;
  release(): Promise<void> | void;
}

export interface NativeAudioSourceResolver {
  acquire(workId: string): Promise<VerifiedNativeAudioFile | null>;
}

export function assertVerifiedNativeAudioFile(
  file: VerifiedNativeAudioFile,
  workId: string,
): void {
  if (
    file.workId !== workId ||
    !/^file:\/\/\/(?!\/)/.test(file.uri) ||
    /[?#\u0000]/.test(file.uri) ||
    !/^[a-f0-9]{64}$/i.test(file.sha256) ||
    !Number.isSafeInteger(file.byteSize) ||
    file.byteSize <= 0 ||
    typeof file.release !== "function"
  ) {
    throw new Error(`No verified local file lease for ${workId}.`);
  }
}
