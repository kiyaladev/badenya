import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_SEEN_KEY } from './splash';
import { View, Text, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
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

export default function OnboardingScreen() {
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
  // Slide-dependent and safe-area values stay inline; LinearGradient is not className-aware.
  const nextButtonStyle: ViewStyle = {
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    shadowColor: currentSlide.gradient[0],
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-800">
      <LinearGradient
        colors={[...currentSlide.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="grow">
          {/* Skip Button */}
          <View className="px-6 items-end" style={{ paddingTop: insets.top + 16 }}>
            <TouchableOpacity onPress={handleSkip} className="px-4 py-2 rounded-full bg-white/15">
              <Text className="text-white text-sm font-medium">Passer</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 justify-center items-center px-8">
            {/* Icon */}
            <View
              className="w-[140px] h-[140px] rounded-full items-center justify-center mb-12"
              style={{ backgroundColor: currentSlide.iconBg }}
            >
              <Icon name={currentSlide.icon} size={64} color="#ffffff" />
            </View>

            {/* Title */}
            <Text className="text-[32px] font-bold text-white text-center mb-4">
              {currentSlide.title}
            </Text>

            {/* Description */}
            <Text className="text-[17px] text-white/90 text-center leading-[26px] px-4">
              {currentSlide.description}
            </Text>
          </View>

          {/* Bottom Section */}
          <View
            className="px-6 bg-white dark:bg-gray-800 rounded-t-[32px] pt-8"
            style={{ paddingBottom: insets.bottom + 32 }}
          >
            {/* Pagination dots */}
            <View className="flex-row justify-center mb-8">
              {onboardingData.map((_, index) => {
                const dotStyle: ViewStyle = {
                  width: index === currentPage ? 32 : 8,
                  backgroundColor: index === currentPage ? currentSlide.gradient[0] : '#e5e7eb',
                };

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentPage(index)}
                    className="h-2 rounded mx-1"
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
                <Text className="text-white text-[17px] font-semibold mr-2">
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
