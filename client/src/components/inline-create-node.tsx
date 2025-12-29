"use client";

import type { TreeNode, NodeTypeKey } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createNode, updateNode, linkNode } from "@/lib/api";
import { TypePicker } from "./type-picker";
import { useTreeStore } from "@/lib/stores/tree-store";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  NodeDetailsMetadataEditor,
  NodeDetailsEntry,
  NodeDetailsValueType,
} from "./node-details-meta-data";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type InlineCreateNodeProps = {
  spaceSlug: string;
  mode: "root" | "child" | "edit";
  parentNode?: TreeNode;
  editNode?: TreeNode;
  trees?: TreeNode[];
  depth: number;
  onCancel: () => void;
  onSuccess?: () => void;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const BASE_TYPES: NodeTypeKey[] = ["Space", "Subspace", "Collection"];
const OTHER_TYPES: NodeTypeKey[] = [
  "Topic",
  "Person",
  "Role",
  "Organisation",
  "Product",
  "Event",
  "MediaItem",
  "Document",
  "Location",
];

function defaultChildType(parentType: NodeTypeKey): NodeTypeKey {
  if (parentType === "Space") return "Subspace";
  if (parentType === "Subspace") return "Collection";
  if (parentType === "Collection") return "Topic";
  return "Collection";
}

function flattenTree(root: TreeNode) {
  const out: TreeNode[] = [];
  const stack = [root];
  while (stack.length) {
    const cur = stack.shift()!;
    out.push(cur);
    cur.children?.forEach((c) => stack.push(c));
  }
  return out;
}

function findParentNode(nodes: TreeNode[], targetId: string): TreeNode | null {
  const stack: { node: TreeNode; parent: TreeNode | null }[] = [];
  nodes.forEach((n) => stack.push({ node: n, parent: null }));
  while (stack.length) {
    const { node, parent } = stack.shift()!;
    if (node.id === targetId) return parent;
    node.children?.forEach((c) => stack.push({ node: c, parent: node }));
  }
  return null;
}

function findNodeByIdLocal(nodes: TreeNode[], id: string): TreeNode | null {
  const stack: TreeNode[] = [...nodes];
  while (stack.length) {
    const cur = stack.shift()!;
    if (cur.id === id) return cur;
    cur.children?.forEach((c) => stack.push(c));
  }
  return null;
}

function aboutToEntries(
  about: Record<string, string | number | boolean> | undefined
): NodeDetailsEntry[] {
  if (!about) return [];
  return Object.entries(about).map(([key, value]) => {
    let type: NodeDetailsValueType = "text";
    if (typeof value === "number") type = "number";
    else if (typeof value === "boolean") type = "boolean";
    else type = "text";
    return { key, value, type };
  });
}

function entriesToAbout(
  entries: NodeDetailsEntry[]
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const e of entries) {
    const k = e.key.trim();
    if (!k) continue;
    if (e.type === "number") {
      if (e.value === "") continue;
      out[k] = Number(e.value);
    } else if (e.type === "boolean") {
      out[k] = Boolean(e.value);
    } else {
      out[k] = String(e.value);
    }
  }
  return out;
}

