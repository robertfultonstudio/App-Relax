import { Redirect } from "expo-router";

/** The private review PWA opens on the consumer Home. The discarded
 * promotional landing must never become a gate before time-to-sound. */
export default function PwaEntry() {
  return <Redirect href="/moments" />;
}
