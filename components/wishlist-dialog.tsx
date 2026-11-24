"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createWishlistAction,
  updateWishlistAction,
  type WishlistActionState,
} from "@/app/actions/wishlist";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/constants";
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

export type EditableWishlistItem = {
  id: string;
  name: string;
  cost: number;
  priority: (typeof PRIORITIES)[number];
};

type WishlistDialogProps =
  | { mode: "create" }
  | { mode: "edit"; item: EditableWishlistItem };

const INITIAL_STATE: WishlistActionState = { success: false };

function WishlistForm({
  mode,
  item,
  onSuccess,
}: {
  mode: "create" | "edit";
  item?: EditableWishlistItem;
  onSuccess: () => void;
}) {
  const action = mode === "create" ? createWishlistAction : updateWishlistAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>(
    item?.priority ?? "MEDIUM"
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Thành công");
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
      <input type="hidden" name="priority" value={priority} />

      <div className="space-y-1.5">
        <Label htmlFor="wl-name">Tên món đồ mong muốn</Label>
        <Input
          id="wl-name"
          name="name"
          placeholder="Ví dụ: Laptop mới"
          defaultValue={item?.name ?? ""}
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wl-cost">Giá mục tiêu (VND)</Label>
          <Input
            id="wl-cost"
            name="cost"
            type="number"
            step="1"
            placeholder="Ví dụ: 15000000"
            defaultValue={item?.cost ?? ""}
          />
          {state.fieldErrors?.cost?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.cost[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="wl-priority">Mức ưu tiên</Label>
          <Select
            value={priority}
            onValueChange={(val) =>
              setPriority(val as (typeof PRIORITIES)[number])
            }
          >
            <SelectTrigger id="wl-priority" className="w-full">
              <SelectValue placeholder="Chọn mức ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.fieldErrors?.priority?.[0] && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.priority[0]}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Đang lưu..."
            : mode === "create"
              ? "Thêm vào Wishlist"
              : "Cập nhật"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function WishlistDialog(props: WishlistDialogProps) {
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
          <Button size="sm" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            Thêm mục tiêu
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Sửa mục tiêu ${props.item.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "create"
              ? "Thêm món đồ vào Wishlist"
              : "Chỉnh sửa mục tiêu Wishlist"}
          </DialogTitle>
          <DialogDescription>
            Theo dõi tiến độ tiết kiệm dựa trên số dư hiện tại của bạn.
          </DialogDescription>
        </DialogHeader>

        <WishlistForm
          key={formKey}
          mode={props.mode}
          item={props.mode === "edit" ? props.item : undefined}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}