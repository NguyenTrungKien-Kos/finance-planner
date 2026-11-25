"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createRecurringAction,
  updateRecurringAction,
  type RecurringActionState,
} from "@/app/actions/recurring";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPES,
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

export type EditableRecurringItem = {
  id: string;
  amount: number;
  description: string;
  type: (typeof TRANSACTION_TYPES)[number];
  category: (typeof CATEGORIES)[number];
  dayOfMonth: number;
};

type RecurringDialogProps =
  | { mode: "create" }
  | { mode: "edit"; item: EditableRecurringItem };

const INITIAL_STATE: RecurringActionState = { success: false };

function RecurringForm({
  mode,
  item,
  onSuccess,
}: {
  mode: "create" | "edit";
  item?: EditableRecurringItem;
  onSuccess: () => void;
}) {
  const action =
    mode === "edit" ? updateRecurringAction : createRecurringAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const [type, setType] = useState<(typeof TRANSACTION_TYPES)[number]>(
    item?.type ?? "EXPENSE"
  );
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    item?.category ?? "BILLS"
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Đã lưu giao dịch định kỳ");
      onSuccess();
    } else if (state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && item && (
        <input type="hidden" name="id" value={item.id} />
      )}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category" value={category} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recurring-type">Loại</Label>
          <Select
            value={type}
            onValueChange={(val) =>
              setType(val as (typeof TRANSACTION_TYPES)[number])
            }
          >
            <SelectTrigger id="recurring-type" className="w-full">
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
          {state.fieldErrors?.type && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.type[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recurring-category">Danh mục</Label>
          <Select
            value={category}
            onValueChange={(val) =>
              setCategory(val as (typeof CATEGORIES)[number])
            }
          >
            <SelectTrigger id="recurring-category" className="w-full">
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
          {state.fieldErrors?.category && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.category[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recurring-amount">Số tiền (VND)</Label>
          <Input
            id="recurring-amount"
            name="amount"
            type="number"
            min={1}
            step={1}
            defaultValue={item?.amount ?? ""}
            placeholder="VD: 3500000"
            required
          />
          {state.fieldErrors?.amount && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.amount[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recurring-day">Ngày hàng tháng (1-31)</Label>
          <Input
            id="recurring-day"
            name="dayOfMonth"
            type="number"
            min={1}
            max={31}
            step={1}
            defaultValue={item?.dayOfMonth ?? 1}
            required
          />
          {state.fieldErrors?.dayOfMonth && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.dayOfMonth[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="recurring-description">Mô tả</Label>
        <Input
          id="recurring-description"
          name="description"
          maxLength={120}
          defaultValue={item?.description ?? ""}
          placeholder="VD: Lương tháng, Tiền thuê trọ..."
          required
        />
        {state.fieldErrors?.description && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Đang lưu..."
            : mode === "edit"
              ? "Lưu thay đổi"
              : "Tạo định kỳ"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RecurringDialog(props: RecurringDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.mode === "create" ? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Thêm định kỳ
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Sửa giao dịch định kỳ ${props.item.description}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create"
              ? "Thêm giao dịch định kỳ"
              : "Chỉnh sửa giao dịch định kỳ"}
          </DialogTitle>
          <DialogDescription>
            Giao dịch sẽ tự động sinh mỗi tháng đúng vào ngày bạn thiết lập.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RecurringForm
            mode={props.mode}
            item={props.mode === "edit" ? props.item : undefined}
            onSuccess={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}