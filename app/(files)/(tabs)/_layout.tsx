import { Link, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { getId, getUserData } from '@/utils/tokenStorage';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setCurrentStreak } from '@/redux/streakSlice';
import apiClient from '@/api/client';
import AppText from '@/components/app-text';
import { useFetchData } from '@/api/hooks/useFetchData';
import { apiEndpoints } from '@/api/endpoints';


export default function TabLayout() {
  const dispatch = useDispatch();
  const currentStreak = useSelector((state: RootState) => state.streak.currentStreak);

  const { loading, fetchDataFromServer: fetchStreak } = useFetchData()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = await getId();
        if (id) {
          const response = await fetchStreak(apiEndpoints.streak.base(id))

          // Global State Current streak
          dispatch(setCurrentStreak({ currentStreak: response.data.current_streak }))
        } else {
          throw new Error('ID not found');
        }
      } catch (err: any) {

        if (err.code == "ERR_NETWORK") {
            const userLocalData = await getUserData()

            if (userLocalData) {
                dispatch(setCurrentStreak({ currentStreak: userLocalData.currentStreak }))
            }
        }

      }
    };

    fetchData();
  }, []); // Empty dependency array to run on mount only

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#E87C39" />
    </View>
  );
//   if (error) return <AppText>Error: {error}</AppText>;
//   if (!currentStreak) return <AppText>No data available.</AppText>;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E87C39',
        headerShadowVisible: false,
        headerTitle: '',
        headerLeft: () => (
          <Image
            source={require('@/assets/images/study steady icon.png')}
            style={{ width: 120, height: 80, marginLeft: 10 }}
          />
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <Link href={'/(files)/(tabs)/streak'}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
                <Ionicons name="flame" size={24} color="#ff4500" />
                <AppText style={{ marginLeft: 5, fontSize: 16, color: '#ff4500', fontWeight: 'bold' }}>
                  {currentStreak}
                </AppText>
              </View>
            </Link>
            <Link href={'/profile'}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="person-circle-outline" size={24} style={{color: '#E87C39'}} />
              </View>
            </Link>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'timer-sharp' : 'timer-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(leaderboard)"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          tabBarItemStyle: { display: 'none' },
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="streak"
        options={{
          title: 'Streak',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flame' : 'flame-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      // backgroundColor: '#e0f7fa',
    },
  })