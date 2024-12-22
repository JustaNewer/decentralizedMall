import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        isAdmin: localStorage.getItem('isAdmin') === 'true'
    }),

    actions: {
        setUser(userData) {
            this.user = userData
            this.token = userData.token
            localStorage.setItem('user', JSON.stringify(userData))
            localStorage.setItem('token', userData.token)
        },

        logout() {
            this.user = null
            this.token = null
            localStorage.removeItem('user')
            localStorage.removeItem('token')
        }
    },

    getters: {
        isLoggedIn: (state) => !!state.token
    }
}) 