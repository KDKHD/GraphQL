import { twilioClient } from "@root/twilio/client"

const TWILIO_VERIFICATION_SERVICE_SID = process.env.TWILIO_VERIFICATION_SERVICE_SID as string

export const sendEmailVerification = (email:string)=>{
    return twilioClient.verify.services(TWILIO_VERIFICATION_SERVICE_SID)
    .verifications
    .create({to: email, channel: 'email'})
}

export const verifyEmailVerification = ({to, code}:{to:string, code:string})=>{
    return twilioClient.verify.services(TWILIO_VERIFICATION_SERVICE_SID)
    .verificationChecks
    .create({to: to, code: code})
}