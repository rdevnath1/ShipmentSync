import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

type AuthResponse = {
  user: User;
};

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
  });

  return {
    user: data?.user,
    isLoading,
    isAuthenticated: !!data?.user && !error,
    error,
  };
}