import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../../theme';

type Props = {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    fullWidth?: boolean;
    style?: ViewStyle;
};

export default function AppButton({
    title,
    onPress,
    disabled,
    variant = 'primary',
    fullWidth = true,
    style,
}: Props) {
    const bg =
        variant === 'danger' ? colors.danger :
            variant === 'secondary' ? colors.border :
                colors.primary;

    const textColor = variant === 'secondary' ? colors.text : '#fff';

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            android_ripple={{ color: '#00000022' }}
            style={({ pressed }) => [
                styles.btn,
                { backgroundColor: bg, opacity: disabled || pressed ? 0.9 : 1, width: fullWidth ? '100%' : undefined },
                shadow,
                style,
            ]}
        >
            <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
                {title}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
