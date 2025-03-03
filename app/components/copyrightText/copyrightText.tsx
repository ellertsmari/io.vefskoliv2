import { CopyrightContainer } from "./style";

export default function Copyright() {
  return <CopyrightContainer>     
     <p>© {new Date().getFullYear()} Tækniskólinn </p>
</CopyrightContainer>;
}
