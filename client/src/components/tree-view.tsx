"use client";

import type { TreeNode } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { NodeIcon } from "./node-icon";
import InlineCreateNode from "./inline-create-node";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useTreeStore } from "@/lib/stores/tree-store";
import { deleteNode, unlinkNode, countNodeOccurrences } from "@/lib/api";

interface TreeViewProps {
  data: TreeNode[];
  defaultOpen?: boolean;
  onEditRoot?: (node: TreeNode) => void;
  homeSpaceId?: string;
}

interface TreeNodeViewProps {
  node: TreeNode;
  defaultOpen?: boolean;
  onEditRoot?: (node: TreeNode) => void;
  isTopLevel?: boolean;
  parentNode?: TreeNode;
  homeSpaceId?: string;
}
export const TreeView = ({
  data,
  defaultOpen = false,
  onEditRoot,
  homeSpaceId,
}: TreeViewProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground px-2 py-1">
        No nodes yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {data.map((node) => (
        <TreeNodeView
          key={node.id}
          node={node}
          defaultOpen={defaultOpen}
          onEditRoot={onEditRoot}
          isTopLevel
          homeSpaceId={homeSpaceId}
        />
      ))}
    </div>
  );
};

export const TreeNodeView = ({
  node,
  defaultOpen = false,
  onEditRoot,
  isTopLevel = false,
  parentNode,
  homeSpaceId,
}: TreeNodeViewProps) => {
  const pathname = usePathname();
  const spaceSlug = node.path.split("/")[0];
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isClient, setIsClient] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [hasLinkedDescendants, setHasLinkedDescendants] = useState(false);
  const [isLinkedInstance, setIsLinkedInstance] = useState(false);

  const activeEditorId = useTreeStore((s) => s.activeEditorId);
  const setActiveEditorId = useTreeStore((s) => s.setActiveEditorId);

  // Check if node is linked (appears multiple times globally)
  // const isLinked = useMemo(() => {
  //   const allTrees = Object.values(useTreeStore.getState().treesBySpace).flat();
  //   return countNodeOccurrences(allTrees, node.id) > 1;
  // }, [node.id]);

  const isCreating = activeEditorId === `create-${node.id}`;
  const isEditing = activeEditorId === `edit-${node.id}`;

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-open when creating a child so the form is visible
  useEffect(() => {
    if (isCreating) {
      setIsOpen(true);
    }
  }, [isCreating]);

  // Auto-open when editing (if not top level) so the form is visible
  useEffect(() => {
    if (isEditing && !isTopLevel) {
      setIsOpen(true);
    }
  }, [isEditing, isTopLevel]);

  const isActive =
    pathname === `/${node.path}` || pathname === `/node/${node.path}`;

  if (!isClient) {
    return null;
  }

  const hasChildren = node.children && node.children.length > 0;

  // Determine the homeSpaceId for children.
  // If this node is a Space, it defines a new "home" context for its descendants.
  const childHomeSpaceId =
    node.nodetype === "Space" ? node.spaceId : homeSpaceId;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "group/row flex items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent w-full text-left",
          isActive &&
            "bg-sidebar-primary/20 text-sidebar-primary-foreground font-semibold"
        )}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </Button>
          </CollapsibleTrigger>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}

        <Link
          href={`/node/${node.path}`}
          className="flex items-center gap-2 flex-1"
        >
          <NodeIcon nodetype={node.nodetype} className="h-4 w-4 shrink-0" />
          <span className="truncate">{node.title}</span>
          {homeSpaceId && node.spaceId !== homeSpaceId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <LinkIcon className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Linked Node (Shared Reference)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Link>

        <div
          className={cn(
            "ml-auto flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
          )}
        >
          <Badge variant="outline">{node.nodetype}</Badge>
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
                setActiveEditorId(`create-${node.id}`);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveEditorId(`edit-${node.id}`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog
              open={showDeleteAlert}
              onOpenChange={setShowDeleteAlert}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  // Check if node itself is linked
                  const allTrees = Object.values(
                    useTreeStore.getState().treesBySpace
                  ).flat();
                  const count = countNodeOccurrences(allTrees, node.id);

                  if (count > 1) {
                    setIsLinkedInstance(true);
                    setShowDeleteAlert(true);
                    return;
                  }

                  setIsLinkedInstance(false);

                  // Check descendants for links
                  let linkedChildren = false;
                  const checkDescendants = (n: TreeNode) => {
                    if (linkedChildren) return;
                    if (n.children) {
                      for (const child of n.children) {
                        const childCount = countNodeOccurrences(
                          allTrees,
                          child.id
                        );
                        if (childCount > 1) {
                          linkedChildren = true;
                          return;
                        }
                        checkDescendants(child);
                      }
                    }
                  };
                  checkDescendants(node);
                  setHasLinkedDescendants(linkedChildren);
                  setShowDeleteAlert(true);
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isLinkedInstance ? "Unlink Node?" : "Delete Node?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isLinkedInstance ? (
                      <span className="block mt-2 text-amber-600 font-medium">
                        FYI: This node is linked elsewhere, but removing it here
                        does not affect them, we just want you to know.
                      </span>
                    ) : (
                      <>
                        Are you sure you want to delete &quot;{node.title}
                        &quot;? This action cannot be undone.
                        {hasLinkedDescendants && (
                          <span className="block mt-2 text-amber-600 font-medium">
                            Note: This node contains linked children. They will
                            be unlinked from here but preserved in their other
                            locations.
                          </span>
                        )}
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isLinkedInstance) {
                        unlinkNode(spaceSlug, parentNode?.id ?? null, node.id)
                          .then((res) => {
                            if (res?.ok) {
                              toast({ title: `"${node.title}" Unlinked` });
                              router.refresh();
                            }
                          })
                          .catch(() =>
                            toast({
                              title: "Failed to unlink",
                              variant: "destructive",
                            })
                          );
                      } else {
                        deleteNode(spaceSlug, node.id)
                          .then((res) => {
                            if (res?.ok) {
                              toast({ title: `"${node.title}" Deleted` });
                              router.refresh();
                            } else {
                              toast({
                                title: "Delete not supported",
                                variant: "destructive",
                              });
                            }
                          })
                          .catch(() =>
                            toast({
                              title: "Failed to delete",
                              variant: "destructive",
                            })
                          );
                      }
                    }}
                  >
                    {isLinkedInstance ? "Remove" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        </div>
      </div>

      {isTopLevel && isEditing && (
        <InlineCreateNode
          spaceSlug={spaceSlug}
          mode="edit"
          editNode={node}
          depth={0}
          onCancel={() => setActiveEditorId(null)}
        />
      )}

      <CollapsibleContent>
        <div className="pl-6 border-l border-sidebar-border ml-3 flex flex-col gap-1 py-1">
          {isCreating && (
            <InlineCreateNode
              spaceSlug={spaceSlug}
              mode="child"
              parentNode={node}
              depth={1}
              onCancel={() => setActiveEditorId(null)}
              onSuccess={() => setIsOpen(true)}
            />
          )}
          {!isTopLevel && isEditing && (
            <InlineCreateNode
              spaceSlug={spaceSlug}
              mode="edit"
              editNode={node}
              parentNode={node}
              depth={1}
              onCancel={() => setActiveEditorId(null)}
            />
          )}
          {node.children?.map((child) => (
            <TreeNodeView
              key={child.id}
              node={child}
              defaultOpen={false}
              onEditRoot={onEditRoot}
              isTopLevel={false}
              parentNode={node}
              homeSpaceId={childHomeSpaceId}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const TreeViewWithCreate = ({
  data,
  defaultOpen = true,
}: TreeViewProps) => {
  return <TreeView data={data} defaultOpen={defaultOpen} />;
};
