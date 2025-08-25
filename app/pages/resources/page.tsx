"use server"

import { getUserRecordings } from "serverActions/Zoom/getZoomRec";
import VideoCard from "components/videoCard/videoCard";
import GoogleDriveButton from "components/googleDriveButton/googleDriveButton";
import { ButtonContainer } from "./style";

const Resources = async () => {

  const getRecordings = await getUserRecordings();

  const recordings = getRecordings?.meetings ?? []

  return (
    <>
    <GoogleDriveButton/>
    <ButtonContainer>
      
    {recordings.map((recordings: any) => (
      <VideoCard key={recordings.uuid} link={recordings.share_url} title={recordings.topic}/>
  ))}
  </ButtonContainer>
  </>
  )
};

export default Resources;
