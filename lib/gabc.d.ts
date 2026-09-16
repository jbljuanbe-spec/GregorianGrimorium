export function parseGabc(source: string): { headers: Record<string, string>; body: string };
export function extractText(body: string): string;
export function stripHeaders(gabc: string): string;
export function gabcForRendering(gabc: string): string;
