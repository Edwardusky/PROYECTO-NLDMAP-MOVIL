import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { emptyProfile, emptyReport, type Profile, type Report } from '@/data/local-draft';

type LocalDraft = {
  profile: Profile; setProfile: Dispatch<SetStateAction<Profile>>;
  report: Report; setReport: Dispatch<SetStateAction<Report>>;
  step: number; setStep: Dispatch<SetStateAction<number>>;
  picking: boolean; setPicking: Dispatch<SetStateAction<boolean>>;
  editingLocation: boolean; setEditingLocation: Dispatch<SetStateAction<boolean>>;
};
const Context = createContext<LocalDraft | null>(null);
export function LocalDraftProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [report, setReport] = useState(emptyReport);
  const [step, setStep] = useState(0);
  const [picking, setPicking] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  return <Context.Provider value={{ profile, setProfile, report, setReport, step, setStep, picking, setPicking, editingLocation, setEditingLocation }}>{children}</Context.Provider>;
}
export function useLocalDraft() {
  const value = useContext(Context);
  if (!value) throw new Error('LocalDraftProvider missing');
  return value;
}
