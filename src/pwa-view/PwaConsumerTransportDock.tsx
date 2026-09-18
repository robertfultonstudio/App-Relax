import {
  PlaybackTransport,
  type PlaybackTransportProps,
} from "@/components/PlaybackTransport";

export function PwaConsumerTransportDock(props: PlaybackTransportProps) {
  return <PlaybackTransport fixedFooter {...props} />;
}
