const employeeDomain = "@employees.billora.invalid";

export const employeeUsernamePattern = /^[a-z0-9][a-z0-9_-]{2,31}$/i;
export const employeeUsernameHint = "Use 3–32 letters, numbers, underscores, or hyphens. Start with a letter or number.";

export function employeeAuthEmail(username: string) {
  return `${username.toLowerCase()}${employeeDomain}`;
}

export function employeeLogin(email: string) {
  return email.endsWith(employeeDomain) ? email.slice(0, -employeeDomain.length) : email;
}
