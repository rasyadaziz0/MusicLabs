export const API_BASE = process.env.NEXT_PUBLIC_EXPRESS_API_URL;

if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_EXPRESS_API_URL wajib diisi');
}
