
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import {
  Calendar,
  Bot,
  BarChart2,
  User,
  Gem,
} from 'lucide-react';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Calendar, label: 'Dashboard' },
  { href: '/dashboard/coach', icon: Bot, label: 'AI Coach' },
  { href: '/dashboard/insights', icon: BarChart2, label: 'Insights' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-primary shrink-0" />
          <span className="font-headline text-lg group-data-[collapsible=icon]:hidden">Hugfeed</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Link href="/pricing" className="w-full">
            <Button variant="outline" className={cn("w-full justify-start text-left", "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8")}>
                <Gem />
                <span className="group-data-[collapsible=icon]:hidden">Upgrade Plan</span>
            </Button>
        </Link>
        <SidebarSeparator />
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
