"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CSV_HEADERS } from "@/lib/csv";
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

type CsvRowError = {
  row: number;
  errors: string[];
};

type ImportApiResponse = {
  importedCount?: number;
  message?: string;
  error?: string;
  rowErrors?: CsvRowError[];
};

function buildExportUrl(period: string, type: string, category: string): string {
  const params = new URLSearchParams();
  if (period && period !== "all") {
    params.set("period", period);
  }
  if (type && type !== "ALL") {
    params.set("type", type);
  }
  if (category && category !== "ALL") {
    params.set("category", category);
  }
  const query = params.toString();
  return query
    ? `/api/transactions/export?${query}`
    : "/api/transactions/export";
}

function downloadSampleCsv() {
  const sampleLines = [
    CSV_HEADERS.join(","),
    "Cơm trưa văn phòng,FOOD,EXPENSE,2026-11-25,50000,VND",
    "Lương tháng 11,SALARY,INCOME,2026-11-01,15000000,VND",
  ];
  const content = `\uFEFF${sampleLines.join("\r\n")}`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "transactions-sample.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function TransactionCsvControls({
  period,
  type,
  category,
}: {
  period: string;
  type: string;
  category: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<CsvRowError[]>([]);

  const exportUrl = buildExportUrl(period, type, category);

  const resetState = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setRowErrors([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrorMessage(null);
    setRowErrors([]);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Vui lòng chọn tệp .csv trước khi tải lên.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setRowErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as ImportApiResponse;

      if (!response.ok) {
        const msg = data.error ?? "Không thể nhập tệp CSV.";
        setErrorMessage(msg);
        setRowErrors(data.rowErrors ?? []);
        toast.error(msg);
        return;
      }

      toast.success(
        data.message ??
          `Đã nhập thành công ${data.importedCount ?? 0} giao dịch.`
      );
      setOpen(false);
      resetState();
      router.refresh();
    } catch {
      const msg = "Lỗi kết nối khi nhập tệp CSV.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={exportUrl} download>
          <Download className="mr-1.5 h-4 w-4" />
          Xuất CSV
        </a>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="mr-1.5 h-4 w-4" />
            Nhập CSV
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhập giao dịch từ CSV</DialogTitle>
            <DialogDescription>
              Tệp CSV cần có dòng tiêu đề đúng thứ tự{" "}
              <code>description,category,type,date,amount,currency</code> (tối
              đa 500 dòng, dung lượng ≤ 1 MB).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p>
              <strong>date</strong>: <code>YYYY-MM-DD</code> ·{" "}
              <strong>type</strong>: <code>INCOME</code> hoặc{" "}
              <code>EXPENSE</code> · <strong>currency</strong>:{" "}
              <code>VND</code>
            </p>
            <p>
              <strong>category</strong>: <code>FOOD</code>,{" "}
              <code>TRANSPORT</code>, <code>ENTERTAINMENT</code>,{" "}
              <code>SHOPPING</code>, <code>BILLS</code>, <code>SALARY</code>,{" "}
              <code>INVESTMENT</code>, <code>OTHER</code>
            </p>
            <Button
              type="button"
              variant="link"
              size="xs"
              className="h-auto p-0 text-xs"
              onClick={downloadSampleCsv}
            >
              <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
              Tải tệp CSV mẫu
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="csv-import-file">Chọn tệp CSV (.csv)</Label>
              <Input
                id="csv-import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <p className="font-medium">{errorMessage}</p>
                {rowErrors.length > 0 && (
                  <ul className="max-h-36 list-disc space-y-1 overflow-y-auto pl-4">
                    {rowErrors.map((item) => (
                      <li key={item.row}>
                        <strong>Dòng {item.row}:</strong>{" "}
                        {item.errors.join("; ")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !selectedFile}>
                {isSubmitting && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Đang nhập..." : "Nhập giao dịch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}