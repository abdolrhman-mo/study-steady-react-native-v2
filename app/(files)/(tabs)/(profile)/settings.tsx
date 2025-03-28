import { useLogout } from '@/api/hooks/useAuth'
import React, { useState } from 'react'
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { GRADIENT_COLORS } from '@/constants/colors'
import AppText from '@/components/app-text'
import { useDispatch } from 'react-redux'
import { resetState } from '@/redux/store'

const Profile = () => {
  const dispatch = useDispatch()

  const [modalVisible, setModalVisible] = useState(false)
  const { logoutUser } = useLogout()

  const handleLogout = async () => {
    
    dispatch(resetState()) // Clears Redux global state
    logoutUser()           // Logs out user
    router.replace('/login')
  }

  const confirmLogout = () => {
    setModalVisible(true)
  }

  return (
    <LinearGradient
        colors={GRADIENT_COLORS}
        style={styles.container}
    >
      <AppText style={styles.streak}>Here you can log out.</AppText>

      {/* Button wrapped in TouchableOpacity */}
      <TouchableOpacity style={styles.buttonLogout} onPress={confirmLogout}>
        <AppText style={styles.textStyle}>Log Out</AppText>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <AppText style={styles.modalText}>Are you sure you want to log out?</AppText>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <AppText style={styles.textStyle}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonLogout]}
                onPress={() => {
                  setModalVisible(!modalVisible)
                  handleLogout()
                }}
              >
                <AppText style={styles.textStyle}>Log Out</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
  },
  streak: {
    fontSize: 18,
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginHorizontal: 10,
  },
  buttonCancel: {
    backgroundColor: '#2196F3',
  },
  buttonLogout: {
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#f44336',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: '#f44336',
    fontSize: 18,
  },
})

export default Profile
