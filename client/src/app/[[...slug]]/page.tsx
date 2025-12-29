import { getTree, resolvePath } from "@/lib/api";
import { getSpaceSlug } from "@/lib/space";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MainContent from "@/components/main-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  // Determine space slug from first part of the path
  const { slug } = await params;
  const spaceSlug = getSpaceSlug(slug?.[0]);
  const pathParts = slug || [spaceSlug];
  const currentPath = pathParts.join("/");

  const data = await resolvePath(currentPath, spaceSlug);

  if (!data.node) {
    return { title: "Gomanto", description: "Knowledge-tree" };
  }

  return {
    title: `${data.node.title} | Gomanto`,
    description: `Viewing ${data.node.title} in the Gomanto knowledge graph.`,
  };
}

export default async function KnowledgeGraphPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const spaceSlug = getSpaceSlug(slug?.[0]);
  const trees = await getTree(spaceSlug);

  // Build the full path from params or default to spaceSlug
  const pathParts = slug ?? [spaceSlug];
  const currentPath = pathParts.join("/");

  const data = await resolvePath(currentPath, spaceSlug);

  if (!data.node && !process.env.NEXT_PUBLIC_USE_MOCK) {
    notFound();
  }

  return (
    <MainContent
      spaceSlug={spaceSlug}
      data={data}
      currentPath={currentPath}
      trees={trees}
      showTreeOnly
    />
  );
}
