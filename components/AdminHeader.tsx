"use client";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import LogoutBtnP from "./LogoutBtnP";

export function AdminHeader() {
  const now = new Date();

  return (
    <div className="flex items-center justify-between p-4 border-4 border-black">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white border-3 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2">
            <span className="text-lg font-bold font-mono">{format(now, "EEE, dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#FFD700] border-3 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
            <Clock className="h-6 w-6 text-black" />
            <span className="text-lg font-bold font-mono">
              {format(now, "HH:mm")} {format(now, "a").toUpperCase()}
            </span>
          </div>
        </div>
        <LogoutBtnP label="Logout" />
      </div>
      <div className="text-3xl font-black transform -rotate-2 bg-[#93B8F3] text-white p-2 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">DASHBOARD</div>
    </div>
  );
}
