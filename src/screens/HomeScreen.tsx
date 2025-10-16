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
import { logout, sendVerificationEmail, getEmailVerificationStatus, resendVerificationEmail } from '../services/auth';
import { clearToken } from '../storage/secure';
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
    highRiskEvents: number;
  } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ verified: boolean; email: string | null }>({
    verified: false,
    email: null
  });
  const [sendingVerification, setSendingVerification] = useState(false);
  
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
      Alert.alert('Acceso Denegado', validation.reason);
    } else {
      addSecurityLog(`✅ Acceso permitido (Nivel de riesgo: ${validation.riskLevel})`);
      loadSecurityMetrics();
    }
  };

  const checkEmailVerificationStatus = async () => {
    const status = getEmailVerificationStatus();
    setEmailStatus(status);
    
    if (!status.verified && auth.currentUser) {
      addSecurityLog('📧 Email no verificado. Se requiere verificación para MFA.');
    } else if (status.verified) {
      addSecurityLog('✅ Email verificado correctamente');
    }
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
    addSecurityLog('🔄 Actualizando estado de seguridad...');
    
    await Promise.all([
      refreshStatus(),
      loadSecurityMetrics(),
      checkEmailVerificationStatus()
    ]);
    
    setRefreshing(false);
    addSecurityLog('✅ Estado actualizado');
  };

  const handleSendVerification = async () => {
    try {
      setSendingVerification(true);
      addSecurityLog('📧 Enviando email de verificación...');
      
      await sendVerificationEmail();
      
      addSecurityLog('✅ Email de verificación enviado. Revisa tu bandeja de entrada.');
      Alert.alert(
        '✅ Email Enviado', 
        'Se ha enviado un email de verificación a tu dirección. ' +
        'Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación.',
        [{ text: 'Entendido' }]
      );
      
    } catch (error: any) {
      addSecurityLog(`❌ Error enviando verificación: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleRefreshVerification = async () => {
    addSecurityLog('🔄 Actualizando estado de verificación...');
    await checkEmailVerificationStatus();
    
    if (emailStatus.verified) {
      addSecurityLog('✅ Email verificado correctamente');
      Alert.alert('✅ Email Verificado', 'Tu email ha sido verificado exitosamente.');
    } else {
      addSecurityLog('⚠️ Email aún no verificado');
      Alert.alert(
        'Email No Verificado', 
        'Tu email aún no ha sido verificado. ' +
        'Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación.',
        [
          { text: 'Reenviar Email', onPress: handleSendVerification },
          { text: 'Actualizar', onPress: handleRefreshVerification },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const handleMFAAction = async () => {
    console.log('🛠️ handleMFAAction llamado');
    addSecurityLog('🛡️ Iniciando modificación de MFA...');
    
    if (!emailStatus.verified) {
      addSecurityLog('❌ MFA bloqueado: Email no verificado');
      Alert.alert(
        'Verificación Requerida', 
        'Debes verificar tu email antes de configurar MFA.\n\n' +
        'Esto es una medida de seguridad para proteger tu cuenta.',
        [
          { text: 'Enviar Verificación', onPress: handleSendVerification },
          { text: 'Actualizar Estado', onPress: handleRefreshVerification },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }

    const validation = await ZeroTrustService.validateRequest({
      action: 'modify_mfa',
      riskLevel: 'high'
    });

    if (!validation.allowed) {
      addSecurityLog(`❌ Modificación MFA denegada: ${validation.reason}`);
      Alert.alert('Acción Restringida', 
        `No se puede modificar MFA: ${validation.reason}`,
        [{ text: 'Entendido', style: 'cancel' }]
      );
      return;
    }

    if (mfaStatus.enabled) {
      addSecurityLog('🔓 Solicitando deshabilitar MFA...');
      try {
        await disableMFA();
        addSecurityLog('✅ MFA deshabilitado correctamente');
        Alert.alert('Éxito', 'MFA deshabilitado correctamente');
        await loadSecurityMetrics();
      } catch (error: any) {
        addSecurityLog(`❌ Error deshabilitando MFA: ${error.message}`);
        Alert.alert('Error', error.message);
      }
    } else {
      // Mostrar configuración de MFA
      addSecurityLog('🔐 Mostrando configuración MFA...');
      console.log('🛠️ Configurando showMFASetup a TRUE');
      setShowMFASetup(true);
    }
  };

  const testAuthHeader = async () => {
    addSecurityLog('🧪 Probando envío de Authorization header...');
    
    const validation = await ZeroTrustService.validateRequest({
      action: 'test_api',
      riskLevel: 'medium'
    });

    if (!validation.allowed) {
      addSecurityLog(`❌ Test API denegado: ${validation.reason}`);
      Alert.alert('Acceso Denegado', validation.reason);
      return;
    }

    try {
      setBusy(true);
      const { data } = await httpSecure.get('https://httpbin.org/anything');
      const h = data?.headers?.Authorization || data?.headers?.authorization;
      const success = h?.startsWith('Bearer ');
      
      if (success) {
        addSecurityLog('✅ Authorization header enviado correctamente');
        Alert.alert('✅ Prueba Exitosa', 'Authorization header enviado correctamente con token Bearer');
      } else {
        addSecurityLog('❌ Falta Authorization header');
        Alert.alert('❌ Prueba Fallida', 'No se encontró el Authorization header en la respuesta');
      }
    } catch (error: any) {
      addSecurityLog(`❌ Error en test API: ${error.message}`);
      Alert.alert('Error', 'Fallo en la prueba de API: ' + error.message);
    } finally { 
      setBusy(false); 
    }
  };

  const test401 = async () => {
    addSecurityLog('🧪 Probando manejo de error 401...');
    
    const validation = await ZeroTrustService.validateRequest({
      action: 'test_error',
      riskLevel: 'low'
    });

    if (!validation.allowed) {
      Alert.alert('Acceso Denegado', validation.reason);
      return;
    }

    try {
      setBusy(true);
      await httpSecure.get('https://httpbin.org/status/401');
    } catch { 
      addSecurityLog('✅ Interceptor manejó 401 correctamente (logout automático)');
      Alert.alert('✅ Prueba Exitosa', 'El interceptor detectó el error 401 y cerró sesión automáticamente');
    } finally { 
      setBusy(false); 
    }
  };

  const testSecureAction = async () => {
    addSecurityLog('🛡️ Ejecutando acción segura...');
    
    const validation = await ZeroTrustService.validateRequest({
      action: 'secure_action',
      riskLevel: 'high'
    });

    if (!validation.allowed) {
      addSecurityLog(`❌ Acción segura denegada: ${validation.reason}`);
      Alert.alert('Acción Restringida', 
        `No se puede ejecutar esta acción: ${validation.reason}`,
        [{ text: 'Entendido', style: 'cancel' }]
      );
      return;
    }

    try {
      setBusy(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      addSecurityLog('✅ Acción segura completada exitosamente');
      Alert.alert('✅ Acción Exitosa', 
        'Acción segura completada con validación Zero Trust\n\n' +
        'Todas las validaciones de seguridad fueron aprobadas.'
      );
    } catch (error) {
      addSecurityLog('❌ Error en acción segura');
      Alert.alert('Error', 'Fallo en acción segura');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    addSecurityLog('🚪 Cerrando sesión...');
    
    const validation = await ZeroTrustService.validateRequest({
      action: 'logout',
      riskLevel: 'medium'
    });

    if (!validation.allowed) {
      Alert.alert('Acción Restringida', validation.reason);
      return;
    }

    try {
      await logout();
      await clearToken();
      addSecurityLog('✅ Sesión cerrada exitosamente');
    } catch (error: any) {
      addSecurityLog(`❌ Error cerrando sesión: ${error.message}`);
      Alert.alert('Error', 'No se pudo cerrar sesión: ' + error.message);
    }
  };

  const viewSecurityDashboard = async () => {
    addSecurityLog('📊 Accediendo al dashboard de seguridad...');
    
    const validation = await ZeroTrustService.validateRequest({
      action: 'view_security_dashboard',
      riskLevel: 'medium'
    });

    if (!validation.allowed) {
      Alert.alert('Acceso Denegado', validation.reason);
      return;
    }

    Alert.alert('Dashboard de Seguridad', 
      `Estado de seguridad actual:\n\n` +
      `• Email: ${emailStatus.verified ? '🟢 VERIFICADO' : '🔴 NO VERIFICADO'}\n` +
      `• MFA: ${mfaStatus.enabled ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'}\n` +
      `• Zero Trust: 🟢 ACTIVADO\n` +
      `• Validaciones: ${securityMetrics ? securityMetrics.allowedEvents + '/' + securityMetrics.totalEvents + ' exitosas' : 'Cargando...'}\n` +
      `• Eventos de alto riesgo: ${securityMetrics ? securityMetrics.highRiskEvents : '0'}`
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Inicio - Zero Trust</Text>
        {auth.currentUser?.email && (
          <Text style={styles.userEmail}>{auth.currentUser.email}</Text>
        )}
        <View style={styles.securityBadge}>
          <Text style={[
            styles.securityStatus,
            emailStatus.verified ? styles.securityActive : styles.securityInactive
          ]}>
            {emailStatus.verified ? '📧 VERIFICADO' : '📧 NO VERIFICADO'}
          </Text>
          <Text style={[
            styles.securityStatus,
            mfaStatus.enabled ? styles.securityActive : styles.securityInactive
          ]}>
            {mfaStatus.enabled ? '🛡️ MFA ACTIVO' : '⚠️ MFA INACTIVO'}
          </Text>
          <Text style={styles.zeroTrustBadge}>🔒 ZERO TRUST</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.card, shadow]}>

          {/* SECCIÓN SEGURIDAD AVANZADA */}
          <View style={styles.securitySection}>
            <Text style={styles.sectionTitle}>Seguridad Avanzada</Text>
            
            <View style={styles.securityInfo}>
              {/* ESTADO DE VERIFICACIÓN DE EMAIL */}
              <View style={[
                styles.securityRow,
                !emailStatus.verified && styles.unverifiedEmailRow
              ]}>
                <Text style={styles.securityLabel}>Email Verificado:</Text>
                <Text style={[
                  styles.securityValue,
                  emailStatus.verified ? styles.securityActive : styles.securityInactive
                ]}>
                  {emailStatus.verified ? '🟢 VERIFICADO' : '🔴 NO VERIFICADO'}
                </Text>
              </View>
              
              {!emailStatus.verified && emailStatus.email && (
                <View style={styles.verificationNotice}>
                  <Text style={styles.verificationText}>
                    📧 Se requiere verificación de email para habilitar MFA
                  </Text>
                  <View style={styles.verificationButtons}>
                    <AppButton 
                      title={sendingVerification ? "Enviando..." : "Enviar Verificación"} 
                      variant="secondary"
                      onPress={handleSendVerification}
                      disabled={sendingVerification}
                      fullWidth={false}
                      style={styles.verificationButton}
                    />
                    <AppButton 
                      title="Actualizar Estado" 
                      variant="secondary"
                      onPress={handleRefreshVerification}
                      fullWidth={false}
                      style={styles.verificationButton}
                    />
                  </View>
                </View>
              )}

              <View style={styles.securityRow}>
                <Text style={styles.securityLabel}>Estado MFA:</Text>
                <Text style={[
                  styles.securityValue,
                  mfaStatus.enabled ? styles.securityActive : 
                  emailStatus.verified ? styles.securityPending : 
                  styles.securityInactive
                ]}>
                  {mfaStatus.enabled ? '🟢 ACTIVADO' : 
                   emailStatus.verified ? '⚪ PENDIENTE' : 
                   '🔴 BLOQUEADO'}
                </Text>
              </View>
              
              {mfaStatus.phone && (
                <View style={styles.securityRow}>
                  <Text style={styles.securityLabel}>Teléfono MFA:</Text>
                  <Text style={styles.phoneNumber}>📱 {mfaStatus.phone}</Text>
                </View>
              )}

              <View style={styles.securityRow}>
                <Text style={styles.securityLabel}>Zero Trust:</Text>
                <Text style={[styles.securityValue, styles.securityActive]}>🟢 ACTIVADO</Text>
              </View>

              {securityMetrics && (
                <View style={styles.metrics}>
                  <Text style={styles.metricsTitle}>Métricas de Seguridad:</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{securityMetrics.totalEvents}</Text>
                      <Text style={styles.metricLabel}>Total</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, styles.metricSuccess]}>{securityMetrics.allowedEvents}</Text>
                      <Text style={styles.metricLabel}>Permitidas</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, styles.metricDanger]}>{securityMetrics.deniedEvents}</Text>
                      <Text style={styles.metricLabel}>Denegadas</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, styles.metricWarning]}>{securityMetrics.highRiskEvents}</Text>
                      <Text style={styles.metricLabel}>Alto Riesgo</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonGroup}>
              <AppButton 
                title={
                  mfaStatus.enabled ? "Deshabilitar MFA" : 
                  !emailStatus.verified ? "Verificar Email Primero" : 
                  "Configurar MFA"
                } 
                variant={
                  mfaStatus.enabled ? "danger" : 
                  !emailStatus.verified ? "secondary" : 
                  "primary"
                }
                onPress={handleMFAAction}
                disabled={isLoading || !emailStatus.verified}
                style={styles.mfaButton}
              />
              
              <AppButton 
                title="Dashboard" 
                variant="secondary"
                onPress={viewSecurityDashboard}
                style={styles.dashboardButton}
              />
            </View>

            <AppButton 
              title="Acción Segura (Alto Riesgo)" 
              variant="secondary"
              onPress={testSecureAction}
              disabled={busy || !emailStatus.verified}
              style={styles.secureActionButton}
            />
          </View>

          {/* CONFIGURACIÓN MFA */}
          {showMFASetup && !mfaStatus.enabled && emailStatus.verified && (
            <View style={styles.mfaSetupContainer}>
              <Text style={styles.debugInfo}>🛠️ Configuración MFA Activada</Text>
              <MFASetup 
                onSuccess={() => {
                  console.log('🛠️ MFASetup onSuccess llamado');
                  setShowMFASetup(false);
                  addSecurityLog('✅ MFA configurado exitosamente');
                  loadSecurityMetrics();
                  Alert.alert('✅ MFA Configurado', 
                    'La autenticación de dos factores ha sido habilitada correctamente.\n\n' +
                    'Ahora recibirás un código por SMS para futuros inicios de sesión.'
                  );
                }}
                onCancel={() => {
                  console.log('🛠️ MFASetup onCancel llamado');
                  setShowMFASetup(false);
                  addSecurityLog('❌ Configuración MFA cancelada por el usuario');
                }}
              />
            </View>
          )}

          {/* SECCIÓN PRUEBAS (SOLO DESARROLLO) */}
          {SHOW_TEST_BUTTONS && (
            <View style={styles.testSection}>
              <Text style={styles.sectionTitle}>🧪 Pruebas de Seguridad</Text>
              
              <AppButton
                title={busy ? 'Probando…' : 'Probar Authorization Header'}
                onPress={testAuthHeader}
                disabled={busy}
                variant="secondary"
              />
              
              <AppButton
                title={busy ? 'Probando…' : 'Probar Error 401'}
                variant="secondary"
                onPress={test401}
                disabled={busy}
              />
            </View>
          )}

          {/* SECCIÓN CLIMA */}
          <View style={styles.weatherSection}>
            <Text style={styles.sectionTitle}>🌤️ Información del Clima</Text>
            <AppButton
              title={showWeather ? 'Ocultar Clima' : 'Verificar Clima'}
              variant="secondary"
              onPress={() => setShowWeather((p) => !p)}
            />
            {showWeather && <WeatherCard />}
          </View>

          {/* SECCIÓN NAVEGACIÓN */}
          <View style={styles.navigationSection}>
            <Text style={styles.sectionTitle}>🗺️ Navegación</Text>
            <AppButton 
              title="Abrir Mapa" 
              onPress={() => navigation.navigate('Map')} 
            />
          </View>

          {/* LOGS DE SEGURIDAD */}
          <View style={styles.logsSection}>
            <Text style={styles.sectionTitle}>📋 Registro de Seguridad en Tiempo Real</Text>
            <View style={styles.logsContainer}>
              {securityLogs.map((log, index) => (
                <Text key={index} style={[
                  styles.logEntry,
                  log.includes('✅') && styles.logSuccess,
                  log.includes('❌') && styles.logError,
                  log.includes('🛡️') && styles.logSecurity,
                  log.includes('🧪') && styles.logTest,
                  log.includes('📧') && styles.logEmail,
                ]}>
                  {log}
                </Text>
              ))}
              {securityLogs.length === 0 && (
                <Text style={styles.noLogs}>No hay eventos de seguridad recientes</Text>
              )}
            </View>
          </View>

          {/* CERRAR SESIÓN */}
          <View style={styles.logoutSection}>
            <AppButton 
              title="🚪 Cerrar Sesión" 
              variant="danger" 
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {(isLoading || busy || sendingVerification) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {sendingVerification ? 'Enviando verificación...' : 
               isLoading ? 'Procesando seguridad...' : 
               'Ejecutando acción...'}
            </Text>
          </View>
        </View>
      )}

      {/* Panel de Debug (solo en desarrollo) */}
      {__DEV__ && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugText}>
            DEBUG: Email = {emailStatus.verified ? 'VERIFIED' : 'NOT VERIFIED'} | 
            MFA Setup = {showMFASetup ? 'SHOWING' : 'HIDDEN'} | 
            MFA Status = {mfaStatus.enabled ? 'ENABLED' : 'DISABLED'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 130,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 10,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  securityStatus: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  securityActive: {
    backgroundColor: '#10B98120',
    color: '#10B981',
  },
  securityInactive: {
    backgroundColor: '#EF444420',
    color: '#EF4444',
  },
  securityPending: {
    backgroundColor: '#F59E0B20',
    color: '#F59E0B',
  },
  zeroTrustBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#3B82F620',
    color: '#3B82F6',
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
    gap: 24,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  unverifiedEmailRow: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
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
  phoneNumber: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  verificationNotice: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: radius,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  verificationButton: {
    flex: 1,
  },
  metrics: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  metricsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  metricSuccess: {
    color: '#10B981',
  },
  metricDanger: {
    color: '#EF4444',
  },
  metricWarning: {
    color: '#F59E0B',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  mfaButton: {
    flex: 2,
  },
  dashboardButton: {
    flex: 1,
  },
  secureActionButton: {
    marginTop: 4,
  },
  mfaSetupContainer: {
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: radius,
    padding: 8,
    backgroundColor: '#F0F9FF',
  },
  debugInfo: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  testSection: {
    gap: 8,
  },
  weatherSection: {
    gap: 12,
  },
  navigationSection: {
    gap: 8,
  },
  logsSection: {
    marginTop: 8,
  },
  logsContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: radius,
    minHeight: 160,
    maxHeight: 200,
  },
  logEntry: {
    fontSize: 11,
    color: '#E5E7EB',
    fontFamily: 'monospace',
    marginBottom: 6,
    lineHeight: 14,
  },
  logSuccess: {
    color: '#10B981',
  },
  logError: {
    color: '#EF4444',
  },
  logSecurity: {
    color: '#3B82F6',
  },
  logTest: {
    color: '#F59E0B',
  },
  logEmail: {
    color: '#8B5CF6',
  },
  noLogs: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  logoutSection: {
    marginTop: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: radius,
    alignItems: 'center',
    gap: 12,
    ...shadow,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 8,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});