import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Quote, QuoteId } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type { Quote, QuoteId };

// ─── Quotes ───────────────────────────────────────────────────────────────────

export function useListAllQuotes() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Array<[QuoteId, Quote]>>({
    queryKey: ["quotes", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllQuotes();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSaveQuote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientName,
      itemsSummary,
      totalCents,
    }: {
      clientName: string;
      itemsSummary: string;
      totalCents: bigint;
    }) => {
      if (!actor) throw new Error("Actor non disponibile");
      return actor.saveQuote(clientName, itemsSummary, totalCents);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });
}

export function useDeleteQuote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: QuoteId) => {
      if (!actor) throw new Error("Actor non disponibile");
      return actor.deleteQuote(quoteId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<boolean>({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}
