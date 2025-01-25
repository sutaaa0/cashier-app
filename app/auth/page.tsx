import { getCurrentUser } from "@/server/actions";
import { redirect } from "next/navigation";

const page = async () => {
  const currentUser = await getCurrentUser();
  const level = currentUser?.level;

  if (level === "admin") {
    return redirect("/dashboard-admin");
  } else if (level === "petugas") {
    return redirect("/kasir");
  } else {
    return redirect("/login");
  }
};

export default page;
