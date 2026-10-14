import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_SEEN_KEY } from './splash';
import { themedStyles } from '@/utils/themedStyles';
import { useThemeStore } from '@/store/themeStore';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui';

const onboardingData = [
  {
    title: 'Épargne Ensemble',
    description: "Créez et gérez vos tontines et groupes d'épargne facilement avec vos proches",
    icon: 'bank' as IconName,
    gradient: ['#0284c7', '#0369a1'] as const,
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    title: 'Décisions Transparentes',
    description: 'Votez démocratiquement sur toutes les dépenses et décisions du groupe',
    icon: 'check-square-o' as IconName,
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    title: 'Suivi en Temps Réel',
    description: "Suivez vos cotisations et l'évolution de votre épargne à tout moment",
    icon: 'line-chart' as IconName,
    gradient: ['#10b981', '#059669'] as const,
    iconBg: 'rgba(255,255,255,0.2)',
  },
];

const baseStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  skipContainer: {
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  skipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  bottom: {
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default function OnboardingScreen() {
  const styles = themedStyles(
    baseStyles,
    useThemeStore(state => state.colors)
  );
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const finishOnboarding = () => {
    AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1').catch(() => undefined);
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = finishOnboarding;

  const currentSlide = onboardingData[currentPage];
  const skipContainerStyle: ViewStyle = {
    ...styles.skipContainer,
    paddingTop: insets.top + 16,
  };
  const bottomStyle: ViewStyle = {
    ...styles.bottom,
    paddingBottom: insets.bottom + 32,
  };
  const iconStyle: ViewStyle = {
    ...styles.icon,
    backgroundColor: currentSlide.iconBg,
  };
  const nextButtonStyle: ViewStyle = {
    ...styles.nextButton,
    shadowColor: currentSlide.gradient[0],
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...currentSlide.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Skip Button */}
          <View style={skipContainerStyle}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={iconStyle}>
              <Icon name={currentSlide.icon} size={64} color="#ffffff" />
            </View>

            {/* Title */}
            <Text style={styles.title}>{currentSlide.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{currentSlide.description}</Text>
          </View>

          {/* Bottom Section */}
          <View style={bottomStyle}>
            {/* Pagination dots */}
            <View style={styles.pagination}>
              {onboardingData.map((_, index) => {
                const dotStyle: ViewStyle = {
                  ...styles.dot,
                  width: index === currentPage ? 32 : 8,
                  backgroundColor: index === currentPage ? currentSlide.gradient[0] : '#e5e7eb',
                };

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentPage(index)}
                    style={dotStyle}
                  />
                );
              })}
            </View>

            {/* Next Button */}
            <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient
                colors={[...currentSlide.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={nextButtonStyle}
              >
                <Text style={styles.nextText}>
                  {currentPage === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
                </Text>
                <Icon
                  name={currentPage === onboardingData.length - 1 ? 'check' : 'arrow-right'}
                  size={18}
                  color="#ffffff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
