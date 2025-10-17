// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import AppButton from '../components/ui/AppButton';
import { logout, fastLogout, sendVerificationEmail, getEmailVerificationStatus, clearFirebaseCache } from '../services/auth';
import { clearToken, clearAllStorage } from '../storage/secure';
import WeatherCard from '../components/WeatherCard';
import { httpSecure } from '../services/http.secure';
import { colors, radius, shadow } from '../theme';
import { MFASetup } from '../components/MFASetup';
import { useMFA } from '../hooks/useMFA';
import { ZeroTrustService } from '../services/zeroTrust';
import { auth } from '../lib/firebase';

const SHOW_TEST_BUTTONS = (process.env.EXPO_PUBLIC_SHOW_TEST_BUTTONS === '1');

export default function HomeScreen({ navigation }: any) {
  const [showWeather, setShowWeather] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [securityMetrics, setSecurityMetrics] = useState<{
    totalEvents: number;
    allowedEvents: number;
    deniedEvents: number;
  } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ verified: boolean; email: string | null }>({
    verified: false,
    email: null
  });
  const [sendingVerification, setSendingVerification] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  const { 
    mfaStatus, 
    enableMFA, 
    disableMFA, 
    isLoading, 
    error,
    refreshStatus 
  } = useMFA();

  useEffect(() => {
    initializeSecurity();
    checkEmailVerificationStatus();
  }, []);

  const initializeSecurity = async () => {
    addSecurityLog('🔍 Inicializando sistema Zero Trust...');
    
    const validation = await ZeroTrustService.validateRequest({
      action: 'access_home',
      riskLevel: 'low'
    });
    
    if (!validation.allowed) {
      addSecurityLog(`❌ Acceso denegado: ${validation.reason}`);
    } else {
      addSecurityLog(`✅ Acceso permitido`);
      loadSecurityMetrics();
    }
  };

  const checkEmailVerificationStatus = async () => {
    const status = getEmailVerificationStatus();
    setEmailStatus(status);
  };

  const loadSecurityMetrics = async () => {
    if (!auth.currentUser) return;
    try {
      const metrics = await ZeroTrustService.getSecurityMetrics(auth.currentUser.uid);
      setSecurityMetrics(metrics);
    } catch (error) {
      console.error('Error loading security metrics:', error);
    }
  };

  const addSecurityLog = (log: string) => {
    setSecurityLogs(prev => [`[${new Date().toLocaleTimeString()}] ${log}`, ...prev.slice(0, 8)]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    addSecurityLog('🔄 Actualizando estado...');
    
    await Promise.all([
      refreshStatus(),
      loadSecurityMetrics(),
      checkEmailVerificationStatus()
    ]);
    
    setRefreshing(false);
    addSecurityLog('✅ Estado actualizado');
  };

  // LOGOUT OPTIMIZADO
  const handleLogout = async () => {
    if (logoutLoading) {
      console.log('⚠️ Logout ya en progreso...');
      return;
    }

    setLogoutLoading(true);
    addSecurityLog('🚪 Iniciando cierre de sesión...');
    
    try {
      const validation = await ZeroTrustService.validateRequest({
        action: 'logout',
        riskLevel: 'low'
      });

      if (!validation.allowed) {
        addSecurityLog(`❌ Logout denegado: ${validation.reason}`);
        Alert.alert('Acción Restringida', validation.reason);
        setLogoutLoading(false);
        return;
      }

      console.log('🔄 Ejecutando logout optimizado...');
      
      // Ejecutar operaciones en paralelo
      await Promise.allSettled([
        logout(),
        clearAllStorage(),
        clearFirebaseCache(),
      ]);
      
      addSecurityLog('✅ Sesión cerrada exitosamente');
      
      // Navegación inmediata
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error: any) {
      console.error('❌ Error en logout:', error);
      
      if (error.message.includes('Timeout') || error.message.includes('red')) {
        addSecurityLog('⚠️ Usando logout rápido...');
        await handleFastLogout();
      } else {
        addSecurityLog(`❌ Error: ${error.message}`);
        Alert.alert('Error', 'No se pudo cerrar sesión: ' + error.message);
        setLogoutLoading(false);
      }
    }
  };

  // LOGOUT RÁPIDO DE EMERGENCIA
  const handleFastLogout = async () => {
    addSecurityLog('⚡ Cerrando sesión rápidamente...');
    
    try {
      await fastLogout();
      addSecurityLog('✅ Sesión cerrada (modo rápido)');
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.warn('Error en logout rápido:', error);
      // Navegar de todas formas
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleSendVerification = async () => {
    try {
      setSendingVerification(true);
      addSecurityLog('📧 Enviando verificación...');
      await sendVerificationEmail();
      addSecurityLog('✅ Email enviado');
      Alert.alert('✅ Email Enviado', 'Revisa tu bandeja de entrada.');
    } catch (error: any) {
      addSecurityLog(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleMFAAction = async () => {
    if (!emailStatus.verified) {
      Alert.alert('Verificación Requerida', 'Verifica tu email primero.');
      return;
    }

    if (mfaStatus.enabled) {
      try {
        await disableMFA();
        Alert.alert('Éxito', 'MFA deshabilitado');
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    } else {
      setShowMFASetup(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Inicio - Zero Trust</Text>
        {auth.currentUser?.email && (
          <Text style={styles.userEmail}>{auth.currentUser.email}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.body}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[styles.card, shadow]}>

          {/* SECCIÓN SEGURIDAD */}
          <View style={styles.securitySection}>
            <Text style={styles.sectionTitle}>Seguridad</Text>
            
            <View style={styles.securityInfo}>
              <View style={styles.securityRow}>
                <Text style={styles.securityLabel}>Email:</Text>
                <Text style={[
                  styles.securityValue,
                  emailStatus.verified ? styles.securityActive : styles.securityInactive
                ]}>
                  {emailStatus.verified ? '🟢 VERIFICADO' : '🔴 NO VERIFICADO'}
                </Text>
              </View>
              
              <View style={styles.securityRow}>
                <Text style={styles.securityLabel}>MFA:</Text>
                <Text style={[
                  styles.securityValue,
                  mfaStatus.enabled ? styles.securityActive : styles.securityInactive
                ]}>
                  {mfaStatus.enabled ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'}
                </Text>
              </View>
            </View>

            {!emailStatus.verified && (
              <AppButton 
                title={sendingVerification ? "Enviando..." : "Verificar Email"} 
                onPress={handleSendVerification}
                disabled={sendingVerification}
                style={styles.verifyButton}
              />
            )}

            <AppButton 
              title={mfaStatus.enabled ? "Deshabilitar MFA" : "Configurar MFA"} 
              onPress={handleMFAAction}
              disabled={!emailStatus.verified}
              style={styles.mfaButton}
            />
          </View>

          {showMFASetup && !mfaStatus.enabled && emailStatus.verified && (
            <View style={styles.mfaSetupContainer}>
              <MFASetup
                onSuccess={() => {
                  setShowMFASetup(false);
                  Alert.alert('✅ MFA Configurado');
                }}
                onCancel={() => setShowMFASetup(false)}
              />
            </View>
          )}

          {/* SECCIÓN CLIMA */}
          <View style={styles.weatherSection}>
            <AppButton
              title={showWeather ? 'Ocultar Clima' : 'Verificar Clima'}
              onPress={() => setShowWeather((p) => !p)}
            />
            {showWeather && <WeatherCard />}
          </View>

          {/* LOGOUT */}
          <View style={styles.logoutSection}>
            <AppButton 
              title={logoutLoading ? "Cerrando..." : "🚪 Cerrar Sesión"} 
              variant="danger" 
              onPress={handleLogout}
              disabled={logoutLoading}
            />
          </View>
        </View>
      </ScrollView>

      {(isLoading || busy || sendingVerification || logoutLoading) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {logoutLoading ? 'Cerrando sesión...' : 
               sendingVerification ? 'Enviando verificación...' : 
               'Procesando...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 100,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  body: { 
    flex: 1, 
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 20,
    gap: 20,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  securitySection: {
    marginBottom: 8,
  },
  securityInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: radius,
    marginBottom: 16,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  securityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  securityActive: {
    color: '#10B981',
  },
  securityInactive: {
    color: '#EF4444',
  },
  verifyButton: {
    marginBottom: 8,
  },
  mfaButton: {
    marginBottom: 8,
  },
  mfaSetupContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  weatherSection: {
    gap: 12,
  },
  logoutSection: {
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: radius,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
});