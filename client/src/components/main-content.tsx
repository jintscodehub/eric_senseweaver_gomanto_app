"use client";

import type { ResolvedPath, TreeNode } from "@/lib/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import InlineCreateNode from "./inline-create-node";
import { useTreeStore } from "@/lib/stores/tree-store";
import { TreeView } from "@/components/tree-view";
import { useBreadcrumb } from "@/context/breadcrumb-context";

type MainContentProps = {
  spaceSlug: string;
  data: ResolvedPath;
  trees: TreeNode[];
  currentPath: string;
  showTreeOnly?: boolean;
};

export default function MainContent({
  spaceSlug,
  data,
  trees,
}: MainContentProps) {
  const { node, ancestors } = data;
  // fallback for mock mode
  const currentNode = node ?? trees[0] ?? null;
  const [creatingRoot, setCreatingRoot] = useState(false);
  const [editingRoot, setEditingRoot] = useState<TreeNode | null>(null);
  const treesBySpace = useTreeStore((s) => s.treesBySpace);
  const storeTrees = useTreeStore((s) => s.treesBySpace[spaceSlug]);
  const spaceForest = Object.values(treesBySpace).flat();
  const effectiveTrees =
    spaceForest.length > 0
      ? spaceForest
      : storeTrees && storeTrees.length
      ? storeTrees
      : trees;

  const { setBreadcrumbs } = useBreadcrumb();

  // Sync breadcrumbs
  useEffect(() => {
    setBreadcrumbs(ancestors, currentNode);
  }, [ancestors, currentNode, setBreadcrumbs]);

  if (!node && !process.env.NEXT_PUBLIC_USE_MOCK) {
    return <div className="p-6 text-muted-foreground">Node not found.</div>;
  }

  useEffect(() => {
    const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    if (!isMock) {
      useTreeStore.getState().setTrees(spaceSlug, trees);
      return;
    }
    if (trees && trees.length) {
      useTreeStore.getState().setTrees(spaceSlug, trees);
    }
  }, [spaceSlug, trees]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_USE_MOCK === "true"
    ) {
      try {
        const raw = window.localStorage.getItem("knowledge-tree");
        if (raw) {
          console.log("knowledge-tree localStorage:", JSON.parse(raw));
        } else {
          console.log("knowledge-tree localStorage: null");
        }
      } catch {
        console.log("knowledge-tree localStorage read failed");
      }
    }
  }, [storeTrees, spaceSlug]);

  return (
    <div className="flex flex-col flex-1 transition-all w-full">
      <main className="flex-1 overflow-y-auto p-2 md:px-6 lg:px-8">
        <div className="mb-8 top-0">
          <div className="flex mb-4 justify-between p-1 gap-4 top-0 border bg-sidebar rounded-lg">
            <form className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search graph..."
                className="w-48 rounded-lg bg-background pl-9 md:w-64"
                disabled // Search not implemented in this MVP
              />
            </form>
            <Button onClick={() => setCreatingRoot(true)}>Create Space</Button>
          </div>
          <TreeView
            data={effectiveTrees}
            onEditRoot={(n) => setEditingRoot(n)}
          />
          {creatingRoot && (
            <InlineCreateNode
              spaceSlug={spaceSlug}
              mode="root"
              trees={effectiveTrees}
              depth={0}
              onCancel={() => setCreatingRoot(false)}
            />
          )}
          {editingRoot && (
            <InlineCreateNode
              spaceSlug={spaceSlug}
              mode="edit"
              editNode={editingRoot}
              trees={effectiveTrees}
              depth={0}
              onCancel={() => setEditingRoot(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
