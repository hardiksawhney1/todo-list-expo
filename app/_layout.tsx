import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { UserStoreContext } from "../stores/UserStoreContext";
import { Slot, Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import userStore from "../stores/UserStore";
import { TaskRefreshProvider } from "../stores/TaskRefreshContext";
import SearchContext from "../stores/SearchContext";

const stores = {
  userStore,
};

const RootLayout = () => {
  return (
    <UserStoreContext.Provider value={userStore}>
      <SearchContext>
      <TaskRefreshProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="modal"
            options={{
              // Set the presentation mode to modal for our modal route.
              presentation: "modal",
            }}
          />
        </Stack>
      </TaskRefreshProvider>
      </SearchContext>
    </UserStoreContext.Provider>
  );
};

export default RootLayout;

const styles = StyleSheet.create({});
