"use client";

import * as React from "react";
import { Eye, EyeOff, ShoppingCart, Receipt, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCurrentUser, Login } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { NeoProgressIndicator } from "./NeoProgresIndicator";
import Image from "next/image";

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const [activeField, setActiveField] = React.useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = await getCurrentUser();

        // If user is already logged in, redirect based on role
        if (user) {
          if (user.level === "ADMIN") {
            router.push("/dashboard-admin");
          } else if (user.level === "PETUGAS") {
            router.push("/kasir");
          } else {
            router.push("/");
          }
        } else {
          // User is not logged in, show login form
          setIsAuthChecking(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthChecking(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  // Efek untuk animasi ketika mengetik
  React.useEffect(() => {
    if (typing) {
      const timer = setTimeout(() => setTyping(false), 150);
      return () => clearTimeout(timer);
    }
  }, [typing]);

  // Fungsi untuk menangani ketikan
  const handleKeyDown = (field: string) => {
    setTyping(true);
    setActiveField(field);
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const newUser = await Login(data.username, data.password);

      if (newUser.status === "Success") {
        toast({
          title: "Success",
          description: "Login successful!",
        });
        // Redirect based on user role
        if (newUser.data?.user?.level === "ADMIN") {
          router.push("/dashboard-admin");
        } else if (newUser.data?.user?.level === "PETUGAS") {
          router.push("/kasir");
        } else {
          router.push("/");
        }
      } else {
        toast({
          title: "Error",
          description: newUser.message || "Invalid username or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  // If still checking authentication status, show loading
  if (isAuthChecking) {
    return <NeoProgressIndicator isLoading={isAuthChecking} message="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex flex-col">
      {/* Header with POS Elements */}
      <div className="w-full p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-black font-mono text-black transform rotate-1 shadow-lg">CASHIER SYSTEM</h1>
          <div className="flex space-x-4 shadow-lg">
            <CreditCard size={32} className="text-black transform -rotate-3" />
            <Receipt size={32} className="text-black transform rotate-6" />
            <ShoppingCart size={32} className="text-black transform -rotate-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        {/* Decorative Elements */}
        <div className="absolute top-8 left-8 w-36 h-36 bg-[#f6f6f6] rounded-sm transform rotate-12 shadow-lg hidden md:block">
          <Image alt="contoh" src="/decorate5.png" fill />
        </div>
        <div className="absolute bottom-8 right-8 w-36 h-36 rounded-sm transform -rotate-6 shadow-lg hidden md:block">
          <Image alt="contoh" src="/decorate2.png" fill />
        </div>
        <div className="absolute top-1/3 right-16 w-36 h-36 rounded-sm transform rotate-45 shadow-lg hidden md:block">
          <Image alt="contoh" src="/decorate3.png" fill />
        </div>

        <div className="absolute top-[60%] left-20 w-36 h-36 rounded-sm transform rotate-45 shadow-lg hidden md:block">
          <Image alt="contoh" src="/decorate4.png" fill />
        </div>

        <div className="w-full max-w-[500px] space-y-8 bg-white p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24 bg-[#4ECDC4] rounded-full border-4 border-black overflow-hidden shadow-lg">
              <Image alt="money" src="/money.png" fill />
              </div>
            </div>
            <h1 className="text-4xl font-black font-mono text-black">CASHIER LOGIN</h1>
            <p className="text-lg font-mono border-b-4 border-[#FF6B35] pb-2 inline-block">Enter credentials to access POS system</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Username Input */}
            <div className="space-y-2">
              <div
                className={`
                relative transition-all duration-150 
                ${activeField === "username" && typing ? "transform translate-y-1 scale-[0.98]" : ""}
              `}
              >
                <input
                  {...form.register("username")}
                  placeholder="Username"
                  className={`
                    w-full h-12 p-4 text-lg font-mono text-black bg-[#FFE66D] 
                    border-4 border-black
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    transform rotate-1 transition-all duration-200
                    hover:translate-y-1 hover:shadow-none
                    focus:outline-none focus:bg-white
                  `}
                  onKeyDown={() => handleKeyDown("username")}
                  onFocus={() => setActiveField("username")}
                  onBlur={() => setActiveField(null)}
                />
                <div
                  className={`
                  absolute -z-10 bg-black opacity-10 w-full h-full top-2 left-2 
                  transform rotate-1 transition-all duration-200
                  ${activeField === "username" ? "top-1 left-1 opacity-5" : ""}
                  ${activeField === "username" && typing ? "top-0 left-0" : ""}
                `}
                ></div>
              </div>
              {form.formState.errors.username && <p className="text-red-600 font-mono text-sm transform rotate-1">{form.formState.errors.username.message}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div
                className={`
                relative transition-all duration-150
                ${activeField === "password" && typing ? "transform translate-y-1 scale-[0.98]" : ""}
              `}
              >
                <input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={`
                    w-full h-12 p-4 text-lg font-mono text-black bg-[#4ECDC4]
                    border-4 border-black
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    transform -rotate-1 transition-all duration-200
                    hover:translate-y-1 hover:shadow-none
                    focus:outline-none focus:bg-white
                  `}
                  onKeyDown={() => handleKeyDown("password")}
                  onFocus={() => setActiveField("password")}
                  onBlur={() => setActiveField(null)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform hover:scale-110">
                  {showPassword ? <EyeOff size={24} className="transform -rotate-1 text-black" /> : <Eye size={24} className="transform -rotate-1 text-black" />}
                </button>
                <div
                  className={`
                  absolute -z-10 bg-black opacity-10 w-full h-full top-2 left-2 
                  transform -rotate-1 transition-all duration-200
                  ${activeField === "password" ? "top-1 left-1 opacity-5" : ""}
                  ${activeField === "password" && typing ? "top-0 left-0" : ""}
                `}
                ></div>
              </div>
              {form.formState.errors.password && <p className="text-red-600 font-mono text-sm transform -rotate-1">{form.formState.errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <div className="relative">
              <Button
                type="submit"
                className="w-full h-14 transition-all duration-200 bg-[#88aaee] text-white p-4 text-lg font-bold font-mono
                       border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       hover:translate-y-1 hover:shadow-none relative z-10"
              >
                OPEN REGISTER
              </Button>
            </div>
          </form>

          {/* Receipt-like footer */}
          <div className="mt-8 pt-4 border-t-4 border-dashed border-black">
            <p className="font-mono text-center text-sm">SYSTEM v2.5 • SECURE POS • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
