import { auth } from "auth";
import { Profile } from "../profile/profile";
import { NavbarContainer } from "globalStyles/layout";
import { NavBar } from "components/navigation/NavBar";

async function Sidebar() {
  const session = await auth();
  return (
    <>
      <Profile session={session} />
      <NavbarContainer>
        <NavBar />
      </NavbarContainer>
    </>
  );
}
export default Sidebar;
