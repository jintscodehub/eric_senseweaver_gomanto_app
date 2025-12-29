import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TreeNode } from "@/lib/types";

/* ---------- Helpers ---------- */

function insertNode(
  trees: TreeNode[],
  parentId: string | null,
  node: TreeNode
): { nodes: TreeNode[]; changed: boolean } {
  // If parentId is null, we are adding to the root level of this specific tree array.
  // This is usually space-specific, so we always consider it a change.
  if (!parentId) {
    return { nodes: [...trees, node], changed: true };
  }

  let changed = false;
  const newTrees = trees.map((t) => {
    // 1. Found the parent? Add the child here.
    if (t.id === parentId) {
      changed = true;
      // We MUST update the child's path to match this parent's location.
      // e.g. Parent is /space/A, child slug is B -> /space/A/B
      const fixedNode = updatePathRecursive(node, t.path);
      return { ...t, children: [...(t.children ?? []), fixedNode] };
    }

    // 2. Not the parent, but has children? Recurse.
    if (t.children && t.children.length > 0) {
      const result = insertNode(t.children, parentId, node);
      if (result.changed) {
        changed = true;
        return { ...t, children: result.nodes };
      }
    }

    return t;
  });

  return { nodes: changed ? newTrees : trees, changed };
}

function updateNodeInTree(
  trees: TreeNode[],
  nodeId: string,
  updater: (n: TreeNode) => TreeNode
): { nodes: TreeNode[]; changed: boolean } {
  let changed = false;
  const newTrees = trees.map((t) => {
    if (t.id === nodeId) {
      changed = true;
      const updated = updater(t);
      // If the slug changed, we might need to update paths of children?
      // For now, assume simple metadata updates.
      // If slug changes, we definitely need updatePathRecursive on children.
      if (updated.slug !== t.slug) {
        // Parent path is the path of the parent of 't'.
        // But we don't have parent path here easily unless we passed it down.
        // However, t.path usually contains the parent path.
        // const parentPath = t.path.substring(0, t.path.lastIndexOf("/"));
        // Actually, we can just assume the caller handles path updates or we do it lazily.
        // But for safety, let's leave path logic to the caller or specific actions.
        // For this task (children updates), we are fine.
      }
      return updated;
    }

    if (t.children && t.children.length > 0) {
      const result = updateNodeInTree(t.children, nodeId, updater);
      if (result.changed) {
        changed = true;
        return { ...t, children: result.nodes };
      }
    }
    return t;
  });

  return { nodes: changed ? newTrees : trees, changed };
}

function removeNode(
  trees: TreeNode[],
  nodeId: string,
  targetParentId?: string | null,
  currentParentId: string | null = null
): { nodes: TreeNode[]; changed: boolean } {
  let changed = false;
  const newNodes: TreeNode[] = [];

  for (const node of trees) {
    if (node.id === nodeId) {
      // If targetParentId is provided, only remove if we match the parent context
      // targetParentId === null means we are targeting a root node (currentParentId is null)
      // targetParentId === undefined means remove ALL instances (legacy behavior)
      const shouldRemove =
        targetParentId === undefined || targetParentId === currentParentId;

      if (shouldRemove) {
        changed = true;
        continue;
      }
    }

    if (node.children && node.children.length > 0) {
      const result = removeNode(node.children, nodeId, targetParentId, node.id);
      if (result.changed) {
        changed = true;
        newNodes.push({ ...node, children: result.nodes });
      } else {
        newNodes.push(node);
      }
    } else {
      newNodes.push(node);
    }
  }

  return { nodes: changed ? newNodes : trees, changed };
}

function replaceNodeRecursive(
  trees: TreeNode[],
  tempId: string,
  realNode: TreeNode
): TreeNode[] {
  return trees.map((t) => {
    if (t.id === tempId) return realNode;
    return {
      ...t,
      children: t.children
        ? replaceNodeRecursive(t.children, tempId, realNode)
        : [],
    };
  });
}

function updatePathRecursive(node: TreeNode, parentPath: string): TreeNode {
  // If parentPath is empty, it means this node is a root (like a Space).
  // Its path should just be its slug.
  // BUT, existing logic might expect "slug" or "/slug".
  // The current mock data often has paths like "art" or "art/artistes".
  // So: if parentPath is empty, path = slug.
  // If parentPath is not empty, path = parentPath + "/" + slug.

  const newPath = parentPath ? `${parentPath}/${node.slug}` : node.slug;

  return {
    ...node,
    path: newPath,
    children: node.children
      ? node.children.map((c) => updatePathRecursive(c, newPath))
      : [],
  };
}

/* ---------- Store Types ---------- */

export interface TreeState {
  treesBySpace: Record<string, TreeNode[]>;

  getTrees: (spaceSlug: string) => TreeNode[];
  setTrees: (spaceSlug: string, trees: TreeNode[]) => void;

  addNodeGlobally: (
    spaceSlug: string,
    parentId: string | null,
    node: TreeNode
  ) => void;

  updateNodeGlobally: (
    nodeId: string,
    updater: (n: TreeNode) => TreeNode
  ) => void;

  // Deprecated / Alias to addNodeGlobally
  addNodeOptimistic: (
    spaceSlug: string,
    parentId: string | null,
    node: TreeNode
  ) => void;

  removeNodeOptimistic: (
    spaceSlug: string,
    nodeId: string,
    parentId?: string | null
  ) => void;
  removeNodeGlobally: (nodeId: string) => void;

  linkNodeOptimistic: (
    spaceSlug: string,
    parentId: string | null,
    node: TreeNode
  ) => void;

