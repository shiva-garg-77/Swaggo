import nodemailer from 'nodemailer'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD
    }
})

const Sendmailer = async (email, subject, content) => {
    let mailoptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: subject,
        html: content
    }
    transporter.sendMail(mailoptions,(error,info)=>{
        if(error){
            console.log(error)
        }else{
            console.log("mailsend",info.messageId)
        }
        
    })
}

export default Sendmailer