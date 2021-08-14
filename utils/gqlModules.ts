import { makeExecutableSchema } from "@graphql-tools/schema";
import gql from "graphql-tag";
import deepmerge from 'deepmerge'

const globalTypeDefs = gql`
  type Query
  type Mutation

  scalar Date

  type pageInfo {
    endCursor: String
    hasNextPage: Boolean
  }

  enum SortDirectionEnum {
    ASC
    DESC
  }

  input FieldOptionsStringIsRequired {
    is:  String!
  }

  input FieldOptionsString {
    is: String
    not: String
    in: [String]
    not_in: [String]
    lt: String
    lte: String
    gt: String
    gte: String
    contains: String
    not_contains: String
    starts_with: String
    not_starts_with: String
    ends_with: String
    not_ends_with: String
  }

  input FieldOptionsInt {
    is: Int
    not: Int
    in: [Int]
    not_in: [Int]
    lt: Int
    lte: Int
    gt: Int
    gte: Int
    contains: Int
    not_contains: Int
    starts_with: Int
    not_starts_with: Int
    ends_with: Int
    not_ends_with: Int
  }

  input FieldOptionsBoolean {
    is: Boolean
    not: Boolean
  }

  type Message {
    message: String
  }
`;

export const makeSchemaFromModules = ({
  modules,
}: {
  modules: any;
}): any => {
  const { typeDefs, resolvers } = modules.reduce(
    (data:any, module:any) => ({
      typeDefs: [...data.typeDefs, ...module.typeDefs],
      resolvers: deepmerge(data.resolvers, module.resolvers),
    }),
    { typeDefs: [globalTypeDefs], resolvers: {} }
  );

  let schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return schema;
};
