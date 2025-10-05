import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [authed, setAuthed] = useState<boolean | null>(null);

    useEffect(() => onAuthStateChanged(auth, (u) => {
        setAuthed(!!u);
        setReady(true);
    }), []);

    if (!ready) return <Text>Cargando…</Text>;
    if (!authed) return <Text>Sesión expirada o no iniciada</Text>;
    return <>{children}</>;
}
