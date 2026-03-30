import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  FileDown,
  Loader2,
  Plus,
  Printer,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CATEGORIES,
  type Category,
  type PriceTier,
  formatEur,
  formatOre,
  getActiveTier,
  tierLabel,
} from "../data/priceList";
import { useSaveQuote } from "../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────

type IvaMode = "inclusa" | "esclusa" | "nessuna";

interface LineItemState {
  id: string;
  categoryId: string;
  subTypeId: string;
  quantity: number;
  checkedAccessories: string[];
  kmValue: number;
  // Assistenza fields
  assistOreL: number;
  assistPersoneL: number;
  assistOreV: number;
  assistPersoneV: number;
  assistKm: number;
  // Note (tutte le sezioni)
  notes: string;
  // Ore extra (tutte le sezioni TRANNE Assistenza)
  extraOre: number;
  extraPrezzoOrario: number;
  // Etichetta personalizzata
  customLabel: string;
}

function emptyLineItem(id: string): LineItemState {
  return {
    id,
    categoryId: CATEGORIES[0].id,
    subTypeId: CATEGORIES[0].subTypes?.[0]?.id ?? "",
    quantity: 1,
    checkedAccessories: [],
    kmValue: 30,
    assistOreL: 1,
    assistPersoneL: 1,
    assistOreV: 0,
    assistPersoneV: 1,
    assistKm: 0,
    notes: "",
    extraOre: 0,
    extraPrezzoOrario: 25,
    customLabel: "",
  };
}

// ─── Computed helpers ──────────────────────────────────────────────────────────

interface ComputedItem {
  item: LineItemState;
  category: Category;
  tiers: PriceTier[];
  activeTier: PriceTier | null;
  isDaConcordare: boolean;
  baseSubtotal: number;
  accessoriesSubtotal: number;
  extraSubtotal: number;
  lineTotal: number;
  accessoryLines: {
    name: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }[];
  // assistenza
  assistLines: { label: string; subtotal: number }[];
}

function computeItem(item: LineItemState): ComputedItem {
  const category = CATEGORIES.find((c) => c.id === item.categoryId)!;

  // ── Assistenza special case
  if (category.isAssistenza) {
    const lavoroSubtotal = item.assistOreL * item.assistPersoneL * 25;
    const viaggioSubtotal = item.assistOreV * item.assistPersoneV * 10;
    const kmSubtotal = item.assistKm * 0.7;
    const lines: ComputedItem["assistLines"] = [];
    if (lavoroSubtotal > 0)
      lines.push({
        label: `Lavoro: ${formatOre(item.assistOreL)} × ${item.assistPersoneL} pers. @ 25€/h`,
        subtotal: lavoroSubtotal,
      });
    if (viaggioSubtotal > 0)
      lines.push({
        label: `Viaggio: ${formatOre(item.assistOreV)} × ${item.assistPersoneV} pers. @ 10€/h`,
        subtotal: viaggioSubtotal,
      });
    if (kmSubtotal > 0)
      lines.push({
        label: `Trasferta: ${item.assistKm} km × 0,70€`,
        subtotal: kmSubtotal,
      });
    const total = lavoroSubtotal + viaggioSubtotal + kmSubtotal;
    return {
      item,
      category,
      tiers: [],
      activeTier: null,
      isDaConcordare: false,
      baseSubtotal: total,
      accessoriesSubtotal: 0,
      extraSubtotal: 0,
      lineTotal: total,
      accessoryLines: [],
      assistLines: lines,
    };
  }

  const subType = category.subTypes?.find((s) => s.id === item.subTypeId);
  const tiers = subType ? subType.tiers : (category.tiers ?? []);
  const activeTier = getActiveTier(tiers, item.quantity);
  const isDaConcordare = activeTier?.unitPrice === null;
  const baseSubtotal =
    isDaConcordare || !activeTier || activeTier.unitPrice === null
      ? 0
      : activeTier.unitPrice * item.quantity;

  const accessoryLines: ComputedItem["accessoryLines"] = [];
  let accessoriesSubtotal = 0;

  for (const accId of item.checkedAccessories) {
    const acc = category.accessories.find((a) => a.id === accId);
    if (!acc) continue;
    if (acc.unit === "km") {
      const subtotal = acc.price * item.kmValue;
      accessoryLines.push({
        name: acc.name,
        qty: item.kmValue,
        unitPrice: acc.price,
        subtotal,
      });
      accessoriesSubtotal += subtotal;
    } else {
      const subtotal = acc.price * item.quantity;
      accessoryLines.push({
        name: acc.name,
        qty: item.quantity,
        unitPrice: acc.price,
        subtotal,
      });
      accessoriesSubtotal += subtotal;
    }
  }

  const extraSubtotal =
    item.extraOre > 0 && item.extraPrezzoOrario > 0
      ? item.extraOre * item.extraPrezzoOrario
      : 0;

  return {
    item,
    category,
    tiers,
    activeTier,
    isDaConcordare,
    baseSubtotal,
    accessoriesSubtotal,
    extraSubtotal,
    lineTotal: baseSubtotal + accessoriesSubtotal + extraSubtotal,
    accessoryLines,
    assistLines: [],
  };
}

