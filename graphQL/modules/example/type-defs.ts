import { gql } from 'graphql-modules';

export default gql`
  type Example {
    hello: String
  }

  extend type Query {
    example: Example
  }

  extend type Mutation {
    example: Example
  }
`;
