import { makeAutoObservable } from 'mobx';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { authfirebase } from '../firebaseConfig';

class UserStore {
  user: any = null;
  
  constructor() {
    makeAutoObservable(this);
    this.initializeAuthState();
  }

  setUser(user: any) {
    this.user = user;
  }

  initializeAuthState() {
    onAuthStateChanged(authfirebase, (user) => {
      if (user) {
        this.setUser(user);
      } else {
        this.setUser(null);
      }
    });
  }

  async signOut() {
    try {
      await signOut(authfirebase);
      console.log('User signed out successfully!');
      this.setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}

const userStore = new UserStore();
export default userStore;
