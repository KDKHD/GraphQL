import { emails, phone_numbers, users } from ".prisma/client";
import { prismaClient } from "@root/dbconnection/client";
import { bcryptHash, verifyHash } from "@utils/bcrypt";
import { dbErrorHandler } from "@utils/dbErrors";
import {
  sendEmailVerification,
  verifyEmailVerification,
} from "@utils/emailVerification";
import {
  sendPhoneVerification,
  verifyPhoneVerification,
} from "@utils/phoneVerification";
import { QueryArgsType } from "@utils/queryHelpers";
import { passwordValidator } from "@validators/user";
import { UserInputError } from "apollo-server-express";
import { VerificationInstance } from "twilio/lib/rest/verify/v2/service/verification";
import { EmailsProvider } from "../email/provider";
import { PhoneNumbersProvider } from "../phone_number/provider";
import { UsersProvider } from "../user/provider";
export class AuthProvider {
  /**
   * Username Password
   */
  static async signInWithUsernameAndPassword({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) {
    const user = await UsersProvider.findFirstUsers({
      where: {
        username: username,
      },
    });

    const hashMatch = await UsersProvider.verifyPassword({ user, password });

    if (hashMatch) {
      return user;
    }

    throw new UserInputError("Login details incorrect.");
  }

  static async signUpWithUsernameAndPassword(args: {
    username: string;
    password: string;
    f_name?: string;
    l_name?: string;
    phone?: string;
    email?: string;
  }) {
    args.password != null &&
      passwordValidator
        .required()
        .validate(args.password, { abortEarly: false });

    const passwordHash = await bcryptHash(args.password);
    const user = await prismaClient.users
      .create({
        data: {
          username: args.username,
          password_hash: passwordHash,
          f_name: args.f_name,
          l_name: args.l_name,
        },
      })
      .catch(dbErrorHandler);

    if (user && args.email) {
      EmailsProvider.addEmail({
        user_id: user.user_id as string,
        email: args.email,
      });
    }

    if (user && args.phone) {
      PhoneNumbersProvider.addPhoneNumber({
        user_id: user.user_id as string,
        phone: args.phone,
      });
    }

    return user;
  }

  /**
   * Email Password
   */
  static async signInWithEmailAndPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const emailsProvider = new EmailsProvider();
    const usersProvider = new UsersProvider();

    const emailRes = (await emailsProvider
      .dataLoaderManager({
        many: false,
      })
      .load([["email", email]])) as emails;

    const user = (await usersProvider
      .dataLoaderManager({
        many: false,
      })
      .load([["user_id", emailRes.user_id]])) as users;

    if (user && user.password_hash) {
      // Verify password
      const hashMatch = await verifyHash({
        encrypted: user.password_hash,
        plainText: password,
      });
      if (hashMatch) {
        return user;
      }
    }

    throw new UserInputError("Login details incorrect.");
  }

  static async signUpWithEmailAndPassword(args: {
    username?: string;
    password: string;
    f_name?: string;
    l_name?: string;
    phone?: string;
    email: string;
  }) {
    args.password != null &&
      passwordValidator
        .required()
        .validate(args.password, { abortEarly: false });

    const passwordHash = await bcryptHash(args.password);
    const user = await prismaClient.users
      .create({
        data: {
          username: args.username,
          password_hash: passwordHash,
          f_name: args.f_name,
          l_name: args.l_name,
        },
      })
      .catch(dbErrorHandler);

    if (user && args.email) {
      EmailsProvider.addEmail({
        user_id: user.user_id as string,
        email: args.email,
      });
    }

    if (user && args.phone) {
      PhoneNumbersProvider.addPhoneNumber({
        user_id: user.user_id as string,
        phone: args.phone,
      });
    }

    return user;
  }

  /**
   * Phone
   */
  static async verifyPhoneInit(args: {
    phone: string;
    user_id: string;
  }): Promise<VerificationInstance> {
    const phoneNumbersProvider = new PhoneNumbersProvider();
    if (args.phone == null) throw new UserInputError("Phone not provided.");
    const phoneNumberForUserRes = (await phoneNumbersProvider
      .dataLoaderManager({
        id: "verifyPhoneInit-phoneNumberForUserRes",
        type: QueryArgsType.Query,
        where: {
          phone: { is: args.phone },
        },
        many: false,
      })
      .load([["user_id", args.user_id]])) as phone_numbers;

    const phoneNumberVerifiedRes = (await phoneNumbersProvider
      .dataLoaderManager({
        id: "verifyPhoneInit-phoneNumberVerifiedRes",
        type: QueryArgsType.Query,
        where: {
          phone: { is: args.phone },
        },
        many: false,
      })
      .load([["verified", "true"]])) as phone_numbers;

    if (args.user_id) {
      if (phoneNumberForUserRes == null && !phoneNumberVerifiedRes?.verified) {
        // User is logged in but does not have phone number (wants to add a new one)
        return PhoneNumbersProvider.addPhoneNumber({
          phone: args.phone,
          user_id: args.user_id,
        }).then(() => sendPhoneVerification({ phone: args.phone }));
      } else if (!phoneNumberForUserRes.verified) {
        return sendPhoneVerification({ phone: args.phone });
      } else {
        throw new UserInputError("Phone already verified.");
      }
    } else {
      // User is not logged in and wants to sign in using phone
      if (!phoneNumberVerifiedRes?.verified) {
        throw new UserInputError("Phone number not found.");
      }
      return sendPhoneVerification({ phone: args.phone });
    }
  }

