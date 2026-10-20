import type { HASSDomEvent } from "../common/dom/fire_event";
import { fireEvent } from "../common/dom/fire_event";

export type HapticType =
  | "success"
  | "warning"
  | "failure"
  | "light"
  | "medium"
  | "heavy"
  | "selection";

declare global {
  interface HASSDomEvents {
    haptic: HapticType;
  }
  interface GlobalEventHandlersEventMap {
    haptic: HASSDomEvent<HASSDomEvents["haptic"]>;
  }
}

export const forwardHaptic = (node: HTMLElement, hapticType: HapticType) => {
  fireEvent(node, "haptic", hapticType);
};
