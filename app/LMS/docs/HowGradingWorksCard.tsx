"use client";

import Modal from "UIcomponents/modal/modal";
import { GradingSlideshow } from "./GradingSlideshow";
import {
  HowItWorksCard,
  CardIcon,
  CardTextWrap,
  CardKicker,
  CardTitle,
  CardDesc,
  CardCta,
} from "./slideshowStyle";

export const HowGradingWorksCard = () => {
  return (
    <Modal
      modalTrigger={
        <HowItWorksCard type="button" aria-haspopup="dialog">
          <CardIcon aria-hidden="true">🎓</CardIcon>
          <CardTextWrap>
            <CardKicker>Start here</CardKicker>
            <CardTitle>How Grading Works</CardTitle>
            <CardDesc>
              A quick, interactive walkthrough of how your grades are built.
            </CardDesc>
            <CardCta>Open the guide →</CardCta>
          </CardTextWrap>
        </HowItWorksCard>
      }
      modalContent={<GradingSlideshow />}
    />
  );
};
