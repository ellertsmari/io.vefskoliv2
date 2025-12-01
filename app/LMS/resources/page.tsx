"use server"

import { getUserRecordings } from "serverActions/Zoom/getZoomRec";
import VideoCard from "./components/videoCard/videoCard";
import GoogleDriveButton from "./components/googleDriveButton/googleDriveButton";
import { ResourcesContainer, SectionTitle, VideoGrid, ButtonContainer } from "./style";

const Resources = async () => {
  const getRecordings = await getUserRecordings();
  const recordings = getRecordings?.meetings ?? [];

  return (
    <ResourcesContainer>
      <div>
        <SectionTitle>Resources</SectionTitle>
        <ButtonContainer>
          <GoogleDriveButton />
        </ButtonContainer>
      </div>

      <div>
        <SectionTitle>Lecture Recordings</SectionTitle>
        <VideoGrid>
          {recordings.map((recording: any) => (
            <VideoCard
              key={recording.uuid}
              link={recording.share_url}
              title={recording.topic}
              date={recording.start_time}
              duration={recording.duration}
            />
          ))}
        </VideoGrid>
      </div>
    </ResourcesContainer>
  );
};

export default Resources;