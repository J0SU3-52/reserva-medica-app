// components/MFASetup.tsx - CORREGIDO
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useMFA } from '../hooks/useMFA';
import AppButton from './ui/AppButton';
import { colors, radius, shadow } from '../theme';

interface MFASetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onSuccess, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('+15005550000'); // Número de prueba por defecto
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'input-phone' | 'verify-code'>('input-phone');
  
  const { 
    requestVerificationCode, 
    setupMFA,
    isLoading, 
    error 
  } = useMFA();

  const handleRequestCode = async () => {
    console.log('📱 Solicitando código para:', phoneNumber);
    
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu número de teléfono');
      return;
    }

    try {
      await requestVerificationCode(phoneNumber);
      setStep('verify-code');
      
      Alert.alert(
        '✅ Código Enviado', 
        `Se ha enviado un código a ${phoneNumber}.\n\n🔑 Usa el código: 123456`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Error sending code:', err);
      Alert.alert('❌ Error', err.message);
    }
  };

  const handleVerifyAndEnable = async () => {
    console.log('✅ Verificando código...');
    
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    try {
      await setupMFA(phoneNumber, verificationCode);
      
      Alert.alert(
        '✅ MFA Habilitado', 
        'La autenticación de dos factores se ha configurado exitosamente.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      console.error('Error enabling MFA:', err);
      Alert.alert('❌ Error', err.message);
    }
  };

  // ✅ CORREGIDO: Función segura para cancelar
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      console.log('MFA setup cancelled');
    }
  };

  // ✅ CORREGIDO: Función segura para éxito
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔒 Configurar Verificación por Teléfono</Text>
      <Text style={styles.description}>
        Añade una capa extra de seguridad a tu cuenta. 
        {__DEV__ && '\n\n🔧 MODO DESARROLLO: Usa el código 123456'}
      </Text>

      {step === 'input-phone' && (
        <View style={styles.form}>
          <Text style={styles.label}>Número de Teléfono</Text>
          <Text style={styles.note}>
            Formato internacional: +1 234 567 8900
            {__DEV__ && '\nNúmero de prueba: +15005550000'}
          </Text>
          <TextInput
            placeholder="+15005550000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          
          <View style={styles.buttonRow}>
            <AppButton 
              title="Cancelar" 
              variant="secondary" 
              onPress={handleCancel} // ✅ Usamos la función segura
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <AppButton 
              title={isLoading ? "Enviando..." : "Enviar Código"} 
              onPress={handleRequestCode}
              disabled={isLoading}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      )}
      
      {step === 'verify-code' && (
        <View style={styles.form}>
          <Text style={styles.label}>Código de Verificación</Text>
          <Text style={styles.note}>
            Ingresa el código de 6 dígitos enviado a {phoneNumber}
            {__DEV__ && '\nCódigo de prueba: 123456'}
          </Text>
          <TextInput
            placeholder="123456"
            value={verificationCode}
            onChangeText={setVerificationCode}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <View style={styles.buttonRow}>
            <AppButton 
              title="Atrás" 
              variant="secondary" 
              onPress={() => setStep('input-phone')}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <AppButton 
              title={isLoading ? "Verificando..." : "Habilitar MFA"} 
              onPress={handleVerifyAndEnable}
              disabled={isLoading}
              style={{ flex: 2 }}
            />
          </View>

          <Text style={styles.resendNote}>
            ¿No recibiste el código? {' '}
            <Text 
              style={styles.resendLink} 
              onPress={handleRequestCode}
            >
              Reenviar código
            </Text>
          </Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: radius,
    ...shadow,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  note: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  resendNote: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 16,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.muted,
  },
});