import * as LocalAuthentication from 'expo-local-authentication';
import SecureStore from './token-storage';

const BIOMETRIC_ENABLED_KEY = 'badenya_biometrics_enabled';

class BiometricService {
  public async isHardwareAvailable(): Promise<boolean> {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  public async isEnrolled(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  }

  public async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await this.isHardwareAvailable();
    const isEnrolled = await this.isEnrolled();
    return hasHardware && isEnrolled;
  }

  public async getBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch {
      return [];
    }
  }

  public async getBiometricName(): Promise<string> {
    const types = await this.getBiometricTypes();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID / Reconnaissance faciale';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Empreinte digitale';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Reconnaissance de l’iris';
    }
    return 'Biométrie';
  }

  public async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  public async setBiometricLoginEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      }
    } catch {
      // SecureStore error handled
    }
  }

  public async authenticate(promptMessage = 'Confirmez votre identité pour continuer'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const available = await this.isBiometricAvailable();
      if (!available) {
        return { success: false, error: 'Biométrie non disponible sur cet appareil.' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Utiliser le mot de passe',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error || 'Échec d’authentification' };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return { success: false, error: err?.message || 'Erreur d’authentification biométrique' };
    }
  }
}

export default new BiometricService();
