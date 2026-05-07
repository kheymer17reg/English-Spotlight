"use client";

import { Copy, FileDown, FileText as FileTextIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ExportBar({
  text,
  filename,
  docxPayload,
}: {
  text: string;
  filename: string;
  docxPayload: any;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const onTxt = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDocx = async () => {
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docxPayload),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onCopy} className="gap-2">
        <Copy className="h-3.5 w-3.5" /> {copied ? "Скопировано" : "Копировать"}
      </Button>
      <Button variant="outline" size="sm" onClick={onTxt} className="gap-2">
        <FileTextIcon className="h-3.5 w-3.5" /> TXT
      </Button>
      <Button size="sm" onClick={onDocx} className="gap-2">
        <FileDown className="h-3.5 w-3.5" /> DOCX
      </Button>
      <Badge variant="outline" className="text-[10px]">с форматированием</Badge>
    </div>
  );
}
