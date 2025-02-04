// components/AuthControl.tsx
import { getCurrentUser } from "@/server/actions"
import { redirect } from "next/navigation"

const AuthControl = async () => {
  const currentUser = await getCurrentUser()
  
  // Redirect langsung tanpa logic branching kompleks
  if (!currentUser) return redirect("/login")
  
  return redirect(
    currentUser.level === 'ADMIN' 
      ? '/dashboard-admin' 
      : currentUser.level === 'PETUGAS' 
        ? '/kasir' 
        : '/login'
  )
}

export default AuthControl