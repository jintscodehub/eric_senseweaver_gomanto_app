import type { Node, ResolvedPath, TreeNode } from "./types";
import { useTreeStore } from "./stores/tree-store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function canUseApi() {
  return !!API_BASE && !USE_MOCK;
}

function walkTree(
  nodes: TreeNode[],
  parentPath = "",
  ancestors: TreeNode[] = []
): {
  byPath: Map<string, { node: TreeNode; ancestors: TreeNode[] }>;
} {
  const byPath = new Map<string, { node: TreeNode; ancestors: TreeNode[] }>();

  for (const node of nodes) {
    const fullPath = parentPath ? `${parentPath}/${node.slug}` : node.slug;
    const nextAncestors = [...ancestors, node];

    byPath.set(fullPath, {
      node,
      ancestors,
    });

    if (node.children?.length) {
      const child = walkTree(node.children, fullPath, nextAncestors);
      child.byPath.forEach((v, k) => byPath.set(k, v));
    }
  }

  return { byPath };
}
function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = n.children?.length ? findNodeById(n.children, id) : null;
    if (found) return found;
  }
  return null;
}

export function countNodeOccurrences(nodes: TreeNode[], id: string): number {
  let count = 0;
  for (const n of nodes) {
    if (n.id === id) count++;
    if (n.children?.length) {
      count += countNodeOccurrences(n.children, id);
    }
  }
  return count;
}

export async function getTree(spaceSlug: string): Promise<TreeNode[]> {
  if (canUseApi()) {
    try {
      const res = await fetch(`${API_BASE}/spaces/${spaceSlug}/tree`, {
        cache: "no-store",
      });
      if (res.ok) {
        const tree = await res.json();
        const trees = tree ? [tree] : [];
        // Sync API data to store to enable optimistic updates on the client
        useTreeStore.getState().setTrees(spaceSlug, trees);
        return trees;
      }
    } catch {
      console.warn("Backend unreachable, falling back to Zustand");
    }
  }

  return useTreeStore.getState().getTrees(spaceSlug);
}

export function resolvePathLocal(
  path: string,
  spaceSlug: string,
  trees?: TreeNode[]
): ResolvedPath {
  const storeTrees = trees ?? useTreeStore.getState().getTrees(spaceSlug);
  const { byPath } = walkTree(storeTrees);

  const hit = byPath.get(path);
  if (!hit) {
    return { node: null, ancestors: [], children: [], path };
  }

  return {
    node: hit.node,
    ancestors: hit.ancestors,
    children: hit.node.children ?? [],
    path,
  };
}

export async function resolvePath(
  path: string,
  spaceSlug: string
): Promise<ResolvedPath> {
  if (canUseApi()) {
    try {
      const res = await fetch(
        `${API_BASE}/paths/resolve/${encodeURIComponent(path)}`,
        { cache: "no-store" }
      );
      if (res.ok) return res.json();
    } catch {
      // fall through
    }
  }

  return resolvePathLocal(path, spaceSlug);
}

export async function createNode(
  spaceSlug: string,
  node: TreeNode,
  parentId?: string
): Promise<TreeNode> {
  // ---------- MOCK OR OFFLINE FALLBACK ----------
  if (!canUseApi()) {
    const store = useTreeStore.getState();
    const existing = findNodeById(store.getTrees(spaceSlug), node.id);
    if (!existing) {
      store.addNodeGlobally(spaceSlug, parentId ?? null, node);
    }
    return node;
  }

  // ---------- API with graceful offline fallback ----------
  try {
    const res = await fetch(`${API_BASE}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spaceId: node.spaceId,
        nodetypeKey: node.nodetype,
        title: node.title,
        slug: node.slug,
        metadata: node.metadata,
        parentId,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();

    if (!data?.id) {
      throw new Error("Invalid node returned from API");
    }

    return data as TreeNode;
  } catch {
    const store = useTreeStore.getState();
    const existing = findNodeById(store.getTrees(spaceSlug), node.id);
    if (!existing) {
      store.addNodeGlobally(spaceSlug, parentId ?? null, node);
    }
    return node;
  }
}

// --- UPDATE NODE ---
export async function updateNode(
  spaceSlug: string,
  id: string,
  data: Partial<Node>
): Promise<Node> {
  if (canUseApi()) {
    try {
      const res = await fetch(`${API_BASE}/nodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) return res.json();
    } catch {
      // fall through to mock
    }
  }

  // ---------- MOCK ----------
  const store = useTreeStore.getState();

  store.updateNodeGlobally(id, (n) => ({
    ...n,
    ...data,
    updatedAt: new Date().toISOString(),
  }));

  const trees = store.getTrees(spaceSlug);
  const updated = findNodeById(trees, id);
  if (!updated) throw new Error("Node not found");

  return updated;
}

