export type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  municipality: string;
  locality: string;
  postalCode: string;
  street: string;
  reference: string;
  social: string;
  photo: string | null;
};
export const emptyProfile: Profile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  state: "",
  municipality: "",
  locality: "",
  postalCode: "",
  street: "",
  reference: "",
  social: "",
  photo: null,
};
