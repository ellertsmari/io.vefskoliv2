import styled from "styled-components";
import Image from "next/image";

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    max-width: 320px;
`;

export const TeacherImage = styled(Image)`
    width: 100%;
    max-width: 280px;
    height: auto;
    object-fit: cover;
    border-radius: 8px;

    @media (min-width: 768px) {
        max-width: 320px;
    }
`;

export const Name = styled.h3`
    font-family: "Source Sans 3", sans-serif;
    font-size: 18px;
    font-weight: 800;
    text-align: center;
    line-height: 1.3;

    @media (min-width: 480px) {
        font-size: 20px;
    }

    @media (min-width: 768px) {
        font-size: 24px;
    }
`;

export const Subject = styled.p`
    font-family: "Source Sans 3", sans-serif;
    font-size: 14px;
    font-weight: 200;
    letter-spacing: 0.05em;
    text-align: center;
    line-height: 1.4;

    @media (min-width: 480px) {
        font-size: 15px;
    }

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;