export default function InlineCreateNode({
  spaceSlug,
  mode,
  parentNode,
  editNode,
  trees,
  depth,
  onCancel,
  onSuccess,
}: InlineCreateNodeProps) {
  const [activeTab, setActiveTab] = useState("create");
  const [title, setTitle] = useState(() => editNode?.title ?? "");
  const [slug, setSlug] = useState(() => editNode?.slug ?? "");
  const [desc, setDesc] = useState(() => {
    const d = (editNode as any)?.metadata?.description;
    return typeof d === "string" ? d : "";
  });
  const [mediaItemUrl, setMediaItemUrl] = useState(() => {
    const m =
      (editNode as any)?.metadata?.mediaItem ??
      (editNode as any)?.metadata?.imageUrl;
    return typeof m === "string" ? m : "";
  });
  const { toast } = useToast();
  const router = useRouter();
  const store = useTreeStore.getState();
  const [type, setType] = useState<NodeTypeKey>(() => {
    if (mode === "edit" && editNode) return editNode.nodetype;
    if (mode === "root") return "Space";
    if (parentNode) return defaultChildType(parentNode.nodetype);
    return "Space";
  });
  const [slugEditing, setSlugEditing] = useState(false);
  const [customTypes, setCustomTypes] = useState<NodeTypeKey[]>([]);
  const [about, setAbout] = useState<NodeDetailsEntry[]>(() =>
    aboutToEntries((editNode as any)?.metadata?.about)
  );
  const [linkedNodeId, setLinkedNodeId] = useState<string | null>(null);
  const [openLinkCombobox, setOpenLinkCombobox] = useState(false);

  const treesBySpace = useTreeStore((state) => state.treesBySpace);
  const allTrees = useMemo(
    () => Object.values(treesBySpace).flat(),
    [treesBySpace]
  );

  const parentId: string | "none" =
    mode === "child" && parentNode
      ? parentNode.id
      : mode === "edit" && editNode
      ? (() => {
          const list = store.getTrees(spaceSlug);
          const p = findParentNode(list ?? [], editNode.id);
          return p?.id ?? "none";
        })()
      : "none";

  const spaceRoot = store.getTrees(spaceSlug)?.[0];
  const canRender =
    mode === "root" ||
    Boolean(spaceRoot || parentNode?.spaceId || editNode?.spaceId);

  if (!canRender) {
    return null;
  }
  const spaceId =
    mode === "root"
      ? crypto.randomUUID()
      : parentNode?.spaceId ?? editNode?.spaceId ?? spaceRoot?.id;

  if (mode !== "root" && !spaceId) {
    return null;
  }

  const parentType: NodeTypeKey | undefined = useMemo(() => {
    if (parentNode) return parentNode.nodetype;
    if (parentId === "none") return undefined;
    const sourceTrees =
      trees && trees.length ? trees : store.getTrees(spaceSlug) ?? [];
    const allNodes = sourceTrees.flatMap(flattenTree);
    const node = allNodes.find((n) => n.id === parentId);
    return node?.nodetype;
  }, [parentNode, parentId, trees, spaceSlug]);

  const availableNodes = useMemo(() => {
    if (!allTrees.length) return [];

    const excludedIds = new Set<string>();
    if (parentId !== "none") {
      excludedIds.add(parentId);
      const parent = findNodeByIdLocal(allTrees, parentId);
      if (parent && parent.children) {
        parent.children.forEach((c) => excludedIds.add(c.id));
      }
    }

    const flat: TreeNode[] = [];
    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (
          node.nodetype !== "Space" &&
          node.nodetype !== "Subspace" &&
          !excludedIds.has(node.id)
        ) {
          flat.push(node);
        }
        if (node.children) traverse(node.children);
      }
    };
    traverse(allTrees);
    return Array.from(new Map(flat.map((n) => [n.id, n])).values());
  }, [allTrees, parentId]);

  function isDisabled(opt: NodeTypeKey): boolean {
    if (!parentNode && parentId === "none") {
      return opt !== "Space";
    }
    const p = parentType;
    if (!p) return false;
    if (p === "Space") return opt !== "Subspace";
    if (p === "Collection") return BASE_TYPES.includes(opt);
    return opt === "Space" || opt === "Subspace";
  }

  async function onCreate() {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    if (!slug.trim()) {
      toast({ title: "Slug is required", variant: "destructive" });
      return;
    }

    const targetSpaceKey = mode === "root" ? slug : spaceSlug;
    const snapshot = structuredClone(
      useTreeStore.getState().getTrees(targetSpaceKey)
    );

    if (mode === "edit" && editNode) {
      try {
        const list = store.getTrees(spaceSlug) ?? [];
        const parent =
          parentId !== "none" ? findNodeByIdLocal(list, parentId) : null;
        const newPath = parent ? `${parent.path}/${slug}` : slug;
        const updated = await updateNode(spaceSlug, editNode.id, {
          title,
          slug,
          nodetype: type as any,
          path: newPath,
          metadata: {
            description: desc,
            about: entriesToAbout(about),
            mediaItem: type === "MediaItem" ? mediaItemUrl : undefined,
          } as any,
        } as any);
        toast({ title: `Node updated: ${updated.title}` });
      } catch {
        toast({ title: "Failed to update node", variant: "destructive" });
      }
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
      onCancel();
      return;
    }

    const optimisticNode: TreeNode = {
      id: crypto.randomUUID(),
      spaceId,
      title,
      slug,
      nodetype: type,
      path: parentNode ? `${parentNode.path}/${slug}` : slug,
      metadata: {
        description: desc,
        about: entriesToAbout(about),
        mediaItem: type === "MediaItem" ? mediaItemUrl : undefined,
      },
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useTreeStore
      .getState()
      .addNodeOptimistic(
        targetSpaceKey,
        parentNode?.id ?? null,
        optimisticNode
      );

    try {
      const created = await createNode(
        targetSpaceKey,
        optimisticNode,
        parentNode?.id
      );

      if (!created || typeof created !== "object" || !("id" in created)) {
        throw new Error("Invalid createNode response");
      }
      if (created.id !== optimisticNode.id) {
        useTreeStore
          .getState()
          .replaceNode(targetSpaceKey, optimisticNode.id, created);
      }

      toast({ title: `Node created: ${created.title}` });
    } catch {
      useTreeStore.getState().rollback(targetSpaceKey, snapshot);

      toast({
        title: "Failed to create node",
        variant: "destructive",
      });
    }
    // ✅ ONLY refresh when backend is in use
    if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
      router.refresh();
    }
    onSuccess?.();
    onCancel();
  }

  async function onLink() {
    if (!linkedNodeId) {
      toast({ title: "Please select a node to link", variant: "destructive" });
      return;
    }
    if (parentId === "none") {
      toast({ title: "Cannot link to root", variant: "destructive" });
      return;
    }

    try {
      await linkNode(spaceSlug, linkedNodeId, parentId);
      toast({ title: `Linked child node` });
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
      onSuccess?.();
      onCancel();
    } catch (e) {
      console.error("Failed to link node", e);
      toast({ title: "Failed to link child node", variant: "destructive" });
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeTab === "create") onCreate();
      else if (activeTab === "link") onLink();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only focus title if we are in create mode or initial render
    if (activeTab === "create") {
      titleRef.current?.focus();
    }
  }, [activeTab]);

  const CreateForm = (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Title:</label>
        <div className="flex items-center gap-2">
          <Input
            ref={titleRef}
            autoFocus
            placeholder="Title"
            value={title}
            onChange={(e) => {
              const t = e.target.value;
              setTitle(t);
              setSlug(slugify(t));
            }}
          />
          <Badge variant="secondary">{type}</Badge>
        </div>
      </div>

      {slug && (
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Slug: {slug}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSlugEditing((v) => !v)}
              aria-label="Edit slug"
            >
              <Pencil className="h-2 w-2" />
            </Button>
          </div>
          {slugEditing && (
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full"
            />
          )}
        </div>
      )}
      <div className="grid gap-2">
        <label className="text-sm font-medium">Type:</label>
        <TypePicker
          value={type}
          options={[...BASE_TYPES, ...OTHER_TYPES, ...customTypes]}
          disabled={isDisabled}
          onChange={(t) => setType(t)}
          onCreate={(t) => {
            setCustomTypes((prev) => (prev.includes(t) ? prev : [...prev, t]));
            setType(t);
          }}
        />
      </div>
      {type === "MediaItem" && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Media URL:</label>
          <Input
            placeholder="https://example.com/image.png"
            value={mediaItemUrl}
            onChange={(e) => setMediaItemUrl(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Description:</label>
        <Input
          placeholder="Description (optional)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        {!["Space", "Subspace"].includes(type) && (
          <NodeDetailsMetadataEditor value={about} onChange={setAbout} />
        )}
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <Button size="sm" onClick={onCreate}>
          {mode === "edit" ? "Save" : "Create"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const LinkForm = (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Select Existing Node:</label>
        <Popover open={openLinkCombobox} onOpenChange={setOpenLinkCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openLinkCombobox}
              className="w-full justify-between"
            >
              {linkedNodeId
                ? availableNodes.find((n) => n.id === linkedNodeId)?.title
                : "Select node..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search node..." />
              <CommandList>
                <CommandGroup heading="Nodes">
                  <CommandEmpty>No node found.</CommandEmpty>
                  {availableNodes.map((node) => (
                    <CommandItem
                      key={node.id}
                      value={`${node.title} ${node.slug}`}
                      onSelect={() => {
                        setLinkedNodeId(
                          node.id === linkedNodeId ? null : node.id
                        );
                        setOpenLinkCombobox(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          linkedNodeId === node.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{node.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {node.slug}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" onClick={onLink} disabled={!linkedNodeId}>
          Add Existing Node
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border bg-secondary p-2",
        "mt-1"
      )}
      style={{ marginLeft: depth * 16 }}
      onKeyDown={onKeyDown}
    >
      {mode === "child" ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="link">Add Existing</TabsTrigger>
          </TabsList>
          <TabsContent value="create">{CreateForm}</TabsContent>
          <TabsContent value="link">{LinkForm}</TabsContent>
        </Tabs>
      ) : (
        CreateForm
      )}
    </div>
  );
}
