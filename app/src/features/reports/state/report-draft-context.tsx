import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { emptyReport, type Report } from '../model/report-draft';

type ReportDraft = {
  report: Report; setReport: Dispatch<SetStateAction<Report>>;
  step: number; setStep: Dispatch<SetStateAction<number>>;
  picking: boolean; setPicking: Dispatch<SetStateAction<boolean>>;
  editingLocation: boolean; setEditingLocation: Dispatch<SetStateAction<boolean>>;
};
const Context = createContext<ReportDraft | null>(null);
export function ReportDraftProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState(emptyReport);
  const [step, setStep] = useState(0);
  const [picking, setPicking] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  return <Context.Provider value={{ report, setReport, step, setStep, picking, setPicking, editingLocation, setEditingLocation }}>{children}</Context.Provider>;
}
export function useReportDraft() {
  const value = useContext(Context);
  if (!value) throw new Error('ReportDraftProvider missing');
  return value;
}
