import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Home,
  Apple,
  TrendingUp,
  Settings,
  Newspaper,
  MessageSquare,
} from 'lucide-react-native';

import { LoginScreen } from '../screens/LoginScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SessionsScreen from '../screens/SessionsScreen';
import MyScheduleScreen from '../screens/MyScheduleScreen';
import NewsScreen from '../screens/NewsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ManageInjuriesScreen from '../screens/ManageInjuriesScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { Colors } from '../constants/theme';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  ChangePassword: undefined;
  MainTabs: undefined;
  Profile: undefined;
  ManageInjuries: undefined;
  Feedback: undefined;
  Settings: undefined;
  News: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Sessions: undefined;
  Schedule: undefined;
  Workout: undefined;
  Nutrition: undefined;
  Progress: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MobileTopBar() {
  const navigation = useNavigation<any>();

  const topActions = [
    { route: 'News', icon: Newspaper },
    { route: 'Feedback', icon: MessageSquare },
    { route: 'Settings', icon: Settings },
  ] as const;

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaTop}>
      <View style={styles.topBarWrapper}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Dumbbell size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>FitMind</Text>
          </View>

          <View style={styles.topActionsRow}>
            {topActions.map((item) => {
              const Icon = item.icon;

              return (
                <TouchableOpacity
                  key={item.route}
                  style={styles.topActionButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <Icon size={19} color="#FFFFFF" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const iconMap = {
    Dashboard: Home,
    Sessions: CalendarDays,
    Schedule: ClipboardList,
    Workout: Dumbbell,
    Nutrition: Apple,
    Progress: TrendingUp,
  } as const;

  const labelMap = {
    Dashboard: 'Home',
    Sessions: 'Sessions',
    Schedule: 'Schedule',
    Workout: 'Workout',
    Nutrition: 'Nutrition',
    Progress: 'Progress',
  } as const;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeAreaBottom}>
      <View style={styles.tabBarOuter}>
        <View style={styles.tabBarInner}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const Icon = iconMap[route.name as keyof typeof iconMap];
            const label = labelMap[route.name as keyof typeof labelMap];

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                activeOpacity={0.85}
                onPress={onPress}
                style={styles.tabItemTouch}
              >
                <View
                  style={[
                    styles.tabItemInner,
                    isFocused && styles.tabItemInnerActive,
                  ]}
                >
                  <Icon
                    size={21}
                    color={isFocused ? Colors.primary : '#9CA3AF'}
                    strokeWidth={isFocused ? 2.4 : 2}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused && styles.tabLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: () => <MobileTopBar />,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="Schedule" component={MyScheduleScreen} />
      <Tab.Screen name="Workout" component={WorkoutScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ManageInjuries"
          component={ManageInjuriesScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Feedback"
          component={FeedbackScreen}
          options={{
            headerShown: true,
            title: 'Feedback',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            title: 'Settings',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen
          name="News"
          component={NewsScreen}
          options={{
            headerShown: true,
            title: 'News',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{
            headerShown: true,
            title: 'Change Password',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: '#fff',
          }}
        />

        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    backgroundColor: '#0D7D6D',
  },
  safeAreaBottom: {
    backgroundColor: '#FFFFFF',
  },

  topBarWrapper: {
    backgroundColor: '#0D7D6D',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 14,
    shadowColor: '#0D7D6D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconBox: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    padding: 7,
    borderRadius: 12,
    marginRight: 10,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topActionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  tabBarOuter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'android' ? 6 : 0,
  },
  tabItemTouch: {
    flex: 1,
    alignItems: 'center',
  },
  tabItemInner: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 5,
    borderRadius: 16,
  },
  tabItemInnerActive: {
    backgroundColor: '#E6F4F1',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: Colors.primary,
  },
});
