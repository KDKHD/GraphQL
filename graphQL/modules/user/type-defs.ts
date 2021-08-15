import { gql } from "graphql-modules";

export default gql`
  type UserNode {
    id: Int
    user_id: String
    f_name: String
    l_name: String
    phone: String
    email: String
    password_hash: String
    created_at: String
  }

  type UserEdge {
    node: UserNode
    cursor: String
  }

  type UserConnection {
    totalCount: Int
    edges: [UserEdge]
  }

  input UserWhere {
    OR: [UserWhere]
    AND: [UserWhere]
    user_id: FieldOptionsString
    f_name: FieldOptionsString
    l_name: FieldOptionsString
    phone: FieldOptionsString
    email: FieldOptionsString
  }

  enum UserOrderByField {
    id
    user_id
    f_name
    l_name
    phone
    email
    created_at
  }

  input UserOrderBy {
    field: UserOrderByField
    direction: SortDirectionEnum
  }

  extend type Query {
    user(
    user_id: String!): UserEdge
    users(
    FIRST: Int
    AFTER: String
    ORDER: [UserOrderBy]
    WHERE:UserWhere): UserConnection
  }

`;
