import { phone_numbers } from "@prisma/client";
import { PhoneNumbersProvider } from "@root/graphQL/modules/phone_number/provider";
import { twilioClient } from "@root/twilio/client";
import { UserInputError } from "apollo-server-errors";

const TWILIO_VERIFICATION_SERVICE_SID = process.env
  .TWILIO_VERIFICATION_SERVICE_SID as string;

export const sendPhoneVerification = async (phone: string) => {
  const phoneNumbersProvider = new PhoneNumbersProvider();
  const phoneRes = (await phoneNumbersProvider
    .dataLoaderManager({ many: false })
    .load([["phone", phone.replace(/\s/g, "")]])) as phone_numbers;

  if (phoneRes.verified) {
    throw new UserInputError("Phone number already verified.");
  }
  
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