// ─── HoursSelector ─────────────────────────────────────────────────────────────────
const MINUTE_OPTIONS = [
  { value: "0", label: "0 min" },
  { value: "0.25", label: "15 min" },
  { value: "0.5", label: "30 min" },
  { value: "0.75", label: "45 min" },
];

function HoursSelector({
  value,
  onChange,
  minHours = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  minHours?: number;
}) {
  const wholeHours = Math.floor(value);
  const minutes = Math.round((value - wholeHours) * 60);
  const minuteFraction = minutes / 60;

  const setWhole = (h: number) => {
    const clamped = Math.max(minHours, h);
    onChange(clamped + minuteFraction);
  };
  const setFraction = (f: number) => {
    onChange(wholeHours + f);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 text-base"
        onClick={() => setWhole(wholeHours - 1)}
        disabled={wholeHours <= minHours && minuteFraction === 0}
      >
        −
      </Button>
      <Input
        type="number"
        min={minHours}
        value={wholeHours}
        onChange={(e) =>
          setWhole(Math.max(minHours, Number.parseInt(e.target.value) || 0))
        }
        className="w-14 h-8 text-center font-semibold text-sm"
      />
      <span className="text-xs text-muted-foreground">ore</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0 text-base"
        onClick={() => setWhole(wholeHours + 1)}
      >
        +
      </Button>
      <Select
        value={minuteFraction.toString()}
        onValueChange={(v) => setFraction(Number(v))}
      >
        <SelectTrigger className="h-8 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── NoteField ─────────────────────────────────────────────────────────────────
function NoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Note
      </Label>
      <Textarea
        placeholder="Aggiungi note, dettagli del lavoro o informazioni per il cliente…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm min-h-[60px] resize-none"
        rows={2}
      />
    </div>
  );
}

