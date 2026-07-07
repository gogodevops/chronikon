"use server";

import { z } from "zod";

import type { ActionResult } from "@/actions/auth";
import { requireProjectRole, getUserProjectRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import {
  notifyProjectMembers,
  notifyUsers,
  projectEntryLink,
  resolveMentionUserIds,
} from "@/lib/notifications";
import { revalidateProject } from "@/lib/revalidate-project";

const questionSchema = z.object({
  entryId: z.string().cuid(),
  category: z.string().min(1),
  text: z.string().min(1),
  passageRef: z.string().optional(),
});

const commentSchema = z.object({
  entryId: z.string().cuid(),
  text: z.string().min(1),
  mentions: z.array(z.string()).optional(),
});

const answerSchema = z.object({
  questionId: z.string().cuid(),
  text: z.string().min(1),
  sourceIds: z.array(z.string()).optional(),
});

export async function addQuestion(
  input: z.infer<typeof questionSchema> & { projectId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { session } = await requireProjectRole(input.projectId, "commenter");

  const entry = await db.entry.findFirst({
    where: { id: parsed.data.entryId, projectId: input.projectId },
  });
  if (!entry) {
    return { success: false, error: "Eintrag nicht gefunden" };
  }

  const question = await db.question.create({
    data: {
      entryId: parsed.data.entryId,
      authorId: session.user.id,
      category: parsed.data.category,
      text: parsed.data.text,
      passageRef: parsed.data.passageRef,
    },
  });

  await notifyProjectMembers(input.projectId, session.user.id, {
    type: "question",
    title: `Neue Frage zu „${entry.title}"`,
    body: parsed.data.text.slice(0, 120),
    link: await projectEntryLink(input.projectId, entry.id, "diskussion"),
  });

  await revalidateProject(input.projectId);
  return { success: true, data: { id: question.id } };
}

export async function addComment(
  input: z.infer<typeof commentSchema> & { projectId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { session } = await requireProjectRole(input.projectId, "commenter");

  const entry = await db.entry.findFirst({
    where: { id: parsed.data.entryId, projectId: input.projectId },
  });
  if (!entry) {
    return { success: false, error: "Eintrag nicht gefunden" };
  }

  const mentionIds = await resolveMentionUserIds(parsed.data.text, input.projectId);

  const comment = await db.comment.create({
    data: {
      entryId: parsed.data.entryId,
      authorId: session.user.id,
      text: parsed.data.text,
      mentions: [...(parsed.data.mentions ?? []), ...mentionIds],
    },
  });

  if (mentionIds.length) {
    await notifyUsers(mentionIds.filter((id) => id !== session.user.id), {
      type: "mention",
      title: `${session.user.name ?? "Jemand"} hat dich erwähnt`,
      body: parsed.data.text.slice(0, 120),
      link: await projectEntryLink(input.projectId, entry.id, "diskussion"),
    });
  }

  await notifyProjectMembers(input.projectId, session.user.id, {
    type: "comment",
    title: `Neuer Kommentar zu „${entry.title}"`,
    body: parsed.data.text.slice(0, 120),
    link: await projectEntryLink(input.projectId, entry.id, "diskussion"),
  });

  await revalidateProject(input.projectId);
  return { success: true, data: { id: comment.id } };
}

export async function answerQuestion(
  input: z.infer<typeof answerSchema> & { projectId: string },
): Promise<ActionResult<{ id: string }>> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { session } = await requireProjectRole(input.projectId, "commenter");

  const question = await db.question.findFirst({
    where: { id: parsed.data.questionId },
    include: { entry: true },
  });

  if (!question || question.entry.projectId !== input.projectId) {
    return { success: false, error: "Frage nicht gefunden" };
  }

  const answer = await db.$transaction(async (tx) => {
    const created = await tx.answer.create({
      data: {
        questionId: parsed.data.questionId,
        authorId: session.user.id,
        text: parsed.data.text,
        sourceIds: parsed.data.sourceIds ?? [],
      },
    });

    await tx.question.update({
      where: { id: parsed.data.questionId },
      data: { status: "resolved" },
    });

    return created;
  });

  await notifyProjectMembers(input.projectId, session.user.id, {
    type: "answer",
    title: `Antwort auf Frage zu „${question.entry.title}"`,
    body: parsed.data.text.slice(0, 120),
    link: await projectEntryLink(input.projectId, question.entry.id, "diskussion"),
  });

  await revalidateProject(input.projectId);
  return { success: true, data: { id: answer.id } };
}

export async function deleteComment(
  projectId: string,
  commentId: string,
): Promise<ActionResult> {
  const { session } = await requireProjectRole(projectId, "commenter");
  const comment = await db.comment.findFirst({
    where: { id: commentId },
    include: { entry: { select: { projectId: true } } },
  });
  if (!comment || comment.entry.projectId !== projectId) {
    return { success: false, error: "Kommentar nicht gefunden" };
  }
  const role = await getUserProjectRole(projectId, session.user.id);
  const isOwner =
    role === "owner" ||
    role === "editor" ||
    comment.authorId === session.user.id;
  if (!isOwner) {
    return { success: false, error: "Keine Berechtigung zum Löschen" };
  }
  await db.comment.delete({ where: { id: commentId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function deleteQuestion(
  projectId: string,
  questionId: string,
): Promise<ActionResult> {
  const { session } = await requireProjectRole(projectId, "commenter");
  const question = await db.question.findFirst({
    where: { id: questionId },
    include: { entry: { select: { projectId: true } } },
  });
  if (!question || question.entry.projectId !== projectId) {
    return { success: false, error: "Frage nicht gefunden" };
  }
  const role = await getUserProjectRole(projectId, session.user.id);
  const isOwner =
    role === "owner" ||
    role === "editor" ||
    question.authorId === session.user.id;
  if (!isOwner) {
    return { success: false, error: "Keine Berechtigung zum Löschen" };
  }
  await db.question.delete({ where: { id: questionId } });
  await revalidateProject(projectId);
  return { success: true, data: undefined };
}

export async function resolveQuestion(
  questionId: string,
  projectId: string,
): Promise<ActionResult> {
  await requireProjectRole(projectId, "commenter");

  const question = await db.question.findFirst({
    where: { id: questionId },
    include: { entry: true },
  });

  if (!question || question.entry.projectId !== projectId) {
    return { success: false, error: "Frage nicht gefunden" };
  }

  await db.question.update({
    where: { id: questionId },
    data: { status: "resolved" },
  });

  await revalidateProject(projectId);
  return { success: true, data: undefined };
}
