import { BadRequestError } from "./errors";

/** Reads and parses a JSON request body, throwing BadRequestError if invalid. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON");
  }
}
