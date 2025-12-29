"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { Node } from "@/lib/types";

type BreadcrumbContextType = {
  ancestors: Node[];
  currentNode: Node | null;
  setBreadcrumbs: (ancestors: Node[], currentNode: Node | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [ancestors, setAncestors] = useState<Node[]>([]);
  const [currentNode, setCurrentNode] = useState<Node | null>(null);

  const setBreadcrumbs = useCallback(
    (newAncestors: Node[], newCurrentNode: Node | null) => {
      // Prevent unnecessary updates if data is same (shallow comparison for node id/slug might be better, but simple ref check first)
      // Actually, arrays are new references every time from parent, so we need value comparison.
      // However, for now, let's just use JSON.stringify for deep comparison or check IDs.

      // Check if currentNode changed
      const nodeChanged = newCurrentNode?.id !== currentNode?.id;

      // Check if ancestors changed (length or IDs)
      const ancestorsChanged =
        newAncestors.length !== ancestors.length ||
        newAncestors.some((node, index) => node.id !== ancestors[index].id);

      if (nodeChanged || ancestorsChanged) {
        setAncestors(newAncestors);
        setCurrentNode(newCurrentNode);
      }
    },
    [ancestors, currentNode]
  );

  return (
    <BreadcrumbContext.Provider
      value={{ ancestors, currentNode, setBreadcrumbs }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}
