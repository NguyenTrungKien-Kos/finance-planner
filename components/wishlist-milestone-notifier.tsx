"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getWishlistMilestoneNotifications } from "@/lib/finance";

type NotifierItem = {
  id: string;
  name: string;
  cost: number;
};

export function WishlistMilestoneNotifier({
  userId,
  items,
  balance,
}: {
  userId: string;
  items: NotifierItem[];
  balance: number;
}) {
  useEffect(() => {
    if (items.length === 0) return;

    const storageKey = `fp_wishlist_milestones_${userId}`;
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
    const { notifications, keysToMark } = getWishlistMilestoneNotifications(
      items,
      balance,
      notifiedSet
    );

    if (notifications.length === 0) return;

    for (const item of notifications) {
      toast.success(item.message);
    }

    const updatedKeys = Array.from(new Set([...storedKeys, ...keysToMark]));
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
    } catch {
      // Bỏ qua nếu localStorage bị chặn
    }
  }, [userId, items, balance]);

  return null;
}