import { createContext } from "react";
import type { WorkspaceContextValue } from "../types/workspace";

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);
