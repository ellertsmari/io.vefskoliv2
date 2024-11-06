import { auth } from "auth";
import { LoginOrRegister } from "components/loginOrRegister/LoginOrRegister";

export async function LoginPage() {
  const session = await auth();

  return <LoginOrRegister session={session} />;
}
