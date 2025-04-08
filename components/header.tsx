"use client";

import { format } from "date-fns";
import LogoutBtnP from "./LogoutBtnP";
import Link from "next/link";
import { id } from "date-fns/locale";

export function Header() {
  const now = new Date();

  return (
    <div className="flex items-center justify-between p-4 border-4 border-black">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white border-3 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <span className="text-lg font-bold font-mono">{format(now, "EEE, dd MMM yyyy", { locale: id })}</span>
          </div>
          <div className="bg-white border-3 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-2">
            <Link href="/kasir/return">
              <span className="text-lg font-bold font-mono">Pengembalian</span>
            </Link>
          </div>
        </div>
        <LogoutBtnP label="Log out" />
      </div>
      <div className="text-3xl font-black transform -rotate-2 bg-[#93B8F3] text-white p-2 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">KASIR</div>
    </div>
  );
}
