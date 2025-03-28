export const apiEndpoints = {
    users: {
        base: '/users/',
        details: (id: number) => `/users/${id}/`,
        register: '/users/register/',
        login: '/users/login/',
        following: (id: number) => `/users/following/${id}/`,
        followingStreaks: (id: number) => `/users/following/${id}/streaks/`,
        followers: (id: number) => `/users/followers/${id}/`,
        follow: (id: number) => `/users/follow/${id}/`,
        unfollow: (id: number) => `/users/unfollow/${id}/`,
        checkFollow: (id: number) => `/users/check/${id}/`,
        stats: (id: number) => `/users/stats/${id}/`, // Followers and following count
    },

    session: {
        base: '/sessions/',
    },

    streak: {
        base: (id: number) => `/streak/${id}/`,
    },
};
