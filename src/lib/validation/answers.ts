/** Проверка формы ответа на задание, пришедшего из браузера. */
import { z } from "zod";

export const exerciseAnswerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), index: z.number().int().min(0).max(10) }),
  z.object({ kind: z.literal("text"), text: z.string().max(300) }),
  z.object({ kind: z.literal("tiles"), tiles: z.array(z.string().max(40)).max(20) }),
  z.object({
    kind: z.literal("pairs"),
    mistakes: z.number().int().min(0).max(50),
    wrongPairs: z.array(z.string().max(80)).max(50),
  }),
]);

export const exerciseIdSchema = z.string().min(1).max(64);
