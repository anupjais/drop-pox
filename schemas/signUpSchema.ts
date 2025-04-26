import * as z from "zod";

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email " }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password should be at least of 8 characters" })
    .max(16, { message: "Password should not be more than 16 characters" }),
  confirmPassword: z.string().min(1, { message: "Conform password" }),
})
.refine((data) => data.password == data.confirmPassword, {
    message: "Password do no matched",
    path: ["confirmPassword"]
})