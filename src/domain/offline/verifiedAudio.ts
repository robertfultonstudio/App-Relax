export interface VerifiedAudioFile {
  uri: string;
  workId: string;
  sha256: string;
  byteSize: number;
  release(): Promise<void> | void;
}

/** Null means no verified local asset. Callers must release every acquired lease. */
export interface VerifiedAudioFileResolver {
  acquire(workId: string): Promise<VerifiedAudioFile | null>;
}
