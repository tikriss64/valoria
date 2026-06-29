import { format, parseISO } from "date-fns";
export const fmtDate = (s: string) => format(parseISO(s), "dd/MM/yyyy HH:mm");
export const fmtDay = (s: string) => format(parseISO(s), "dd/MM/yyyy");
