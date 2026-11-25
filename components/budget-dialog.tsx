"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  upsertBudgetAction,
  type BudgetActionState,
} from "@/app/actions/budgets";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
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

export type EditableBudgetItem = {
  id: string;
  category: (typeof CATEGORIES)[number];
  month: number;
  year: number;
  limit: number;
};

type BudgetDialogProps =
  | { mode: "create"; defaultMonth: number; defaultYear: number }
  | { mode: "edit"; item: EditableBudgetItem };

const INITIAL_STATE: BudgetActionState = { success: false };

function BudgetForm({
  mode,
  defaultMonth,
  defaultYear,
  item,
  onSuccess,
}: {
  mode: "create" | "edit";
  defaultMonth: number;
  defaultYear: number;
  item?: EditableBudgetItem;
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    upsertBudgetAction,
    INITIAL_STATE
  );

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    item?.category ?? "FOOD"
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Đã lưu ngân sách");
      onSuccess();
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="month" value={item?.month ?? defaultMonth} />
      <input type="hidden" name="year" value={item?.year ?? defaultYear} />

      <div className="space-y-1.5">
        <Label htmlFor="budget-category">Danh mục</Label>
        <Select
          value={category}
          disabled={mode === "edit"}
          onValueChange={(val) =>
            setCategory(val as (typeof CATEGORIES)[number])
          }
        >
          <SelectTrigger id="budget-category" className="w-full">
            <SelectValue placeholder="Chọn danh mục" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
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

      <div className="space-y-1.5">
        <Label htmlFor="budget-limit">
          Hạn mức tháng {item?.month ?? defaultMonth}/{item?.year ?? defaultYear}{" "}
          (VND)
        </Label>
        <Input
          id="budget-limit"
          name="limit"
          type="number"
          step="1"
          placeholder="Ví dụ: 3000000"
          defaultValue={item?.limit ?? ""}
        />
        {state.fieldErrors?.limit?.[0] && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.limit[0]}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Đang lưu..."
            : mode === "create"
              ? "Lưu ngân sách"
              : "Cập nhật hạn mức"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BudgetDialog(props: BudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFormKey((k) => k + 1);
    }
  };

  const month =
    props.mode === "edit" ? props.item.month : props.defaultMonth;
  const year = props.mode === "edit" ? props.item.year : props.defaultYear;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {props.mode === "create" ? (
          <Button size="sm" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            Đặt ngân sách
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Sửa ngân sách ${CATEGORY_LABELS[props.item.category]}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create"
              ? `Đặt ngân sách tháng ${month}/${year}`
              : `Sửa ngân sách ${CATEGORY_LABELS[props.item.category]}`}
          </DialogTitle>
          <DialogDescription>
            Hệ thống sẽ cảnh báo khi chi tiêu chạm 80% và khi vượt 100% hạn mức.
          </DialogDescription>
        </DialogHeader>

        <BudgetForm
          key={formKey}
          mode={props.mode}
          defaultMonth={month}
          defaultYear={year}
          item={props.mode === "edit" ? props.item : undefined}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}