export const emailValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const phoneValid = (value: string) =>
  /^[+\d\s().-]+$/.test(value) &&
  value.replace(/\D/g, "").length >= 7 &&
  value.replace(/\D/g, "").length <= 15;
