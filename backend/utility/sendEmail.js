import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Siksha Mantra" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text, // plain text version
      html, // HTML version (optional)
    });

  } catch (error) {
    console.error("Email sending error:", error);
    throw new ApiError(500, "Email could not be sent");
  }
};

export default sendEmail;
