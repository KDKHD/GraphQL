import { twilioClient } from "@root/twilio/client"

const TWILIO_VERIFICATION_SERVICE_SID = process.env.TWILIO_VERIFICATION_SERVICE_SID as string

export const sendPhoneVerification = (phone:string)=>{
    return twilioClient.verify.services(TWILIO_VERIFICATION_SERVICE_SID)
    .verifications
    .create({to: phone, channel: 'sms'})
}

export const verifyPhoneVerification = ({to, code}:{to:string, code:string})=>{
    return twilioClient.verify.services(TWILIO_VERIFICATION_SERVICE_SID)
    .verificationChecks
    .create({to: to, code: code})
}