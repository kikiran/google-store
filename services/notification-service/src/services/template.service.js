import notificationRepository from '../repositories/notification.repository.js';

/**
 * Renders a template by substituting every `{{key}}` token found in the
 * payload. Unknown tokens are left untouched intentionally.
 */
export function render(template, payload = {}) {
  let subject = String(template.subject_template || '');
  let body = String(template.body_template || '');
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    subject = subject.replace(pattern, String(value));
    body = body.replace(pattern, String(value));
  }
  return { subject, body };
}

export async function getTemplate(type) {
  return notificationRepository.findTemplateByType(type);
}

export default { render, getTemplate };