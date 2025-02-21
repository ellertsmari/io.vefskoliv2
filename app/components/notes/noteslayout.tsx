'use client';

import { NotesContainer, NotesHeading, NotesBox, NotesTextarea } from "./notesStyle";

const Notes = () => {
  return (
    <NotesContainer>
      <NotesBox>
        <div>
          <NotesHeading>Notes:</NotesHeading>
          <NotesTextarea name="description" placeholder="Enter text here..." />
        </div>
      </NotesBox>
    </NotesContainer>
  );
};

export default Notes;
