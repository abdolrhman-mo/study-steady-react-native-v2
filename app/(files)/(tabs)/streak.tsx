import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getId } from '@/utils/tokenStorage';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { setCurrentStreak, setTopStreak } from '@/redux/streakSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENT_COLORS, PRIMARY_COLOR, STREAK_COLOR_L1, STREAK_COLOR_L2, STREAK_COLOR_L3, TEXT_COLOR, TROPHY_COLOR, WHITE } from '@/constants/colors';
import AppText from '@/components/app-text';
import { shadowStyle } from '@/styles/styles';
import { useFetchData } from '@/api/hooks/useFetchData';
import { apiEndpoints } from '@/api/endpoints';
import { format } from "date-fns" // date functions (fns) library
import { BarChart, XAxis, YAxis, Bar, Tooltip, CartesianGrid, ReferenceLine } from "recharts"

// Function to format data for 12AM - 11PM
const formatStudyData = (sessions: any) => {
    // Step 1: Generate all hours from 12AM to 11PM
    const hours = Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, "0")}:00`, // "00:00", "01:00", ..., "23:00"
      duration: 0, // Default value
    }));
  
    // Step 2: Fill in actual study durations
    sessions.forEach((session: any) => {
      const date = new Date(session.created_at);
      const hour = date.getHours(); // Extract hour (0-23)
      hours[hour].duration += session.duration; // Add to that hour
    });
  
    return hours;
};

export default function StreakScreen(): JSX.Element {
    const dispatch = useDispatch();
    const currentStreak = useSelector((state: RootState) => state.streak.currentStreak);
    const topStreak = useSelector((state: RootState) => state.streak.topStreak);

    const { loading, error, fetchDataFromServer: fetchStreak } = useFetchData()
    const { data: sessionsData, fetchDataFromServer: fetchSessions } = useFetchData()

    const [formattedData, setFormattedData] = useState<any>(null)
    const [currentHour, setCurrentHour] = useState(format(new Date(), "HH:00"));

    // Now Refernce Line at Barchart
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHour(format(new Date(), "HH:00")); // Update every minute
        }, 60000); // 60,000ms = 1 minute

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const id = await getId();
                if (id) {
                    const streakResponse = await fetchStreak(apiEndpoints.streak.base(id))

                    dispatch(setCurrentStreak({ currentStreak: streakResponse.current_streak }));
                    dispatch(setTopStreak(streakResponse.top_streak));

                    const sessionsResponse = await fetchSessions(apiEndpoints.session.base) // returns all sessions with iso format dates
                    console.log('streak.tsx sessionsResponse', sessionsResponse)
                    if (sessionsResponse) {

                        const formattedDataConst = formatStudyData(sessionsResponse.today_sessions)

                        setFormattedData(formattedDataConst)

                        console.log('streak.tsx sessionsResponse', sessionsResponse)
                    }
                } else {
                    throw new Error('ID not found');
                }
            } catch (err: any) {

                if (err.code == "ERR_NETWORK") {
                    
                }
            }
        };

        fetchData();
    }, []);

    if (loading)
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#ff4500" />
            </View>
        );

    if (error) return <AppText>Error: {error}</AppText>;
    // if (!data) return <AppText>No data available.</AppText>;

    return (
        <LinearGradient colors={GRADIENT_COLORS} style={styles.container}>
            <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name="flame" size={140} color={STREAK_COLOR_L1} />
            </View>
            {/* <View style={{ paddingHorizontal: 20, alignItems: 'center' }}> */}
            <View style={[styles.card, shadowStyle.default]}>
            <AppText style={styles.streakText}>
                Current Streak: {currentStreak} days
            </AppText>
            <View style={styles.topStreakContainer}>
                <Icon name="trophy" size={28} color={TROPHY_COLOR} style={styles.trophyIcon} />
                <AppText style={styles.topStreakText}>
                Top Streak: {topStreak} days
                </AppText>
            </View>
            </View>


            {/* Quick Streak Guide */}
            {/* <View style={styles.infoContainer}>
                <AppText style={styles.infoTitle}>Streak Guide</AppText>
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, 
                        // { backgroundColor: STREAK_COLOR_L1 }
                        { backgroundColor: '#FCD8BF' }
                    ]}>
                        <Ionicons name="flame" size={16} color={STREAK_COLOR_L1} />
                        <AppText style={styles.badgeText}>25 – 60 m</AppText>
                    </View>
                    <View style={[styles.badge, 
                        // { backgroundColor: STREAK_COLOR_L2 }
                        { backgroundColor: '#FCD8BF' }
                    ]}>
                        <Ionicons name="flame" size={16} color={STREAK_COLOR_L2} />
                        <AppText style={styles.badgeText}>2 h+</AppText>
                    </View>
                    <View style={[styles.badge, 
                            // { backgroundColor: STREAK_COLOR_L3 }
                            { backgroundColor: '#FCD8BF' }
                            ]}>
                        <Ionicons name="flame" size={16} color={STREAK_COLOR_L3} />
                        <AppText style={styles.badgeText}>4 h+</AppText>
                    </View>
                </View>
            </View> */}

            {/* Sessions Data */}
            <View style={styles.sessionsContainer}>
                <AppText style={styles.sessionsDate}>Today, {format(Date(), "dd MMMM")}</AppText>
                <AppText style={styles.sessionsTitle}>{Math.floor(sessionsData?.today_total / 60)}h {sessionsData?.today_total % 60}m</AppText>
                <BarChart 
                    width={300} height={200} data={formattedData}
                    // style={{ backgroundColor: "#121212", borderRadius: 10, padding: 10 }}
                    margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                >
                    <CartesianGrid stroke="#aaa" strokeDasharray="7 3" vertical={false} />

                    <XAxis 
                        dataKey="time"
                        scale="point"  // Ensures even spacing without padding issues
                        tickFormatter={(time) => {
                            const [hour] = time.split(":").map(Number);
                            const suffix = hour < 12 ? "AM" : "PM";
                            const formattedHour = hour % 12 || 12; // Convert 0 to 12
                            return `${formattedHour}${suffix}`;
                        }}
                        interval={5}
                        tick={{ 
                            fontSize: 13, fontWeight: "500", 
                            fontFamily: "Inter, Arial, sans-serif", 
                            // fill: "#aaa", 
                            dx: 20, dy: -11
                        }} 
                        // tickLine={false} // Removes small lines under ticks
                        // axisLine={false} // Hides the axis line
                        tickLine={{ stroke: "#aaa", strokeWidth: 2 }} tickSize={20}
                    />
                    <YAxis 
                        domain={[0, 50]}
                        tickFormatter={(value) => `${value}m`}
                        tickCount={3}
                        tick={{ 
                            fontSize: 15, fontWeight: "500", 
                            fontFamily: "Inter, Arial, sans-serif", 
                            dx: -5 
                        }} 
                        tickLine={false} // Removes small lines under ticks
                        // axisLine={false} // Hides the axis line
                    />

                    {/* NOW Marker */}
                    <ReferenceLine 
                        x={currentHour} 
                        stroke="red" 
                        strokeDasharray="3 3" 
                        label={{ 
                            value: "Now", 
                            position: "top", fill: "red", 
                            fontSize: 12, fontFamily: "Inter, Arial, sans-serif", 
                            dy: -5
                        }}
                    />

                    <defs>
                        <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={PRIMARY_COLOR} stopOpacity={1} />
                            <stop offset="100%" stopColor={GRADIENT_COLORS[0]} stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <Bar 
                        dataKey="duration" 
                        fill="url(#barColor)" 
                        barSize={15}
                        radius={[2, 2, 0, 0]} 
                    />

                    {/* Modernized Tooltip */}
                    <Tooltip 
                        contentStyle={{ borderRadius: 8, padding: 8 }} 
                        labelStyle={{ color: "#aaa", fontSize: 12 }} 
                    />
                </BarChart>
            </View>
        </LinearGradient>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trophyIcon: {
        marginRight: 0,
    },
    bold: {
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: WHITE, // Semi-transparent white
        borderRadius: 15,
        padding: 20,
        marginVertical: 10,
        alignItems: 'center',
      },
      streakText: {
        fontSize: 16, // Larger text to make the streak stand out
        fontWeight: '600',
        color: TEXT_COLOR,
        textShadowRadius: 3,
        marginBottom: 10, // Space below the text
      },
      topStreakContainer: {
        flexDirection: 'row', // Position icon and text side by side
        alignItems: 'center', // Vertically align icon and text
        marginVertical: 5, // Provide breathing room above and below
      },
      topStreakText: {
        fontSize: 14, // Slightly smaller than the main streak text
        color: TEXT_COLOR, // A lighter tone for a balanced contrast
        fontWeight: '400',
        marginLeft: 8, // Space between the trophy icon and the text
      },

      infoContainer: {
        marginVertical: 20,
        padding: 15,
        backgroundColor: WHITE,
        borderRadius: 15,
        width: '80%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
      },
    
      infoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_COLOR,
        marginBottom: 15,
        textAlign: 'center',
      },
    
      badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      },
    
      badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginHorizontal: 5,
      },
    
      badgeText: {
        fontSize: 14,
        // color: WHITE,
        color: TEXT_COLOR,
        marginLeft: 5,
        fontWeight: '600',
      },

    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    sessionsContainer: {
        marginVertical: 20,
        padding: 20,
        backgroundColor: WHITE,
        borderRadius: 15,
        width: '90%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    sessionsDate: {
        fontSize: 16,
        color: TEXT_COLOR,
    },
    sessionsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_COLOR,
        marginBottom: 15,
    },
});