import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { useAppTheme } from "@/shared/theme/app-theme-context";
import { pointStatusLabel, type MapCase } from "../utils/map-cases";

type Props = {
  visibleCases: MapCase[];
  selecting: boolean;
  onSelect: (coordinate: [number, number]) => void;
};

export function MapCaseLayers(props: Props) {
  const { colors: c } = useAppTheme();
  const { visibleCases, selecting, onSelect: setSelection } = props;
  return (
    <GeoJSONSource
      id="demo-cases"
      data={{
        type: "FeatureCollection",
        features: visibleCases.map((item) => ({
          type: "Feature",
          id: item.id,
          properties: {
            id: item.id,
            status: item.status,
            label: pointStatusLabel(visibleCases, item.coordinates),
          },
          geometry: { type: "Point", coordinates: item.coordinates },
        })),
      }}
      onPress={
        selecting
          ? undefined
          : (event) => {
            event.stopPropagation();
            const id = event.nativeEvent.features[0]?.properties?.id;
            const item = visibleCases.find((entry) => entry.id === id);
            if (item) setSelection(item.coordinates);
          }
      }
    >
      <Layer
        id="demo-points"
        type="circle"
        paint={{
          "circle-radius": ["match", ["get", "label"], "B/L", 13, 9],
          "circle-color": [
            "match",
            ["get", "status"],
            "Localizados",
            c.located,
            c.searching,
          ],
          "circle-opacity": selecting ? 0.35 : 1,
          "circle-stroke-opacity": selecting ? 0.35 : 1,
          "circle-stroke-width": 3,
          "circle-stroke-color": c.mapMarkerOutline,
        }}
      />
      <Layer
        id="demo-status-labels"
        type="symbol"
        layout={{
          "text-field": ["get", "label"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 11,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        }}
        paint={{
          "text-color": c.mapMarkerText,
          "text-opacity": selecting ? 0.35 : 1,
        }}
      />
    </GeoJSONSource>
  );
}
