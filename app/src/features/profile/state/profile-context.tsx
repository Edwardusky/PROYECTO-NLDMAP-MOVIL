
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  emptyProfile,
  type Profile,
} from "@/features/profile/model/profile";

import {
  useAuthSession,
} from "@/features/auth/state/auth-session-context";

type ProfileState = {
  profile: Profile;
  setProfile: Dispatch<SetStateAction<Profile>>;
};

const Context = createContext<ProfileState | null>(
  null
);

export function ProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuthSession();

  const [profile, setProfile] =
    useState<Profile>(emptyProfile);

  // Evita conservar datos locales de otra cuenta.
  useEffect(() => {
    setProfile({ ...emptyProfile });
  }, [user?.id]);

  return (
    <Context.Provider
      value={{ profile, setProfile }}
    >
      {children}
    </Context.Provider>
  );
}

export function useProfile() {
  const value = useContext(Context);

  if (!value) {
    throw new Error(
      "ProfileProvider missing"
    );
  }

  return value;
}
