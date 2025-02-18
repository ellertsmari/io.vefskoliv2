import { Guide } from 'models/guide';
import { connectToDatabase } from 'serverActions/mongoose-connector';
import Admin from './Admin'

const getGuides = async () => {
  connectToDatabase();
  return await Guide.find({});
}
const Page = async () => {
  const guideArr = await getGuides();
  return (
    <div>
      <Admin guides={JSON.parse(JSON.stringify(guideArr))}/>
    
    </div>
  )
}

export default Page