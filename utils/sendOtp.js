import {createTransport} from 'nodemailer'

const sendOtp = async ({email, subject, otp}) => {
    const transport = createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth: {
            user: process.env.Gmail,
            pass: process.env.Password
        },
    })   
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OTP Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #ece9e6, #ffffff);
    }

    .container {
      background-color: #ffffff;
      padding: 40px 30px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }

    h1 {
      color: #4b0082;
      margin-bottom: 16px;
      font-size: 24px;
    }

    p {
      color: #555;
      font-size: 16px;
      margin: 0 0 12px;
    }

    .otp {
      font-size: 40px;
      font-weight: bold;
      color: #6a5acd;
      letter-spacing: 4px;
      margin-top: 20px;
    }

    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>OTP Verification</h1>
    <p>Hello <strong>${email}</strong>,</p>
    <p>Your One-Time Password (OTP) for account verification is:</p>
    <div class="otp">${otp}</div>
    <div class="footer">
      This OTP is valid for the next 10 minutes. Please do not share it with anyone.
    </div>
  </div>
</body>
</html>`;


    await transport.sendMail({
        from: process.env.Gmail,
        to: email,
        subject,
        html,
    });
};

export default sendOtp;