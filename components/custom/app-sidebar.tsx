'use client';

import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { Plus, Heart } from 'lucide-react';
import { SidebarMemoryProfiles } from '@/components/custom/sidebar-memory-profiles';
import { SidebarUserNav } from '@/components/custom/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';

export function AppSidebar({ user }: { user: User | null }) {
  const router = useRouter();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 bg-white/80 backdrop-blur-sm">
      <SidebarHeader className="border-b border-gray-200/50">
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center px-2 py-3">
            <div
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
              className="flex flex-row gap-2 items-center cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                InLovingMemory
              </span>
            </div>
            <BetterTooltip content="Upload WhatsApp Chat" align="start">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </BetterTooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white/50">
        <SidebarMemoryProfiles user={user ?? undefined} />
      </SidebarContent>
      <SidebarFooter className="gap-0 border-t border-gray-200/50 bg-white/80">
        {user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarUserNav user={user} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
