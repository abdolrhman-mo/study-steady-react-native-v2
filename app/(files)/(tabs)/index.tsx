import React, { useState, useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '@/components/app-text';
import { View, TouchableOpacity, Modal, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { usePostData } from '@/api/hooks/usePostData';
import { styles } from '@/components/timer/timer.styles';
import { apiEndpoints } from '@/api/endpoints';
import { getId } from '@/utils/tokenStorage'
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentStreak, setTopStreak, updateCurrentStreak } from '@/redux/streakSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS, PRIMARY_COLOR } from '@/constants/colors';
import { Svg, Circle } from 'react-native-svg'
import { shadowStyle } from '@/styles/styles';
import { useFetchData } from '@/api/hooks/useFetchData';
import * as Notifications from 'expo-notifications';
import { NavigationProp, useNavigation } from '@react-navigation/native';

/*
    ### Timer ###
    The timer uses Date.now() => Returns the current time in milliseconds since January 1, 1970 (Unix Epoch)
*/

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export default function Timer(): JSX.Element {
    // Timer Main States
    const [startTime, setStartTime] = useState<number | null>(null); // Stores start time in Unix Epoch
    const [timeLeft, setTimeLeft] = useState<number>(0); // Stores time left in seconds
    const [elapsedTime, setElapsedTime] = useState<number>(0); // Tracks elapsed time when paused
    // Timer Secondary States
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [isBreak, setIsBreak] = useState<boolean>(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    // More States
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [sessionReminderVisible, setSessionReminderVisible] = useState<boolean>(false);
    const [promptModalVisible, setPromptModalVisible] = useState<boolean>(false);
    const dispatch = useDispatch();
    const [notificationTimeoutId, setNotificationTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const navigation = useNavigation<NavigationProp<any>>();
    // API Calls Hooks
    const { 
        data: saveSessionRes,
        loading: saveSessionLoading,
        postDataToServer: postSession
    } = usePostData(); // Hook
    const {
        fetchDataFromServer
    } = useFetchData(); // Hook
    

    // Notification Request Permission
    useEffect(() => {
        Notifications.requestPermissionsAsync();
    }, []);

    // Handle Notification click on mobile
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification Clicked:', response);
            navigation.navigate('index'); // Replace with your actual screen
        });

        return () => subscription.remove();
    }, []);
    
    // *********************** API Calls ***********************
    useEffect(() => {
        const fetchData = async () => {
            const id = await getId();
            if (id) {
                const response = await fetchDataFromServer(apiEndpoints.streak.base(id)); // Wait for the fetch
    
                if (response) {
                    dispatch(setCurrentStreak({ currentStreak: response.current_streak }));
                    dispatch(setTopStreak(Number(response.top_streak)));
                    if (response.current_streak > 0) {
                        setSessionReminderVisible(false)
                    } else {
                        setSessionReminderVisible(true)
                    }
                }
            }
        };
        fetchData();
    }, []);
    
    const saveSessionData = async (duration: number): Promise<void> => {
        await postSession(apiEndpoints.session.base, { duration });
    };

    // *********************** Global States ***********************
    useEffect(() => {
        // Global State Streak
        if (!saveSessionLoading && saveSessionRes) {
            console.log('session saved res', saveSessionRes.current_streak)
            dispatch(updateCurrentStreak(saveSessionRes.current_streak))
        }
    }, [saveSessionRes, saveSessionLoading])

    // *********************** Notifications ***********************
    const scheduleNotification = async (minutes: number) => {
        const seconds = minutes * 60
        // Mobile Notifications
        if (Platform.OS !== 'web') {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⏰ Time is up!',
                    body: 'Your Pomodoro session has ended.',
                    sound: true,
                },
                trigger: { seconds, repeats: false } as Notifications.TimeIntervalTriggerInput,
            });
        } 

        // Web Notifications
        else {
            if (Notification.permission === 'granted') {
                setTimeout(() => {
                    const notification = new Notification('⏰ Time is up!', {
                        body: 'Click to return to the timer!',
                    });

                    // Handle notification click
                    notification.onclick = () => {
                        window.focus(); // Bring tab to focus
                    };
                }, seconds * 1000);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        setTimeout(() => {
                            const notification = new Notification('⏰ Time is up!', {
                                body: 'Click to return to the timer!',
                            });

                            // Handle notification click
                            notification.onclick = () => {
                                window.focus(); // Bring tab to focus
                            };
                        }, seconds * 1000);
                    }
                });
            }
        }
    };
    
    const cancelNotification = async () => {
        if (Platform.OS !== 'web') {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } else {
            if (notificationTimeoutId) {
                clearTimeout(notificationTimeoutId);
                setNotificationTimeoutId(null);
                console.log('Web notification timeout cleared.');
            }
        }
    };

    // Web Notifications check if Tab is Active or InActive
    // if Active scheduleNotification
    // else it removes scheduleNotification
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isRunning) {
                console.log('Tab is hidden, switching to web notification');
                scheduleNotification(timeLeft / 60); // Send web notification
            }
        };
    
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isRunning, timeLeft]);

    
    // *********************** Timer ***********************
    // Timer End
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
    
        if (isRunning && startTime) {
            interval = setInterval(() => {
                const timePassedAway = Math.floor((Date.now() - startTime) / 1000);
                const newTimeLeft = Math.max(timeLeft - timePassedAway, 0);
                setTimeLeft(newTimeLeft);
    
                if (newTimeLeft <= 0) {
                    clearInterval(interval);
                    setIsRunning(false);
                    playSound();
                    setModalVisible(true);
                    // cancelNotification();
                    if (!isBreak) {
                        saveSessionData(duration);
                    }
                }
            }, 1000);
        } else {
            clearInterval(interval);
        }
    
        return () => clearInterval(interval);
    }, [isRunning, startTime]);

    // Timer Start
    const startTimer = (minutes: number, breakTime: boolean = false): void => {
        // Timer main states
        setStartTime(Date.now());
        setTimeLeft(minutes * 60);
        setElapsedTime(0);
        // Timer secondary states
        setDuration(minutes);
        setIsRunning(true);
        setIsPaused(false);
        setIsBreak(breakTime)
        // More states
        setPromptModalVisible(true)
        scheduleNotification(minutes)
    };

    // Timer Paused
    const pauseTimer = (): void => {
        if (startTime) {
            setIsRunning(false);
            setIsPaused(true);
            setElapsedTime((prevElapsed) => prevElapsed + (Date.now() - startTime));
            
            // Cancel the scheduled notification
            cancelNotification();
        }
    };
    
    // Timer Resumed
    const resumeTimer = (): void => {
        if (isPaused) {
            const newStartTime = Date.now() - elapsedTime; // Adjust start time
            setStartTime(newStartTime);
            setIsRunning(true);
            setIsPaused(false);
            
            // Ensure timeLeft is correct before scheduling
            const remainingTime = Math.max(timeLeft - Math.floor(elapsedTime / 1000), 0);
            setTimeLeft(remainingTime);
            
            // Reschedule notification
            scheduleNotification(remainingTime / 60); // Convert back to minutes
        }
    };

    const playSound = async (): Promise<void> => {
        const { sound } = await Audio.Sound.createAsync(require('@/assets/iphone_alarm.mp3'));
        setSound(sound);
        await sound.playAsync();
    };

    const stopSound = async (): Promise<void> => {
        if (sound) {
            await sound.stopAsync();
            setSound(null);
        }
    };

    const handleBreak = (): void => {
        stopSound();
        startTimer(10, true);
        setModalVisible(false);
    };

    const handleCancel = (): void => {
        stopSound();
        setModalVisible(false);
    };

    const handleNewSession = (): void => {
        stopSound();
        startTimer(duration);
        setModalVisible(false);
    };

    const formatTime = (seconds: number): any => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Alert component to show when streak is zero
    const renderStreakAlert = () => {
        if (sessionReminderVisible) {
          return (
            <View style={styles.alertContainer}>
              <View style={[styles.alert, shadowStyle.default]}>
                <AppText style={styles.alertText}>
                    Start the timer and study to begin your streak!
                    <Icon name="flame" size={20} color="#ff4500" style={styles.icon} />
                </AppText>
                <TouchableOpacity
                  style={styles.alertCloseButton}
                  onPress={() => setSessionReminderVisible(false)}
                >
                  <Icon name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )
        }
        return null
      }
    
      return (
        <LinearGradient 
            colors={GRADIENT_COLORS}
            style={styles.container}
        >
          {renderStreakAlert()}
          <View style={styles.timerContainer}>
            <Svg height="300" width="300" viewBox="0 0 200 200">
            {/* Background Circle */}
            <Circle
                cx="100"
                cy="100"
                r="90"
                stroke="#FFE6D6"
                strokeWidth="5"
                fill="none"
                />
            {/* Progress Circle */}
            <Circle
                cx="100"
                cy="100"
                r="90"
                stroke={PRIMARY_COLOR}
                strokeWidth="5"
                fill="none"
                strokeDasharray={Math.PI * 2 * 90} // Full circle length
                strokeDashoffset={(1 - timeLeft / (duration * 60)) * Math.PI * 2 * 90} // Increases to erase the stroke
                strokeLinecap="round"
            />
            </Svg>
            <AppText style={styles.timer}>{formatTime(timeLeft)}</AppText>
        </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.minsButton, isRunning && !isPaused && styles.disabledButton]}
              onPress={() => startTimer(0.2)}
              disabled={isRunning && !isPaused}
            >
              <Icon name="timer-outline" size={20} color={PRIMARY_COLOR} />
              <AppText style={styles.minsButtonText}>25 min</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.minsButton, isRunning && !isPaused && styles.disabledButton]}
              onPress={() => startTimer(50)}
              disabled={isRunning && !isPaused}
            >
              <Icon name="timer-outline" size={20} color={PRIMARY_COLOR} />
              <AppText style={styles.minsButtonText}>50 min</AppText>
            </TouchableOpacity>
          </View>
          <View style={styles.controlButtonsContainer}>
            {isRunning && !isPaused && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={pauseTimer}
              >
                <Icon name="pause" size={20} color="#fff" />
                {/* <AppText style={styles.controlButtonText}>Pause</AppText> */}
              </TouchableOpacity>
            )}
            {isPaused && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={resumeTimer}
              >
                <Icon name="play" size={20} color="#fff" />
                {/* <AppText style={styles.controlButtonText}>Resume</AppText> */}
              </TouchableOpacity>
            )}
          </View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={handleCancel}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <AppText style={styles.modalText}>{isBreak ? "Break over!" : "Time's up!"}</AppText>
                <View style={styles.modalButtonsContainer}>
                  {isBreak ? (
                    <>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleNewSession}
                      >
                        <Icon name="checkmark-outline" size={20} color="#fff" />
                        <AppText style={styles.modalButtonText}>Start New Session</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleCancel}
                      >
                        <Icon name="close-outline" size={20} color="#fff" />
                        <AppText style={styles.modalButtonText}>Cancel</AppText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleBreak}
                      >
                        <Icon name="checkmark-outline" size={20} color="#fff" />
                        <AppText style={styles.modalButtonText}>Take a Break</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleCancel}
                      >
                        <Icon name="close-outline" size={20} color="#fff" />
                        <AppText style={styles.modalButtonText}>Cancel</AppText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={promptModalVisible}
            onRequestClose={() => setPromptModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalView}>
                <AppText style={styles.modalText}>Please don't leave the app to prevent the timer from stopping.</AppText>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setPromptModalVisible(false)}
                >
                  <Icon name="close-outline" size={20} color="#fff" />
                  <AppText style={styles.modalButtonText}>Okay</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      )
}