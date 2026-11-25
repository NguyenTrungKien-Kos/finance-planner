"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  createTransactionAction,
  updateTransactionAction,
  type TransactionActionState,
} from "@/app/actions/transactions";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export type EditableTransaction = {
  id: string;
  amount: number;
  description: string;
  type: (typeof TRANSACTION_TYPES)[number];
  category: (typeof CATEGORIES)[number];
  date: string; // YYYY-MM-DD
};

type TransactionDialogProps =
  | { mode: "create" }
  | { mode: "edit"; transaction: EditableTransaction };

const INITIAL_STATE: TransactionActionState = { success: false };

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function TransactionForm({
  mode,
  transaction,
  onSuccess,
}: {
  mode: "create" | "edit";
  transaction?: EditableTransaction;
  onSuccess: () => void;
}) {
  const action =
    mode === "create" ? createTransactionAction : updateTransactionAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const [type, setType] = useState<(typeof TRANSACTION_TYPES)[number]>(
    transaction?.type ?? "EXPENSE"
  );
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    transaction?.category ?? "FOOD"
  );
  const [description, setDescription] = useState<string>(
    transaction?.description ?? ""
  );
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Thành công");
      onSuccess();
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  const handleSuggestCategory = async () => {
    const trimmed = description.trim();
    if (trimmed.length < 2) {
      toast.error("Vui lòng nhập mô tả ít nhất 2 ký tự trước khi gợi ý.");
      return;
    }

    setIsSuggesting(true);
    try {
      const response = await fetch("/api/ai/suggest-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: trimmed,
          type,
        }),
      });

      const data = (await response.json()) as {
        category?: (typeof CATEGORIES)[number];
        error?: string;
      };

      if (!response.ok || !data.category) {
        toast.error(data.error ?? "Không thể gợi ý danh mục lúc này.");
        return;
      }

      setCategory(data.category);
      toast.success(`Đã gợi ý danh mục: ${CATEGORY_LABELS[data.category]}`);
    } catch {
      toast.error("Lỗi kết nối khi gọi gợi ý AI.");
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && transaction && (
        <input type="hidden" name="id" value={transaction.id} />
      )}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category" value={category} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tx-type">Loại giao dịch</Label>
          <Select
            value={type}
            onValueChange={(val) =>
              setType(val as (typeof TRANSACTION_TYPES)[number])
            }
          >
            <SelectTrigger id="tx-type" className="w-full">
              <SelectValue placeholder="Chọn loại" />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TRANSACTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.type?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.type[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tx-category">Danh mục</Label>
          <Select
            value={category}
            onValueChange={(val) =>
              setCategory(val as (typeof CATEGORIES)[number])
            }
          >
            <SelectTrigger id="tx-category" className="w-full">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.category?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.category[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tx-amount">Số tiền (VND)</Label>
          <Input
            id="tx-amount"
            name="amount"
            type="number"
            step="1"
            placeholder="Ví dụ: 150000"
            defaultValue={transaction?.amount ?? ""}
          />
          {state.fieldErrors?.amount?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.amount[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tx-date">Ngày giao dịch</Label>
          <Input
            id="tx-date"
            name="date"
            type="date"
            defaultValue={transaction?.date ?? getTodayDateString()}
          />
          {state.fieldErrors?.date?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.date[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="tx-description">Mô tả (1–120 ký tự)</Label>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleSuggestCategory}
            disabled={isSuggesting || isPending || description.trim().length < 2}
          >
            {isSuggesting ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3.5 w-3.5" />
            )}
            {isSuggesting ? "Đang gợi ý..." : "Gợi ý AI"}
          </Button>
        </div>
        <Input
          id="tx-description"
          name="description"
          placeholder="Ví dụ: Cơm trưa văn phòng"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {state.fieldErrors?.description?.[0] && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Đang lưu..."
            : mode === "create"
              ? "Lưu giao dịch"
              : "Cập nhật"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TransactionDialog(props: TransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFormKey((k) => k + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.mode === "create" ? (
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Thêm giao dịch
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Sửa giao dịch ${props.transaction.description}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create"
              ? "Thêm giao dịch mới"
              : "Chỉnh sửa giao dịch"}
          </DialogTitle>
          <DialogDescription>
            Nhập đầy đủ thông tin thu chi bằng tiền VND (số nguyên dương).
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          key={formKey}
          mode={props.mode}
          transaction={props.mode === "edit" ? props.transaction : undefined}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}