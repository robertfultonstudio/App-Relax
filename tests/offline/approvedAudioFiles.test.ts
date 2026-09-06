import published from "@/content/approvedAudioFiles.json";
import source from "../../docs/M4_LOCAL_LISTENING_MANIFEST.json";

it("keeps packaged download metadata exactly aligned without importing excluded docs at runtime", () => {
  expect(published.files).toEqual(
    source.files.map(({ filename, bytes, sha256 }) => ({
      filename,
      bytes,
      sha256,
    })),
  );
  expect(published.files).toHaveLength(37);
  expect(JSON.stringify(published)).not.toMatch(
    /\/Users\/|https?:\/\/|token|Eclypsis|Nirvana/i,
  );
});
