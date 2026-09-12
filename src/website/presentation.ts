import { createContext, useContext } from "react";
import type { WebsiteConfigV1 } from "./contract";
export type Presentation = {
  config: WebsiteConfigV1 | null;
  preview: boolean;
  branchId: string | null;
  selection: string;
  select: (id: string) => void;
};
export const PresentationContext = createContext<Presentation>({
  config: null,
  preview: false,
  branchId: null,
  selection: "",
  select: () => {},
});
export const usePresentation = () => useContext(PresentationContext);
