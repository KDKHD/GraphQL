import { phone_numbers } from "@prisma/client";
import { PhoneNumbersProvider } from "@root/graphQL/modules/phone_number/provider";
import { twilioClient } from "@root/twilio/client";
import { UserInputError } from "apollo-server-errors";
import { resolve } from "path";
import { VerificationInstance } from "twilio/lib/rest/verify/v2/service/verification";
import { VerificationCheckInstance } from "twilio/lib/rest/verify/v2/service/verificationCheck";

const TWILIO_VERIFICATION_SERVICE_SID = process.env
  .TWILIO_VERIFICATION_SERVICE_SID as string;

// export const sendPhoneVerification = async ({phone}:{phone: string}) => {
//   return twilioClient.verify
//     .services(TWILIO_VERIFICATION_SERVICE_SID)
//     .verifications.create({ to: phone, channel: "sms" });
// };

// export const verifyPhoneVerification = ({
//   to,
//   code,
// }: {
//   to: string;
//   code: string;
// }) => {
//   return twilioClient.verify
//     .services(TWILIO_VERIFICATION_SERVICE_SID)
//     .verificationChecks.create({ to: to, code: code });
// };

export const sendPhoneVerification = async ({phone}:{phone: string}) => {
  return {to: phone} as unknown as VerificationInstance
};

export const verifyPhoneVerification = ({
  to,
  code,
}: {
  to: string;
  code: string;
}): Promise<VerificationCheckInstance> => {
  return new Promise((resolve, reject)=>{
    resolve({status: "approved"} as unknown as VerificationCheckInstance)
  })
};
