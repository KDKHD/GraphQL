import { gql } from 'graphql-modules';

export default gql`
  type EmailNode {
    id: ID
    email_id: String
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

  enum EmailOrderByField {
    id
    user_id
    email
  }

  input EmailOrderBy {
    field: EmailOrderByField
    direction: SortDirectionEnum
  }

  extend type Query {
    email(email_id: String!): PhoneEdge

    emails(
      FIRST: Int
      AFTER: String
      ORDER: [PhoneOrderBy]
      WHERE: PhoneWhere
    ): EmailConnection
  }

`;
