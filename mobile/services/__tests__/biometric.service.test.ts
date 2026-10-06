jest.mock('../token-storage', () => ({
  __esModule: true,
  default: jest.requireMock('expo-secure-store'),
}));
import biometricService from '../biometric.service';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

describe('BiometricService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBiometricAvailable', () => {
    it('returns true when hardware is present and enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await biometricService.isBiometricAvailable();
      expect(result).toBe(true);
    });

    it('returns false when hardware is missing', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);

      const result = await biometricService.isBiometricAvailable();
      expect(result).toBe(false);
    });
  });

  describe('getBiometricName', () => {
    it('returns Face ID when facial recognition is available', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const name = await biometricService.getBiometricName();
      expect(name).toBe('Face ID / Reconnaissance faciale');
    });

    it('returns Empreinte digitale when fingerprint is available', async () => {
      (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const name = await biometricService.getBiometricName();
      expect(name).toBe('Empreinte digitale');
    });
  });

  describe('enable / disable biometrics', () => {
    it('saves preference to SecureStore', async () => {
      await biometricService.setBiometricLoginEnabled(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('badenya_biometrics_enabled', 'true');

      await biometricService.setBiometricLoginEnabled(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('badenya_biometrics_enabled');
    });

    it('reads preference from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');
      const isEnabled = await biometricService.isBiometricLoginEnabled();
      expect(isEnabled).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('returns success true when authentication succeeds', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

      const res = await biometricService.authenticate();
      expect(res.success).toBe(true);
    });

    it('returns success false with error message when authentication fails', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const res = await biometricService.authenticate();
      expect(res.success).toBe(false);
      expect(res.error).toBe('user_cancel');
    });
  });
});
