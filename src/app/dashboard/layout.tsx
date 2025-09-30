
import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppStateProvider } from '@/context/app-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
      <SidebarProvider>
        <div className="min-h-screen flex">
          <AppSidebar />
          <SidebarInset>
            <div className="p-4 sm:p-6 lg:p-8 w-full">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppStateProvider>
  );
}
