
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import type { Palette } from "@/shared/constants/palette";
import { useAppTheme } from "@/shared/theme/app-theme-context";
import type { FilterPanel } from "./map-filter-panel";

type Props = {
  height: number;
  panel: FilterPanel | null;
  caseCount: number;
  listOpen: boolean;
  onOpen: (panel: FilterPanel) => void;
  onOpenList: () => void;
  bottomOffset?: number;
};

export function MapToolbar({
  height,
  panel,
  caseCount,
  listOpen,
  onOpen,
  onOpenList,
  bottomOffset = 64,
}: Props) {
  const { colors: c } = useAppTheme();
  const styles = createStyles(c);

  const filtersOpen = panel === "filters";

  // Si el mapa tiene poca altura,
  // los botones se distribuyen horizontalmente.
  const compact = height > 0 && height < 280;

  const controls = [
    {
      id: "list",
      label: "Lista",
      icon: "list-outline",
      description: "Ver lista de reportes visibles",
      active: listOpen,
      onPress: onOpenList,
    },
    {
      id: "filters",
      label: "Filtros",
      icon: "options-outline",
      description:
        `Filtros de reportes. ${caseCount} de 2 ` +
        `estados seleccionados. Abrir filtros`,
      active: filtersOpen,
      onPress: () => onOpen("filters"),
    },
  ] as const;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.rail,
        compact && styles.railCompact,
        { bottom: bottomOffset },
      ]}
    >
      {controls.map((control) => (
        <Pressable
          key={control.id}
          accessibilityRole="button"
          accessibilityLabel={control.description}
          accessibilityState={{
            expanded: control.active,
            selected: control.active,
          }}
          onPress={control.onPress}
          style={({ pressed }) => [
            styles.control,
            control.active && styles.controlSelected,
            pressed && styles.controlPressed,
          ]}
        >
          <Ionicons
            name={control.icon}
            size={24}
            color={
              control.active ? c.action : c.text
            }
            accessible={false}
          />

          <Text
            numberOfLines={1}
            style={styles.controlLabel}
          >
            {control.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    rail: {
      position: "absolute",
      right: 12,
      bottom: 64,
      alignItems: "flex-end",
      flexDirection: "column",
      gap: 8,
    },

    railCompact: {
      flexDirection: "row",
      alignItems: "center",
    },

    control: {
      width: 80,
      minHeight: 64,

      paddingHorizontal: 6,
      paddingVertical: 8,

      alignItems: "center",
      justifyContent: "center",
      gap: 4,

      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,

      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.18,
      shadowRadius: 3,

      elevation: 3,
    },

    controlSelected: {
      backgroundColor: c.surfaceAlt,
      borderColor: c.action,
      borderWidth: 2,
    },

    controlPressed: {
      opacity: 0.8,
      transform: [
        { scale: 0.97 },
      ],
    },

    controlLabel: {
      color: c.text,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
  });
}
