export const MOCK_ADMIN = {
  email: "admin@messbilling.com",
  name: "Rishi",
  acceptedPasswords: ["rishi123", "rishigay"],
} as const;

export function isValidMockLogin(email: string, password: string) {
  return (
    email.trim().length > 0 &&
    MOCK_ADMIN.acceptedPasswords.includes(
      password as (typeof MOCK_ADMIN.acceptedPasswords)[number],
    )
  );
}
