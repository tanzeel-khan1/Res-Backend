const nodemailer = require("nodemailer");

const sendEmail = async ({ name, email, message, filePath }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: "New Contact Form Message",
    html: `
      <h3>New Message</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
    attachments: filePath ? [{ path: filePath }] : [],
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
