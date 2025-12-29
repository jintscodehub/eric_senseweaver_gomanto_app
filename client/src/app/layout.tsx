import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import SidebarContent from "@/components/sidebar-content";
import AppHeader from "@/components/app-header";
import { BreadcrumbProvider } from "@/context/breadcrumb-context";
import { getTree } from "@/lib/api";
import { getSpaceSlug } from "@/lib/space";

export const metadata: Metadata = {
  title: "Gomanto",
  description: "The Knowledge Graph Social Network",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const spaceSlug = getSpaceSlug();
  const tree = await getTree(spaceSlug);
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn("min-h-screen bg-background font-body antialiased")}
        suppressHydrationWarning={true}
      >
        <BreadcrumbProvider>
          <SidebarProvider>
            <div className="flex">
              <Sidebar
                className="hidden flex-shrink-0 bg-sidebar sm:sticky sm:inset-y-0 sm:left-0 sm:z-20 sm:flex"
                collapsible="icon"
              >
                <SidebarContent trees={tree} />
              </Sidebar>
              <div className="flex-1 flex flex-col min-w-0">
                <AppHeader />
                {children}
              </div>
            </div>
            <Toaster />
          </SidebarProvider>
        </BreadcrumbProvider>
      </body>
    </html>
  );
}
