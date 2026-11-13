import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { emptyProfile, type Profile } from '@/features/profile/model/profile';

type ProfileState = {
  profile: Profile; setProfile: Dispatch<SetStateAction<Profile>>;
};
const Context = createContext<ProfileState | null>(null);
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(emptyProfile);
  return <Context.Provider value={{ profile, setProfile }}>{children}</Context.Provider>;
}
export function useProfile() {
  const value = useContext(Context);
  if (!value) throw new Error('ProfileProvider missing');
  return value;
}
