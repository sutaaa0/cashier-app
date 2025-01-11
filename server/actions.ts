"use server";

import { prisma } from "@/lib/db";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export async function Register(username: string, password: string, level: string) {
    try {

        const userExists = await prisma.user.findUnique({
            where: { username }, 
        })

        if(userExists) {
            return { status: "Failed", message: "User already exists", code: 400 };
        }

        // Hash password sebelum menyimpan ke database
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { username, password: hashedPassword, level },
        });

        return { status: "Success", data: user, code: 200 };
    } catch (error) {
        console.error("Error registering user:", error);
        return { status: "Failed", message: "Gagal", code: 500 };
    }
}



export async function Login(username: string, password: string) {

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return { status: "Failed", message: "User not found" };
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return {  status: "Failed", message: "Password incorrect" };
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return { status: "Success", data: { user, token } };
    } catch (error) {
        console.error("Error logging in user:", error);
        return { status: "Failed", message: "Gagal" };
    }
}