import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

export async function sendConfirmationEmail({ email, firstName, eventName, startTime, location }) {
  console.log(`[Email] Attempting to send to: ${email}`);
  
  if (!RESEND_API_KEY) {
    console.error('[Email] Error: RESEND_API_KEY is not set in environment variables.');
    return;
  }

  const date = new Date(startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  try {
    const { data, error } = await resend.emails.send({
      from: 'sol <onboarding@resend.dev>',
      to: email,
      subject: `Registration Confirmed: ${eventName}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #111;">
          <h2>Hi ${firstName},</h2>
          <p>You're all set! Your registration for <strong>${eventName}</strong> is confirmed.</p>
          <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>When:</strong> ${date}</p>
            <p style="margin: 0;"><strong>Where:</strong> ${location || 'Online'}</p>
          </div>
          <p>We look forward to seeing you there!</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 12px; color: #71717a;">This is an automated confirmation from sol.</p>
        </div>
      `
    });

    if (error) {
      console.error('[Email] Resend API Error:', error);
    } else {
      console.log('[Email] Success:', data);
    }
  } catch (err) {
    console.error('[Email] Unexpected Error:', err);
  }
}
