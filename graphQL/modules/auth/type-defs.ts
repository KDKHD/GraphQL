import { gql } from 'graphql-modules';

export default gql`
  type AuthNode {
    token: String
    user: UserEdge
  }

  type AuthEdge {
    node: AuthNode
    cursor: String
  }

  type InitVerification {
    to: String
    status: String
  }

  extend type Query {
    signedInUser: UserEdge
  }

  extend type Mutation {
    signUpWithUsernameAndPassword(username: String!, password: String!, f_name: String, l_name: String, phone: String, email: String): AuthEdge
    signInWithUsernameAndPassword(username: String!, password: String!): AuthEdge

    signUpWithEmailAndPassword(username: String, password: String!, f_name: String, l_name: String, phone: String, email: String!): AuthEdge
    signInWithEmailAndPassword(email: String!, password: String!): AuthEdge

    signUpWithPhone(username: String, password: String, f_name: String, l_name: String, phone: String!, email: String): AuthEdge
    verifyPhoneInit(phone: String): InitVerification # phone is required when user is not logged in
    verifyPhone(to: String, code: String!): AuthEdge # to is required when user is not logged in

    signUpWithEmail(username: String, password: String, f_name: String, l_name: String, phone: String, email: String!): AuthEdge
    verifyEmailInit(email: String): InitVerification # email is required when user is not logged in
    verifyEmail(to: String, code: String!): AuthEdge # to is required when user is not logged in
  }
`;
