import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  PhoneAuthProvider, 
  linkWithCredential,
  updateProfile,
  signOut,
  signInWithCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

interface MFAStatus {
  enabled: boolean;
  phone?: string;
  lastUpdated?: string;
}

export const useMFA = () => {
  console.log('🛠️ useMFA hook inicializado');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ 
    enabled: false 
  });

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setMfaStatus({
          enabled: data.mfaEnabled || false,
          phone: data.mfaPhone || undefined,
          lastUpdated: data.mfaLastUpdated
        });
      } else {
        await setDoc(userRef, {
          mfaEnabled: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error loading MFA status:', error);
    }
  };

  const requestVerificationCode = async (phoneNumber: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Formato de teléfono inválido. Usa: +521234567890');
      }

      console.log('📱 Preparando envío de código a:', phoneNumber);

      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const testNumbers = [
          '+16505553434',
          '+16505553435', 
          '+16505553436'
        ];
        
        if (testNumbers.includes(phoneNumber)) {
          console.log('✅ Usando número de prueba de Firebase');
          return `mock-verification-id-${Date.now()}`;
        }
        
        throw new Error(
          'Para desarrollo, usa números de prueba de Firebase:\n' +
          '+1 650-555-3434\n' + 
          '+1 650-555-3435\n' +
          '+1 650-555-3436\n\n' +
          'O configura react-native-firebase para SMS reales.'
        );
      }

      throw new Error(
        'Para SMS reales en React Native, instala y configura react-native-firebase:\n\n' +
        'npm install @react-native-firebase/app\n' +
        'npm install @react-native-firebase/auth'
      );
      
    } catch (err: any) {
      console.error('Error requesting verification:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const enableMFA = async (verificationId: string, verificationCode: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('El código debe tener 6 dígitos');
      }

      console.log('✅ Verificando código...');

      if (process.env.NODE_ENV === 'development') {
        if (verificationCode === '123456' && verificationId.startsWith('mock-verification-id')) {
          console.log('✅ Verificación simulada exitosa');
          
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            mfaEnabled: true,
            mfaPhone: '+16505553434',
            mfaLastUpdated: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });

          setMfaStatus({
            enabled: true,
            phone: '+16505553434',
            lastUpdated: new Date().toISOString()
          });
          
          return;
        } else {
          throw new Error('Código de verificación inválido. Usa "123456" para desarrollo.');
        }
      }

      throw new Error('Configura react-native-firebase para verificación real');
      
    } catch (err: any) {
      console.error('Error enabling MFA:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      console.log('🔓 Deshabilitando MFA...');

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        mfaEnabled: false,
        mfaPhone: null,
        mfaLastUpdated: serverTimestamp(),
        mfaDisabledAt: serverTimestamp()
      });

      setMfaStatus({
        enabled: false,
        phone: undefined,
        lastUpdated: new Date().toISOString()
      });
      
      console.log('✅ MFA deshabilitado exitosamente');
      
    } catch (err: any) {
      console.error('Error disabling MFA:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setupMFA = async (phoneNumber: string, verificationCode: string): Promise<void> => {
    try {
      const verificationId = await requestVerificationCode(phoneNumber);
      
      await enableMFA(verificationId, verificationCode);
      
    } catch (error) {
      throw error;
    }
  };

  return {
    enableMFA,
    disableMFA,
    requestVerificationCode,
    setupMFA,
    mfaStatus,
    isLoading,
    error,
    clearError: () => setError(null),
    refreshStatus: loadMFAStatus
  };
};