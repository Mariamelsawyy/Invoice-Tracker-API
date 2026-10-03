import { z } from "zod";



export const createClientSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
});
export const createInvoiceSchema = z.object({
  client_id: z.number().int().positive(),
  amount: z.number().positive(),
  due_date: z.iso.date(),
  vat_rate: z.number().min(0).max(100).default(20),
  status: z.enum(["draft", "sent", "paid"]).default("draft"),
});

export const listInvoicesQuerySchema = z.object({
  status: z.enum(["draft", "sent", "paid"]).optional(),
  overdue: z.literal("true").optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid"]),
});