import { gql } from 'graphql-modules';

export default gql`
  type EmailNode {
    id: ID
    user_id: String
    email: String
    verified: Boolean
  }

  type EmailEdge {
    node: UserNode
    cursor: String
  }

  type EmailConnection {
    totalCount: Int
    edges: [EmailEdge]
  }

  input EmailWhere {
    OR: [EmailWhere]
    AND: [EmailWhere]
    user_id: FieldOptionsString
    email: FieldOptionsString
    verified: FieldOptionsBoolean
  }
`;
