'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';

import { Heart } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

type MemoryProfile = Database['public']['Tables']['memory_profiles']['Row'];

const fetcher = async (): Promise<MemoryProfile[]> => {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('memory_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Memory profiles fetch error:', profilesError);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('Fetcher error:', error);
    return [];
  }
};

const MemoryProfileItem = ({
  profile,
  isActive,
  setOpenMobile,
}: {
  profile: MemoryProfile;
  isActive: boolean;
  setOpenMobile: (open: boolean) => void;
}) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild isActive={isActive}>
      <Link
        href={`/memories/${profile.id}`}
        onClick={() => setOpenMobile(false)}
      >
        <Heart className="size-4 text-purple-600" />
        <span>{profile.name}</span>
        {profile.relationship && (
          <span className="text-xs text-muted-foreground ml-auto">
            {profile.relationship}
          </span>
        )}
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

export function SidebarMemoryProfiles({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const {
    data: profiles,
    isLoading,
    mutate,
  } = useSWR<MemoryProfile[]>(
    user ? ['memory-profiles', user.id] : null,
    fetcher,
    {
      fallbackData: [],
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  useEffect(() => {
    mutate();
  }, [mutate]);

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Memory Profiles</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 p-2">
            <div>Login to see your memory profiles!</div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Memory Profiles</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div className="h-4 w-4 rounded-full bg-sidebar-accent-foreground/10 animate-pulse" />
                <div className="h-4 rounded-md flex-1 max-w-[60%] bg-sidebar-accent-foreground/10 animate-pulse" />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (profiles?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Memory Profiles</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="text-zinc-500 w-full flex flex-col justify-center items-center text-sm gap-2 p-2">
            <div className="text-center">
              Your loved ones will appear here once you upload WhatsApp chats!
            </div>
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-700 text-xs underline"
              onClick={() => setOpenMobile(false)}
            >
              Upload WhatsApp Chat
            </Link>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Memory Profiles</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {profiles?.map((profile) => (
            <MemoryProfileItem
              key={profile.id}
              profile={profile}
              isActive={profile.id === id}
              setOpenMobile={setOpenMobile}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
