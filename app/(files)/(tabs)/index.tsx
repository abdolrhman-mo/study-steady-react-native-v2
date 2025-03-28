import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import AppText from '@/components/app-text';
import { View, TouchableOpacity, Modal } from 'react-native';
import { Audio } from 'expo-av';
import { usePostData } from '@/api/hooks/usePostData';
import { styles } from '@/components/timer/timer.styles';
import { apiEndpoints } from '@/api/endpoints';
import { getId } from '@/utils/tokenStorage'
import { useDispatch } from 'react-redux';
import { setCurrentStreak, setTopStreak, updateCurrentStreak } from '@/redux/streakSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS, PRIMARY_COLOR } from '@/constants/colors';
import { Svg, Circle } from 'react-native-svg'
import { shadowStyle } from '@/styles/styles';
import { useFetchData } from '@/api/hooks/useFetchData';


export default function Timer(): JSX.Element {
    // Timer Main States
    const [startTime, setStartTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    // Timer Secondary States
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [isBreak, setIsBreak] = useState<boolean>(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    // More States
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [promptModalVisible, setPromptModalVisible] = useState<boolean>(false);
    const [streak, setStreak] = useState<number>(1);

    const { 
        data: saveSessionRes,
        loading: saveSessionLoading,
        postDataToServer: postSession
    } = usePostData(); // Hook

    const {
        fetchDataFromServer
    } = useFetchData(); // Hook
    
    const dispatch = useDispatch();
    
    useEffect(() => {
        const fetchData = async () => {
            const id = await getId();
            if (id) {
                const response = await fetchDataFromServer(apiEndpoints.streak.base(id)); // Wait for the fetch
    
                if (response) {
                    dispatch(setCurrentStreak({ currentStreak: response.current_streak }));
                    dispatch(setTopStreak(Number(response.top_streak)));
    
                    if (response.current_streak === 0 && response.top_streak === 0) {
                        setStreak(0);
                    }
                }
            }
        };
        fetchData();
    }, []);
    
    const saveSessionData = async (duration: number): Promise<void> => {
        await postSession(apiEndpoints.session.base, { duration });
    };

    useEffect(() => {
        // Global State Streak
        if (!saveSessionLoading && saveSessionRes) {
            console.log('session saved res', saveSessionRes.current_streak)
            dispatch(updateCurrentStreak(saveSessionRes.current_streak))
        }
    }, [saveSessionRes, saveSessionLoading])

    // Timer End
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
    
        if (isRunning && startTime) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const newTimeLeft = Math.max(timeLeft - elapsed, 0);
                setTimeLeft(newTimeLeft);
    
                if (newTimeLeft <= 0) {
                    clearInterval(interval);
                    setIsRunning(false);
                    playSound();
                    setModalVisible(true);
                    if (!isBreak) {
                        saveSessionData(duration);
                        setStreak((prevStreak) => prevStreak + 1); // Increase streak after each session
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
        setTimeLeft(minutes * 60);
        setDuration(minutes);
        setStartTime(Date.now());
        setIsRunning(true);
        setIsPaused(false);
        setIsBreak(breakTime)

        setPromptModalVisible(true)
    };

    // Timer Paused
    const pauseTimer = (): void => {
        setIsPaused(true);
        setIsRunning(false);
    };

    // Timer Resumed
    const resumeTimer = (): void => {
        if (isPaused) {
            setStartTime(Date.now() - (timeLeft * 1000)); // Adjust for paused time
            setIsRunning(true);
            setIsPaused(false);
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
        if (streak === 0) {
          return (
            <View style={styles.alertContainer}>
              <View style={[styles.alert, shadowStyle.default]}>
                <AppText style={styles.alertText}>
                    Start the timer and study to begin your streak!
                    <Icon name="flame" size={20} color="#ff4500" style={styles.icon} />
                </AppText>
                <TouchableOpacity
                  style={styles.alertCloseButton}
                  onPress={() => setStreak(1)}
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
              onPress={() => startTimer(25)}
            //   onPress={() => startTimer(0.05)}
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