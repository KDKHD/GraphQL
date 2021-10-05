import jwt from 'jsonwebtoken'
import fs from 'fs'
import dotenv from "dotenv";
import path from 'path';
import { root } from '@utils/root';
dotenv.config();

const PRIVATE_KEY = fs.readFileSync(path.join(root, process.env.JWT_PRIVATE_KEY as string));


const PUBLIC_KEY = fs.readFileSync(
    path.join(root, process.env.JWT_PUBLIC_KEY as string)
  );

  
export const signJWT = async ({user_id}:{user_id:string|null}) => {
    if(!user_id) throw new Error(`user_id is null`)
    return new Promise((resolve, reject)=>{
        const token = jwt.sign({ user_id }, PRIVATE_KEY, { algorithm: 'RS256'})
        resolve(token)
    })
}

export const verifyJWT = async (token?:string) => {
    if (!token) throw new Error()
    return new Promise(async (resolve, reject)=>{
        const decoded = await jwt.verify(token, PUBLIC_KEY, {algorithms: ['RS256']})
        resolve(decoded)
    })
}