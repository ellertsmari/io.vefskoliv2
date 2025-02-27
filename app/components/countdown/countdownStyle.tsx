import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  width: 772px;
  height: 187px;
`;

export const TimerWrapper = styled.div``;
export const TimerSegment = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px;
`;

export const TimerTitle = styled(TimerSegment)``;

export const Time = styled.div`
  display: flex;
  width: 50px;
  height: 50px;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  border: 1px solid #7c444f;
  background: var(--light-beige, #fdfaf8);
  font-family: Karma;
  font-size: 32px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
`;
export const Label = styled.div`
  color: var(--100-Burgundy, #7c2d38);
  font-family: Karma;
  font-size: 12px;
  text-align: center;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin: 5px;
`;

export const TimerInner = styled.div`
  display: flex;
  padding: 11px;
  align-items: center;
`;

export const Headline = styled.div`
  display: flex;
  color: var(--100-pinkred, #db5063);
  font-family: Karma;
  font-size: 20px;
  font-style: normal;
  font-weight: 700;
  align-items: center;
`;

export const FrameCountdown = styled.div`
  display: flex;
  width: 772px;
  height: 187px;
  justify-content: center;
  align-items: center;
  align-content: center;
  border-radius: 16px;
  background-color: rgba(250, 247, 242, 1);
  box-shadow: 0px 4px 32px 0px rgba(124, 68, 79, 0.5);
`;
