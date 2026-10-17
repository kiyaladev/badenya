import { useEffect, useState, ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { StyleSheet, View } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { Loading } from '@/components/ui';
const styles = StyleSheet.create({
  fill: { flex: 1 },
  cover: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
});
export default function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [checked, setChecked] = useState(isAuthenticated);
  useEffect(() => {
    if (!checked) checkAuth().finally(() => setChecked(true));
  }, [checked, checkAuth]);
  const colors = useThemeStore(state => state.colors);
  if (!checked || (!isAuthenticated && isLoading)) return <Loading />;
  if (!isAuthenticated) return <Redirect href="/(auth)/splash" />;
  return (
    <View style={styles.fill}>
      <View
        style={styles.fill}
        pointerEvents={isLoading ? 'none' : 'auto'}
        accessibilityElementsHidden={isLoading}
        aria-hidden={isLoading}
        importantForAccessibility={isLoading ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </View>
      {isLoading && (
        <View
          testID="session-lock-cover"
          style={[styles.cover, { backgroundColor: colors.background }]}
        >
          <Loading />
        </View>
      )}
    </View>
  );
}
