
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppStateProvider } from '@/context/app-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
             <SidebarTrigger />
             {/* Add header content for mobile if needed */}
          </header>
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>
              <div className="p-4 sm:p-6 lg:p-8 w-full">
                {children}
              </div>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </AppStateProvider>
  );
}
