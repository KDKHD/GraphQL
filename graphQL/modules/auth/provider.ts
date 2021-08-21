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
export class AuthProvider {
  static async signInWithUsernameAndPassword({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) {
    const user = await prismaClient.users.findFirst({
      where: {
        username: username,
      },
    });

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
    return prismaClient.users
      .create({
        data: {
          username: args.username,
          password_hash: passwordHash,
          f_name: args.f_name,
          l_name: args.l_name,
          phone: args.phone,
          email: args.email,
        },
      })
      .catch(dbErrorHandler);
  }

  static async verifyPhoneInit(args: { phone: string }) {
    if(args.phone == null) throw new UserInputError("Phone not provided.");

    const user = await prismaClient.users.findFirst({
      where: { phone: args.phone.replace(/\s/g, "") },
    });
    if (user != null) return sendPhoneVerification(args.phone);
    throw new UserInputError("Invalid Phone number");
  }

  static async verifyPhone(args: { to: string; code: string }) {
    if(args.to == null) throw new UserInputError("To not provided.");

    const verification_check = await verifyPhoneVerification({
      to: args.to,
      code: args.code,
    });
    if (verification_check.status === "approved") {
      return prismaClient.users.update({
        data: {
          phone_verified: true,
        },
        where: {
          phone: args.to,
        },
      });
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
    return prismaClient.users
      .create({
        data: {
          username: args.username,
          password_hash: passwordHash,
          f_name: args.f_name,
          l_name: args.l_name,
          phone: args.phone.replace(/\s/g, ""),
          email: args.email,
        },
      })
      .catch(dbErrorHandler);
  }

  static async verifyEmailInit(args: { email: string }) {
    if(args.email == null) throw new UserInputError("Email not provided.");

    const user = await prismaClient.users.findFirst({
      where: { email: args.email },
    });
    if (user != null) return sendEmailVerification(args.email);
    throw new UserInputError("Invalid email");
  }

  static async verifyEmail(args: { to: string; code: string }) {
    if(args.to == null) throw new UserInputError("To not provided.");

    const verification_check = await verifyEmailVerification({
      to: args.to,
      code: args.code,
    });
    if (verification_check.status === "approved") {
      return prismaClient.users.update({
        data: {
          email_verified: true,
        },
        where: {
          email: args.to,
        },
      });
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
    return prismaClient.users
      .create({
        data: {
          username: args.username,
          password_hash: passwordHash,
          f_name: args.f_name,
          l_name: args.l_name,
          phone: args.phone,
          email: args.email,
        },
      })
      .catch(dbErrorHandler);
  }
}
