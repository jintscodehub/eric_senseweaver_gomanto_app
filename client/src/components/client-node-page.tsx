"use client";

import { useEffect, useState } from "react";
import { getTree, resolvePathLocal } from "@/lib/api";
import { getSpaceSlug } from "@/lib/space";
import NodeView from "@/components/node-view";
// import IntelligentToolSuggestions from "@/components/ai/flows/intelligent-tool-suggestions";
import { useTreeStore } from "@/lib/stores/tree-store";
import { useBreadcrumb } from "@/context/breadcrumb-context";

interface ClientNodePageProps {
  slug?: string[];
}

export default function ClientNodePage({ slug }: ClientNodePageProps) {
  const [loading, setLoading] = useState(true);

  // Subscribe to store changes to handle hydration and updates
  // We use the store data directly for rendering to support optimistic updates
  const treesBySpace = useTreeStore((s) => s.treesBySpace);

  // Derived state from store (acts like a selector)
  const spaceSlug = getSpaceSlug(slug?.[0]);
  const trees = treesBySpace[spaceSlug] ?? [];

  const pathParts = slug || [spaceSlug];
  const currentPath = pathParts.join("/");

  // Resolve path from the store data
  const data = resolvePathLocal(currentPath, spaceSlug, trees);

  const { setBreadcrumbs } = useBreadcrumb();

  // Sync breadcrumbs
  useEffect(() => {
    if (data) {
      setBreadcrumbs(data.ancestors, data.node);
    }
  }, [data, setBreadcrumbs]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Fetch fresh data from API (which will sync to store)
        // We don't use the return value directly, we rely on the store update
        await getTree(spaceSlug);

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load node data:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [spaceSlug]); // Only re-fetch when switching spaces

  if (loading && trees.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!data?.node) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h1 className="text-2xl font-bold">Node not found</h1>
        <p className="text-muted-foreground">
          The requested node could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-col flex-1 transition-all w-full">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <NodeView
          node={data.node}
          childrenNodes={data.children}
          currentPath={slug ? slug.join("/") : data.node.slug}
        />
        <div className="mt-12">
          {/* <IntelligentToolSuggestions node={data.node} /> */}
        </div>
      </main>
    </div>
  );
}
