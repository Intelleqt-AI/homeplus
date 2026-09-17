import { deleteData, fetchData, patchData, postData } from '@/lib/Api';

// Homeowner-side messaging API (HomePlus). Talks to the homeowner messaging mount.
// Mirrors the trader-side mount used by Tradepilot-frontend at
// /api/v1/tradepilot/messaging — see the plan's shared API contract.
export const BASE = '/api/v1/messaging';

/** Single source of truth for the messages-thread query-key string. */
export const getMessagesUrl = (conversationId: string) =>
  `${BASE}/conversations/${conversationId}/messages/`;

/** Conversations-list query-key string, kept alongside BASE so every mutation
 * that changes a conversation's block state / last_message preview invalidates
 * the exact same key Messages.tsx queries with. */
export const CONVERSATIONS_URL = `${BASE}/conversations/`;

export const UNREAD_URL = `${BASE}/unread-count/`;

export type DeleteScope = 'me' | 'everyone';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'scam_fraud'
  | 'impersonation'
  | 'off_platform_contact'
  | 'other';

export const blockConversation = (conversationId: string) =>
  postData({ url: `${BASE}/conversations/${conversationId}/block/` });

export const unblockConversation = (conversationId: string) =>
  postData({ url: `${BASE}/conversations/${conversationId}/unblock/` });

export const editMessage = (conversationId: string, messageId: string, body: string) =>
  patchData({
    url: `${BASE}/conversations/${conversationId}/messages/${messageId}/`,
    data: { body },
  });

export const deleteMessage = (conversationId: string, messageId: string, scope: DeleteScope) =>
  deleteData({
    url: `${BASE}/conversations/${conversationId}/messages/${messageId}/`,
    data: { scope },
  });

export const reportMessage = (
  conversationId: string,
  messageId: string,
  payload: { reason: ReportReason; details?: string },
) =>
  postData({
    url: `${BASE}/conversations/${conversationId}/messages/${messageId}/report/`,
    data: payload,
  });

export const fetchMessageHistory = (conversationId: string, messageId: string) =>
  fetchData(`${BASE}/conversations/${conversationId}/messages/${messageId}/history/`);

export type AttachmentType = 'image' | 'video' | 'pdf' | 'docx';

export type PresignedUpload = {
  upload: { method: 'POST' | 'PUT'; url: string; fields?: Record<string, string> | null };
  s3_key: string;
  attachment_type: AttachmentType;
  file_name: string;
};

/** Ask the backend for direct-upload instructions for a chat attachment.
 * Uploads the file's bytes straight to S3 (or, in local dev, a same-app
 * fallback endpoint) — never through this API call itself. */
export const presignAttachment = async (
  conversationId: string,
  file: File,
): Promise<PresignedUpload> => {
  const res: any = await postData({
    url: `${BASE}/conversations/${conversationId}/attachments/presign/`,
    data: { file_name: file.name, content_type: file.type, file_size: file.size },
  });
  return res.data;
};
