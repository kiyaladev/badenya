import { Alert } from '../dialog.service';
jest.mock('react-native', () => ({ Platform: { OS: 'web' }, Alert: { alert: jest.fn() } }));
describe('Browser confirmation callbacks', () => {
  const confirm = jest.fn();
  const alert = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { confirm, alert } });
  });
  it('executes the accepted financial action exactly once', () => {
    const accepted = jest.fn();
    confirm.mockReturnValue(true);
    Alert.alert('Versement', 'Confirmer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: accepted },
    ]);
    expect(accepted).toHaveBeenCalledTimes(1);
  });
  it('does not perform an action when confirmation is cancelled', () => {
    const accepted = jest.fn();
    confirm.mockReturnValue(false);
    Alert.alert('Versement', 'Confirmer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: accepted },
    ]);
    expect(accepted).not.toHaveBeenCalled();
  });
  it('runs the success navigation after acknowledgement', () => {
    const navigate = jest.fn();
    Alert.alert('Création réussie', undefined, [{ text: 'OK', onPress: navigate }]);
    expect(alert).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
