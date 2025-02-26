"use server"

import ProgressBar from "components/widgets/ProgressBar"
import { BoxContainer, Percentage, Progress, ProgressContainer, ProgressWrapper, Title } from "components/widgets/style"
import { getGuides } from "serverActions/getGuides"
import {auth} from "auth"

const ProgressB=async ()=>{
    const session=await auth()
    const id=session?.user?.id;
    const guides=await getGuides(id as string)
    console.log(guides)
    let design=0
    let code=0
    let designReturned=0
    let codeReturned=0
    guides?.forEach((guide)=>{
     if (guide.category==="design"){
      design++
      if (guide.returnsSubmitted.length>0){
        designReturned++
      }
     }
     if (guide.category==="code"){
      code++
      if (guide.returnsSubmitted.length>0){
        codeReturned++
      }
     }
    })

    return (
        <div>
            <Title>School Progress</Title>

<BoxContainer>
  <ProgressContainer>

    {/* Design Progress */}
    <ProgressWrapper>
      <span>Design progress</span> {/* Graph title */}
      <Progress>
        <ProgressBar progress={designReturned/design*100} />
        <Percentage>{Math.round(designReturned/design*100)}%</Percentage> {/* the percentage appears after the progress bar */}
      </Progress>
    </ProgressWrapper>

    {/* Code Progress */}
    <ProgressWrapper>
      <span>Code progress</span> {/* Graph title */}
      <Progress>
        <ProgressBar progress={codeReturned/code*100} />
        <Percentage>{Math.round(codeReturned/code*100)}%</Percentage> {/* the percentage appears after the progress bar */}
      </Progress>
    </ProgressWrapper>

  </ProgressContainer>
</BoxContainer>
        </div>
    )
}

export default ProgressB