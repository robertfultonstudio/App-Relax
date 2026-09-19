export type ReviewTransport = {
  canPlay: boolean;
  canStop: boolean;
  playing: boolean;
  busy: boolean;
  status: string;
  onPlayPause: () => void;
  onStop: () => void | Promise<void>;
};
