import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler } from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { CameraRef, LngLat, MapRef } from "@maplibre/maplibre-react-native";
import { useProfile } from "@/features/profile/state/profile-context";
import { useReportDraft } from "@/features/reports/state/report-draft-context";
import { seedReport } from "@/features/reports/model/report-draft";
import { useDeviceLocation } from "./use-device-location";
import { casesAtPoint, type MapCase } from "../utils/map-cases";

// Camera events, projection and confirmation share the same invalidation lifecycle.
export function useMapSelection(visibleCases: MapCase[]) {
  const { profile } = useProfile();
  const {
    report,
    setReport,
    picking: selecting,
    setPicking: setSelecting,
    editingLocation,
    setEditingLocation,
  } = useReportDraft();
  const cameraRef = useRef<CameraRef>(null);
  const [confirming, setConfirming] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const operation = useRef(0);
  const busy = useRef<number | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const [selection, setSelection] = useState<LngLat | null>(null);
  const [projection, setProjection] = useState<{
    coordinate: LngLat;
    point: [number, number];
  } | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [cameraRevision, setCameraRevision] = useState(0);
  const [moving, setMoving] = useState(false);
  // Exact equality only: nearby points are not clustered or displaced.
  const selectedCases = casesAtPoint(visibleCases, selection);
  const selectedCoordinate = selectedCases.length ? selection : null;
  const point =
    projection && projection.coordinate === selectedCoordinate
      ? projection.point
      : null;

  const deviceLocation = useDeviceLocation((coordinate, approximate) => {
    if (!mapReady || !cameraRef.current) throw new Error("Map not ready");
    operation.current += 1;
    setSelection(null);
    setMoving(true);
    cameraRef.current.flyTo({
      center: coordinate,
      zoom: approximate ? 11 : 14,
      duration: 700,
    });
  });

  function startSelection() {
    operation.current += 1;
    setReport((current) => seedReport(current, profile));
    setEditingLocation(false);
    setSelection(null);
    setSelectionError(null);
    setSelecting(true);
  }

  function stopSelection() {
    operation.current += 1;
    busy.current = null;
    setSelecting(false);
    setConfirming(false);
    setSelectionError(null);
    setSelection(null);
  }

  function cancelSelection() {
    stopSelection();
    if (editingLocation) {
      setEditingLocation(false);
      router.navigate("/create-report");
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (editingLocation && selecting && mapReady && report.coordinate) {
        cameraRef.current?.jumpTo({ center: report.coordinate, zoom: 14 });
      }
    }, [editingLocation, selecting, mapReady, report.coordinate]),
  );

  useEffect(() => {
    if (!selecting) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        cancelSelection();
        return true;
      },
    );
    return () => subscription.remove();
  }, [selecting, editingLocation]);

  useEffect(
    () => () => {
      operation.current += 1;
      busy.current = null;
    },
    [],
  );

  async function confirmLocation() {
    if (
      !selecting ||
      busy.current !== null ||
      deviceLocation.loading ||
      moving ||
      !mapReady ||
      !mapRef.current ||
      !viewport.width ||
      !viewport.height
    )
      return;
    setConfirming(true);
    setSelectionError(null);
    const request = ++operation.current;
    busy.current = request;
    try {
      // Pixel center of the measured Map view, accounting for camera padding via unproject.
      const coordinate = await mapRef.current.unproject([
        viewport.width / 2,
        viewport.height / 2,
      ]);
      if (request !== operation.current) return;
      if (!coordinate.every(Number.isFinite) || Math.abs(coordinate[1]) > 90)
        throw new Error("Invalid coordinate");
      // Wrap longitude when the user has panned across a repeated world.
      const longitude = ((((coordinate[0] + 180) % 360) + 360) % 360) - 180;
      setReport((current) => ({
        ...seedReport(current, profile),
        coordinate: [longitude, coordinate[1]],
      }));
      stopSelection();
      setEditingLocation(false);
      router.navigate("/create-report");
    } catch {
      if (request === operation.current)
        setSelectionError(
          "No se pudo obtener la ubicación. Inténtalo de nuevo.",
        );
    } finally {
      if (busy.current === request) {
        busy.current = null;
        setConfirming(false);
      }
    }
  }

  // Projection responses can arrive after another selection or camera gesture.
  // Cleanup prevents such stale responses from placing a window at the wrong point.
  useEffect(() => {
    let cancelled = false;
    setProjection(null);
    if (!moving && selectedCoordinate && viewport.width && viewport.height) {
      mapRef.current
        ?.project(selectedCoordinate)
        .then((nextPoint) => {
          if (!cancelled)
            setProjection({ coordinate: selectedCoordinate, point: nextPoint });
        })
        .catch(() => {
          if (!cancelled) setProjection(null);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [selectedCoordinate, moving, cameraRevision, viewport]);

  function leaveSelection() {
    stopSelection();
    setEditingLocation(false);
  }

  function resizeViewport(width: number, height: number) {
    operation.current += 1;
    setViewport({ width, height });
  }

  function onRegionWillChange() {
    operation.current += 1;
    setMoving(true);
  }

  function onRegionDidChange() {
    setMoving(false);
    setCameraRevision((value) => value + 1);
  }

  function onDidFailLoadingMap() {
    operation.current += 1;
    setMapFailed(true);
    setMapReady(false);
  }

  function onDidFinishLoadingMap() {
    setMapFailed(false);
    setMapReady(true);
  }

  return {
    mapRef, cameraRef, viewport, resizeViewport,
    mapReady, mapFailed, moving, confirming, selectionError,
    selecting, reportStarted: report.started,
    selectedCases, selectedCoordinate, point, setSelection,
    deviceLocation, startSelection, confirmLocation, cancelSelection, leaveSelection,
    onRegionWillChange, onRegionDidChange, onDidFailLoadingMap, onDidFinishLoadingMap,
  };
}
