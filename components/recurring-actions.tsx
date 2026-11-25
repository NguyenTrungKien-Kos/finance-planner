"use client";

import { useState, useTransition } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteRecurringAction,
  toggleRecurringAction,
} from "@/app/actions/recurring";
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

export function ToggleRecurringButton({
  id,
  description,
  isActive,
}: {
  id: string;
  description: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleRecurringAction(id, !isActive);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={handleToggle}
      aria-label={
        isActive
          ? `Tạm dừng giao dịch định kỳ ${description}`
          : `Kích hoạt giao dịch định kỳ ${description}`
      }
      title={isActive ? "Tạm dừng" : "Kích hoạt lại"}
    >
      {isActive ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4 text-emerald-600" />
      )}
    </Button>
  );
}

export function DeleteRecurringButton({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteRecurringAction(id);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          aria-label={`Xoá giao dịch định kỳ ${description}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận xoá giao dịch định kỳ</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xoá mẫu định kỳ &ldquo;{description}&rdquo;? Các
            giao dịch đã sinh trước đây vẫn được giữ nguyên.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Huỷ
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Đang xoá..." : "Xoá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}