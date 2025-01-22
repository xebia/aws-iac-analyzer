import { TopNavigationProps } from '@cloudscape-design/components/top-navigation';
import { useAuth } from '../contexts/AuthContext';

export const useUserMenuUtilities = (): TopNavigationProps.Utility[] => {
  const { authState, logout } = useAuth();

  if (!authState.isAuthenticated || !authState.userProfile) {
    return [];
  }

  return [
    {
      type: "menu-dropdown",
      text: authState.userProfile.email,
      iconName: "user-profile",
      items: [
        {
          id: "signout",
          text: "Sign out"
        }
      ],
      onItemClick: ({ detail }) => {
        if (detail.id === 'signout') {
          logout();
        }
      }
    }
  ];
};