import { gql } from 'graphql-modules';

export default gql`
  type AuthNode {
    token: String
    user_id: String
    user: UserEdge
  }

  type AuthEdge {
    node: AuthNode
    cursor: String
  }

  extend type Query {
    signedInUser: UserEdge
  }

  extend type Mutation {
    signUpWithUsernameAndPassword(username: String, password: String): AuthEdge
    signInWithUsernameAndPassword(username: String, password: String): AuthEdge
  }
`;
