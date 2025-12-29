import type { Metadata } from "next";
import { getSpaceSlug } from "@/lib/space";
import { resolvePath } from "@/lib/api";
import ClientNodePage from "@/components/client-node-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spaceSlug = getSpaceSlug(slug?.[0]);
  const pathParts = slug || [spaceSlug];
  const currentPath = pathParts.join("/");
  
  // Attempt to resolve on server (works for backend, fails for local-only)
  const data = await resolvePath(currentPath, spaceSlug);
  
  if (!data.node) {
    return { 
      title: "Gomanto",
      description: "Knowledge Graph"
    };
  }
  
  return {
    title: `${data.node.title} | Gomanto`,
    description: `Viewing ${data.node.title} in the Gomanto knowledge graph.`,
  };
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  return <ClientNodePage slug={slug} />;
}
