"use server";
import { UserInfoCards } from "../../components/userInfoCards/UserInfoCards";
import { getUsers } from "serverActions/getUsers";
import { Container } from "./style";

const PeoplePage = async () => {
  const teachers = await getUsers({ role: "teacher" });
  const students = await getUsers({ role: "user" });

  return (
    <Container>
      <div
        style={{
          alignSelf: "flex-start",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          gap: "2rem",
        }}
      >
        <p>Select someone to learn more about them</p>

        <UserInfoCards userInfo={teachers} title="Teachers" zIndex={4} />

        <UserInfoCards userInfo={students} title="Students" />
      </div>
    </Container>
  );
};

export default PeoplePage;
