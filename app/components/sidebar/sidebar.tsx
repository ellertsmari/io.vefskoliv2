import { auth } from "auth";
import { Profile } from "../profile/profile";

async function Sidebar() {
  const session = await auth();
  return <Profile session={session} />;
}
export default Sidebar;
