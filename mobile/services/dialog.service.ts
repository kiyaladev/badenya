import { Alert as NativeAlert, Platform, type AlertButton, type AlertOptions } from 'react-native';
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void {
    if (Platform.OS !== 'web') return NativeAlert.alert(title, message, buttons, options);
    if (typeof window === 'undefined') return;
    const text = [title, message].filter(Boolean).join('\n\n');
    const actions = (buttons || []).filter(button => button.style !== 'cancel');
    const cancel = buttons?.find(button => button.style === 'cancel');
    if ((buttons?.length || 0) > 1) {
      if (actions.length > 1) {
        const choice = window.prompt(
          `${text}\n${actions.map((action, index) => `${index + 1}. ${action.text}`).join('\n')}`
        );
        const action = choice ? actions[Number(choice) - 1] : undefined;
        if (action) action.onPress?.();
        else cancel?.onPress?.();
      } else if (window.confirm(text)) actions[0]?.onPress?.();
      else cancel?.onPress?.();
    } else {
      window.alert(text);
      actions[0]?.onPress?.();
    }
  },
};
