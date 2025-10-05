import { Platform } from "react-native";

export const colors = {
    primary: "#1976D2",
    primaryDark: "#115293",
    danger: "#E53935",
    bg: "#F6F8FA",
    card: "#FFFFFF",
    text: "#0F172A",
    muted: "#64748B",
    border: "#E2E8F0",
};

export const radius = 14;

export const shadow = Platform.select({
    ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {}, // web
});
