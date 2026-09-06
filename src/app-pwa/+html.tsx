import type { ReactNode } from "react";
import { REVIEW_REVISION } from "@/content/reviewRevision";
import {
  ScrollViewStyleReset,
  useServerDocumentContext,
} from "expo-router/html";

const SERVICE_WORKER_REGISTRATION = `
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(function (error) {
      console.warn("App Relax service worker registration failed.", error);
    });
  });
}
`;

export default function PwaDocument({ children }: { children: ReactNode }) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } =
    useServerDocumentContext();

  return (
    <html {...htmlAttributes} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          content="width=device-width, initial-scale=1, viewport-fit=cover"
          name="viewport"
        />
        <meta content="#f3e9d8" name="theme-color" />
        <meta content={REVIEW_REVISION} name="app-relax-review" />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="default" name="apple-mobile-web-app-status-bar-style" />
        <meta content="App Relax" name="apple-mobile-web-app-title" />
        <meta
          content="Music and nature for meditation, yoga, massage, relaxation, sleep and focus."
          name="description"
        />
        <link href="/manifest.webmanifest" rel="manifest" />
        <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
        <ScrollViewStyleReset />
        <style>
          {
            '[role="button"]:focus-visible,[role="radio"]:focus-visible,[role="tab"]:focus-visible,a:focus-visible{outline:3px solid #365b58;outline-offset:3px}'
          }
        </style>
        {headNodes}
        <script
          dangerouslySetInnerHTML={{ __html: SERVICE_WORKER_REGISTRATION }}
        />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
