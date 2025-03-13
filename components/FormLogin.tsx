"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCurrentUser, Login } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

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
    return (
      <NeoProgressIndicator isLoading={isAuthChecking} message="Checking authentication..." />
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-black font-mono">WELCOME BACK</h1>
            <p className="text-lg">Please enter your details</p>
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
                    w-full h-12 p-4 text-lg font-mono text-text bg-main 
                    border-2 border-border dark:border-darkBorder 
                    shadow-light dark:shadow-dark 
                    transform rotate-2 transition-all duration-200
                    hover:translate-y-1 hover:shadow-none dark:hover:shadow-none
                    focus:outline-none focus:border-[#4400FF]
                  `}
                  onKeyDown={() => handleKeyDown("username")}
                  onFocus={() => setActiveField("username")}
                  onBlur={() => setActiveField(null)}
                />
                <div
                  className={`
                  absolute -z-10 bg-black opacity-10 w-full h-full top-2 left-2 
                  transform rotate-2 transition-all duration-200
                  ${activeField === "username" ? "top-1 left-1 opacity-5" : ""}
                  ${activeField === "username" && typing ? "top-0 left-0" : ""}
                `}
                ></div>
              </div>
              {form.formState.errors.username && <p className="text-red-600 font-mono text-sm transform rotate-2">{form.formState.errors.username.message}</p>}
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
                    w-full h-12 p-4 text-lg font-mono text-text bg-main 
                    border-2 border-border dark:border-darkBorder 
                    shadow-light dark:shadow-dark 
                    transform -rotate-2 transition-all duration-200
                    hover:translate-y-1 hover:shadow-none dark:hover:shadow-none
                    focus:outline-none focus:border-[#4400FF]
                  `}
                  onKeyDown={() => handleKeyDown("password")}
                  onFocus={() => setActiveField("password")}
                  onBlur={() => setActiveField(null)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-transform hover:scale-110">
                  {showPassword ? <EyeOff size={24} className="transform -rotate-2 mb-2" /> : <Eye size={24} className="transform -rotate-2 mb-2" />}
                </button>
                <div
                  className={`
                  absolute -z-10 bg-black opacity-10 w-full h-full top-2 left-2 
                  transform -rotate-2 transition-all duration-200
                  ${activeField === "password" ? "top-1 left-1 opacity-5" : ""}
                  ${activeField === "password" && typing ? "top-0 left-0" : ""}
                `}
                ></div>
              </div>
              {form.formState.errors.password && <p className="text-red-600 font-mono text-sm transform -rotate-2">{form.formState.errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <div className="relative">
              <Button
                type="submit"
                className="w-full h-12 transition-all duration-200 bg-[#4400FF] text-white p-4 text-lg font-bold font-mono
                       hover:bg-[#3300CC] hover:translate-y-1 relative z-10"
              >
                Sign In
              </Button>
              <div
                className="absolute -z-10 bg-[#3300CC] opacity-40 w-full h-full top-2 left-0 
                transition-all duration-200 group-hover:top-0"
              ></div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}