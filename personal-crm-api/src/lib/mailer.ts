import nodemailer from "nodemailer";

export function createMailer(config: { host: string; mailFrom: string; port: number }) {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false
  });

  return {
    async sendMail(input: { subject: string; text: string; to: string }) {
      await transport.sendMail({
        from: config.mailFrom,
        subject: input.subject,
        text: input.text,
        to: input.to
      });
    }
  };
}
