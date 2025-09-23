import { StaticImageData } from "next/image";
import { Container, TeacherImage, Name, Subject } from "./style";

type LandingPageTeachersProps = {
  image: StaticImageData;
  name: string;
  subject: string;
  alt: string;
}

const LandingPageTeachers = ({ image, name, subject, alt }: LandingPageTeachersProps) => {
  return (
    <Container>
        <TeacherImage src={image} alt={alt} />
        <Name>{name}</Name>
        <Subject>{subject}</Subject>
    </Container>
  );
};

export default LandingPageTeachers;