import { toNodeHandler } from "better-auth/node";
import { auth } from "../../src/server/auth.js";

// Better Auth consumes the raw request body itself.
export const config = {
  api: {
    bodyParser: false
  }
};

export default toNodeHandler(auth.handler);
