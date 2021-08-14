import { PrismaClient } from '@prisma/client'
import { BatchedKeys, batchKeys, DataLoaderKey } from '@utils/dataloaderHelper'
import { whereGen } from '@utils/queryHelpers'
import DataLoader from 'dataloader'
import objectHash from 'object-hash'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

export class UsersProvider {
    static usersDataLoaders = {} as {[whereKey:string]:DataLoader<DataLoaderKey, any[], unknown>}

    static usersDataLoaderManager = (where:any) => {
        const filterKey = objectHash(where)
        if(!(filterKey in UsersProvider.usersDataLoaders)) UsersProvider.usersDataLoaders[filterKey] = UsersProvider.usersDataLoader(where)
        return UsersProvider.usersDataLoaders[filterKey]
    }

    static usersDataLoader = (where:any)=>new DataLoader(async (keys:readonly DataLoaderKey[]) => {
        const batchedKeys = batchKeys(keys)
        
        const grouped = keys.reduce((total, [field, value])=>{
            if(!(field in total)) total[field] = {}
            if(!(value in total[field])) total[field][value] = []
            return total
        },{} as {[field:string]:{[value in string|number]:any[]}})

        const groupedKeys = Object.keys(grouped)

        await UsersProvider.usersBatchFunction({where}, batchedKeys).then(data=>{
            data.forEach(item=>{
                groupedKeys.forEach((key)=>{
                    const value = item[key]
                    if(value in grouped[key]) grouped[key][value].push(item)
                })
            })
        })
        return keys.map(([field, value])=>grouped[field][value])
    })

    static usersBatchFunction = async (where:any, batchedKeys?:BatchedKeys):Promise<any[]> => {
        return prisma.$queryRaw`SELECT * FROM users ${whereGen(where, batchedKeys)}`
    }

    static usersBatchCountFunction = async (where:any, batchedKeys?:BatchedKeys):Promise<number> => {
        return prisma.$queryRaw`SELECT COUNT(*) FROM users ${whereGen(where, batchedKeys)}`.then(res=>res?.[0].count)
    }
}
