/** Consumer recovery copy. Raw diagnostics stay available to the review panel. */
export function consumerPlaybackError(error: string): string {
  if (
    error === "This session is unavailable. Choose another duration or sound."
  )
    return error;
  if (/No compatible session is available/.test(error))
    return "No compatible session is available at this duration. Choose another duration or sound.";
  if (/network|fetch|connection|offline|timeout|timed out/i.test(error))
    return "The sound could not load. Check your connection, then retry.";
  if (/revision|hash|integrity|etag|sha|changed/i.test(error))
    return "This saved sound needs an update. Reconnect and retry loading.";
  if (/decode|pcm|flac|buffer|audio|sound/i.test(error))
    return "This sound could not play. Retry loading, or choose another activity.";
  return "This session could not be prepared. Retry, or choose another activity.";
}
