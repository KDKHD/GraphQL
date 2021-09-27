import { phone_numbers } from "@prisma/client";
import { PhoneNumbersProvider } from "@root/graphQL/modules/phone_number/provider";
import { twilioClient } from "@root/twilio/client";
import { UserInputError } from "apollo-server-errors";
import { VerificationInstance } from "twilio/lib/rest/verify/v2/service/verification";

const TWILIO_VERIFICATION_SERVICE_SID = process.env
  .TWILIO_VERIFICATION_SERVICE_SID as string;

export const sendPhoneVerification = async ({phone}:{phone: string}) => {
  return null as unknown as VerificationInstance
  return twilioClient.verify
    .services(TWILIO_VERIFICATION_SERVICE_SID)
    .verifications.create({ to: phone, channel: "sms" });
};

export const verifyPhoneVerification = ({
  to,
  code,
}: {
  to: string;
  code: string;
}) => {
  return twilioClient.verify
    .services(TWILIO_VERIFICATION_SERVICE_SID)
    .verificationChecks.create({ to: to, code: code });
};
