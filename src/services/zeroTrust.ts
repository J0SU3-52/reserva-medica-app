import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface SecurityEvent {
  userId: string;
  action: string;
  resource?: string;
  riskLevel: 'low' | 'medium' | 'high';
  allowed: boolean;
  reason?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

export interface SecurityEventInput {
  userId: string;
  action: string;
  resource?: string;
  riskLevel: 'low' | 'medium' | 'high';
  allowed: boolean;
  reason?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

interface FirestoreSecurityEvent {
  userId: string;
  action: string;
  resource?: string;
  riskLevel: 'low' | 'medium' | 'high';
  allowed: boolean;
  reason?: string;
  timestamp: Timestamp;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  eventId?: string;
}

export class ZeroTrustService {
  private static riskLevels = {
    low: ['access_home', 'view_weather', 'test_error', 'refresh_status'],
    medium: ['test_api', 'logout', 'view_map', 'toggle_weather'],
    high: ['modify_mfa', 'secure_action', 'change_security', 'delete_account', 'change_phone']
  };

  private static sessionTimeout = {
    low: 24 * 60 * 60 * 1000,
    medium: 8 * 60 * 60 * 1000,
    high: 2 * 60 * 60 * 1000
  };

  static async validateRequest(context: {
    action: string;
    resource?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  }): Promise<{ allowed: boolean; reason?: string; riskLevel: string }> {
    const user = auth.currentUser;
    const startTime = Date.now();
    
    try {
      if (!user) {
        await this.logSecurityEvent({
          userId: 'anonymous',
          action: context.action,
          riskLevel: context.riskLevel || 'low',
          allowed: false,
          reason: 'Usuario no autenticado'
        });
        return { 
          allowed: false, 
          reason: 'Usuario no autenticado',
          riskLevel: context.riskLevel || 'low'
        };
      }

      const calculatedRisk = this.calculateRiskLevel(context.action, context.riskLevel);

      const sessionValid = await this.validateSession(user.uid, calculatedRisk);
      if (!sessionValid.valid) {
        await this.logSecurityEvent({
          userId: user.uid,
          action: context.action,
          riskLevel: calculatedRisk,
          allowed: false,
          reason: sessionValid.reason
        });
        return { 
          allowed: false, 
          reason: sessionValid.reason,
          riskLevel: calculatedRisk
        };
      }

      const behaviorCheck = await this.checkUserBehavior(user.uid, context.action);
      if (!behaviorCheck.normal) {
        await this.logSecurityEvent({
          userId: user.uid,
          action: context.action,
          riskLevel: calculatedRisk,
          allowed: false,
          reason: behaviorCheck.reason
        });
        return { 
          allowed: false, 
          reason: behaviorCheck.reason,
          riskLevel: calculatedRisk
        };
      }

      const frequencyCheck = await this.checkActionFrequency(user.uid, context.action);
      if (!frequencyCheck.allowed) {
        await this.logSecurityEvent({
          userId: user.uid,
          action: context.action,
          riskLevel: calculatedRisk,
          allowed: false,
          reason: frequencyCheck.reason
        });
        return { 
          allowed: false, 
          reason: frequencyCheck.reason,
          riskLevel: calculatedRisk
        };
      }

      if (calculatedRisk === 'high') {
        const recentAuth = await this.hasRecentAuthentication(user.uid);
        if (!recentAuth) {
          await this.logSecurityEvent({
            userId: user.uid,
            action: context.action,
            riskLevel: calculatedRisk,
            allowed: false,
            reason: 'Reautenticación requerida para acción de alto riesgo'
          });
          return { 
            allowed: false, 
            reason: 'Reautenticación requerida para esta acción sensible',
            riskLevel: calculatedRisk
          };
        }
      }

      const privilegeCheck = await this.checkPrivileges(user.uid, context.action, context.resource);
      if (!privilegeCheck.allowed) {
        await this.logSecurityEvent({
          userId: user.uid,
          action: context.action,
          riskLevel: calculatedRisk,
          allowed: false,
          reason: privilegeCheck.reason
        });
        return { 
          allowed: false, 
          reason: privilegeCheck.reason,
          riskLevel: calculatedRisk
        };
      }

      const processingTime = Date.now() - startTime;
      
      await this.logSecurityEvent({
        userId: user.uid,
        action: context.action,
        resource: context.resource,
        riskLevel: calculatedRisk,
        allowed: true,
        reason: `Validación Zero Trust exitosa (${processingTime}ms)`
      });

      console.log(`✅ Zero Trust: "${context.action}" → PERMITIDO (${calculatedRisk}, ${processingTime}ms)`);
      
      return { 
        allowed: true, 
        riskLevel: calculatedRisk 
      };

    } catch (error) {
      console.error('❌ Error en validación Zero Trust:', error);

      await this.logSecurityEvent({
        userId: user?.uid || 'unknown',
        action: context.action,
        riskLevel: context.riskLevel || 'high',
        allowed: false,
        reason: `Error de sistema: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return { 
        allowed: false, 
        reason: 'Error de seguridad del sistema. Intente más tarde.',
        riskLevel: 'high'
      };
    }
  }

  private static calculateRiskLevel(action: string, explicitRisk?: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    if (explicitRisk) return explicitRisk;
    
    if (this.riskLevels.high.includes(action)) return 'high';
    if (this.riskLevels.medium.includes(action)) return 'medium';
    return 'low';
  }

  private static async validateSession(userId: string, riskLevel: 'low' | 'medium' | 'high'): Promise<{ valid: boolean; reason?: string }> {
    const user = auth.currentUser;
    if (!user) return { valid: false, reason: 'Usuario no autenticado' };

    const lastSignIn = user.metadata.lastSignInTime;
    if (!lastSignIn) return { valid: false, reason: 'Sesión inválida' };

    const sessionAge = Date.now() - new Date(lastSignIn).getTime();
    const maxAge = this.sessionTimeout[riskLevel];

    if (sessionAge > maxAge) {
      return { 
        valid: false, 
        reason: `Sesión expirada por inactividad (${riskLevel} risk)` 
      };
    }

    return { valid: true };
  }

  private static async checkUserBehavior(userId: string, action: string): Promise<{ normal: boolean; reason?: string }> {
    try {
      const eventsRef = collection(db, 'securityEvents');
      const thirtyMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000));
      
      const q = query(
        eventsRef,
        where('userId', '==', userId),
        where('timestamp', '>=', thirtyMinutesAgo),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const recentEvents = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreSecurityEvent;
        return {
          allowed: data.allowed,
          riskLevel: data.riskLevel,
          timestamp: data.timestamp?.toDate?.() || new Date()
        };
      });

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const failedAttempts = recentEvents.filter(event => 
        !event.allowed && event.timestamp > fiveMinutesAgo
      ).length;

      if (failedAttempts > 5) {
        return { 
          normal: false, 
          reason: 'Demasiados intentos fallidos recientemente' 
        };
      }

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const highRiskActions = recentEvents.filter(event => 
        event.riskLevel === 'high' && 
        event.timestamp > tenMinutesAgo
      ).length;

      if (highRiskActions > 3) {
        return { 
          normal: false, 
          reason: 'Actividad de alto riesgo inusual detectada' 
        };
      }

      return { normal: true };
    } catch (error) {
      console.warn('No se pudo verificar el comportamiento, asumiendo normal:', error);
      return { normal: true };
    }
  }

  private static async checkActionFrequency(userId: string, action: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const eventsRef = collection(db, 'securityEvents');
      const oneMinuteAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 1000));
      
      const q = query(
        eventsRef,
        where('userId', '==', userId),
        where('action', '==', action),
        where('timestamp', '>=', oneMinuteAgo),
        where('allowed', '==', true)
      );

      const snapshot = await getDocs(q);
      const recentActions = snapshot.size;

      const limits: { [key: string]: number } = {
        'modify_mfa': 2,    
        'secure_action': 5,  
        'test_api': 10,      
        'default': 20        
      };

      const limit = limits[action] || limits.default;

      if (recentActions >= limit) {
        return { 
          allowed: false, 
          reason: `Demasiadas solicitudes de "${action}" recientemente` 
        };
      }

      return { allowed: true };
    } catch (error) {
      console.warn('Error verificando frecuencia, permitiendo acción:', error);
      return { allowed: true };
    }
  }

  private static async hasRecentAuthentication(userId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const lastSignIn = user.metadata.lastSignInTime;
    if (!lastSignIn) return false;

    const timeSinceSignIn = Date.now() - new Date(lastSignIn).getTime();
    
    return timeSinceSignIn < 5 * 60 * 1000;
  }

  private static async checkPrivileges(userId: string, action: string, resource?: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = auth.currentUser;
    if (!user) return { allowed: false, reason: 'Usuario no autenticado' };

    if (!user.emailVerified && action === 'modify_mfa') {
      return { 
        allowed: false, 
        reason: 'Verificación de email requerida para modificar MFA' 
      };
    }

    return { allowed: true };
  }

  static async logSecurityEvent(eventInput: SecurityEventInput): Promise<void> {
    try {
      const eventRef = doc(collection(db, 'securityEvents'));
      
      const firestoreEvent: Omit<FirestoreSecurityEvent, 'timestamp'> & { timestamp: any } = {
        userId: eventInput.userId,
        action: eventInput.action,
        resource: eventInput.resource,
        riskLevel: eventInput.riskLevel,
        allowed: eventInput.allowed,
        reason: eventInput.reason,
        timestamp: serverTimestamp(),
        userAgent: eventInput.userAgent || 'react-native',
        ipAddress: eventInput.ipAddress || 'detected',
        location: eventInput.location || 'detected',
        eventId: eventRef.id
      };
      
      await setDoc(eventRef, firestoreEvent);

      console.log(`📋 Security Event: ${eventInput.action} → ${eventInput.allowed ? 'ALLOWED' : 'DENIED'}`);
      
    } catch (error) {
      console.error('Error logging security event:', error);
      console.warn('Security Event (fallback):', {
        ...eventInput,
        timestamp: new Date().toISOString()
      });
    }
  }

  static async requireReauthentication(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      console.log('🛡️ Zero Trust: Reautenticación requerida');
      
      await user.getIdToken(true);
      
      return true;
    } catch (error) {
      console.error('Error en reautenticación:', error);
      return false;
    }
  }

  static async getSecurityMetrics(userId: string): Promise<{
    totalEvents: number;
    allowedEvents: number;
    deniedEvents: number;
    highRiskEvents: number;
    lastEvent: Date | null;
  }> {
    try {
      const eventsRef = collection(db, 'securityEvents');
      const q = query(
        eventsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreSecurityEvent;
        return {
          allowed: data.allowed,
          riskLevel: data.riskLevel,
          timestamp: data.timestamp?.toDate?.() || new Date()
        };
      });

      return {
        totalEvents: events.length,
        allowedEvents: events.filter(e => e.allowed).length,
        deniedEvents: events.filter(e => !e.allowed).length,
        highRiskEvents: events.filter(e => e.riskLevel === 'high').length,
        lastEvent: events[0]?.timestamp || null
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        totalEvents: 0,
        allowedEvents: 0,
        deniedEvents: 0,
        highRiskEvents: 0,
        lastEvent: null
      };
    }
  }

  static async getRecentSecurityEvents(userId: string, limitCount: number = 10): Promise<SecurityEvent[]> {
    try {
      const eventsRef = collection(db, 'securityEvents');
      const q = query(
        eventsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreSecurityEvent;
        return {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          riskLevel: data.riskLevel,
          allowed: data.allowed,
          reason: data.reason,
          timestamp: data.timestamp?.toDate?.() || new Date(),
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          location: data.location
        } as SecurityEvent;
      });
    } catch (error) {
      console.error('Error getting recent security events:', error);
      return [];
    }
  }
  static async cleanupOldEvents(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      console.log(`🧹 Limpiando eventos más antiguos que: ${cutoffDate.toISOString()}`);

      
      return 0;
    } catch (error) {
      console.error('Error cleaning up old events:', error);
      return 0;
    }
  }


  static async getSystemStatus(): Promise<{
    firestoreConnected: boolean;
    authConnected: boolean;
    totalEvents: number;
    lastCleanup: Date | null;
  }> {
    try {
      const eventsRef = collection(db, 'securityEvents');
      const testQuery = query(eventsRef, limit(1));
      await getDocs(testQuery);

      const user = auth.currentUser;
      
      return {
        firestoreConnected: true,
        authConnected: !!user,
        totalEvents: 0, 
        lastCleanup: null
      };
    } catch (error) {
      console.error('Error checking system status:', error);
      return {
        firestoreConnected: false,
        authConnected: false,
        totalEvents: 0,
        lastCleanup: null
      };
    }
  }
}