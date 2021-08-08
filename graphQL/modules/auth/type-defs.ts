import { gql } from 'graphql-modules';

export default gql`
  type Auth {
    token: String
  }

  type User {
    id: String
    name: String
  }

  extend type Query {
    signedInUser: User
  }

  extend type Mutation {
    signInWithUsernameAndPassword(username: String, password: String): Auth
  }
`;
