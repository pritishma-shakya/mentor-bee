// (auth)/layout.tsx
"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import HeaderBar, { HeaderBarProps } from "@/components/header-bar";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/context/SocketContext";

interface AuthLayoutProps {
  children: ReactNode;
  header?: Partial<HeaderBarProps>; // title, subtitle, showSearch, searchQuery, setSearchQuery, user
}

export default function AuthLayout({ children, header }: AuthLayoutProps) {
  const user = header?.user || null;

  return (
    <SocketProvider user={user}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 ml-30 pl-3 pr-2">
          {/* HeaderBar */}
          {header?.title && (
            <HeaderBar
              title={header.title}
              subtitle={header.subtitle}
              showSearch={header.showSearch}
              searchQuery={header.searchQuery}
              setSearchQuery={header.setSearchQuery}
              user={user}
            />
          )}

          {/* Page content with spacing below header */}
          <div className="mt-6">{children}</div>
          <Toaster position="top-right" />
        </main>
      </div>
    </SocketProvider>
  );
}
