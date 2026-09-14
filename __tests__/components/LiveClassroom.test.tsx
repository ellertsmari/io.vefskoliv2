import { fireEvent, render, screen } from "@testing-library/react";
import LiveClassroom from "app/LMS/live/LiveClassroom";
import useClassroom from "app/LMS/live/useClassroom";

jest.mock("app/LMS/live/useClassroom", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("app/LMS/live/MediaTrack", () => ({ VideoTrack: () => <div>Video track</div>, AudioTrack: () => null, MicrophoneLevel: () => null }));

const session = { id: "RM_test", title: "Design studio", participants: 1, startedAt: "2026-09-14T10:00:00.000Z" };
const controls = { enter: jest.fn(), toggleDevice: jest.fn(), shareScreen: jest.fn(), leave: jest.fn(), refresh: jest.fn(), setError: jest.fn(), chooseDevice: jest.fn() };
let state: Record<string, unknown>;
beforeEach(() => {
  jest.clearAllMocks();
  state = { ...controls, room: null, joined: null, status: { configured: true, session: null }, devices: [], videoDevice: "", audioDevice: "", error: "", notice: "", busy: "", deviceBusy: "", previewVideo: null, previewAudio: null };
  (useClassroom as jest.Mock).mockImplementation(() => state);
});

it("lets a teacher name and start a session without enabling devices automatically", () => {
  render(<LiveClassroom name="Teacher" isTeacher />);
  fireEvent.change(screen.getByLabelText("Session title"), { target: { value: "Wednesday studio" } });
  fireEvent.click(screen.getByRole("button", { name: "Start live session" }));
  expect(controls.enter).toHaveBeenCalledWith("start", "Wednesday studio");
  expect(controls.toggleDevice).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Turn on mic" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByText(/Not recording/)).toBeInTheDocument();
});

it("keeps students in the lobby until the teacher starts, then allows joining", () => {
  const { rerender } = render(<LiveClassroom name="Student" isTeacher={false} />);
  expect(screen.getByRole("button", { name: "Waiting for your teacher" })).toBeDisabled();
  expect(screen.queryByLabelText("Session title")).not.toBeInTheDocument();
  state.status = { configured: true, session };
  rerender(<LiveClassroom name="Student" isTeacher={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Join live session" }));
  expect(controls.enter).toHaveBeenCalledWith("join", expect.any(String));
});

it("blocks starting when setup is missing or the title is empty", () => {
  const { rerender } = render(<LiveClassroom name="Teacher" isTeacher />);
  fireEvent.change(screen.getByLabelText("Session title"), { target: { value: " " } });
  expect(screen.getByRole("button", { name: "Start live session" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Session title"), { target: { value: "Studio" } });
  state.status = { configured: false, session: null };
  rerender(<LiveClassroom name="Teacher" isTeacher />);
  expect(screen.getByRole("button", { name: "Start live session" })).toBeDisabled();
});

const joinedRoom = (role: string, connection = "connected") => {
  const local = { identity: "self", name: "Tester", metadata: JSON.stringify({ role }), isLocal: true, isCameraEnabled: false, isMicrophoneEnabled: false, isScreenShareEnabled: false, getTrackPublication: () => undefined };
  state.joined = session;
  state.room = { localParticipant: local, remoteParticipants: new Map(), activeSpeakers: [], canPlaybackAudio: true, state: connection };
};

it("offers teacher screen sharing and confirms before ending for everyone", () => {
  joinedRoom("teacher");
  render(<LiveClassroom name="Teacher" isTeacher />);
  fireEvent.click(screen.getByRole("button", { name: "Share screen" }));
  expect(controls.shareScreen).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "End session for everyone" }));
  expect(controls.leave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Yes, end session" }));
  expect(controls.leave).toHaveBeenCalledWith(true);
});

it("keeps Leave available during reconnection and hides teacher controls for students", () => {
  joinedRoom("student", "reconnecting");
  render(<LiveClassroom name="Student" isTeacher={false} />);
  expect(screen.queryByRole("button", { name: "Share screen" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "End session for everyone" })).not.toBeInTheDocument();
  const leave = screen.getByRole("button", { name: "Leave" });
  expect(leave).toBeEnabled();
  fireEvent.click(leave);
  expect(controls.leave).toHaveBeenCalledWith();
});
