import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Better Auth's catch-all handler serves every /api/auth/* endpoint.
export const { GET, POST } = toNextJsHandler(auth);
