// New file: global.d.ts (if not already present, create this file)
import { UserOptions } from "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}