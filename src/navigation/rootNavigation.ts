import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParamList, TabParamList } from './Navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
) {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name,
      params,
    })
  );
  return true;
}

export function navigateToMainTab(name: keyof TabParamList) {
  if (!navigationRef.isReady()) {
    return false;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'MainTabs',
      params: { screen: name },
    })
  );
  return true;
}
