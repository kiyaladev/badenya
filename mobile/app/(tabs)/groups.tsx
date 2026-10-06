import { Alert } from '@/services/dialog.service';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupStore } from '@/store/groupStore';
import GroupCard from '@/components/GroupCard';
import groupService, { GROUP_TYPE_LABELS, GroupType } from '@/services/group.service';
import { getErrorMessage } from '@/utils/errorHandler';
import { Icon, Loading, Badge } from '@/components/ui';

const styles = StyleSheet.create({
  fab: {
    elevation: 5,
  },
});

interface PublicCommunityGroup {
  id: string;
  name: string;
  type: GroupType;
  description: string;
  membersCount: number;
  contributionAmount: number;
  currency: string;
  frequency: string;
  city: string;
}

const searchIconStyle = { marginRight: 8 };

export default function GroupsScreen() {
  const [publicGroups, setPublicGroups] = useState<PublicCommunityGroup[]>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'my_groups' | 'discover'>('my_groups');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [inviteCode, setInviteCode] = useState('');
  const [joinedGroupIds, setJoinedGroupIds] = useState<Set<string>>(new Set());

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { groups, isLoading, fetchGroups } = useGroupStore();

  useEffect(() => {
    fetchGroups();
    groupService
      .discover()
      .then(groups =>
        setPublicGroups(
          groups.map(group => ({
            id: group._id,
            name: group.name,
            type: group.type,
            description: group.description || '',
            membersCount: group.memberCount ?? group.members.length,
            contributionAmount: group.contributionAmount,
            currency: group.currency,
            frequency: group.frequency,
            city: '',
          }))
        )
      )
      .catch(error => setDiscoveryError(getErrorMessage(error, 'Découverte indisponible')));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return Alert.alert('Code requis', 'Veuillez saisir un code.');
    try {
      const result = await groupService.joinByCode(inviteCode.trim().toUpperCase());
      Alert.alert(
        result.status === 'active' ? 'Groupe rejoint' : 'Demande envoyée',
        result.status === 'active'
          ? 'Vous êtes membre du groupe.'
          : 'Un administrateur doit approuver votre demande.'
      );
      setInviteCode('');
      await fetchGroups();
    } catch (error) {
      Alert.alert('Adhésion impossible', getErrorMessage(error));
    }
  };

  const handleRequestJoinPublicGroup = async (group: PublicCommunityGroup) => {
    try {
      const result = await groupService.join(group.id);
      setJoinedGroupIds(previous => new Set(previous).add(group.id));
      Alert.alert(
        result.status === 'active' ? 'Groupe rejoint' : 'Demande envoyée',
        result.status === 'active'
          ? 'Vous êtes membre du groupe.'
          : 'Votre demande attend une approbation.'
      );
      await fetchGroups();
    } catch (error) {
      Alert.alert('Adhésion impossible', getErrorMessage(error));
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || group.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredPublicGroups = publicGroups.filter(group => {
    return (
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View
        className="bg-white dark:bg-gray-800 px-6 pb-2 border-b border-gray-200 dark:border-gray-600"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          Groupes & Tontines
        </Text>

        {/* Top Segmented Tabs */}
        <View className="flex-row bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-3">
          <TouchableOpacity
            onPress={() => setActiveTab('my_groups')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'my_groups' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === 'my_groups' ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Mes Groupes ({groups.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('discover')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'discover' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeTab === 'discover' ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Découvrir la Communauté
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg mb-2">
          <Icon name="search" size={16} color="#9ca3af" style={searchIconStyle} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === 'my_groups'
                ? 'Rechercher parmi mes groupes...'
                : 'Rechercher par ville, nom, mots-clés...'
            }
            className="flex-1 text-sm text-gray-800 dark:text-gray-100 py-1"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'my_groups' ? (
          <>
            {/* Group Categories */}
            <View className="px-6 mt-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'all' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  onPress={() => setSelectedFilter('all')}
                >
                  <Text
                    className={`font-medium ${selectedFilter === 'all' ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    Tous
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'tontine' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  onPress={() => setSelectedFilter('tontine')}
                >
                  <Text
                    className={`font-medium ${selectedFilter === 'tontine' ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    Tontines
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'association' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  onPress={() => setSelectedFilter('association')}
                >
                  <Text
                    className={`font-medium ${selectedFilter === 'association' ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    Associations
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'family' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  onPress={() => setSelectedFilter('family')}
                >
                  <Text
                    className={`font-medium ${selectedFilter === 'family' ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    Famille
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'friends' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  onPress={() => setSelectedFilter('friends')}
                >
                  <Text
                    className={`font-medium ${selectedFilter === 'friends' ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    Amis
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === 'project' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                  onPress={() => setSelectedFilter('project')}
                >
                  <Text
                    className={`font-medium ${selectedFilter === 'project' ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    Projets
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Groups List */}
            <View className="px-6 mt-6">
              {isLoading && !refreshing ? (
                <Loading />
              ) : filteredGroups.length === 0 ? (
                /* Empty State */
                <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center">
                  <Icon name="users" size={48} color="#0284c7" />
                  <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold mb-2">
                    {searchQuery ? 'Aucun groupe trouvé' : 'Aucun groupe'}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-300 text-sm text-center mb-6">
                    {searchQuery
                      ? 'Essayez une autre recherche'
                      : "Commencez par créer votre premier groupe d'épargne ou explorez la communauté"}
                  </Text>
                  {!searchQuery && (
                    <TouchableOpacity
                      className="bg-primary-600 px-6 py-3 rounded-lg flex-row items-center"
                      onPress={() => router.push('/(screens)/create-group')}
                    >
                      <Icon name="plus" size={14} color="#ffffff" />
                      <Text className="text-white text-base font-bold ml-2">Créer un groupe</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                /* Groups List */
                filteredGroups.map(group => <GroupCard key={group._id} group={group} />)
              )}
            </View>

            {/* Discover Banner Link */}
            {groups.length > 0 && (
              <View className="px-6 mt-6 mb-8">
                <View className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-primary-100 shadow-sm">
                  <Text className="text-gray-800 dark:text-gray-100 text-base font-bold mb-1">
                    Découvrir la communauté Badenya
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-300 text-xs mb-3 leading-relaxed">
                    Rejoignez des groupes d'épargne publics et des tontines actives dans votre pays
                    ou région.
                  </Text>
                  <TouchableOpacity
                    className="bg-primary-50 dark:bg-gray-800 border border-primary-200 px-4 py-2.5 rounded-lg flex-row items-center justify-center active:bg-primary-100"
                    onPress={() => setActiveTab('discover')}
                  >
                    <Icon name="compass" size={16} color="#0284c7" />
                    <Text className="text-primary-700 text-sm font-semibold ml-2">
                      Explorer les groupes publics
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          /* Discover & Join Screen */
          <View className="px-6 mt-4 mb-8">
            {/* Join by Invitation Code */}
            <View className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-600 mb-6 shadow-sm">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-2">
                  <Icon name="key" size={14} color="#0284c7" />
                </View>
                <Text className="text-gray-800 dark:text-gray-100 font-bold text-base">
                  Rejoindre avec un code
                </Text>
              </View>
              <Text className="text-gray-600 dark:text-gray-300 text-xs mb-3">
                Vous avez reçu un code d'invitation d'un proche ou d'un collègue ?
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Ex: 8F2A9C"
                  autoCapitalize="characters"
                  className="flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold uppercase text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
                />
                <TouchableOpacity
                  onPress={handleJoinByCode}
                  className="bg-primary-600 px-5 py-2.5 rounded-lg items-center justify-center"
                >
                  <Text className="text-white font-bold text-sm">Valider</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Public Community Groups List */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-800 dark:text-gray-100 text-lg font-bold">
                Groupes publics actifs
              </Text>
              <Badge variant="primary" size="sm">
                Communauté
              </Badge>
            </View>

            <View className="space-y-4">
              {discoveryError && (
                <Text accessibilityRole="alert" className="text-red-600 mb-4">
                  {discoveryError}
                </Text>
              )}
              {!discoveryError && publicGroups.length === 0 && (
                <Text className="text-gray-600 dark:text-gray-300 mb-4">
                  Aucun groupe public disponible.
                </Text>
              )}
              {filteredPublicGroups.map(pGroup => {
                const isRequested = joinedGroupIds.has(pGroup.id);
                return (
                  <View
                    key={pGroup.id}
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm mb-4"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Badge
                        variant={
                          pGroup.type === 'tontine'
                            ? 'warning'
                            : pGroup.type === 'project'
                              ? 'info'
                              : 'primary'
                        }
                        size="sm"
                      >
                        {GROUP_TYPE_LABELS[pGroup.type]}
                      </Badge>
                      <View className="flex-row items-center">
                        <Icon name="map-marker" size={12} color="#6b7280" />
                        <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          {pGroup.city}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-gray-900 dark:text-gray-50 font-bold text-base mb-1">
                      {pGroup.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-3">
                      {pGroup.description}
                    </Text>

                    <View className="flex-row justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mb-3">
                      <View>
                        <Text className="text-gray-400 text-xs">Cotisation</Text>
                        <Text className="text-gray-800 dark:text-gray-100 font-bold text-sm">
                          {pGroup.contributionAmount.toLocaleString()} {pGroup.currency}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-400 text-xs">Fréquence</Text>
                        <Text className="text-gray-800 dark:text-gray-100 font-semibold text-sm">
                          {pGroup.frequency}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-gray-400 text-xs">Membres</Text>
                        <Text className="text-gray-800 dark:text-gray-100 font-semibold text-sm">
                          {pGroup.membersCount} personnes
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRequestJoinPublicGroup(pGroup)}
                      disabled={isRequested}
                      className={`py-3 rounded-lg flex-row items-center justify-center ${
                        isRequested
                          ? 'bg-emerald-50 border border-emerald-300'
                          : 'bg-primary-600 active:bg-primary-700'
                      }`}
                    >
                      {isRequested ? (
                        <>
                          <Icon name="check" size={14} color="#059669" />
                          <Text className="text-emerald-700 font-semibold text-sm ml-2">
                            Demande envoyée
                          </Text>
                        </>
                      ) : (
                        <>
                          <Icon name="user-plus" size={14} color="#ffffff" />
                          <Text className="text-white font-semibold text-sm ml-2">
                            Demander à rejoindre
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary-600 w-16 h-16 rounded-full items-center justify-center shadow-lg active:bg-primary-700"
        style={styles.fab}
        onPress={() => router.push('/(screens)/create-group')}
      >
        <Icon name="plus" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
