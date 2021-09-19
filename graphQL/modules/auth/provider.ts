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
    if (args.phone == null) throw new UserInputError("Phone not provided.");
    return PhoneNumbersProvider.addPhoneNumber({
      phone: args.phone,
      user_id: args.user_id,
    }).then(() => sendPhoneVerification(args.phone));
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
      await PhoneNumbersProvider.updatePhoneVerified({
        user_id: args.user_id,
        phone: args.to,
        verified: true,
      });

      const usersProvider = new UsersProvider();

      const user = await usersProvider
        .dataLoaderManager({
          many: false,
        })
        .load([["user_id", args.user_id]]);

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
   * Email
   */
  static async verifyEmailInit(args: {
    email: string;
    user_id: string;
  }): Promise<VerificationInstance> {
    if (args.email == null) throw new UserInputError("Email not provided.");

    return EmailsProvider.addEmail({
      email: args.email,
      user_id: args.user_id,
    }).then(() => sendEmailVerification(args.email));
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
      EmailsProvider.updateEmailVerified({
        email: args.to,
        verified: true,
        user_id: args.user_id,
      });
      const usersProvider = new UsersProvider();
      const user = await usersProvider
        .dataLoaderManager({
          many: false,
        })
        .load([["user_id", args.user_id]]);
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
