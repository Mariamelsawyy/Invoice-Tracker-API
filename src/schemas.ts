import { z } from "zod";


export const createClientSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
});