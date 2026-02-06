/**
 * SOS notification helper - extensible for future push notifications.
 * Currently in-app notifications are handled by Supabase realtime.
 * When FCM is set up, add logic here to send push notifications to recipient devices.
 */

export async function notifySOSRecipients(
  _sosEventId: string,
  _recipientEmails: string[]
): Promise<void> {
  // In-app notifications: handled by Supabase realtime subscription on sos_events
  // Future: call FCM to send push to devices registered for recipientEmails
}
