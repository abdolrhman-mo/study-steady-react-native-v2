import { API_ENDPOINTS } from '@/api/endpoints';
import { useFetchData } from '@/api/hooks/useFetchData';
import AppText from '@/components/app-text';
import { GRADIENT_COLORS } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

const SearchFriends = () => {
    const { data, loading, error } = useFetchData(API_ENDPOINTS.USERS);
    const navigation = useNavigation();

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFriends, setFilteredFriends] = useState<any>([]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);

        if (!data) return;

        if (query) {
            const filtered = data.filter((friend: any) =>
                friend.username.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredFriends(filtered);
        } else {
            setFilteredFriends(data);
        }
    };

    useEffect(() => {
        navigation.setOptions({
            headerShown: false, // Turn off default header
        });
    }, [navigation]);

    if (loading) {
        return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E87C39" />
        </View>
        );
    }
    if (error) return <AppText style={styles.errorText}>Error: {error}</AppText>;

    return (
        <LinearGradient
            colors={GRADIENT_COLORS}
            style={styles.container}
        >
            <View style={styles.customHeader}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for friends..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>
            <FlatList
                data={filteredFriends}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => {setSearchQuery(''); setFilteredFriends([]);}} >
                        <Link
                            href={{
                                pathname: '/user/[id]',
                                params: { id: item.id },
                            }}
                            style={styles.friendItem}
                        >
                            {item.username}
                        </Link>
                    </TouchableOpacity>
                )}
            />

            {/* Add the Link to /leaderboard at the bottom */}
            <Link href="/leaderboard" asChild>
                <TouchableOpacity style={styles.leaderboardLink}>
                    <AppText style={styles.leaderboardText}>Go to Leaderboard</AppText>
                </TouchableOpacity>
            </Link>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    customHeader: {
        padding: 16,
        // backgroundColor: '#e0f7fa',
    },
    searchInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
    },
    friendItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
    },
    leaderboardLink: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#E87C39',
        borderRadius: 8,
        alignItems: 'center',
    },
    leaderboardText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SearchFriends;
