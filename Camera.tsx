import { StatusBar } from 'expo-status-bar'
import { Platform, StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, LayoutChangeEvent, Alert, AppState } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { Camera, CameraCapturedPicture, CameraType } from 'expo-camera'
import { useRef, useState, useEffect, useCallback } from 'react'
import * as NavigationBar from 'expo-navigation-bar'
import { useFocusEffect } from '@react-navigation/native'

import { RootStackParamList } from './RootStackParams'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

const DEFAULT_WINDOW_SIZE = Dimensions.get('window')

type CameraScreenProp = NativeStackNavigationProp<RootStackParamList, 'Camera'>
export default function CameraScreen() {
  const navigation = useNavigation<CameraScreenProp>()

  const cameraRef = useRef<Camera>(null)
  const snapBoxRef = useRef<View>(null)

  const [screenSize, setScreenSize] = useState<{width: number, height: number}>({width: DEFAULT_WINDOW_SIZE.width, height: DEFAULT_WINDOW_SIZE.height})

  const [cameraType, setCameraType] = useState(CameraType.back)
  const [cameraRatio, setCameraRatio] = useState('4:3') // default. only applicable on android
  const [camVertPadding, setCamVertPadding] = useState(0)
  const [camRatioPrepared, setCamRatioPrepared] = useState(false) // mark if the ratio has been prepared, at least initially
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [photoData, setPhotoData] = useState<CameraCapturedPicture | null>(null)

  const [camPermissions, requestCamPermissions] = Camera.useCameraPermissions()

  const setNavigationBar = () => {
    NavigationBar.setBehaviorAsync('overlay-swipe')
    NavigationBar.setVisibilityAsync('hidden')
  }

  useFocusEffect(
    useCallback(() => {
      setNavigationBar()
      return () => {
        // Reset to default when we leave the camera screen to other screens in the app
        NavigationBar.setBehaviorAsync('inset-touch')
        NavigationBar.setVisibilityAsync('visible')
      }
    }, [])
  )

  useEffect(() => {
    const ascSubscription = AppState.addEventListener('change', nextAppState => {
      // When user comes back into the app set the correct nav bar behavior
      if(nextAppState === 'active') {
        setNavigationBar()
      }
    })

    requestCamPermissions().then(res => {
      if(!res.granted) {
        Alert.alert('Permissions Required!', 'We can only use the camera if you allow it...', [
            {
                text: 'Ok',
                onPress: () => navigation.goBack()
            }
        ])
      }
    })

    return () => {
      ascSubscription.remove()
    }
  }, [])

  const getScreenDependentStyles = (screenSize: {width: number, height: number}) => StyleSheet.create({
    dot: {
      backgroundColor: 'red',
      width: Math.floor(screenSize.width * 0.04),
      height: Math.floor(screenSize.width * 0.04),
      borderRadius: Math.floor(screenSize.width * 0.02),
      marginTop: 'auto',
      marginBottom: 'auto',
    },
    captureBtn: {
      backgroundColor: '#f5f5f5',
      width: Math.floor(screenSize.width * 0.2),
      height: Math.floor(screenSize.width * 0.2),
      borderRadius: Math.floor(screenSize.width * 0.1),
      margin: Math.floor(screenSize.width * 0.1),
    },
    prevBtn: {
      // backgroundColor: 'red',
      width: Math.floor(screenSize.width / 3),
      paddingVertical: Math.floor(screenSize.width / 12),
      alignItems: 'center',
    },
    prevBtnText: {
      fontSize: Math.floor(screenSize.width / 16),
      color: 'white',
      marginTop: 'auto',
      marginBottom: 'auto',
    }
  })
  const sdStyles = getScreenDependentStyles(screenSize) // Styles depend on screen size

  const prepareCamRatio = async () => {
    if(Platform.OS === 'android' && cameraRef.current) {
      const ratios = await cameraRef.current.getSupportedRatiosAsync()

      let closestRatio: string = '4:3' // default
      let closestNumRatio: number = 4/3 // default
      let closestDistance: number | null = null
      for (let i = 0; i < ratios.length; ++i) {
        const parts = ratios[i].split(':')
        const numRatio = parseInt(parts[0]) / parseInt(parts[1])
        const distance = (screenSize.height / screenSize.width) - numRatio
        if(closestDistance == null) {
          closestRatio = ratios[i]
          closestNumRatio = numRatio
          closestDistance = distance
        } else {
          console.log(distance)
          if ((distance > -0.01) && distance < closestDistance) {
            closestRatio = ratios[i]
            closestNumRatio = numRatio
            closestDistance = distance
          }
        }
      }
      const remainder = Math.round(
        (screenSize.height - closestNumRatio * screenSize.width)
      )

      console.log(screenSize)
      console.log(closestRatio)
      console.log(remainder)

      setCamVertPadding(remainder / 2)
      setCameraRatio(closestRatio)
      setCamRatioPrepared(true)
    }
  }

  const takePicture = async () => {
    if(!cameraRef.current) return
    const data = await cameraRef.current.takePictureAsync()
    setPhotoData(data)
    cameraRef.current.pausePreview()
  }

  const saveSnap = async () => {
    setPhotoData(null)
    if(cameraRef.current) {
      cameraRef.current.resumePreview()
    }
    const result = await captureRef(snapBoxRef, {
        result: 'tmpfile',
    })
    console.log(result)
  }

  const updateScreen = async (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout
    setScreenSize({width, height})
    if(Platform.OS==='android') {
      const behavior = await NavigationBar.getBehaviorAsync()
      if(behavior!=='overlay-swipe') {
        setNavigationBar()
      }
    }
  }

  const cameraReady = async () => {
    if(!camRatioPrepared) {
      await prepareCamRatio()
    }
    setIsCameraReady(true)
  }

  const renderOverlay = () => (
    <View style={styles.overlay}>
      <View style={sdStyles.dot}/>
    </View>
  )

  const retakePicture = () => {
    setPhotoData(null)
    if(!cameraRef.current) return
    cameraRef.current.resumePreview()
  }

  const renderPreviewControls = () => (
    <View style={styles.container}>
      <View style={styles.prevControls}>
        <TouchableOpacity
          style={sdStyles.prevBtn}
          onPress={retakePicture}
        >
          <Text style={sdStyles.prevBtnText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={sdStyles.prevBtn}
          onPress={saveSnap}
        >
          <Text style={sdStyles.prevBtnText}>Save Snap</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderCaptureControls = () => (
    <View style={styles.captureControls}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!isCameraReady || !cameraRef.current}
        onPress={takePicture}
        style={sdStyles.captureBtn}
      />
      <TouchableOpacity onPress={() => navigation.goBack()} style={{
        position: 'absolute',
        bottom: Math.floor(screenSize.width * 0.1),
        left: 0,
        width: Math.floor(screenSize.width / 3),
        paddingVertical: Math.floor(screenSize.width / 16),
        alignItems: 'center',
      }}>
        <Text style={{
          color: 'white',
          fontSize: Math.floor(screenSize.width / 16),
        }}>Back</Text>
      </TouchableOpacity>
      {/* Other capture controls */}
    </View>
  )

  return (
    <View style={styles.mainContainer} onLayout={updateScreen}>
      { camPermissions?.granted && 
        <Camera
          ref={cameraRef}
          style={[styles.camera, {marginTop: camVertPadding, marginBottom: camVertPadding, display: photoData ? 'none' : 'flex'}]}
          type={cameraType}
          ratio={cameraRatio}
          onCameraReady={cameraReady}
          onMountError={err => {
            console.log('Camera Error: ', err)
          }}
        />
      }
      
      {
        photoData ? <>
          <View style={[styles.container, {backgroundColor: 'black'}]} ref={snapBoxRef}>
            <Image source={{ uri: photoData.uri }} style={[styles.camera, {marginTop: camVertPadding, marginBottom: camVertPadding}]}/>
          </View>
          {renderOverlay()}
          {renderPreviewControls()}
        </> :
        <>
          {isCameraReady && renderOverlay()}
          {renderCaptureControls()}
        </>
      }
      <StatusBar style="auto" hidden/>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    display: 'flex',
    alignItems: 'center',
  },
  prevControls: {
    marginTop: 'auto',
    paddingBottom: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  captureControls: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 'auto',
  },
})