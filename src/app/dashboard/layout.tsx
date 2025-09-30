
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
        <div className="min-h-screen">
          <div className="flex flex-1">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
                <SidebarTrigger />
                {/* Header content for the main area can go here */}
              </header>
              <SidebarInset>
                <div className="p-4 sm:p-6 lg:p-8 w-full">
                  {children}
                </div>
              </SidebarInset>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </AppStateProvider>
  );
}
