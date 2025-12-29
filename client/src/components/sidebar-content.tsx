"use client";
import {
  SidebarHeader,
  SidebarContent as SidebarContentArea,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, FileText, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/types";
import { useTreeStore } from "@/lib/stores/tree-store";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NodeIcon } from "./node-icon";
// import { GomantoIcon } from "./icons";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SideBarContentProps = { trees: TreeNode[] };

type NodeWithContext = TreeNode & {
  homeSpaceId?: string;
};

function flattenTree(nodes: TreeNode[]): NodeWithContext[] {
  const result: NodeWithContext[] = [];
  const traverse = (list: TreeNode[], parentHomeSpaceId?: string) => {
    for (const node of list) {
      // Determine homeSpaceId: if node is Space, it sets the context.
      // Otherwise inherit from parent.
      // For top-level nodes in the list, if they are Spaces, they are their own home.
      const currentHomeSpaceId =
        node.nodetype === "Space" ? node.spaceId : parentHomeSpaceId;

      const nodeWithContext: NodeWithContext = {
        ...node,
        homeSpaceId: currentHomeSpaceId,
      };

      result.push(nodeWithContext);
      if (node.children) traverse(node.children, currentHomeSpaceId);
    }
  };
  traverse(nodes);
  return result;
}

function collectTopLevelOtherNodes(nodes: TreeNode[]): NodeWithContext[] {
  const result: NodeWithContext[] = [];
  const traverse = (list: TreeNode[], parentHomeSpaceId?: string) => {
    for (const node of list) {
      const currentHomeSpaceId =
        node.nodetype === "Space" ? node.spaceId : parentHomeSpaceId;

      if (node.nodetype === "Space" || node.nodetype === "Subspace") {
        // Continue traversing into containers
        if (node.children) traverse(node.children, currentHomeSpaceId);
      } else {
        // It's a "Node" content type. Add it.
        const nodeWithContext: NodeWithContext = {
          ...node,
          homeSpaceId: currentHomeSpaceId,
        };
        result.push(nodeWithContext);
      }
    }
  };
  traverse(nodes);
  return result;
}

function SidebarSection({
  title,
  nodes,
  defaultOpen = false,
  typeIcon,
}: {
  title: string;
  nodes: NodeWithContext[];
  defaultOpen?: boolean;
  typeIcon: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  if (nodes.length === 0) return null;

  if (isCollapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={title} onClick={() => toggleSidebar()}>
            {typeIcon}
            <span className="sr-only">{title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <Collapsible
      open={!isCollapsed && isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        <CollapsibleTrigger asChild>
          <button className="hover:bg-sidebar-accent rounded-sm p-0.5">
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform text-muted-foreground",
                isOpen && "rotate-90"
              )}
            />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <SidebarMenu>
          {nodes.map((node, index) => {
            const isActive =
              pathname === `/${node.path}` || pathname === `/node/${node.path}`;
            // Handle potential duplicate paths by using index as fallback or appending suffix
            // The user requested adding "mirrored-instance" to differentiate.
            // Since we can't easily know which one is "original" without checking the whole set,
            // we'll rely on the fact that if a key repeats, React complains.
            // We can generate a unique key by checking if this path has appeared before in this specific list render.
            // However, doing that inside map is tricky.
            // Simpler approach: use path + index if strict uniqueness is needed,
            // but to follow user request: we can just append index to key if we want.
            // But let's try to detect duplicates.
            const isDuplicate =
              nodes.findIndex((n) => n.path === node.path) !== index;
            const key = isDuplicate
              ? `${node.path}-mirrored-instance-${index}`
              : node.path;

            return (
              <SidebarMenuItem key={key}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={`/node/${node.path}`}>
                    <NodeIcon nodetype={node.nodetype} />
                    <span className="truncate">{node.title}</span>
                    {node.homeSpaceId && node.spaceId !== node.homeSpaceId && (
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
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function SidebarContent({ trees }: SideBarContentProps) {
  const treesBySpace = useTreeStore((s) => s.treesBySpace);
  const spaceForest = Object.values(treesBySpace).flat();
  const hasStoreData = Object.keys(treesBySpace).length > 0;
  const data = hasStoreData ? spaceForest : trees;

  const allNodes = flattenTree(data);
  const spaces = allNodes.filter((n) => n.nodetype === "Space");
  const subspaces = allNodes.filter((n) => n.nodetype === "Subspace");

  // Use specialized collector for "Nodes" to only show top-level items (no children)
  const otherNodes = collectTopLevelOtherNodes(data);

  return (
    <>
      <SidebarHeader className="border-b h-16 flex flex-row items-center justify-between px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          {/* <GomantoIcon className="h-8 w-8 text-primary" /> */}
          <h1
            className={cn(
              "text-xl font-semibold font-headline",
              "group-data-[collapsible=icon]:hidden"
            )}
          >
            Gomanto
          </h1>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContentArea className="p-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex flex-col gap-4 py-2">
              <SidebarSection
                key="spaces"
                title="Spaces"
                nodes={spaces}
                defaultOpen={true}
                typeIcon={<NodeIcon nodetype="Space" />}
              />
              <SidebarSection
                key="subspaces"
                title="Subspaces"
                nodes={subspaces}
                defaultOpen={true}
                typeIcon={<NodeIcon nodetype="Subspace" />}
              />
              <SidebarSection
                key="nodes"
                title="Nodes"
                nodes={otherNodes}
                defaultOpen={true}
                typeIcon={<FileText className="h-4 w-4" />}
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContentArea>
    </>
  );
}
