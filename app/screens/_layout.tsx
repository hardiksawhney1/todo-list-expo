import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import CustomHeader from "../Components/CustomHeader";
import CustomDrawer from "../Components/CutomDrawer";
import {
  DrawerContentComponentProps,
  DrawerHeaderProps,
} from "@react-navigation/drawer";
import { getHeaderTitle } from "@react-navigation/elements";
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          header: ({ navigation, route, options }) => (
            <CustomHeader title={getHeaderTitle(options, route.name)} />
          ),
        }}
        drawerContent={(props: DrawerContentComponentProps) => (
          <CustomDrawer {...props} />
        )}
      >
        <Drawer.Screen
          name="Tasks"
          options={{
            drawerLabel: "Tasks",
            title: "Tasks",
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
