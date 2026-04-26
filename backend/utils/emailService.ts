import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, name: string, verifyLink: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"MentorBee" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to MentorBee!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #f97316;">Welcome to MentorBee, ${name}! 🐝</h2>
          <p>We are thrilled to have you join our mentoring community.</p>
          <p>Your account has been successfully created. Please verify your email by clicking the button below:</p>\n          <div style="text-align: center; margin: 30px 0;">\n            <a href="${verifyLink}" style="background-color: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>\n          </div>
          <p>Happy connecting!</p>
          <br/>
          <p>Best regards,<br/>The MentorBee Team</p>
        </div>
      `,
    });
    console.log("Verification email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

export interface SessionDetails {
  studentName: string;
  mentorName: string;
  date: string;
  time: string;
  course: string;
  price: string;
  type: string;
  location?: string | null;
}

export const sendSessionConfirmationEmail = async (
  email: string, 
  recipientName: string, 
  details: SessionDetails,
  isMentor: boolean = false
) => {
  try {
    const subject = isMentor 
      ? `New Session Booked - ${details.studentName}`
      : `Session Confirmed - ${details.mentorName}`;

    const greeting = `Hi ${recipientName},`;
    const intro = isMentor
      ? `A new mentorship session has been booked with you by ${details.studentName}.`
      : `Your mentorship session with ${details.mentorName} has been successfully booked.`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #f97316; text-align: center;">Session Confirmed! ✅</h2>
        <p style="font-size: 16px;">${greeting}</p>
        <p>${intro}</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #f3f4f6;">
          <h3 style="margin-top: 0; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Session Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 120px;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #111827;">${details.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; color: #111827;">${details.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Mentor:</strong></td>
              <td style="padding: 8px 0; color: #111827;">${details.mentorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Course:</strong></td>
              <td style="padding: 8px 0; color: #111827;">${details.course}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Type:</strong></td>
              <td style="padding: 8px 0; color: #111827;">${details.type}</td>
            </tr>
            ${details.location ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Location:</strong></td>
              <td style="padding: 8px 0; color: #111827;">${details.location}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0; color: #f97316; font-weight: bold;">Rs. ${details.price}</td>
            </tr>
          </table>
        </div>

        <p style="color: #6b7280; font-size: 14px;">Please log in to your dashboard to view full details or manage your sessions.</p>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">Best regards,</p>
          <p style="margin: 5px 0 0 0; color: #f97316; font-weight: bold;">The MentorBee Team</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"MentorBee" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: html,
    });
    
    console.log(`Session confirmation email sent to ${email} (${isMentor ? 'Mentor' : 'Student'}):`, info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending session confirmation email:", error);
    return false;
  }
};
