import LogoutBtn from "@/components/LogoutBtn";
import { getCurrentUser } from "@/server/actions";
import React from "react";

const page = async () => {
  const currentUser = await getCurrentUser();

  console.log(currentUser);


  return (
    <div className="container mx-auto flex justify-center items-center h-screen">
      <div className="flex flex-col items-center justify-center gap-y-5">
        <h1>Home</h1>
        <LogoutBtn />
      </div>
    </div>
  );
};

export default page;
