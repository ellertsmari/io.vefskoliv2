"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveUser,
  rejectUser,
  type PendingUser,
} from "serverActions/approveUsers";
import DefaultButton from "globalStyles/buttons/default";
import {
  Actions,
  ErrorText,
  Hint,
  Identity,
  List,
  Meta,
  Name,
  Row,
  Wrapper,
} from "./style";
import {
  InfoSubtitle,
  PersonCount,
  SectionHeader,
} from "../userInfoCards/style";

/**
 * Registrations waiting for a teacher. Rendered only when there are some, and
 * only for teachers — the page never hands this list to a student.
 *
 * The email is shown on purpose: the name alone does not tell a teacher
 * whether "Anna Jónsdóttir" is the Anna in their class or somebody who found
 * the sign-up form.
 */
export const PendingApprovals = ({ pending }: { pending: PendingUser[] }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = (id: string, action: (id: string) => Promise<{ success: boolean; message?: string }>) => {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await action(id);
      if (!result.success) {
        setError(result.message ?? "Something went wrong — try again.");
      }
      setBusyId(null);
      router.refresh();
    });
  };

  return (
    <Wrapper aria-labelledby="pending-approvals-heading">
      <SectionHeader>
        <InfoSubtitle id="pending-approvals-heading">
          Waiting for approval
        </InfoSubtitle>
        <PersonCount>{pending.length}</PersonCount>
      </SectionHeader>
      <Hint>
        These people registered themselves and cannot sign in until you let
        them in. Reject anyone you don&apos;t recognise — their registration
        is deleted.
      </Hint>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <List>
        {pending.map((user) => {
          const busy = isPending && busyId === user.id;
          return (
            <Row key={user.id}>
              <Identity>
                <Name>{user.name}</Name>
                <Meta>
                  {user.email} · registered {user.createdAt.slice(0, 10)}
                </Meta>
              </Identity>
              <Actions>
                <DefaultButton
                  type="button"
                  style="outlined"
                  disabled={busy}
                  onClick={() => act(user.id, rejectUser)}
                >
                  Reject
                </DefaultButton>
                <DefaultButton
                  type="button"
                  style="default"
                  disabled={busy}
                  onClick={() => act(user.id, approveUser)}
                >
                  {busy ? "Saving…" : "Approve"}
                </DefaultButton>
              </Actions>
            </Row>
          );
        })}
      </List>
    </Wrapper>
  );
};
