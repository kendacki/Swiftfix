import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "smart-camera-web": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "capture-id"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
