export type ApiRecord = Record<string, unknown>;

export function asApiRecord(value: unknown): ApiRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as ApiRecord;
}

export function unwrapApiRecord(value: unknown, nestedKey?: string): ApiRecord | null {
  const record = asApiRecord(value);
  if (!record) return null;

  const data = asApiRecord(record.data);

  if (nestedKey) {
    return (
      asApiRecord(data?.[nestedKey]) ??
      data ??
      asApiRecord(record[nestedKey]) ??
      record
    );
  }

  return data ?? record;
}

export function resolveApiArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  const record = asApiRecord(value);
  if (!record) return [];

  if (Array.isArray(record.data)) return record.data as T[];
  if (Array.isArray(record.items)) return record.items as T[];

  const data = asApiRecord(record.data);
  return Array.isArray(data?.items) ? (data.items as T[]) : [];
}

export function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export function readNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  const record = asApiRecord(error);
  return readString(record?.message, fallback) || fallback;
}

export function getResponseMessage(value: unknown, fallback: string) {
  const record = unwrapApiRecord(value);
  return readString(record?.message, fallback) || fallback;
}
