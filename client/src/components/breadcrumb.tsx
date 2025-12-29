"use client";

import Link from "next/link";
import type { Node } from "@/lib/types";
import { ChevronRight, Home } from "lucide-react";
import { useMemo } from "react";

type BreadcrumbProps = {
  ancestors: Node[];
  currentNode: Node | null;
};

export default function Breadcrumb({
  ancestors,
  currentNode,
}: BreadcrumbProps) {
  const pathSegments = useMemo(() => {
    let currentPath = "";
    const segs: { name: string; path: string }[] = [];

    ancestors.forEach((ancestor) => {
      currentPath = currentPath
        ? `${currentPath}/${ancestor.slug}`
        : ancestor.slug;
      if (ancestor.id !== "1") {
        segs.push({ name: ancestor.title, path: `/node/${currentPath}` });
      }
    });

    const currentSlug = currentNode?.slug ?? "";
    currentPath = currentPath ? `${currentPath}/${currentSlug}` : currentSlug;
    segs.push({
      name: currentNode?.title ?? "",
      path: `/node/${currentPath}`,
    });

    return segs;
  }, [ancestors, currentNode]);

  // if (pathSegments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center sm:flex">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-foreground">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {pathSegments.map((segment, index) => (
          <li key={segment.path} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4" />
            <Link
              href={segment.path}
              aria-current={
                index === pathSegments.length - 1 ? "page" : undefined
              }
              className={`whitespace-nowrap transition-colors hover:text-foreground ${
                index === pathSegments.length - 1
                  ? "font-medium text-foreground"
                  : ""
              }`}
            >
              {segment.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
