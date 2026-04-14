import { ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import Topbar from "@/components/Topbar";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

const PageLayout = ({ title, children }: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
