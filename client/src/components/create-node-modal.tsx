"use client";

import type { TreeNode, NodeTypeKey } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
 

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { attachChild, createNode } from "@/lib/api";
import { useRouter } from "next/navigation";

type CreateNodeModalProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  parentNode?: TreeNode | null;
  tree?: TreeNode;
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

function flattenTree(
  root: TreeNode
): Array<{ id: string; path: string; title: string; nodetype: NodeTypeKey }> {
  const out: Array<{
    id: string;
    path: string;
    title: string;
    nodetype: NodeTypeKey;
  }> = [];
  const stack: TreeNode[] = [root];
  while (stack.length) {
    const cur = stack.shift() as TreeNode;
    out.push({
      id: cur.id,
      path: cur.path,
      title: cur.title,
      nodetype: cur.nodetype,
    });
    for (const c of cur.children || []) stack.push(c);
  }
  return out;
}

export default function CreateNodeModal({
  open,
  onOpenChange,
  parentNode,
  tree,
}: CreateNodeModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [slugEditing, setSlugEditing] = useState(false);
  const [type, setType] = useState<NodeTypeKey>(
    parentNode ? defaultChildType(parentNode.nodetype) : "Space"
  );
  const [typeQuery, setTypeQuery] = useState("");
  const [customTypes, setCustomTypes] = useState<NodeTypeKey[]>([]);
  const [parentId, setParentId] = useState<string>(
    parentNode ? parentNode.id : "none"
  );
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTitle("");
      setSlug("");
      setDesc("");
      setSlugEditing(false);
      setType(parentNode ? defaultChildType(parentNode.nodetype) : "Space");
      setTypeQuery("");
      setParentId(parentNode ? parentNode.id : "none");
    }
  }, [open, parentNode]);

  const parentType: NodeTypeKey | undefined = useMemo(() => {
    if (parentNode) return parentNode.nodetype;
    if (!tree) return undefined;
    if (parentId === "none") return undefined;
    const node = flattenTree(tree).find((n) => n.id === parentId);
    return node?.nodetype;
  }, [parentNode, parentId, tree]);

  function isDisabled(opt: NodeTypeKey): boolean {
    if (!parentNode && parentId === "none") {
      return opt !== "Space";
    }
    const p = parentType;
    if (!p) return false;
    if (p === "Space") return opt !== "Subspace";
    if (p === "Subspace") return opt !== "Collection";
    if (p === "Collection") return BASE_TYPES.includes(opt);
    return opt === "Space" || opt === "Subspace";
  }

  async function onSubmit() {
    if (!title || !slug) return;
    try {
      const spaceSlug =
        parentNode
          ? parentNode.path.split("/")[0]
          : tree
          ? tree.path.split("/")[0]
          : "gomanto";
      const payload: TreeNode = {
        id: crypto.randomUUID(),
        spaceId: parentNode?.spaceId ?? tree?.spaceId ?? "1",
        nodetype: type as NodeTypeKey,
        title,
        slug,
        metadata: { description: desc } as any,
        path: "",
        children: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const created = await createNode(spaceSlug, payload, parentNode ? parentNode.id : undefined);
      const childId = (created as any)?.id as string | undefined;
      const targetParentId = parentNode
        ? parentNode.id
        : parentId !== "none"
        ? parentId
        : undefined;
      if (childId && targetParentId) {
        await attachChild(spaceSlug, targetParentId, childId, slug);
      }
      toast({ title: "Node created", description: title });
      onOpenChange(false);
      router.refresh();
    } catch {
      toast({ title: "Failed to create node", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Node</DialogTitle>
          {parentNode ? (
            <DialogDescription>
              Subnode for {parentNode.title}
            </DialogDescription>
          ) : (
            <DialogDescription>Create New Node.</DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => {
                const t = e.target.value;
                setTitle(t);
                setSlug(slugify(t));
              }}
              className="w-full"
            />
          </div>
          {slug && (
            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Slug: {slug}
                </span>
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
            <label className="text-sm font-medium">Description</label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full"
            />
          </div>
          {!parentNode && tree && (
            <div className="grid gap-2">
              <label className="text-sm font-medium">Parent</label>
              <Select
                value={parentId}
                onValueChange={(v) => {
                  setParentId(v);
                  if (v === "none") {
                    setType("Space");
                  } else {
                    const node = flattenTree(tree).find((n) => n.id === v);
                    if (node) setType(defaultChildType(node.nodetype));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="none">None</SelectItem>
                  {flattenTree(tree).map((n) => (
                    <SelectItem
                      key={n.id}
                      value={n.id}
                    >{`${n.path} — ${n.title}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <label className="text-sm font-medium">Type</label>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setTypeQuery("")}
              >
                {type}
              </Button>

              <div className="mt-2 rounded-md border bg-popover shadow-md">
                <div className="p-2 border-b">
                  <Input
                    autoFocus
                    value={typeQuery}
                    onChange={(e) => setTypeQuery(e.target.value)}
                    placeholder="Search nodetype or create..."
                    className="h-8"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {[...BASE_TYPES, ...OTHER_TYPES, ...customTypes]
                    .filter((opt) =>
                      opt.toLowerCase().includes(typeQuery.toLowerCase())
                    )
                    .map((opt) => {
                      const disabled = isDisabled(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && setType(opt)}
                          className="w-full px-3 py-2 text-left hover:bg-muted disabled:opacity-50"
                        >
                          {opt}
                        </button>
                      );
                    })}

                  {typeQuery &&
                    ![...BASE_TYPES, ...OTHER_TYPES, ...customTypes].some(
                      (t) => t.toLowerCase() === typeQuery.toLowerCase()
                    ) &&
                    !isDisabled(typeQuery as NodeTypeKey) && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left bg-muted"
                        onClick={() => {
                          const candidate = typeQuery as NodeTypeKey;
                          setCustomTypes((prev) =>
                            prev.includes(candidate)
                              ? prev
                              : [...prev, candidate]
                          );
                          setType(candidate);
                        }}
                      >
                        Create “{typeQuery}”
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onSubmit}>Create</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
