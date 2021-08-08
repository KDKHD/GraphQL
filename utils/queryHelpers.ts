import { Prisma } from "@prisma/client";

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
