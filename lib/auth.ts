import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "student"
}

export async function signIn(email: string, password: string) {
  // For demo purposes, we'll simulate authentication
  // In a real app, you'd use proper authentication
  const { data: users } = await supabase.from("users").select("*").eq("email", email).single()

  if (users) {
    return { user: users, error: null }
  }

  return { user: null, error: "Invalid credentials" }
}

export async function getCurrentUser(): Promise<User | null> {
  // In a real app, this would check the session
  // For demo, we'll return a mock user based on localStorage
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("currentUser")
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

export async function signOut() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser")
  }
}
