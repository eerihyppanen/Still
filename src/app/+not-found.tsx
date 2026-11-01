import { useRouter, Stack } from "expo-router";
import { Button, Empty, Screen } from "../components/ui";
export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <Stack.Screen options={{ title: "A fresh start" }} />
      <Empty
        title="This page isn’t here"
        message="Your habits are waiting on Today."
        action={
          <Button title="Go to Today" onPress={() => router.replace("/")} />
        }
      />
    </Screen>
  );
}
