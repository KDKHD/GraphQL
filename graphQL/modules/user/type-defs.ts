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
    pageInfo: pageInfo
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

  extend type Query {
    user(
    user_id: String): UserEdge
    users(
    FIRST: Int
    AFTER: String
    DIRECTION: SortDirectionEnum
    WHERE:UserWhere): UserConnection
  }

`;
