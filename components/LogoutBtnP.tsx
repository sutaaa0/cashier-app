import React from "react";
import { NeoButton } from "./ui/neo-button";
import { toast } from "@/hooks/use-toast";
import { Logout } from "@/server/actions";
import { useRouter } from "next/navigation";

const LogoutBtnP = ({label} : {label : string}) => {
    const router = useRouter();

  const handleLogout = async () => {
    try {
      const log = await Logout();

      if (log.status === "Success") {
        toast({
          title: "Logout success",
          description: "You have been logged out",
        });

        // Use router.push instead of redirect
        router.push("/login");
        // Force a page refresh to clear client state
        router.refresh();
      }
    } catch (error) {
      if (error) {
        toast({
          title: "Error",
          description: "Something went wrong while logging out",
          variant: "destructive",
        });
      }
    }
  };
  return (
    <NeoButton size="sm" className="transform rotate-1" onClick={handleLogout}>
      {label}
    </NeoButton>
  );
};

export default LogoutBtnP;
