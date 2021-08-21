import { gql } from "graphql-modules";

export default gql`
  type UserNode {
    id: Int
    user_id: String
    f_name: String
    l_name: String
    phone: String
    email: String
    email_verified: Boolean
    phone_verified: Boolean
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
    id: FieldOptionsInt
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

  extend type Mutation {
    user(username: String, password: String, f_name: String, l_name: String, phone: String, email: String): UserEdge
  }

`;