  replaceNode: (spaceSlug: string, tempId: string, realNode: TreeNode) => void;

  rollback: (spaceSlug: string, snapshot: TreeNode[]) => void;

  // Global editor state
  activeEditorId: string | null;
  setActiveEditorId: (id: string | null) => void;
}

/* ---------- Store ---------- */

export const useTreeStore = create<TreeState>()(
  persist(
    (set, get) => ({
      treesBySpace: {},
      activeEditorId: null,

      setActiveEditorId: (id) => set({ activeEditorId: id }),

      getTrees: (spaceSlug) => get().treesBySpace[spaceSlug] ?? [],

      setTrees: (spaceSlug, trees) =>
        set((state) => ({
          treesBySpace: {
            ...state.treesBySpace,
            [spaceSlug]: trees,
          },
        })),

      // addNodeOptimistic: (spaceSlug, parentId, node) =>
      //   set((state) => ({
      //     treesBySpace: {
      //       ...state.treesBySpace,
      //       [spaceSlug]: insertNode(
      //         state.treesBySpace[spaceSlug] ?? [],
      //         parentId,
      //         node
      //       ),
      //     },
      //   })),

      addNodeGlobally: (spaceSlug, parentId, node) => {
        set((state) => {
          const newTreesBySpace = { ...state.treesBySpace };
          let anyChanged = false;

          // 1. If adding to root (parentId is null), it is space-specific.
          if (!parentId) {
            const trees = newTreesBySpace[spaceSlug] ?? [];
            const res = insertNode(trees, null, node);
            if (res.changed) {
              newTreesBySpace[spaceSlug] = res.nodes;
              anyChanged = true;
            }
          } else {
            // 2. If adding to a parent, update ALL spaces where parent exists.
            for (const key of Object.keys(newTreesBySpace)) {
              const trees = newTreesBySpace[key];
              const res = insertNode(trees, parentId, node);
              if (res.changed) {
                newTreesBySpace[key] = res.nodes;
                anyChanged = true;
              }
            }
            // If the spaceSlug passed is new or empty, we might need to initialize it?
            // But usually we only care about existing trees.
          }

          return anyChanged ? { treesBySpace: newTreesBySpace } : state;
        });
      },

      addNodeOptimistic: (spaceSlug, parentId, node) => {
        get().addNodeGlobally(spaceSlug, parentId, node);
      },

      updateNodeGlobally: (nodeId, updater) => {
        set((state) => {
          const newTreesBySpace = { ...state.treesBySpace };
          let anyChanged = false;

          for (const key of Object.keys(newTreesBySpace)) {
            const trees = newTreesBySpace[key];
            const res = updateNodeInTree(trees, nodeId, updater);
            if (res.changed) {
              // If the node changed, we MUST re-calculate paths for the entire tree
              // or at least for the affected subtree.
              // Since `updateNodeInTree` only updates the node itself,
              // we need a subsequent pass to fix paths if the slug changed.
              // For robustness, let's regenerate paths for the whole tree
              // if we suspect a slug change (which affects paths).
              // However, blindly regenerating everything is expensive.
              // A better approach in `updateNodeInTree` is to check if slug changed.

              // Let's refine `updateNodeInTree` to return a flag if path update is needed,
              // or just re-run path generation for the modified tree.

              // Simplest fix for now: If changed, re-run path update on the root(s) of this space.
              // Note: trees is an array of roots.
              const fixedTrees = res.nodes.map((root) =>
                updatePathRecursive(root, "")
              );

              newTreesBySpace[key] = fixedTrees;
              anyChanged = true;
            }
          }

          return anyChanged ? { treesBySpace: newTreesBySpace } : state;
        });
      },

      removeNodeOptimistic: (spaceSlug, nodeId, parentId) => {
        const currentTrees = get().treesBySpace[spaceSlug] ?? [];
        console.log("removeNodeOptimistic called", {
          spaceSlug,
          nodeId,
          parentId,
          beforeCount: currentTrees.length,
        });

        const { nodes: newTrees, changed } = removeNode(
          currentTrees,
          nodeId,
          parentId,
          null
        );
        console.log("removeNodeOptimistic result", {
          afterCount: newTrees.length,
          changed,
        });

        if (changed) {
          set((state) => ({
            treesBySpace: {
              ...state.treesBySpace,
              [spaceSlug]: newTrees,
            },
          }));
        }
      },

      removeNodeGlobally: (nodeId) => {
        set((state) => {
          const newTreesBySpace = { ...state.treesBySpace };
          let anyChanged = false;

          for (const spaceSlug of Object.keys(newTreesBySpace)) {
            const trees = newTreesBySpace[spaceSlug];
            const { nodes: newTrees, changed } = removeNode(trees, nodeId);
            if (changed) {
              newTreesBySpace[spaceSlug] = newTrees;
              anyChanged = true;
            }
          }

          return anyChanged ? { treesBySpace: newTreesBySpace } : state;
        });
      },

      linkNodeOptimistic: (spaceSlug, parentId, node) => {
        get().addNodeGlobally(spaceSlug, parentId, node);
      },

      replaceNode: (spaceSlug, tempId, realNode) =>
        set((state) => ({
          treesBySpace: {
            ...state.treesBySpace,
            [spaceSlug]: replaceNodeRecursive(
              state.treesBySpace[spaceSlug] ?? [],
              tempId,
              realNode
            ),
          },
        })),

      rollback: (spaceSlug, snapshot) =>
        set((state) => ({
          treesBySpace: {
            ...state.treesBySpace,
            [spaceSlug]: snapshot,
          },
        })),
    }),
    {
      name: "knowledge-tree",
      version: 2,
    }
  )
);
