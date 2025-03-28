import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { getId } from '@/utils/tokenStorage'
import apiClient from '@/api/client'
import { useDispatch } from 'react-redux'
import { followUser, unfollowUser } from '@/redux/followingSlice'
import { LinearGradient } from 'expo-linear-gradient'
import AppText from '@/components/app-text'
import Icon from 'react-native-vector-icons/Ionicons'
import { GRADIENT_COLORS, TROPHY_COLOR } from '@/constants/colors'
import { apiEndpoints } from '@/api/endpoints'
import { useFetchData } from '@/api/hooks/useFetchData'

const User = () => {
  const dispatch = useDispatch()

  const [following, setFollowing] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false) // New state for tracking the follow/unfollow process

  const {
      data: userDetailsData,
      loading: userDetailsLoading,
      error: userDetailsError,
      fetchDataFromServer: fetchUserDetails 
  } = useFetchData()
  
  const {
      data: streakData,
      loading: streakLoading,
      error: streakError,
      fetchDataFromServer: fetchStreak 
  } = useFetchData()
  
  const {
      loading: checkFollowLoading,
      fetchDataFromServer: fetchCheckFollow 
  } = useFetchData()

  const { id: userId } = useLocalSearchParams()

  useEffect(() => {
    const fetchData = async () => {
        const myId = await getId()

        if (userId && myId) {
          await fetchUserDetails(apiEndpoints.users.details(Number(userId)))
          await fetchStreak(apiEndpoints.streak.base(Number(userId)))
          

          const followStatusResponse = await fetchCheckFollow(apiEndpoints.users.checkFollow(Number(userId)))

          setFollowing(followStatusResponse.is_following)
        } else {
          throw new Error('ID not found')
        }
    }

    fetchData()
  }, [])

  const handleFollowToggle = async () => {
    try {
      const myId = await getId()

      if (myId && userId) {
        setIsProcessing(true) // Set processing state to true while follow/unfollow is in progress
        
        const endpoint = following
          ? apiEndpoints.users.unfollow(Number(userId))
          : apiEndpoints.users.follow(Number(userId))

        const method = following ? 'DELETE' : 'POST'

        await apiClient({
          url: endpoint,
          method,
        })

        if (following) {
          dispatch(unfollowUser({ id: Number(userId) }))
        } else {
          dispatch(followUser({ id: userId, username: userDetailsData.username, top_streak: streakData.top_streak }))
        }

        setFollowing(!following)
      } else {
        throw new Error('ID not found')
      }
    } catch (err: any) {
      console.error(err.message)
    } finally {
      setIsProcessing(false) // Set processing state to false once the action is done
    }
  }

  if (userDetailsLoading || streakLoading || checkFollowLoading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" />
    </View>
  )

  if (userDetailsError) return <AppText>Error: {userDetailsError}</AppText>
  if (streakError) return <AppText>Error: {streakError}</AppText>
  if (!userDetailsData) return <AppText>No data available.</AppText>
  if (!streakData) return <AppText>No data available.</AppText>

  return (
    <LinearGradient
        colors={GRADIENT_COLORS}
        style={styles.container}
    >
      <AppText style={styles.title}>{userDetailsData.username}</AppText>
      <AppText style={styles.streak}>
            <Icon name="trophy" size={20} color={TROPHY_COLOR} style={styles.trophyIcon} />
            Top Streak: {streakData.top_streak}
      </AppText>
      <TouchableOpacity
        style={following ? styles.unfollowButton : styles.followButton}
        onPress={handleFollowToggle}
        disabled={isProcessing} // Disable button while processing
      >
        <AppText style={styles.buttonText}>
          {isProcessing
            ? 'Processing...' // Show "Processing..." text when the action is in progress
            : following
            ? 'Unfollow'
            : 'Follow'}
        </AppText>
      </TouchableOpacity>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  streak: {
    fontSize: 18,
    marginVertical: 5,
  },
  followButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
  },
  unfollowButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyIcon: {
    marginHorizontal: 5, // Adds space between the trophy and the score
  },
})

export default User
