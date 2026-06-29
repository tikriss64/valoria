const KEY = "valoria_qc_auth";

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function login(password: string): boolean {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD as string;
  if (password === expected) {
    window.localStorage.setItem(KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  window.localStorage.removeItem(KEY);
}
