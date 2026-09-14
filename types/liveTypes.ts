export type LiveSession = {
  id: string;
  title: string;
  startedAt: string;
  participants: number;
};

export type LiveStatus = {
  configured: boolean;
  session: LiveSession | null;
};

export type LiveConnection = {
  session: LiveSession;
  serverUrl: string;
  token: string;
};
