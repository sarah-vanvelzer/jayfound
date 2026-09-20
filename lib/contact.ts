export function splitContact(contactInfo: string | null): { email: string; phone: string } {
  if (!contactInfo) return { email: "", phone: "" };
  const parts = contactInfo.split(",").map((p) => p.trim()).filter(Boolean);
  let email = "";
  let phone = "";
  for (const part of parts) {
    if (part.includes("@") && !email) email = part;
    else if (!phone) phone = part;
  }
  return { email, phone };
}