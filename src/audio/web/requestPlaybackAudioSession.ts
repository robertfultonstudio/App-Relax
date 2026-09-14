/** WebKit otherwise treats Web Audio as ambient (silenced by the ringer
 * switch). Request media playback only on the user's Play gesture; this never
 * requests microphone access or substitutes for AudioContext.resume().
 * https://bugs.webkit.org/show_bug.cgi?id=237322#c6
 */
export function requestPlaybackAudioSession(): void {
  if (typeof navigator === "undefined") return;
  try {
    const session = (
      navigator as Navigator & { audioSession?: { type: string } }
    ).audioSession;
    if (session && session.type !== "playback") session.type = "playback";
  } catch {
    // Optional API: unsupported/read-only implementations must retain Play.
  }
}
