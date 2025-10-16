import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { useMFA } from '../hooks/useMFA';
import AppButton from './ui/AppButton';
import { colors, radius, shadow } from '../theme';

interface MFASetupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onSuccess, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('+16505553434');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'input-phone' | 'verify-code'>('input-phone');
  
  const { 
    setupMFA, 
    requestVerificationCode, 
    isLoading, 
    error 
  } = useMFA();

  console.log('🛠️ MFASetup renderizado, step:', step);

  const handleRequestCode = async () => {
    console.log('🛠️ handleRequestCode llamado');
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu número de teléfono');
      return;
    }

    try {
      console.log('📱 Solicitando código para:', phoneNumber);
      await requestVerificationCode(phoneNumber);
      setStep('verify-code');
      
      Alert.alert(
        '✅ Código Enviado (Modo Desarrollo)', 
        `Simulación para: ${phoneNumber}\n\n` +
        `🔑 Usa el código: 123456`,
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Error sending code:', err);
      Alert.alert('❌ Error', err.message);
    }
  };

  const handleVerifyAndEnable = async () => {
    console.log('🛠️ handleVerifyAndEnable llamado');
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    try {
      console.log('✅ Verificando código...');
      await setupMFA(phoneNumber, verificationCode);
      
      Alert.alert(
        '✅ MFA Habilitado', 
        'MFA configurado exitosamente!',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      console.error('Error enabling MFA:', err);
      Alert.alert('❌ Error', err.message);
    }
  };

  const handleCancel = () => {
    console.log('🛠️ handleCancel llamado');
    onCancel?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Configurar MFA (DEBUG)</Text>
      <Text style={styles.debugInfo}>Componente renderizado correctamente</Text>

      {step === 'input-phone' && (
        <View style={styles.form}>
          <Text style={styles.label}>Número de Teléfono</Text>
          <TextInput
            placeholder="+16505553434"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.input}
            keyboardType="phone-pad"
          />
          
          <View style={styles.buttonRow}>
            <AppButton 
              title="Cancelar" 
              variant="secondary" 
              onPress={handleCancel}
              disabled={isLoading}
            />
            <AppButton 
              title={isLoading ? "Enviando..." : "Enviar Código"} 
              onPress={handleRequestCode}
              disabled={isLoading}
            />
          </View>
        </View>
      )}
      
      {step === 'verify-code' && (
        <View style={styles.form}>
          <Text style={styles.label}>Código de Verificación</Text>
          <TextInput
            placeholder="123456"
            value={verificationCode}
            onChangeText={setVerificationCode}
            style={styles.input}
            keyboardType="number-pad"
          />
          
          <View style={styles.buttonRow}>
            <AppButton 
              title="Atrás" 
              variant="secondary" 
              onPress={() => setStep('input-phone')}
              disabled={isLoading}
            />
            <AppButton 
              title={isLoading ? "Verificando..." : "Habilitar MFA"} 
              onPress={handleVerifyAndEnable}
              disabled={isLoading}
            />
          </View>
        </View>
      )}

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text>Cargando...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: '#4CAF50',
    ...shadow,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  debugInfo: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
});