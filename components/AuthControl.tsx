import { getCurrentUser } from "@/server/actions";
import { redirect } from "next/navigation";

const AuthControl = async () => {
  const currentUser = await getCurrentUser();
  const level = currentUser?.level;

  if (level === "ADMIN") {
    return redirect("/dashboard-admin");
  } else if (level === "PETUGAS") {
    return redirect("/kasir");
  } else {
    return redirect("/login");
  }
};

export default AuthControl;
