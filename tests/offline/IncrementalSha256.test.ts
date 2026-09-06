import { createHash, randomBytes } from "node:crypto";
import { IncrementalSha256 } from "@/offline/IncrementalSha256";

describe("incremental SHA-256", () => {
  it.each([
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    [
      "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    ],
  ])("matches standard vectors %s", (input, expected) => {
    const hash = new IncrementalSha256();
    for (const byte of Buffer.from(input)) hash.update(Uint8Array.of(byte));
    expect(hash.digestHex()).toBe(expected);
    expect(() => hash.digestHex()).toThrow();
    expect(() => hash.update(new Uint8Array())).toThrow();
  });

  it("matches the million-a NIST vector with bounded chunks", () => {
    const hash = new IncrementalSha256();
    const block = new Uint8Array(1000).fill(97);
    for (let i = 0; i < 1000; i++) hash.update(block);
    expect(hash.digestHex()).toBe(
      "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0",
    );
  });

  it.each([1, 55, 56, 63, 64, 65, 127, 128, 129, 262145])(
    "matches node crypto at block boundary %i",
    (length) => {
      const input = randomBytes(length),
        hash = new IncrementalSha256();
      for (let offset = 0; offset < length; offset += 37)
        hash.update(input.subarray(offset, offset + 37));
      expect(hash.digestHex()).toBe(
        createHash("sha256").update(input).digest("hex"),
      );
    },
  );
});
