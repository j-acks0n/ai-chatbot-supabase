'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';

import { Heart, Plus, User as UserIcon } from 'lucide-react';
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
    <SidebarMenuButton asChild isActive={isActive} className="h-10 px-3">
      <Link
        href={`/memories/${profile.id}`}
        onClick={() => setOpenMobile(false)}
      >
        <div className="flex items-center space-x-3 w-full min-w-0">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <Heart className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {profile.name}
            </p>
            {profile.relationship && (
              <p className="text-xs text-gray-500 truncate">
                {profile.relationship}
              </p>
            )}
          </div>
        </div>
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
        <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
          Memory Profiles
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-3 py-4">
            <div className="text-center space-y-2">
              <UserIcon className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">
                Login to see your memory profiles
              </p>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
          Memory Profiles
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-3 py-2 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-3 h-10">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-2 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
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
        <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
          Memory Profiles
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-3 py-4">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">
                  No memories yet
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Upload WhatsApp chats to create memory profiles of your loved
                  ones
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-xs text-purple-600 hover:text-purple-700 font-medium group"
                onClick={() => setOpenMobile(false)}
              >
                <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span>Create Memory</span>
              </Link>
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
        Memory Profiles
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1 px-1">
          {profiles?.map((profile) => (
            <MemoryProfileItem
              key={profile.id}
              profile={profile}
              isActive={profile.id === id}
              setOpenMobile={setOpenMobile}
            />
          ))}
        </SidebarMenu>
        <div className="px-3 pt-2 pb-1">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs text-gray-500 hover:text-purple-600 py-2 group transition-colors"
            onClick={() => setOpenMobile(false)}
          >
            <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span>Add new memory</span>
          </Link>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
