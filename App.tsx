import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'

import { NavigationContainer, StackActions, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from './RootStackParams'

import CameraScreen from './Camera'

const Stack = createNativeStackNavigator<RootStackParamList>()

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>
const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenProp>()

    return (
        <View style={styles.container}>
            <Text style={{ color: '#333', fontSize: 20 }}>Welcome</Text>
            <TouchableOpacity
                style={{backgroundColor:'#47f', width: 150, padding: 10, margin: 10, alignItems: 'center'}}
                onPress={() => navigation.navigate('Camera')}
            >
                <Text style={{ fontSize: 18, color: '#fff' }}>Camera</Text>
            </TouchableOpacity>
            <StatusBar style='auto' />
        </View>
    )
}

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName='Home'>
                <Stack.Screen name='Home' component={HomeScreen} options={{ title: 'SnapCam | Home' }}/>
                <Stack.Screen name='Camera' component={CameraScreen} options={{ title: 'SnapCam | Camera', headerShown: false }}/>
            </Stack.Navigator>
        </NavigationContainer>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})