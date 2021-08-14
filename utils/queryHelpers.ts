import { Prisma } from "@prisma/client";
import { Sql } from "@prisma/client/runtime";
import { BatchedKeys, batchKeys } from "./dataloaderHelper";

type OrderByType = {
  field: string;
  direction: "ASC" | "DESC";
};

export const prismaPartition = (
  partitionBy: string[],
  orderBy: OrderByType[]
) => {
  return Prisma.sql`
        Row_number() 
            OVER( 
                partition BY ${Prisma.join(partitionBy)} 
                ORDER BY ${Prisma.join(
                  orderBy.map(
                    (item) => Prisma.sql`${item.field} ${item.direction}`
                  )
                )} 
                ) 
            AS partition_index
        `;
};

export const batchedKeysToSQL = (batchedKeys?:BatchedKeys) => {
  if(!batchedKeys || Object.keys(batchedKeys).length == 0) return Prisma.empty
  return Prisma.join(Object.keys(batchedKeys).map(field=>Prisma.sql([`${field} IN (`, ')'], Prisma.join(batchedKeys[field]))), " AND ")
}

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

export const handleOperator = (
  operation: string,
  field: string,
  value: any
) => {
  switch (operation) {
    case "is": {
      return Prisma.sql([`${field} = `,''], value) 
    }
    case "not": {
      return Prisma.sql([`${field} != `,''], value) 
    }
    case "in": {
      return Prisma.sql([`${field} IN `,''], Prisma.join(value)) 
    }
    case "not_in": {
      return Prisma.sql([`${field} NOT IN `,''], Prisma.join(value)) 
    }
    case "lt": {
      return Prisma.sql([`${field} < `,''], value) 
    }
    case "lte": {
      return Prisma.sql([`${field} <= `,''], value) 
    }
    case "gt": {
      return Prisma.sql([`${field} > `,''], value) 
    }
    case "gte": {
      return Prisma.sql([`${field} >= `,''], value) 
    }
    case "contains": {
      return Prisma.sql([`${field} ILIKE `,''], `%${value}%`) 

    }
    case "not_contains": {
      return Prisma.sql([`${field} NOT ILIKE `,''], `%${value}%`) 
    }
    case "starts_with": {
      return Prisma.sql([`${field} ILIKE `,''], `${value}%`) 
    }
    case "not_starts_with": {
      return Prisma.sql([`${field} NOT ILIKE `,''], `${value}%`) 
    }
    case "ends_with": {
      return Prisma.sql([`${field} ILIKE `,''], `%${value}`) 
    }
    case "not_ends_with": {
      return Prisma.sql([`${field} NOT ILIKE `,''], `%${value}`) 
    }
    default: {
      throw new Error(`Invalid operator ${operation}`);
      break;
    }
  }
};

export type Where = {
  [field in string | number | "OR" | "AND"]:
    | FieldOptionsString
    | FieldOptionsInt
    | Where[];
};


export const prismaWhere = (where: Where) => {
  return prismaWhereHelper(where)
};

const prismaWhereHelper = (where: Where | Where[], key?: string): Sql => {
  if(where == null || Object.keys(where).length == 0) return Prisma.empty
  if (Array.isArray(where)) {
    // inside of AND, OR (array of val)
    return Prisma.join(
      (where as Where[]).map((arrItem) => prismaWhereHelper(arrItem)),
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
    const op = ops[0];
    const value = operation[op];
    return handleOperator(op, field, value);
  }
};

export const whereGen = (where:Where, batchedKeys?:BatchedKeys) => {
  const conditions = [prismaWhere(where),batchedKeysToSQL(batchedKeys)].filter((item)=>item!=Prisma.empty)
  if (conditions.length == 0) return Prisma.empty
  return Prisma.sql`WHERE (${Prisma.join(conditions, " AND ")})`
}