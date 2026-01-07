import { z } from "zod";

export const addressIdSchema = z.object({
  id: z.coerce
  .number("ID must be a number")
  .int()
  .positive("ID must be a positive integer"),
});

export const addressUserIdSchema = z.object({
  user_id: z.coerce
  .number("ID must be a number")
  .int()
  .positive("ID must be a positive integer"),
});

export const addressSchema = z.object({
  address_line: z.string()
  .min(1, "Address line field is empty"),
  city: z.string()
  .min(1, "City field is empty"),
  state: z.string()
  .min(1, "State field is empty"),
  postal_code: z.string()
  .min(1, "Postal Code field is empty"),
  country: z.string()
  .min(1, "Country field is empty"),
});

export const addressUpdateSchema = addressSchema.partial();
