import { gql } from 'graphql-modules';

export default gql`
  type PhoneNode {
    id: ID
    phone_number_id: String
    user_id: String
    phone: String
    verified: Boolean
  }

  type PhoneEdge {
    node: PhoneNode
    cursor: String
  }

  type PhoneConnection {
    totalCount: Int
    edges: [PhoneEdge]
  }

  enum PhoneOrderByField {
    id
    user_id
    phone
    verified
  }

  input PhoneOrderBy {
    field: PhoneOrderByField
    direction: SortDirectionEnum
  }

  input PhoneWhere {
    OR: [PhoneWhere]
    AND: [PhoneWhere]
    user_id: FieldOptionsString
    phone: FieldOptionsString
    verified: FieldOptionsBoolean
  }

  extend type Query {
    phone_number(phone_number_id: String!): PhoneEdge

    phone_numbers(
      FIRST: Int
      AFTER: String
      ORDER: [PhoneOrderBy]
      WHERE: PhoneWhere
    ): PhoneConnection
  }
`;
