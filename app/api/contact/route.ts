import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    // 驗證資料
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    // 創建 Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 設定郵件內容
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `[React 網站聯絡表單] 來自 ${name} 的新訊息`,
      text: `
        姓名: ${name}
        Email: ${email}
        
        訊息內容:
        ${message}
      `,
      html: `
        <h3>收到新的聯絡表單訊息</h3>
        <p><strong>姓名:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>訊息內容:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // 發送郵件
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
