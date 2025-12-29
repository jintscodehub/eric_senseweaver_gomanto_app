"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import Breadcrumb from "./breadcrumb";
import { useBreadcrumb } from "@/context/breadcrumb-context";

export default function AppHeader() {
  const { ancestors, currentNode } = useBreadcrumb();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 sm:hidden">
        <SidebarTrigger />
      </div>

      <Breadcrumb ancestors={ancestors} currentNode={currentNode} />

      <div className="ml-auto flex items-center gap-4">
        {/* Additional header items can go here */}
      </div>
    </header>
  );
}
