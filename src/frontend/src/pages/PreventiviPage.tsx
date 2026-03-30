import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, FileText, LogIn, Trash2, User } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { formatEur } from "../data/priceList";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteQuote,
  useIsAdmin,
  useListAllQuotes,
} from "../hooks/useQueries";

export default function PreventiviPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const { data: quotes = [], isLoading } = useListAllQuotes();
  const deleteQuote = useDeleteQuote();

  const handleDelete = async (quoteId: bigint) => {
    try {
      await deleteQuote.mutateAsync(quoteId);
      toast.success("Preventivo eliminato");
    } catch {
      toast.error("Errore durante l'eliminazione");
    }
  };

  const sorted = [...quotes].sort(([, a], [, b]) =>
    Number(b.timestamp - a.timestamp),
  );

  if (!identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Storico Preventivi
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Accedi per visualizzare e gestire i preventivi salvati.
        </p>
        <Button
          onClick={() => login()}
          disabled={isLoggingIn}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="preventivi.primary_button"
        >
          <LogIn className="w-4 h-4 mr-2" />
          {isLoggingIn ? "Accesso in corso..." : "Accedi"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Storico Preventivi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tutti i preventivi salvati nel sistema.
        </p>
      </motion.div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {quotes.length} Preventiv{quotes.length === 1 ? "o" : "i"}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3" data-ocid="preventivi.loading_state">
              {[1, 2, 3, 4, 5].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="preventivi.empty_state"
            >
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessun preventivo ancora</p>
              <p className="text-xs mt-1">
                Genera il primo preventivo dal Preventivatore
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="preventivi.table">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">
                      Data
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">
                      Cliente
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold">
                      Riepilogo
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">
                      Totale
                    </TableHead>
                    {isAdmin && <TableHead className="w-16" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(([quoteId, quote], idx) => {
                    const date = new Date(Number(quote.timestamp / 1_000_000n));
                    let summary = "—";
                    try {
                      const parsed = JSON.parse(quote.itemsSummary);
                      if (Array.isArray(parsed)) {
                        summary = parsed
                          .map(
                            (it: any) =>
                              `${it.category}${it.subType ? ` (${it.subType})` : ""} ×${it.quantity}`,
                          )
                          .join(", ");
                      }
                    } catch {
                      summary = quote.itemsSummary;
                    }

                    return (
                      <motion.tr
                        key={quoteId.toString()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        data-ocid={`preventivi.item.${idx + 1}`}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {date.toLocaleDateString("it-IT")}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5 font-medium text-sm">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {quote.clientName}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <p
                            className="text-xs text-muted-foreground max-w-xs truncate"
                            title={summary}
                          >
                            {summary}
                          </p>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 font-semibold">
                            {formatEur(Number(quote.totalCents) / 100)}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="py-3">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  data-ocid={`preventivi.delete_button.${idx + 1}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent data-ocid="preventivi.dialog">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Elimina preventivo
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare il preventivo
                                    di <strong>{quote.clientName}</strong>?
                                    L'operazione non è reversibile.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-ocid="preventivi.cancel_button">
                                    Annulla
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(quoteId)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    data-ocid="preventivi.confirm_button"
                                  >
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        )}
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
