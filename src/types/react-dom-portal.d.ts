declare module "react-dom" {
  /** The PWA uses only the stable createPortal API, not a second React root. */
  export function createPortal(
    children: import("react").ReactNode,
    container: Element | DocumentFragment,
    key?: string | null,
  ): import("react").ReactPortal;
}
