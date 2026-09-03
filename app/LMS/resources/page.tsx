import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { getUserRecordings } from "serverActions/Zoom/getZoomRec";
import VideoCard from "./components/videoCard/videoCard";
import GoogleDriveButton from "./components/googleDriveButton/googleDriveButton";
import {
  ResourcesContainer,
  SectionTitle,
  VideoGrid,
  ButtonContainer,
  Section,
  Notice,
} from "./style";
import { PageTitle, TitleBlock } from "globalStyles/pageStyles";

const Resources = async () => {
  // The proxy already redirects anonymous visitors; this is the page's own
  // check so a matcher change cannot expose the recordings.
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { meetings, unavailable } = await getUserRecordings();

  return (
    <ResourcesContainer>
      <TitleBlock>
        <PageTitle>Resources</PageTitle>
      </TitleBlock>

      <Section>
        <ButtonContainer>
          <GoogleDriveButton />
        </ButtonContainer>
      </Section>

      <Section>
        <SectionTitle>Lecture Recordings</SectionTitle>
        {unavailable ? (
          <Notice>
            Lecture recordings are temporarily unavailable. Please try again in
            a moment — everything else on this page still works.
          </Notice>
        ) : meetings.length === 0 ? (
          <Notice>No lecture recordings have been published yet.</Notice>
        ) : (
          <VideoGrid>
            {meetings.map((recording: any) => (
              <VideoCard
                key={recording.uuid}
                link={recording.share_url}
                title={recording.topic}
                date={recording.start_time}
                duration={recording.duration}
              />
            ))}
          </VideoGrid>
        )}
      </Section>
    </ResourcesContainer>
  );
};

export default Resources;
