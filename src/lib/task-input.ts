import { z } from "zod";

export const taskInputSchema = z.object({
  type: z.enum(["GENERAL", "CALLBACK"]).default("GENERAL"),
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.string().datetime().optional(),
  assigneeId: z.string().min(1).optional(),
}).refine((value) => value.type !== "CALLBACK" || Boolean(value.dueAt), {
  message: "A call-back date and time are required",
  path: ["dueAt"],
});
