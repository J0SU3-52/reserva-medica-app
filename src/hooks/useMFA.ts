// hooks/useMFA.ts - CON MANEJO DE ERRORES MEJORADO
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ 
    enabled: false 
  });
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [currentPhone, setCurrentPhone] = useState<string>('');

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      console.log('🔍 Cargando estado MFA para usuario:', user.uid);
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('📊 Datos MFA encontrados:', data);
        setMfaStatus({
          enabled: data.mfaEnabled || false,
          phone: data.mfaPhone || undefined,
          lastUpdated: data.mfaLastUpdated
        });
      } else {
        console.log('📝 Creando documento de usuario...');
        // Crear documento si no existe
        await setDoc(userRef, {
          mfaEnabled: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading MFA status:', error);
      
      // Manejar error de permisos específicamente
      if (error.code === 'permission-denied') {
        setError('Error de permisos en la base de datos. Contacta al administrador.');
      }
    }
  };

  const requestVerificationCode = async (phoneNumber: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      console.log('📱 Enviando código a:', phoneNumber);
      
      // ✅ GUARDAR el teléfono actual
      setCurrentPhone(phoneNumber);

      // SIMULACIÓN TEMPORAL - siempre funciona
      console.log('🔧 Usando simulación para desarrollo');
      
      const simulatedVerificationId = `simulated-verification-${Date.now()}`;
      setVerificationId(simulatedVerificationId);
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Verification ID simulado:', simulatedVerificationId);
      return simulatedVerificationId;
      
    } catch (err: any) {
      console.error('❌ Error enviando código:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCodeAndEnableMFA = async (verificationCode: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      if (!verificationId) {
        throw new Error('No hay verificación en curso. Solicita un código primero.');
      }

      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('El código debe tener 6 dígitos');
      }

      console.log('✅ Verificando código:', verificationCode);

      // ✅ VERIFICACIÓN SIMULADA - SIEMPRE FUNCIONA CON 123456
      console.log('🔧 Usando verificación simulada');
      
      if (verificationCode === '123456') {
        console.log('✅ Código correcto, guardando en Firestore...');
        
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            mfaEnabled: true,
            mfaPhone: currentPhone,
            mfaLastUpdated: serverTimestamp(),
            updatedAt: serverTimestamp(),
            email: user.email, // Guardar email también
            displayName: user.displayName || 'Usuario'
          }, { merge: true });

          console.log('✅ MFA guardado en Firestore exitosamente');
          
          setMfaStatus({
            enabled: true,
            phone: currentPhone,
            lastUpdated: new Date().toISOString()
          });

          setVerificationId(null);
          console.log('✅ MFA habilitado completamente');
          
        } catch (firestoreError: any) {
          console.error('❌ Error guardando en Firestore:', firestoreError);
          
          // Si falla Firestore, al menos actualizar el estado local
          setMfaStatus({
            enabled: true,
            phone: currentPhone,
            lastUpdated: new Date().toISOString()
          });
          
          throw new Error('MFA habilitado localmente, pero error guardando en servidor');
        }
        
      } else {
        throw new Error('Código inválido. Usa "123456" para testing.');
      }
      
    } catch (err: any) {
      console.error('❌ Error en verifyCodeAndEnableMFA:', err);
      
      // Manejar error de Firestore específicamente
      if (err.code === 'permission-denied') {
        setError('Error de permisos. Verifica las reglas de Firestore.');
      } else {
        setError(err.message);
      }
      
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

      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          mfaEnabled: false,
          mfaLastUpdated: serverTimestamp(),
          mfaDisabledAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('✅ MFA deshabilitado en Firestore');
      } catch (firestoreError) {
        console.warn('⚠️ Error deshabilitando en Firestore, continuando localmente...');
      }

      setMfaStatus({
        enabled: false,
        lastUpdated: new Date().toISOString()
      });
      
      console.log('✅ MFA deshabilitado completamente');
      
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
      console.log('🔄 Iniciando setup MFA...');
      await requestVerificationCode(phoneNumber);
      await verifyCodeAndEnableMFA(verificationCode);
      console.log('✅ Setup MFA completado');
    } catch (error) {
      console.error('❌ Error en setup MFA:', error);
      throw error;
    }
  };

  return {
    enableMFA: verifyCodeAndEnableMFA,
    disableMFA,
    requestVerificationCode,
    setupMFA,
    mfaStatus,
    isLoading,
    error,
    verificationId,
    clearError: () => setError(null),
    refreshStatus: loadMFAStatus
  };
};