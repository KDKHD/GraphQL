import { gql } from 'graphql-modules';

export default gql`
  type PhoneNode {
    id: ID
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

  input PhoneWhere {
    OR: [PhoneWhere]
    AND: [PhoneWhere]
    user_id: FieldOptionsString
    phone: FieldOptionsString
    verified: FieldOptionsBoolean
  }
`;
