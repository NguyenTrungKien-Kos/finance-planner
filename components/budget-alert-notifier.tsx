"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { CATEGORY_LABELS } from "@/lib/constants";
import {
  getBudgetAlertNotifications,
  type BudgetStatusItem,
} from "@/lib/finance";

export function BudgetAlertNotifier({
  userId,
  statuses,
}: {
  userId: string;
  statuses: BudgetStatusItem[];
}) {
  useEffect(() => {
    if (statuses.length === 0) return;

    const storageKey = `fp_budget_alerts_${userId}`;
    let storedKeys: string[] = [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          storedKeys = parsed.filter((x): x is string => typeof x === "string");
        }
      }
    } catch {
      storedKeys = [];
    }

    const notifiedSet = new Set(storedKeys);
    const { notifications, keysToMark } = getBudgetAlertNotifications(
      statuses,
      notifiedSet,
      CATEGORY_LABELS
    );

    if (notifications.length === 0) return;

    for (const item of notifications) {
      if (item.threshold === 100) {
        toast.error(item.message);
      } else {
        toast.warning(item.message);
      }
    }

    const updatedKeys = Array.from(new Set([...storedKeys, ...keysToMark]));
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
    } catch {
      // Bỏ qua nếu localStorage bị chặn
    }
  }, [userId, statuses]);

  return null;
}