export async function linkNode(
  spaceSlug: string,
  nodeId: string,
  parentId: string
): Promise<TreeNode> {
  const store = useTreeStore.getState();

  // Search globally for the node
  const allTrees = Object.values(store.treesBySpace).flat();
  const existing = findNodeById(allTrees, nodeId);

  if (!existing) {
    throw new Error("Node not found");
  }

  // Optimistic update
  store.addNodeOptimistic(spaceSlug, parentId, existing);

  // API call
  if (canUseApi()) {
    try {
      const res = await fetch(`${API_BASE}/nodes/${nodeId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId }),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Fallback to optimistic
    }
  }

  return existing;
}

// --- DELETE NODE ---
export async function deleteNode(
  spaceSlug: string,
  id: string
): Promise<{ ok: true }> {
  const store = useTreeStore.getState();

  // Use global removal to handle cases where spaceSlug mismatch occurs
  // This ensures the node is removed from ANY space it might reside in
  store.removeNodeGlobally(id);

  if (canUseApi()) {
    try {
      const res = await fetch(`${API_BASE}/nodes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      // ignore offline errors, keep optimistic deletion
    }
  }

  return { ok: true };
}

// --- SEARCH NODE ---
export async function searchNodes(
  spaceSlug: string,
  query: string
): Promise<Node[]> {
  if (!query.trim()) return [];

  if (canUseApi()) {
    const res = await fetch(
      `${API_BASE}/search?q=${encodeURIComponent(query)}`
    );
    if (res.ok) return res.json();
  }

  // ---------- MOCK ----------
  const trees = useTreeStore.getState().getTrees(spaceSlug);
  const matches: Node[] = [];

  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.title.toLowerCase().includes(query.toLowerCase())) {
        matches.push(n);
      }
      if (n.children?.length) walk(n.children);
    }
  };

  walk(trees);
  return matches;
}

// --- ATTACH CHILD ---
export async function attachChild(
  spaceSlug: string,
  parentId: string,
  childId: string,
  slug: string
): Promise<{ ok: true }> {
  const store = useTreeStore.getState();
  const snapshot = structuredClone(store.getTrees(spaceSlug));

  try {
    const child = findNodeById(snapshot, childId);
    if (!child) throw new Error("Child not found");

    store.removeNodeOptimistic(spaceSlug, childId);

    const updatedChild: TreeNode = {
      ...child,
      slug,
      path: "", // recalculated in render
      updatedAt: new Date().toISOString(),
    };

    store.addNodeOptimistic(spaceSlug, parentId, updatedChild);

    if (canUseApi()) {
      try {
        const res = await fetch(`${API_BASE}/paths/attach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId, childId, slug }),
        });
        if (!res.ok) throw new Error("Attach failed");
      } catch {
        // ignore offline errors, keep optimistic change
      }
    }

    return { ok: true };
  } catch {
    store.rollback(spaceSlug, snapshot);
    throw new Error("Attach failed");
  }
}

// --- DETACH CHILD ---
export async function detachChild(
  spaceSlug: string,
  parentId: string,
  childId: string
): Promise<{ ok: true }> {
  const store = useTreeStore.getState();
  const snapshot = structuredClone(store.getTrees(spaceSlug));

  try {
    const child = findNodeById(snapshot, childId);
    if (!child) throw new Error("Child not found");

    // Remove specifically from this parent
    store.removeNodeOptimistic(spaceSlug, childId, parentId);

    store.addNodeOptimistic(spaceSlug, null, {
      ...child,
      path: child.slug,
      updatedAt: new Date().toISOString(),
    });

    if (canUseApi()) {
      try {
        const res = await fetch(`${API_BASE}/paths/detach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId, childId }),
        });
        if (!res.ok) throw new Error("Detach failed");
      } catch {
        // ignore offline errors, keep optimistic change
      }
    }

    return { ok: true };
  } catch {
    store.rollback(spaceSlug, snapshot);
    throw new Error("Detach failed");
  }
}

// --- UNLINK NODE ---
export async function unlinkNode(
  spaceSlug: string,
  parentId: string | null,
  childId: string
): Promise<{ ok: true }> {
  const store = useTreeStore.getState();
  const snapshot = structuredClone(store.getTrees(spaceSlug));

  try {
    // 1. Optimistic remove from parent
    store.removeNodeOptimistic(spaceSlug, childId, parentId);

    // 2. Call API
    if (canUseApi()) {
      try {
        const res = await fetch(`${API_BASE}/paths/detach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId, childId }),
        });
        if (!res.ok) throw new Error("Unlink failed");
      } catch {
        // ignore offline errors
      }
    }

    return { ok: true };
  } catch {
    store.rollback(spaceSlug, snapshot);
    throw new Error("Unlink failed");
  }
}
