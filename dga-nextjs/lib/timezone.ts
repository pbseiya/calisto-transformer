export function toBangkokLocal(isoStr: string): string {
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const d = new Date(isoStr);
  const b = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return b.getUTCFullYear() + '-' + pad2(b.getUTCMonth() + 1) + '-' + pad2(b.getUTCDate())
    + ' ' + pad2(b.getUTCHours()) + ':' + pad2(b.getUTCMinutes()) + ':' + pad2(b.getUTCSeconds());
}

export function roundDownTo15Min(date: Date): Date {
  const rounded = new Date(date);
  rounded.setUTCMinutes(Math.floor(rounded.getUTCMinutes() / 15) * 15, 0, 0);
  return rounded;
}
