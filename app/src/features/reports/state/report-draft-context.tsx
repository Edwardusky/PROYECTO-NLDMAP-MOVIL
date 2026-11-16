
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  emptyReport,
  type Report,
} from "../model/report-draft";

type ReportDraft = {
  report: Report;
  setReport: Dispatch<SetStateAction<Report>>;

  step: number;
  setStep: Dispatch<SetStateAction<number>>;

  picking: boolean;
  setPicking: Dispatch<SetStateAction<boolean>>;

  editingLocation: boolean;
  setEditingLocation: Dispatch<SetStateAction<boolean>>;

  // Nueva operación centralizada.
  discardDraft: () => void;
};

const Context = createContext<ReportDraft | null>(null);

export function ReportDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [report, setReport] = useState<Report>(emptyReport);
  const [step, setStep] = useState(0);
  const [picking, setPicking] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  /**
   * Descartar completamente el borrador temporal.
   * No afecta al perfil ni a los reportes del mapa.
   */
  const discardDraft = useCallback(() => {
    setReport({
      ...emptyReport,
      marks: [],
    });

    setStep(0);
    setPicking(false);
    setEditingLocation(false);
  }, []);

  return (
    <Context.Provider
      value={{
        report,
        setReport,
        step,
        setStep,
        picking,
        setPicking,
        editingLocation,
        setEditingLocation,
        discardDraft,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useReportDraft() {
  const value = useContext(Context);

  if (!value) {
    throw new Error("ReportDraftProvider missing");
  }

  return value;
}