// ─── ExtraOreSection ─────────────────────────────────────────────────────────────────
function ExtraOreSection({
  extraOre,
  extraPrezzoOrario,
  onUpdate,
}: {
  extraOre: number;
  extraPrezzoOrario: number;
  onUpdate: (updates: {
    extraOre?: number;
    extraPrezzoOrario?: number;
  }) => void;
}) {
  const extraTotal =
    extraOre > 0 && extraPrezzoOrario > 0 ? extraOre * extraPrezzoOrario : 0;

  return (
    <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-md p-3">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
        Lavoro extra / Ore extra cantiere
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ore extra</Label>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-base"
              onClick={() => onUpdate({ extraOre: Math.max(0, extraOre - 1) })}
            >
              −
            </Button>
            <Input
              type="number"
              min={0}
              step={0.25}
              value={extraOre}
              onChange={(e) =>
                onUpdate({ extraOre: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-16 h-8 text-center font-semibold text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-base"
              onClick={() => onUpdate({ extraOre: extraOre + 1 })}
            >
              +
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Prezzo orario (€)
          </Label>
          <Input
            type="number"
            min={0}
            value={extraPrezzoOrario}
            onChange={(e) =>
              onUpdate({
                extraPrezzoOrario: Math.max(0, Number(e.target.value) || 0),
              })
            }
            className="h-8 text-sm"
          />
        </div>
      </div>
      {extraTotal > 0 && (
        <p className="text-xs text-amber-700 font-medium">
          {extraOre} ore × {formatEur(extraPrezzoOrario)}/h ={" "}
          <strong>{formatEur(extraTotal)}</strong>
        </p>
      )}
    </div>
  );
}

// ─── Assistenza Card ─────────────────────────────────────────────────────────────────

function AssistenzaCard({
  item,
  computed,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: LineItemState;
  computed: ComputedItem;
  index: number;
  onUpdate: (updates: Partial<LineItemState>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className="bg-card border border-border rounded-lg shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={item.customLabel || `Voce ${index + 1}`}
            onChange={(e) => onUpdate({ customLabel: e.target.value })}
            placeholder={`Voce ${index + 1}`}
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-transparent border-0 border-b border-transparent focus:border-border focus:outline-none w-auto min-w-[80px] max-w-[200px] cursor-pointer"
            onClick={(e) => e.currentTarget.select()}
          />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            – Assistenza Tecnica
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
            title="Rimuovi voce"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Ore lavoro */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ore di lavoro
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Ore effettuate
              </Label>
              <HoursSelector
                value={item.assistOreL}
                onChange={(v) => onUpdate({ assistOreL: v })}
                minHours={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                N° persone
              </Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-base"
                  onClick={() =>
                    onUpdate({
                      assistPersoneL: Math.max(1, item.assistPersoneL - 1),
                    })
                  }
                >
                  −
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={item.assistPersoneL}
                  onChange={(e) =>
                    onUpdate({
                      assistPersoneL: Math.max(
                        1,
                        Number.parseInt(e.target.value) || 1,
                      ),
                    })
                  }
                  className="w-14 h-8 text-center font-semibold text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-base"
                  onClick={() =>
                    onUpdate({ assistPersoneL: item.assistPersoneL + 1 })
                  }
                >
                  +
                </Button>
                <span className="text-xs text-muted-foreground">pers.</span>
              </div>
            </div>
          </div>
          {item.assistOreL > 0 && (
            <p className="text-xs text-primary font-medium">
              {formatOre(item.assistOreL)} × {item.assistPersoneL} pers. × 25€/h
              ={" "}
              <strong>
                {formatEur(item.assistOreL * item.assistPersoneL * 25)}
              </strong>
            </p>
          )}
        </div>

        <Separator />

        {/* Ore viaggio */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ore di viaggio
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Ore effettuate
              </Label>
              <HoursSelector
                value={item.assistOreV}
                onChange={(v) => onUpdate({ assistOreV: v })}
                minHours={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                N° persone
              </Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-base"
                  onClick={() =>
                    onUpdate({
                      assistPersoneV: Math.max(1, item.assistPersoneV - 1),
                    })
                  }
                >
                  −
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={item.assistPersoneV}
                  onChange={(e) =>
                    onUpdate({
                      assistPersoneV: Math.max(
                        1,
                        Number.parseInt(e.target.value) || 1,
                      ),
                    })
                  }
                  className="w-14 h-8 text-center font-semibold text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-base"
                  onClick={() =>
                    onUpdate({ assistPersoneV: item.assistPersoneV + 1 })
                  }
                >
                  +
                </Button>
                <span className="text-xs text-muted-foreground">pers.</span>
              </div>
            </div>
          </div>
          {item.assistOreV > 0 && (
            <p className="text-xs text-primary font-medium">
              {formatOre(item.assistOreV)} × {item.assistPersoneV} pers. × 10€/h
              ={" "}
              <strong>
                {formatEur(item.assistOreV * item.assistPersoneV * 10)}
              </strong>
            </p>
          )}
        </div>

        <Separator />

        {/* Km trasferta */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Km trasferta
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={item.assistKm}
              onChange={(e) =>
                onUpdate({
                  assistKm: Math.max(0, Number.parseInt(e.target.value) || 0),
                })
              }
              className="w-24 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">
              km × 0,70€ = {formatEur(item.assistKm * 0.7)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Note */}
        <NoteField
          value={item.notes}
          onChange={(v) => onUpdate({ notes: v })}
        />

        {/* Subtotale */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Subtotale voce</span>
          <motion.span
            key={computed.lineTotal}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-base font-bold text-primary"
          >
            {formatEur(computed.lineTotal)}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Dispatcher: picks right card based on category ──────────────────────────────

function AnyItemCard(props: {
  item: LineItemState;
  computed: ComputedItem;
  index: number;
  onUpdate: (updates: Partial<LineItemState>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  if (props.computed.category.isAssistenza) {
    return <AssistenzaCard {...props} />;
  }
  return <LineItemCardWithCategorySwitch {...props} />;
}

// Wrapper that handles category switching (including switching to/from assistenza)
function LineItemCardWithCategorySwitch(props: {
  item: LineItemState;
  computed: ComputedItem;
  index: number;
  onUpdate: (updates: Partial<LineItemState>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { item, computed, index, onUpdate, onRemove, canRemove } = props;
  const { category, activeTier, isDaConcordare } = computed;

  const handleCategoryChange = (catId: string) => {
    const cat = CATEGORIES.find((c) => c.id === catId)!;
    onUpdate({
      categoryId: catId,
      subTypeId: cat.subTypes?.[0]?.id ?? "",
      checkedAccessories: [],
    });
  };

  const toggleAccessory = (accId: string, checked: boolean) => {
    onUpdate({
      checkedAccessories: checked
        ? [...item.checkedAccessories, accId]
        : item.checkedAccessories.filter((a) => a !== accId),
    });
  };

  const hasKm = item.checkedAccessories.some((id) => {
    const acc = category.accessories.find((a) => a.id === id);
    return acc?.unit === "km";
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      className="bg-card border border-border rounded-lg shadow-card overflow-hidden"
      data-ocid={`items.item.${index + 1}`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <input
          type="text"
          value={item.customLabel || `Voce ${index + 1}`}
          onChange={(e) => onUpdate({ customLabel: e.target.value })}
          placeholder={`Voce ${index + 1}`}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-transparent border-0 border-b border-transparent focus:border-border focus:outline-none w-auto min-w-[80px] max-w-[200px] cursor-pointer"
          onClick={(e) => e.currentTarget.select()}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
            data-ocid={`items.delete_button.${index + 1}`}
            title="Rimuovi voce"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categoria
            </Label>
            <Select
              value={item.categoryId}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger
                className="h-9 text-sm"
                data-ocid={`items.select.${index + 1}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {category.subTypes && category.subTypes.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tipo / Fascia
              </Label>
              <Select
                value={item.subTypeId}
                onValueChange={(v) => onUpdate({ subTypeId: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {category.subTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {category.quantityLabel ?? "Quantità (pz)"}
            </Label>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 text-base"
                onClick={() =>
                  onUpdate({ quantity: Math.max(1, item.quantity - 1) })
                }
              >
                −
              </Button>
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  onUpdate({
                    quantity: Math.max(1, Number.parseInt(e.target.value) || 1),
                  })
                }
                className="w-16 h-9 text-center font-semibold"
                data-ocid={`items.input.${index + 1}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 text-base"
                onClick={() => onUpdate({ quantity: item.quantity + 1 })}
              >
                +
              </Button>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {isDaConcordare ? (
              <div
                className="flex items-center gap-2 bg-destructive/10 rounded-md px-3 py-2"
                data-ocid={`items.error_state.${index + 1}`}
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-concordare text-sm">
                  Prezzo da concordare
                </span>
              </div>
            ) : activeTier ? (
              <div className="bg-primary-subtle rounded-md px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Fascia applicata
                </p>
                <p className="text-sm font-semibold text-primary">
                  {tierLabel(activeTier)}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-destructive/10 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-sm text-destructive">
                  Quantità fuori fascia
                </span>
              </div>
            )}
          </div>
        </div>

        {category.accessories.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Accessori
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {category.accessories.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between gap-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${item.id}-${acc.id}`}
                      checked={item.checkedAccessories.includes(acc.id)}
                      onCheckedChange={(c) =>
                        toggleAccessory(acc.id, c === true)
                      }
                      data-ocid={`items.checkbox.${index + 1}`}
                    />
                    <Label
                      htmlFor={`${item.id}-${acc.id}`}
                      className="text-xs cursor-pointer"
                    >
                      {acc.name}
                    </Label>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {acc.unit === "km"
                      ? `${acc.price.toFixed(2)}€/km`
                      : `+${formatEur(acc.price)}/pz`}
                  </span>
                </div>
              ))}
            </div>
            {hasKm && (
              <div className="mt-3 flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                  Km trasferta:
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={item.kmValue}
                  onChange={(e) =>
                    onUpdate({
                      kmValue: Math.max(
                        1,
                        Number.parseInt(e.target.value) || 1,
                      ),
                    })
                  }
                  className="w-24 h-8 text-sm"
                  data-ocid={`items.input.${index + 1}`}
                />
                <span className="text-xs text-muted-foreground">
                  km × 0,70€ = {formatEur(item.kmValue * 0.7)}
                </span>
              </div>
            )}
          </div>
        )}

        {category.note && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5 italic">
            {category.note}
          </p>
        )}

        {/* Ore extra cantiere */}
        <ExtraOreSection
          extraOre={item.extraOre}
          extraPrezzoOrario={item.extraPrezzoOrario}
          onUpdate={(updates) => onUpdate(updates)}
        />

        {/* Note */}
        <NoteField
          value={item.notes}
          onChange={(v) => onUpdate({ notes: v })}
        />

        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Subtotale voce</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={computed.lineTotal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-base font-bold ${isDaConcordare ? "text-concordare" : "text-primary"}`}
            >
              {isDaConcordare ? "Da concordare" : formatEur(computed.lineTotal)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Quote Preview ─────────────────────────────────────────────────────────────────

function QuotePreview({
  clientName,
  computedItems,
  grandTotal,
  hasConcordare,
  ivaMode,
  tipoDocumento,
}: {
  clientName: string;
  computedItems: ComputedItem[];
  grandTotal: number;
  hasConcordare: boolean;
  ivaMode: IvaMode;
  tipoDocumento: "Preventivo" | "Fattura";
}) {
  const today = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="print-document bg-white text-foreground rounded-lg border border-border p-8 space-y-6 text-sm">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            H&F Society
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            Door Stylist
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Data</p>
          <p className="font-semibold">{today}</p>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {tipoDocumento} per
        </p>
        <p className="text-lg font-semibold mt-0.5">{clientName}</p>
      </div>
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dettaglio Lavori
        </p>
        {computedItems.map((ci, idx) => {
          const subTypeName =
            ci.category.subTypes?.find((s) => s.id === ci.item.subTypeId)
              ?.name ?? "";
          const voceLabel = ci.item.customLabel || `Voce ${idx + 1}`;
          return (
            <div
              key={ci.item.id}
              className="border border-border rounded-md overflow-hidden"
            >
              <div className="bg-muted/40 px-4 py-2 flex justify-between items-center">
                <div>
                  <span className="font-semibold text-xs">
                    {voceLabel}. {ci.category.name}
                  </span>
                  {subTypeName && (
                    <span className="text-xs text-muted-foreground ml-2">
                      — {subTypeName}
                    </span>
                  )}
                </div>
                {!ci.category.isAssistenza && (
                  <Badge variant="secondary" className="text-xs">
                    {ci.item.quantity} pz
                  </Badge>
                )}
              </div>
              <div className="px-4 py-3 space-y-1.5">
                {ci.category.isAssistenza ? (
                  ci.assistLines.length > 0 ? (
                    ci.assistLines.map((al) => (
                      <div key={al.label} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {al.label}
                        </span>
                        <span className="font-medium">
                          {formatEur(al.subtotal)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Nessun importo inserito
                    </p>
                  )
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {ci.isDaConcordare
                          ? "Posa (prezzo da concordare)"
                          : `Posa × ${ci.item.quantity} pz @ ${formatEur(ci.activeTier?.unitPrice ?? 0)}/pz`}
                      </span>
                      <span
                        className={
                          ci.isDaConcordare
                            ? "text-concordare font-semibold"
                            : "font-medium"
                        }
                      >
                        {ci.isDaConcordare
                          ? "Da concordare"
                          : formatEur(ci.baseSubtotal)}
                      </span>
                    </div>
                    {ci.accessoryLines.map((al) => (
                      <div
                        key={al.name}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-muted-foreground">
                          {al.name} × {al.qty}
                        </span>
                        <span>{formatEur(al.subtotal)}</span>
                      </div>
                    ))}
                    {ci.extraSubtotal > 0 && (
                      <div className="flex justify-between text-xs bg-amber-50 rounded px-2 py-1">
                        <span className="text-amber-700 font-medium">
                          Lavoro extra ({ci.item.extraOre} ore ×{" "}
                          {formatEur(ci.item.extraPrezzoOrario)}/h)
                        </span>
                        <span className="text-amber-700 font-semibold">
                          {formatEur(ci.extraSubtotal)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span>Subtotale {voceLabel}</span>
                  <span
                    className={
                      ci.isDaConcordare ? "text-concordare" : "text-primary"
                    }
                  >
                    {ci.isDaConcordare
                      ? "Da concordare"
                      : formatEur(ci.lineTotal)}
                  </span>
                </div>
                {/* Note nel PDF */}
                {ci.item.notes && (
                  <div className="mt-2 bg-muted/40 rounded px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                      Note
                    </p>
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {ci.item.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-md px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide">
            Totale Complessivo
          </p>
          {ivaMode === "inclusa" && (
            <p className="text-xs text-muted-foreground">IVA inclusa</p>
          )}
          {ivaMode === "esclusa" && (
            <p className="text-xs text-muted-foreground">IVA esclusa</p>
          )}
        </div>
        <p
          className={`text-xl font-bold font-display ${
            hasConcordare ? "text-destructive" : "text-primary"
          }`}
        >
          {hasConcordare ? "Voci da concordare" : formatEur(grandTotal)}
        </p>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Questo preventivo è stato generato da H&F Society Door Stylist. Valido
        30 giorni.
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

let nextId = 1;
function newId() {
  return `item-${nextId++}`;
}

export default function CalcolatorePage() {
  const saveQuote = useSaveQuote();
  const printRef = useRef<HTMLDivElement>(null);

  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<LineItemState[]>([emptyLineItem(newId())]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ivaMode, setIvaMode] = useState<IvaMode>("inclusa");
  const [tipoDocumento, setTipoDocumento] = useState<"Preventivo" | "Fattura">(
    "Preventivo",
  );

  const computedItems = useMemo(() => items.map(computeItem), [items]);
  const hasConcordare = computedItems.some((ci) => ci.isDaConcordare);
  const grandTotal = computedItems.reduce((sum, ci) => sum + ci.lineTotal, 0);

  const updateItem = (id: string, updates: Partial<LineItemState>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it)),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyLineItem(newId())]);
  };

  const ivaTotaleLabel =
    ivaMode === "inclusa"
      ? "Totale preventivo (IVA inclusa)"
      : ivaMode === "esclusa"
        ? "Totale preventivo (IVA esclusa)"
        : "Totale preventivo";

  const handleSaveAndPrint = async () => {
    if (!clientName.trim()) {
      toast.error("Inserisci il nome del cliente");
      return;
    }
    const summary = computedItems.map((ci) => {
      const subTypeName =
        ci.category.subTypes?.find((s) => s.id === ci.item.subTypeId)?.name ??
        "";
      return {
        category: ci.category.name,
        subType: subTypeName || undefined,
        quantity: ci.category.isAssistenza ? null : ci.item.quantity,
        unitPrice: ci.activeTier?.unitPrice ?? null,
        subtotal: ci.lineTotal,
        extraOre: ci.item.extraOre > 0 ? ci.item.extraOre : undefined,
        extraPrezzoOrario:
          ci.item.extraOre > 0 ? ci.item.extraPrezzoOrario : undefined,
        extraSubtotal: ci.extraSubtotal > 0 ? ci.extraSubtotal : undefined,
        notes: ci.item.notes || undefined,
        customLabel: ci.item.customLabel || undefined,
        accessories: ci.category.isAssistenza
          ? ci.assistLines.map((al) => ({
              name: al.label,
              qty: 1,
              price: al.subtotal,
            }))
          : ci.accessoryLines.map((al) => ({
              name: al.name,
              qty: al.qty,
              price: al.subtotal,
            })),
      };
    });
    try {
      await saveQuote.mutateAsync({
        clientName: clientName.trim(),
        itemsSummary: JSON.stringify(summary),
        totalCents: BigInt(Math.round(grandTotal * 100)),
      });
      toast.success("Preventivo salvato con successo!");
    } catch {
      toast.error("Errore nel salvataggio (accedi per salvare)");
    }
    window.print();
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 no-print">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            Elenco dettagli Fattura
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Componi il preventivo aggiungendo le voci di lavoro.
          </p>
        </motion.div>

        <Card className="shadow-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Dati Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label
                  htmlFor="client-name"
                  className="text-xs text-muted-foreground"
                >
                  Nome e Cognome / Ragione Sociale
                </Label>
                <Input
                  id="client-name"
                  placeholder="Es. Mario Rossi"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-9"
                  data-ocid="quote.input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 mb-6">
          <AnimatePresence>
            {items.map((item, idx) => (
              <AnyItemCard
                key={item.id}
                item={item}
                computed={computedItems[idx]}
                index={idx}
                onUpdate={(updates) => updateItem(item.id, updates)}
                onRemove={() => removeItem(item.id)}
                canRemove={items.length > 1}
              />
            ))}
          </AnimatePresence>
        </div>

        <Button
          variant="outline"
          onClick={addItem}
          className="w-full mb-6 border-dashed border-primary/40 text-primary hover:border-primary hover:bg-primary/5"
          data-ocid="quote.secondary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi prodotto / voce
        </Button>

        <Card className="shadow-card border-primary/20">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {ivaTotaleLabel}
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={grandTotal}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`font-display text-3xl font-bold mt-0.5 ${
                      hasConcordare ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {hasConcordare
                      ? "Voci da concordare"
                      : formatEur(grandTotal)}
                  </motion.p>
                </AnimatePresence>
                {hasConcordare && (
                  <p className="text-xs text-destructive mt-1">
                    Una o più voci richiedono concordamento prezzo
                  </p>
                )}
                {/* Tipo documento selector */}
                <div className="flex items-center gap-2 mt-3">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Tipo documento:
                  </Label>
                  <Select
                    value={tipoDocumento}
                    onValueChange={(v) =>
                      setTipoDocumento(v as "Preventivo" | "Fattura")
                    }
                  >
                    <SelectTrigger
                      className="h-7 text-xs w-36"
                      data-ocid="quote.tipo_documento"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preventivo" className="text-xs">
                        Preventivo
                      </SelectItem>
                      <SelectItem value="Fattura" className="text-xs">
                        Fattura
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* IVA selector */}
                <div className="flex items-center gap-2 mt-3">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Regime IVA:
                  </Label>
                  <Select
                    value={ivaMode}
                    onValueChange={(v) => setIvaMode(v as IvaMode)}
                  >
                    <SelectTrigger
                      className="h-7 text-xs w-44"
                      data-ocid="quote.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inclusa" className="text-xs">
                        IVA inclusa
                      </SelectItem>
                      <SelectItem value="esclusa" className="text-xs">
                        IVA esclusa
                      </SelectItem>
                      <SelectItem value="nessuna" className="text-xs">
                        Non mostrare IVA
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!clientName.trim()}
                  data-ocid="quote.secondary_button"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Anteprima
                </Button>
                <Button
                  onClick={handleSaveAndPrint}
                  disabled={!clientName.trim() || saveQuote.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-ocid="quote.primary_button"
                >
                  {saveQuote.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4 mr-2" />
                  )}
                  {saveQuote.isPending ? "Salvataggio..." : "Genera Preventivo"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            data-ocid="quote.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display">
                Anteprima Preventivo
              </DialogTitle>
            </DialogHeader>
            <div ref={printRef}>
              <QuotePreview
                clientName={clientName || "—"}
                computedItems={computedItems}
                grandTotal={grandTotal}
                hasConcordare={hasConcordare}
                ivaMode={ivaMode}
                tipoDocumento={tipoDocumento}
              />
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(false)}
                data-ocid="quote.cancel_button"
              >
                Chiudi
              </Button>
              <Button
                onClick={handleSaveAndPrint}
                disabled={saveQuote.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-ocid="quote.confirm_button"
              >
                {saveQuote.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Stampa / Salva PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* print-only MUST be outside no-print wrapper so it's visible when printing */}
      <div className="print-only hidden">
        <QuotePreview
          clientName={clientName || "—"}
          computedItems={computedItems}
          grandTotal={grandTotal}
          hasConcordare={hasConcordare}
          ivaMode={ivaMode}
          tipoDocumento={tipoDocumento}
        />
      </div>
    </>
  );
}
