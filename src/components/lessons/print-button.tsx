"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()} className="gap-1">
      <Printer className="h-3 w-3" /> Печать / Сохранить как PDF
    </Button>
  );
}
