import { useRouter, Stack } from "expo-router";
import { Button, Empty, Screen } from "../components/ui";
export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <Stack.Screen options={{ title: "Page not found" }} />
      <Empty
        title="This page isn’t here"
        message="Return to Today to continue."
        action={
          <Button title="Go to Today" onPress={() => router.replace("/")} />
        }
      />
    </Screen>
  );
}
