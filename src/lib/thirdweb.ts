import { createThirdwebClient } from "thirdweb";

// Substitua NEXT_PUBLIC_TEMPLATE_CLIENT_ID pelo seu client ID da thirdweb
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error("Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID environment variable");
}

export const client = createThirdwebClient({
  clientId: clientId,
}); 