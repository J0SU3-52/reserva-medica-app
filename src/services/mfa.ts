import { auth } from '../lib/firebase';
import { 
  multiFactor,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  MultiFactorError,
  User,
  MultiFactorUser
} from 'firebase/auth';
import { initializeRecaptcha, getRecaptchaVerifier } from './recaptcha';

type MFAResolution = {
  verificationId: string;
  resolver: any;
};

const getMultiFactorUser = (user: User): MultiFactorUser => {
  return multiFactor(user);
};

export class MFAService {
  static isMFAEnabled(user: User): boolean {
    try {
      const mfaUser = getMultiFactorUser(user);
      return mfaUser.enrolledFactors.length > 0;
    } catch (error) {
      console.error('Error checking MFA status:', error);
      return false;
    }
  }

  static getEnrolledFactors(user: User): any[] {
    try {
      const mfaUser = getMultiFactorUser(user);
      return mfaUser.enrolledFactors;
    } catch (error) {
      console.error('Error getting enrolled factors:', error);
      return [];
    }
  }

  static async enrollPhoneMFA(phoneNumber: string): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      console.log('Iniciando enrolamiento MFA para:', phoneNumber);

      try {
        getRecaptchaVerifier();
      } catch {
        initializeRecaptcha();
      }

      const mfaUser = getMultiFactorUser(user);
      const session = await mfaUser.getSession();
      console.log('Sesión MFA obtenida');

      const phoneInfoOptions = {
        phoneNumber,
        session
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions, 
        getRecaptchaVerifier()
      );
      
      console.log('Verification ID generado');
      return verificationId;

    } catch (error: any) {
      console.error('Error en enrollPhoneMFA:', error);
      
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Número de teléfono inválido');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos. Intente más tarde.');
      }
      
      throw new Error(`Error al configurar MFA: ${error.message}`);
    }
  }

  static async verifyAndEnrollMFA(verificationId: string, verificationCode: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      console.log('Verificando código MFA...');

      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      const mfaUser = getMultiFactorUser(user);
      await mfaUser.enroll(multiFactorAssertion, 'Teléfono de respaldo');
      
      console.log('MFA habilitado exitosamente');

    } catch (error: any) {
      console.error('Error en verifyAndEnrollMFA:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Código de verificación inválido');
      }
      if (error.code === 'auth/code-expired') {
        throw new Error('Código expirado. Solicite uno nuevo.');
      }
      
      throw new Error(`Error al verificar MFA: ${error.message}`);
    }
  }

  static requiresMFA(error: any): boolean {
    return error && 
           error.code === 'auth/multi-factor-auth-required' &&
           error.name === 'FirebaseError';
  }

  static async resolveSignInMFA(error: MultiFactorError, phoneNumber: string): Promise<MFAResolution> {
    try {
      console.log('Resolviendo MFA requerido...');

      const resolver = getMultiFactorResolver(auth, error);
      
      if (resolver.hints[0].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
        const phoneInfoOptions = {
          multiFactorHint: resolver.hints[0],
          session: resolver.session
        };

        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
          phoneInfoOptions, 
          getRecaptchaVerifier()
        );
        
        console.log('MFA resolution iniciado');
        return { verificationId, resolver };
      }
      
      throw new Error('Solo MFA por teléfono es soportado');

    } catch (mfaError: any) {
      console.error('Error en resolveSignInMFA:', mfaError);
      throw new Error(`Error al resolver MFA: ${mfaError.message}`);
    }
  }

  static async completeSignInMFA(resolver: any, verificationId: string, verificationCode: string): Promise<any> {
    try {
      console.log('Completando login MFA...');

      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
      console.log('Login MFA completado exitosamente');
      
      return userCredential;

    } catch (error: any) {
      console.error('Error en completeSignInMFA:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Código de verificación inválido');
      }
      
      throw new Error(`Error al completar MFA: ${error.message}`);
    }
  }

  static async unenrollMFA(factorId?: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');

      const mfaUser = getMultiFactorUser(user);
      const factors = mfaUser.enrolledFactors;
      
      if (factors.length === 0) {
        throw new Error('No hay factores MFA enrolados');
      }

      if (factorId) {
        const factor = factors.find(f => f.uid === factorId);
        if (factor) {
          await mfaUser.unenroll(factor);
        } else {
          throw new Error('Factor especificado no encontrado');
        }
      } else {
        await mfaUser.unenroll(factors[0]);
      }
      
      console.log('MFA deshabilitado exitosamente');

    } catch (error: any) {
      console.error('Error en unenrollMFA:', error);
      throw new Error(`Error al deshabilitar MFA: ${error.message}`);
    }
  }

  static getMFAInfo(user: User): { 
    isEnabled: boolean; 
    factors: any[];
    factorCount: number;
  } {
    const factors = this.getEnrolledFactors(user);
    
    return {
      isEnabled: factors.length > 0,
      factors: factors,
      factorCount: factors.length
    };
  }
}