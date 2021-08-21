import bcrypt from 'bcrypt'
const saltRounds = 10;

export const bcryptHash = (string:string):Promise<string> => {
    return new Promise((resolve, reject)=>{
        bcrypt.hash(string, saltRounds, function(err, hash) {
            if(err) reject(err)
            resolve(hash)
        });
    })
}

export const verifyHash = ({encrypted, plainText}:{encrypted:string, plainText:string})=>{
    return new Promise((resolve, reject)=>{
        bcrypt.compare(plainText, encrypted, function(err, result) {
            if(err) reject(err)
            resolve(result)
        });
    })
}