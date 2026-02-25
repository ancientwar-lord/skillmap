"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { AuthContext, useAuthLogic, useAuth } from "@/lib/auth/context";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authValue = useAuthLogic();

  return (
    <AuthContext.Provider value={authValue}>
      <LayoutContent>{children}</LayoutContent>
    </AuthContext.Provider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {!user && <Navbar />}
      {user && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}
      <main
        className={`min-h-screen transition-all duration-300  ${user ? (isSidebarCollapsed ? "md:pl-20" : "md:pl-64") : ""}`}
      >
        {children}
      </main>
      {!user && <Footer />}
    </>
  );
}
