import { Prisma } from "@prisma/client";
import { Sql } from "@prisma/client/runtime";
import { BatchedKeys, batchKeys } from "./dataloaderHelper";
import format from 'pg-format';

export type OrderByType = {
  field: string;
  direction: "ASC" | "DESC";
};

type ValueOf<T> = T[keyof T];

export enum QueryArgsType {"Query" , "Mutation"}

export type QueryArgs = {
  id?: string
  where?: Where;
  batchedKeys?: BatchedKeys;
  first?: number;
  after?: string;
  partitionBy?: string[];
  order?: OrderByType[];
  paginateFiled?: string;
  many?:boolean
  type?: QueryArgsType
};

const HARD_LIMIT = 20;

export const prismaPartition = (args: QueryArgs) => {
  return Prisma.sql` 
            OVER( 
              ${
                args.partitionBy == undefined
                  ? Prisma.empty
                  : Prisma.sql`partition BY ${Prisma.join([
                      ...selectFields(args.partitionBy),
                    ])}`
              } 
              ${
                args.order == undefined
                  ? Prisma.empty
                  : Prisma.sql`ORDER BY ${Prisma.join(
                      args.order.map((item) => sqlWrap(format('%I %s', item.field, item.direction))
                      )
                    )}`
              }
                ) 
            AS partition_value
        `;
};

export const sqlWrap = (s:string) => {
  return Prisma.sql([s])
}


export const batchedKeysToSQL = (batchedKeys?: BatchedKeys) => {
  if (!batchedKeys || Object.keys(batchedKeys).length == 0) return Prisma.empty;
  return Prisma.join(
    Object.keys(batchedKeys).map((field) => handleOperator("in", field, Array.from(batchedKeys[field]))
    ),
    " AND "
  );
};

export const selectFields = (fields?: string[], fmt: ("%%" | "%I" | "%L" | "%s") = "%I") => {
  if (fields == undefined) return [];
  const joined = fields.map((field) => sqlWrap(format(`${fmt}`, field)));
  return joined;
};

export type FieldOptionsString = {
  is?: String;
  not?: String;
  in?: String[];
  not_in?: String[];
  lt?: String;
  lte?: String;
  gt?: String;
  gte?: String;
  contains?: String;
  not_contains?: String;
  starts_with?: String;
  not_starts_with?: String;
  ends_with?: String;
  not_ends_with?: String;
};

export type FieldOptionsInt = {
  is?: number;
  not?: number;
  in?: number[];
  not_in?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  contains?: number;
  not_contains?: number;
  starts_with?: number;
  not_starts_with?: number;
  ends_with?: number;
  not_ends_with?: number;
};

export type FieldOptionsBoolean = {
  is?: Boolean;
};

export const handleOperator = (
  operation: keyof FieldOptionsString | keyof FieldOptionsInt,
  field: string,
  value: ValueOf<FieldOptionsString> | ValueOf<FieldOptionsInt>
) => {
  switch (operation) {
    case "is": {
      return sqlWrap(format("%I = %L", field, value));
    }
    case "not": {
      return sqlWrap(format("%I != %L", field, value))
    }
    case "in": {
      return sqlWrap(format("%I IN (%L)", field, value))
    }
    case "not_in": {
      return sqlWrap(format("%I NOT IN (%L)", field, value))
    }
    case "lt": {
      return sqlWrap(format("%I < %L", field, value));
    }
    case "lte": {
      return sqlWrap(format("%I <= %L", field, value));
    }
    case "gt": {
      return sqlWrap(format("%I > %L", field, value));
    }
    case "gte": {
      return sqlWrap(format("%I >= %L", field, value));
    }
    case "contains": {
      return sqlWrap(format("%I ILIKE %L", field, `%${value}%`))
    }
    case "not_contains": {
      return sqlWrap(format("%I NOT ILIKE %L", field, `%${value}%`))
    }
    case "starts_with": {
      return sqlWrap(format("%I ILIKE %L", field, `${value}%`))
    }
    case "not_starts_with": {
      return sqlWrap(format("%I NOT ILIKE %L", field, `${value}%`))
    }
    case "ends_with": {
      return sqlWrap(format("%I ILIKE %L", field, `%${value}`))
    }
    case "not_ends_with": {
      return sqlWrap(format("%I NOT ILIKE %L", field, `%${value}`))
    }
    default: {
      throw new Error(`Invalid operator ${operation}`);
    }
  }
};

export type Where = {
  [field in string | number | "OR" | "AND"]:
    | FieldOptionsString
    | FieldOptionsInt
    | Where[];
};

export const prismaWhere = (where?: Where) => {
  return prismaWhereHelper(where);
};

const prismaWhereHelper = (where?: Where | Where[], key?: string): Sql => {
  if (where == null || Object.keys(where).length == 0) return Prisma.empty;
  if (Array.isArray(where)) {
    return Prisma.join(
      (where as Where[]).filter((arrItem)=>arrItem != null).map((arrItem) => prismaWhereHelper(arrItem)),
      key
    );
  } else {
    // one key (field, AND, OR)
    const keys = Object.keys(where);
    if (keys.length !== 1) throw new Error("Invalid where object");
    const key = keys[0];
    if (key == "AND" || key == "OR") {
      return Prisma.sql`(${prismaWhereHelper(where[key] as Where[], key)})`;
    }
    const field = key;
    const operation = where[key] as {
      [field: string]: FieldOptionsString | FieldOptionsInt;
    };
    const ops = Object.keys(operation);
    if (ops.length !== 1)
      throw new Error('Operation can only have one key. name: {is: "Bob"}');
    const op = ops[0] as keyof FieldOptionsString | keyof FieldOptionsInt;
    const value = operation[op] as ValueOf<FieldOptionsString> | ValueOf<FieldOptionsInt>;
    return handleOperator(op, field, value);
  }
};

export const whereGen = (args: QueryArgs) => {
  const conditions = [
    prismaWhere(args.where),
    batchedKeysToSQL(args.batchedKeys),
  ].filter((item) => item != Prisma.empty);
  if (conditions.length == 0) return Prisma.empty;
  return Prisma.sql`WHERE (${Prisma.join(conditions, " AND ")})`;
};

export const afterLimit = (sql: Prisma.Sql, args: QueryArgs) => {
  const afterId = args.after
    ? parseInt(Buffer.from(args.after, "base64").toString("ascii"))
    : 0;
  const limit =
    args.first == undefined || args.first > HARD_LIMIT
      ? HARD_LIMIT
      : args.first;

  const afterSQL = sqlWrap(format.withArray("%s > %s", [args.paginateFiled || "partition_value", afterId]))
  const limitSQL = sqlWrap(format.withArray("%s < %s", [args.paginateFiled || "partition_value", limit]))

  return Prisma.sql`SELECT * FROM ${sql} WHERE ${afterSQL} AND ${limitSQL}`;
};

export const selectCount = (sql: Prisma.Sql, args: QueryArgs) => {
  return Prisma.sql`SELECT ${Prisma.join([
    ...args.partitionBy?.map((item) => sqlWrap(format('MIN(%I) AS %I', item,item))) || [],
    Prisma.sql`AVG(partition_value) as count`,
  ])} FROM ${sql}`
}
