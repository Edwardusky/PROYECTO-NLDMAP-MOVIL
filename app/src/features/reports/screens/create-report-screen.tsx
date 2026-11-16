import { useCallback, useEffect, useState } from "react";
import { BackHandler, Text } from "react-native";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  Action,
  FormScreen,
  useFormStyles,
} from "@/shared/components/form-controls";
import { ReportProgress } from "../components/report-progress";
import { useProfile } from "@/features/profile/state/profile-context";
import { ReportContactStep } from "../components/report-contact-step";
import { ReportDescriptionStep } from "../components/report-description-step";
import { ReportIdentificationStep } from "../components/report-identification-step";
import { ReportLocationStep } from "../components/report-location-step";
import { ReportReviewStep } from "../components/report-review-step";
import { useReportDraft } from "../state/report-draft-context";
import {
  coordinateValid,
  reportErrors,
  seedReport,
  type Report,
  type Mark,
} from "@/features/reports/model/report-draft";

const sections = [
  "Identificación",
  "Descripción",
  "Hechos y ubicación",
  "Quien reporta",
  "Revisión del borrador",
];

export default function CreateReportScreen() {
  const s = useFormStyles();
  const { profile } = useProfile();
  const {
    report: r,
    setReport,
    step,
    setStep,
    setPicking,
    setEditingLocation,
  } = useReportDraft();
  const params = useLocalSearchParams<{
    longitude?: string;
    latitude?: string;
  }>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    setReport((current) => {
      const seeded = seedReport(current, profile);
      if (
        seeded.coordinate ||
        !params.longitude?.trim() ||
        !params.latitude?.trim()
      )
        return seeded;
      const coordinate: [number, number] = [
        Number(params.longitude),
        Number(params.latitude),
      ];
      return coordinateValid(coordinate) ? { ...seeded, coordinate } : seeded;
    });
  }, [params.longitude, params.latitude, profile, setReport]);
  const back = useCallback(() => {
    setNotice(null);
    setErrors({});
    if (step > 0) setStep(step - 1);
    else if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [step, setStep]);
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          back();
          return true;
        },
      );
      return () => subscription.remove();
    }, [back]),
  );
  function update<K extends keyof Report>(key: K, value: Report[K]) {
    setReport((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setNotice(null);
  }
  function addMark() {
    update("marks", [
      ...r.marks,
      {
        id: Math.max(0, ...r.marks.map((mark) => mark.id)) + 1,
        type: "",
        area: "",
        description: "",
      },
    ]);
  }
  function removeMark(id: number) {
    update(
      "marks",
      r.marks.filter((mark) => mark.id !== id),
    );
  }
  function updateMark(id: number, key: Exclude<keyof Mark, "id">, value: string) {
    update(
      "marks",
      r.marks.map((mark) => mark.id === id ? { ...mark, [key]: value } : mark),
    );
  }
  function pickLocation() {
    setEditingLocation(true);
    setPicking(true);
    router.navigate("/");
  }
  function copyProfileContact() {
    const seeded = seedReport({ ...r, started: false }, profile);
    setReport(seeded);
    setErrors({});
    setNotice("Datos del perfil copiados al borrador. Puedes corregirlos.");
  }
  function next() {
    const nextErrors = reportErrors(r, step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setNotice("Revisa los campos indicados antes de continuar.");
      return;
    }
    setNotice(null);
    setStep(step + 1);
  }
  function submit() {
    for (let index = 0; index < 4; index++) {
      const nextErrors = reportErrors(r, index);
      if (Object.keys(nextErrors).length) {
        setStep(index);
        setErrors(nextErrors);
        setNotice("Revisa los campos indicados.");
        return;
      }
    }
    setNotice("Campos comprobados. No se enviaron datos.");
  }
  function edit(index: number) {
    setStep(index);
    setErrors({});
    setNotice(null);
  }
  return (
    <FormScreen
      key={step}
      header={
        <ReportProgress
          step={step}
          sections={sections}
        />
      }
    >
      <Text style={s.body}>
        Completa los datos que conozcas.
        Los campos obligatorios se indican expresamente.
        Si desconoces un dato, utiliza la opción correspondiente
        cuando esté disponible.
      </Text>
      {/* <Text style={s.body}>
        Borrador temporal. Completa lo que sabes; los campos con * son
        obligatorios.
      </Text> */}
      {notice && (
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={s.body}
        >
          {notice}
        </Text>
      )}
      {step === 0 && (
        <ReportIdentificationStep report={r} errors={errors} onUpdate={update} />
      )}
      {step === 1 && (
        <ReportDescriptionStep
          report={r}
          errors={errors}
          onUpdate={update}
          onAddMark={addMark}
          onRemoveMark={removeMark}
          onUpdateMark={updateMark}
        />
      )}
      {step === 2 && (
        <ReportLocationStep
          report={r}
          errors={errors}
          onUpdate={update}
          onPickLocation={pickLocation}
        />
      )}
      {step === 3 && (
        <ReportContactStep
          report={r}
          errors={errors}
          onUpdate={update}
          onUseProfile={copyProfileContact}
        />
      )}
      {step === 4 && (
        <ReportReviewStep report={r} onEdit={edit} onSubmit={submit} />
      )}
      {step < 4 && (
        <Action
          label={step === 3 ? "Revisar borrador" : "Continuar"}
          onPress={next}
        />
      )}
      <Action
        secondary
        label={step ? "Paso anterior" : "Volver al mapa"}
        onPress={back}
      />
    </FormScreen>
  );
}
