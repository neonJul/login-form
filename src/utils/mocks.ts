export type LoginResponse =
  | { ok: true; token: string }
  | {
      ok: false;
      code: "INVALID_CREDENTIALS" | "LOCKED";
      message: string;
    };

export type DemoDB = Record<string, { password: string }>;

export const DEMO_DB: DemoDB = {
  "mock@email.com": { password: "Password123" },
};