  static async verifyPhone(args: {
    to: string;
    code: string;
    user_id: string;
  }) {
    if (args.to == null) throw new UserInputError("To not provided.");

    const verification_check = await verifyPhoneVerification({
      to: args.to,
      code: args.code,
    });

    if (verification_check.status === "approved") {
      if (args.user_id) {
        // User is logged in and is verifying a new phone number
        await PhoneNumbersProvider.updatePhoneVerified({
          user_id: args.user_id,
          phone: args.to,
          verified: true,
        });
      }

      const user = await UsersProvider.getUserByPhone({ phone: args.to });

      return user;
    }
    throw new UserInputError("Phone verification failed. Please try again.");
  }

  static async signUpWithPhone(args: {
    username?: string;
    password?: string;
    f_name?: string;
    l_name?: string;
    phone: string;
    email?: string;
  }) {
    args.password != null &&
      passwordValidator
        .required()
        .validate(args.password, { abortEarly: false });

    const passwordHash =
      args.password != null ? await bcryptHash(args.password) : null;

    const user = await prismaClient.users
      .create({
        data: {
          username: args.username,
          password_hash: passwordHash,
          f_name: args.f_name,
          l_name: args.l_name,
        },
      })
      .catch(dbErrorHandler);

    const setUpActions = [];
    if (user && args.email != null) {
      setUpActions.push(
        EmailsProvider.addEmail({
          user_id: user.user_id as string,
          email: args.email,
        }).then(() => sendEmailVerification({ email: args.email as string }))
      );
    }

    if (user && args.phone != null) {
      setUpActions.push(
        PhoneNumbersProvider.addPhoneNumber({
          user_id: user.user_id as string,
          phone: args.phone,
        }).then(() => sendPhoneVerification({ phone: args.phone as string }))
      );
    }

    await Promise.all(setUpActions);
    return user;
  }

  /**
   * Email
   */
  static async verifyEmailInit(args: {
    email: string;
    user_id: string;
  }): Promise<VerificationInstance> {
    const emailsProvider = new EmailsProvider();

    if (args.email == null) throw new UserInputError("Email not provided.");

    const emailForUserRes = (await emailsProvider
      .dataLoaderManager({
        id: "verifyEmailInit-emailForUserRes",
        type: QueryArgsType.Query,
        where: {
          email: { is: args.email },
        },
        many: false,
      })
      .load([["user_id", args.user_id]])) as emails;

    const emailVerifiedRes = (await emailsProvider
      .dataLoaderManager({
        id: "verifyEmailInit-emailVerifiedRes",
        type: QueryArgsType.Query,
        where: {
          email: { is: args.email },
        },
        many: false,
      })
      .load([["verified", "true"]])) as emails;

    if (args.user_id) {
      if (emailForUserRes == null && !emailVerifiedRes?.verified) {
        // User is logged in but does not have email (wants to add a new one)
        return EmailsProvider.addEmail({
          email: args.email,
          user_id: args.user_id,
        }).then(() => sendEmailVerification({ email: args.email }));
      } else if (!emailForUserRes.verified) {
        return sendEmailVerification({ email: args.email });
      } else {
        throw new UserInputError("Email already verified.");
      }
    } else {
      // User is not logged in and wants to sign in using email
      if (!emailVerifiedRes?.verified) {
        throw new UserInputError("Email not found.");
      }
      return sendEmailVerification({ email: args.email });
    }
  }

  static async verifyEmail(args: {
    to: string;
    code: string;
    user_id: string;
  }) {
    if (args.to == null) throw new UserInputError("To not provided.");

    const verification_check = await verifyEmailVerification({
      to: args.to,
      code: args.code,
    });

    if (verification_check.status === "approved") {
      if (args.user_id) {
        // User is logged in and is verifying a new email
        EmailsProvider.updateEmailVerified({
          email: args.to,
          verified: true,
          user_id: args.user_id,
        });
      }

      const user = await UsersProvider.getUserByEmail({ email: args.to });

      return user;
    }
    throw new UserInputError("Email verification failed. Please try again.");
  }

  static async signUpWithEmail(args: {
    username?: string;
    password?: string;
    f_name?: string;
    l_name?: string;
    phone?: string;
    email: string;
  }) {
    args.password != null &&
      passwordValidator
        .required()
        .validate(args.password, { abortEarly: false });

    const passwordHash =
      args.password != null ? await bcryptHash(args.password) : null;
    const user = await prismaClient.users
      .create({
        data: {
          username: args.username,
          password_hash: passwordHash,
          f_name: args.f_name,
          l_name: args.l_name,
        },
      })
      .catch(dbErrorHandler);

    if (user && args.email) {
      EmailsProvider.addEmail({
        user_id: user.user_id as string,
        email: args.email,
      });
    }

    if (user && args.phone) {
      PhoneNumbersProvider.addPhoneNumber({
        user_id: user.user_id as string,
        phone: args.phone,
      });
    }

    return user;
  }
}
