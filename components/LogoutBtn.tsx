"use client";

import React from "react";
import { Button } from "./ui/button";
import { Logout } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const LogoutBtn = () => {
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

  return <Button onClick={handleLogout}>Logout</Button>;
};

export default LogoutBtn;
