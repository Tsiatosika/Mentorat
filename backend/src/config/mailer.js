const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token, prenom) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"MentorIPath" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Vérifiez votre adresse email - MentorIPath',
    html: `
      <div style="max-width:600px;margin:0 auto;padding:20px;font-family:Arial,sans-serif">
        <h2 style="color:#3B82F6">Bienvenue sur MentorIPath !</h2>
        <p>Bonjour ${prenom},</p>
        <p>Merci de vous être inscrit. Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">Vérifier mon email</a>
        <p>Ou copiez ce lien :</p>
        <p style="color:#666;font-size:12px">${verificationUrl}</p>
        <p style="color:#999;font-size:12px;margin-top:24px">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    `,
  });
};

module.exports = { transporter, sendVerificationEmail };