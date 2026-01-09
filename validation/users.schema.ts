import { z } from "zod";

export const userIdSchema = z.object({
  id: z
    .coerce
    .number("ID must be a number")
    .int()
    .positive("ID must be a positive integer"),
});

export const userInfoSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters"),
  email: z.string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
});

export const userInsertSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().
    min(6, "Password must be at least 6 characters"),
});

export const userInsertTransactionSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().
    min(6, "Password must be at least 6 characters"),

  // Addresses Array
  addresses: z.array(
    z.object({
      address_line: z.string().min(1, "Address line is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      postal_code: z.string().min(1, "Postal code is required"),
      country: z.string().min(1, "Country is required"),
    })
  ).min(1, "At least one address is required")

});
