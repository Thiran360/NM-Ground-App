import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

// Import Screens
import ModalScreen from './screens/modal';
// Since we don't have the full navigation set up yet, we'll use a placeholder for the main screen
import HomeScreen from './screens/(tabs)/index'; 

const Stack = createNativeStackNavigator();

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={HomeScreen} />
          <Stack.Screen 
            name="Modal" 
            component={ModalScreen} 
            options={{ presentation: 'modal', headerShown: true }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
