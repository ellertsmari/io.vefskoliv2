import LoginOrRegister from "UIcomponents/LoginOrRegister";
import { auth } from "auth";

export default async function LoginPage() {
  const session = await auth();

  return <LoginOrRegister session={session} />;
}
