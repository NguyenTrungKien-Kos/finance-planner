"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Bỏ qua nếu trình duyệt/chế độ ẩn danh không hỗ trợ Service Worker
      });
    }
  }, []);

  return null;
}