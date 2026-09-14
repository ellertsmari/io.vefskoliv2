"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectionState, Track, type Participant } from "livekit-client";
import useClassroom from "./useClassroom";
import LiveIcon from "./LiveIcon";
import { AudioTrack, MicrophoneLevel, VideoTrack } from "./MediaTrack";
import s from "./LiveClassroom.module.css";

function teacher(participant: Participant) {
  try { return JSON.parse(participant.metadata || "{}")?.role === "teacher"; } catch { return false; }
}
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
function elapsed(start: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(start)) / 1000));
  return Math.floor(seconds / 60).toString().padStart(2, "0") + ":" + (seconds % 60).toString().padStart(2, "0");
}

export default function LiveClassroom({ name, isTeacher }: { name: string; isTeacher: boolean }) {
  const live = useClassroom();
  const { room, status, joined, busy, deviceBusy } = live;
  const [title, setTitle] = useState("Let's build something together");
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!joined) { setConfirmEnd(false); return; }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [joined]);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const participants = joined && room ? [room.localParticipant, ...room.remoteParticipants.values()] : [];
  const presenter = participants.find((p) => p.isScreenShareEnabled);
  const speaker = participants.find(teacher) || participants.find((p) => p.isCameraEnabled) || participants[0];
  const stagePerson = presenter || speaker;
  const stageTrack = presenter?.getTrackPublication(Track.Source.ScreenShare)?.videoTrack
    || (speaker?.isCameraEnabled ? speaker.getTrackPublication(Track.Source.Camera)?.videoTrack : undefined)
    || (!joined ? live.previewVideo : undefined);
  const camera = joined ? Boolean(room?.localParticipant.isCameraEnabled) : Boolean(live.previewVideo);
  const microphone = joined ? Boolean(room?.localParticipant.isMicrophoneEnabled) : Boolean(live.previewAudio);
  const sharing = Boolean(joined && room?.localParticipant.isScreenShareEnabled);
  const reconnecting = Boolean(joined && room?.state !== ConnectionState.Connected);
  const localAudio = joined ? room?.localParticipant.getTrackPublication(Track.Source.Microphone)?.audioTrack || null : live.previewAudio;
  const remoteAudio = joined && room ? [...room.remoteParticipants.values()].flatMap((p) =>
    [...p.audioTrackPublications.values()].flatMap((publication) => publication.audioTrack ? [{ id: publication.trackSid, track: publication.audioTrack }] : []),
  ) : [];
  const disabled = Boolean(busy || deviceBusy || reconnecting);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/LMS/live");
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch { live.setError("Couldn't copy the link. You can copy this page's address from your browser."); }
  };
  const fullscreen = async () => {
    try { await stage.current?.requestFullscreen(); }
    catch { live.setError("Full screen isn't available in this browser."); }
  };

  return <div className={s.page}>
    <header className={s.header}>
      <div className={s.brand}><span className={s.brandIcon}><LiveIcon name="bolt" size={29} /></span><div><div className={s.eyebrow}>VEFSKÓLINN / LIVE CLASSROOM</div><h1>Reverse Flash<span className={s.demo}>DEMO</span></h1></div></div>
      <button className={s.linkButton} onClick={copyLink}><LiveIcon name={copied ? "check" : "link"} />{copied ? "Link copied" : "Copy classroom link"}</button>
    </header>

    {live.error && <div className={s.error} role="alert"><span>{live.error}</span><button onClick={() => { live.setError(""); void live.refresh(); }} aria-label="Dismiss error and retry"><LiveIcon name="close" /></button></div>}
    {live.notice && <p className={s.notice} role="status">{live.notice}</p>}
    {status && !status.configured && <p className={s.notice}>The classroom connection is being set up. You can try your camera and microphone here in the meantime.</p>}

    <div className={s.sessionHeading}>
      <div><div className={s.sessionKicker}>{joined ? "YOU'RE IN THE CLASSROOM" : isTeacher ? "YOUR TEACHING SPACE" : "YOUR CLASSROOM, WHEREVER YOU ARE"}</div><h2>{joined ? joined.title : isTeacher ? "A little preparation. A great session." : status?.session ? status.session.title : "Good things start together."}</h2><p>{joined ? (presenter ? (stagePerson?.name || "Your teacher") + " is presenting." : "Make room for questions, ideas, and the occasional happy accident.") : isTeacher ? "Check your setup, bring everyone in, and make it yours." : status?.session ? "Your class is live. Check your setup and come on in." : "Your teacher will start the session here. Keep this page open."}</p></div>
      <span className={joined || status?.session ? s.liveBadge : s.readyBadge}><i />{reconnecting ? "Reconnecting" : joined ? "Live · " + elapsed(joined.startedAt, now) : status?.session ? "Class is live" : "Not live yet"}</span>
    </div>

    <div className={s.workspace}>
      <section className={s.studio} aria-label={joined ? "Live classroom" : "Device preview"}>
        <div className={s.stage} ref={stage}>
          {stageTrack ? <VideoTrack track={stageTrack} mirror={!presenter && (!joined || stagePerson?.isLocal === true)} className={presenter ? s.sharedVideo : s.cameraVideo} />
            : <div className={s.emptyStage}><div className={s.orbitOne} /><div className={s.orbitTwo} /><span className={s.stageBolt}><LiveIcon name="bolt" size={46} /></span><div className={s.emptyAvatar}>{initials(stagePerson?.name || name)}</div><h3>{joined ? stagePerson?.name || "Your classroom" : "Make yourself at home."}</h3><p>{joined ? "Camera off. The conversation can keep going." : "Your camera preview appears here."}</p></div>}
          <div className={s.stageTop}><span className={s.stageTag}><i className={joined ? s.onAir : s.previewDot} />{joined ? presenter ? "SCREEN SHARE" : "LIVE CLASSROOM" : "ONLY YOU CAN SEE THIS"}</span><span className={s.stageTag}>{presenter ? "PRESENTATION" : camera || stageTrack ? "CAMERA" : "CAMERA OFF"}</span></div>
          <div className={s.stageBottom}><span>{joined ? stagePerson?.name || "Classroom" : name}<small>{joined ? presenter ? "Presenting" : teacher(stagePerson || room!.localParticipant) ? "Teacher" : "Student" : "Your preview"}</small></span><div className={s.stageBottomRight}><MicrophoneLevel track={microphone ? localAudio : null} /><button onClick={fullscreen} aria-label="Open projector view" title="Open projector view"><LiveIcon name="expand" /></button></div></div>
        </div>

        <div className={s.controls}>
          <div className={s.controlGroup}>
            <button className={microphone ? s.controlOn : s.control} onClick={() => void live.toggleDevice("audio")} disabled={disabled} aria-pressed={microphone}><LiveIcon name={microphone ? "mic" : "micOff"} /><span>{microphone ? "Mute mic" : "Turn on mic"}</span></button>
            <button className={camera ? s.controlOn : s.control} onClick={() => void live.toggleDevice("video")} disabled={disabled} aria-pressed={camera}><LiveIcon name={camera ? "camera" : "cameraOff"} /><span>{camera ? "Turn off camera" : "Turn on camera"}</span></button>
            {joined && isTeacher && <button className={sharing ? s.controlOn : s.control} onClick={() => void live.shareScreen()} disabled={disabled} aria-pressed={sharing}><LiveIcon name="screen" /><span>{sharing ? "Stop sharing" : "Share screen"}</span></button>}
          </div>
          {joined ? <button className={s.leaveButton} onClick={() => void live.leave()} disabled={Boolean(busy || deviceBusy)}><LiveIcon name="leave" />Leave</button> : <span className={s.privateHint}>A moment to get ready.<br />Nothing is being broadcast.</span>}
        </div>

        {joined && room && !room.canPlaybackAudio && <button className={s.audioButton} onClick={() => void room.startAudio().catch(() => live.setError("Audio playback is still blocked. Check your browser's sound permission."))}><LiveIcon name="volume" />Click to hear the classroom</button>}

        {joined ? <div className={s.participantStrip} aria-label="Participant cameras">{participants.map((p) => {
          const track = p.isCameraEnabled ? p.getTrackPublication(Track.Source.Camera)?.videoTrack : undefined;
          const speaking = room?.activeSpeakers.some((person) => person.identity === p.identity);
          return <div key={p.identity} className={speaking ? s.speakingTile : s.personTile}>
            {track ? <VideoTrack track={track} mirror={p.isLocal} className={s.personVideo} /> : <span className={s.personInitials}>{initials(p.name || "Student")}</span>}
            <div><span>{p.name || "Student"}{p.isLocal ? " (you)" : ""}</span><LiveIcon name={p.isMicrophoneEnabled ? "mic" : "micOff"} size={13} /></div>
          </div>;
        })}</div> : <div className={s.deviceSettings}>
          <label><LiveIcon name="camera" size={17} /><span className={s.srOnly}>Camera device</span><select aria-label="Camera device" value={live.videoDevice} onChange={(e) => void live.chooseDevice("video", e.target.value)} disabled={disabled}><option value="">Default camera</option>{live.devices.filter((d) => d.kind === "videoinput" && d.deviceId).map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || "Camera " + (i + 1)}</option>)}</select></label>
          <label><LiveIcon name="mic" size={17} /><span className={s.srOnly}>Microphone device</span><select aria-label="Microphone device" value={live.audioDevice} onChange={(e) => void live.chooseDevice("audio", e.target.value)} disabled={disabled}><option value="">Default microphone</option>{live.devices.filter((d) => d.kind === "audioinput" && d.deviceId).map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || "Microphone " + (i + 1)}</option>)}</select></label>
        </div>}
      </section>

      <aside className={s.sidebar}>
        {joined ? <section className={s.roomCard}><div className={s.cardHeading}><span className={s.cardIcon}><LiveIcon name="users" /></span><h3>In the room</h3><span className={s.count}>{participants.length}</span></div><p className={s.cardIntro}>Same classroom. A few different places.</p><div className={s.roster}>{participants.map((p) => <div key={p.identity} className={s.rosterRow}><span className={s.rosterAvatar}>{initials(p.name || "Student")}</span><span className={s.rosterName}>{p.name || "Student"}{p.isLocal ? " (you)" : ""}<small>{teacher(p) ? "Teacher" : "Student"}</small></span><LiveIcon name={p.isMicrophoneEnabled ? "mic" : "micOff"} size={16} /></div>)}</div>{isTeacher && <div className={s.endSection}>{confirmEnd ? <><p>End this session for everyone?</p><button className={s.endButton} onClick={() => void live.leave(true)} disabled={disabled}>{busy === "end" ? "Ending…" : "Yes, end session"}</button><button className={s.cancelButton} onClick={() => setConfirmEnd(false)} disabled={Boolean(busy)}>Keep the room open</button></> : <button className={s.endButton} onClick={() => setConfirmEnd(true)} disabled={disabled}>End session for everyone</button>}</div>}</section>
          : <section className={s.roomCard}>
            <div className={s.cardHeading}><span className={s.cardIcon}><LiveIcon name={isTeacher ? "bolt" : "users"} /></span><h3>{isTeacher ? "Ready when you are." : "There's a place for you."}</h3></div>
            <p className={s.cardIntro}>{isTeacher ? "One room for the people here and the people joining from home." : "Check your microphone and camera below. You choose what to turn on when you join."}</p>
            {isTeacher && !status?.session && <label className={s.titleLabel}>Session title<input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="What are we learning today?" /></label>}
            {status?.session && <div className={s.currentSession}><span><i />HAPPENING NOW</span><strong>{status.session.title}</strong><small>{status.session.participants} {status.session.participants === 1 ? "person" : "people"} in the classroom</small></div>}
            <div className={s.preflight}><span><LiveIcon name="check" size={16} />Signed in as {isTeacher ? "a teacher" : "a student"}</span><span><LiveIcon name={microphone ? "mic" : "micOff"} size={16} />Microphone {microphone ? "on when you join" : "muted"}</span><span><LiveIcon name={camera ? "camera" : "cameraOff"} size={16} />Camera {camera ? "on when you join" : "off"}</span></div>
            <button className={s.primaryButton} disabled={disabled || !status?.configured || (!isTeacher && !status?.session) || (isTeacher && !status?.session && !title.trim())} onClick={() => void live.enter(status?.session ? "join" : "start", title)}>
              <LiveIcon name="bolt" />{busy ? "Connecting…" : status?.session ? "Join live session" : isTeacher ? "Start live session" : "Waiting for your teacher"}{!busy && <LiveIcon name="arrow" size={18} />}
            </button>
            <p className={s.joinHint}>{!status ? "Checking the classroom…" : !status.configured ? "Live connection not configured yet." : isTeacher ? "Students can join as soon as you go live." : status.session ? "You're joining with your LMS account." : "This page updates automatically."}</p>
          </section>}
        <section className={s.noteCard}><span className={s.noteNumber}>{joined ? "A LITTLE ROOM FOR IDEAS" : "LESS SETUP. MORE LEARNING."}</span><h3>{joined ? "Show your thinking." : "Bring your screen.\nBring your questions."}</h3><p>{joined ? "A question, a sketch, a line of code. The good stuff happens when we share how we got there." : "Built for our classroom: live video, clear audio, and room to share what you're working on."}</p><span className={s.noteBolt}><LiveIcon name="bolt" size={72} /></span></section>
      </aside>
    </div>
    <footer className={s.footer}><span><i />{reconnecting ? "Reconnecting to your classroom…" : joined ? "Connected to your classroom" : "Your space to learn together"}</span><span>Reverse Flash · Classroom demo · Not recording</span></footer>
    <div className={s.remoteAudio}>{remoteAudio.map(({ id, track }) => <AudioTrack key={id} track={track} />)}</div>
  </div>;
}
