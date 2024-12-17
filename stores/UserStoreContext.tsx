import React from 'react';
import userStore from './UserStore';

const UserStoreContext = React.createContext(userStore);

export const useUserStore = () => React.useContext(UserStoreContext);
export { UserStoreContext };