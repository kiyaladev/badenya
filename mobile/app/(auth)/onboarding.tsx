import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const onboardingData = [
  {
    title: 'Épargne Ensemble',
    description: "Créez et gérez vos tontines et groupes d'épargne facilement avec vos proches",
    icon: 'bank' as const,
    gradient: ['#0284c7', '#0369a1'] as const,
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    title: 'Décisions Transparentes',
    description: 'Votez démocratiquement sur toutes les dépenses et décisions du groupe',
    icon: 'check-square-o' as const,
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    iconBg: 'rgba(255,255,255,0.2)',
  },
  {
    title: 'Suivi en Temps Réel',
    description: "Suivez vos contributions et l'évolution de votre épargne à tout moment",
    icon: 'line-chart' as const,
    gradient: ['#10b981', '#059669'] as const,
    iconBg: 'rgba(255,255,255,0.2)',
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const currentSlide = onboardingData[currentPage];

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <LinearGradient
        colors={[...currentSlide.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Skip Button */}
          <View
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 24,
              alignItems: 'flex-end',
            }}
          >
            <TouchableOpacity
              onPress={handleSkip}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>Passer</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 32,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: currentSlide.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 48,
              }}
            >
              <FontAwesome name={currentSlide.icon} size={64} color="#ffffff" />
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {currentSlide.title}
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 17,
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                lineHeight: 26,
                paddingHorizontal: 16,
              }}
            >
              {currentSlide.description}
            </Text>
          </View>

          {/* Bottom Section */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingBottom: insets.bottom + 32,
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 32,
            }}
          >
            {/* Pagination dots */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
              {onboardingData.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentPage(index)}
                  style={{
                    height: 8,
                    width: index === currentPage ? 32 : 8,
                    borderRadius: 4,
                    marginHorizontal: 4,
                    backgroundColor: index === currentPage ? currentSlide.gradient[0] : '#e5e7eb',
                  }}
                />
              ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient
                colors={[...currentSlide.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: currentSlide.gradient[0],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '600', marginRight: 8 }}>
                  {currentPage === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
                </Text>
                <FontAwesome
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
