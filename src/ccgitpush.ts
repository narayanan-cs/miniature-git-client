import * as fs from 'fs'
import axios from 'axios'
//import * as axios from 'axios'
import * as readline from 'readline'
import {execSync} from 'child_process'
import { Commit } from './Commit'
import { Utils } from "./Utils"
import * as dotenv from 'dotenv'
dotenv.config()

export class ccgitpush
{
    
    public commit: Commit
    public remoteOriginUrl: string
    private packDirectory: string
    
    constructor(commit: Commit)
    {
        this.commit = commit
        this.packDirectory = ".git/objects/pack"
    }

    
    private async getOldSha(): Promise<{ branch: string, oldSha: string }>
    {
        let oldSha
        const url = process.env.REMOTE_URL + "/info/refs"
        try{
            const response = await axios.get(url,{
            auth:{
                username: process.env.USER || '',
                password: process.env.PAT || ''
            },
            params:{
                service: "git-receive-pack"
            }
        })
                console.log(response.data)
                oldSha = response.data.substring(39,79)
             if (!oldSha || oldSha.length !== 40) {
                  throw new Error("Invalid SHA in response")
             }
             const refLine = response.data.split('\n').find((line:string) => line.includes('refs/heads/'));
             const defaultBranch = refLine?.match(/refs\/heads\/(\w+)/)?.[1];
             return {"branch": defaultBranch,"oldSha":oldSha}
          
        } catch(error: any){
            console.error("Failed to fetch old SHA:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Body:", error.response.data);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Axios error:", error.message);
        }
        throw new Error("getOldSha() failed");
        }
    }

    private getNewSha(): string
    {
        let newSha
        if(fs.existsSync('.git/refs/heads/master'))
            {
                newSha = fs.readFileSync('.git/refs/heads/master',{encoding:'ascii'})
            } else {
                newSha = fs. readFileSync('.git/info/refs')
            }
        return newSha.toString().substring(0,40)
    }
    
   public async push()
        {

            if(!this.commit._isStagingAreaPresent())
                {
                    console.log("No staged files")
                    return
                }
            const data = this.commit._readIndex()
            if(!data.includes("TREE"))
                {
                    console.log("Commit the files and then push")
                    return 
                }
                
                let numberOfEntries  = Buffer.alloc(2)
                data.copy(numberOfEntries,0,data.indexOf("TREE")+9,data.indexOf("TREE")+11)
               if(numberOfEntries.toString() === "-1") 
               {
                console.log("Commit the files and then push")
                return 
               }

            execSync('git gc')
            const newSha = this.getNewSha()
            const body = await this.prepareBody(newSha)
            const url = process.env.REMOTE_URL + "/git-receive-pack"

            await axios.post(url,body,{
            auth:{
                username: process.env.USER,
                password: process.env.PAT
            },
            headers:{
                Host: "github.com",
                "Content-Type":"application/x-git-receive-pack-request",
                Accept:"application/x-git-receive-pack-result"
                    }
        }).then(
            function(response:any)
            {
                console.log(response.data)
                
            }
        ).catch(function(error: any){
            console.log(error.errno,error.code)
        }).finally(function(){
            
        })
    }
        
   public async prepareBody(newSha: string): Promise<Buffer>
    {
        let packFile
        try {
             packFile = fs.readdirSync(this.packDirectory).
        filter((content=>
            content.substring(content.length-4) === 'pack'
        )).join(",")
        }catch (e)
        {
            console.log(e.message)
        }
        
        const payload = fs.readFileSync(this.packDirectory+"/"+packFile)
        let res
        res  = await this.getOldSha()
        
        console.log( res.oldSha, newSha)
        
        const partialPayload = `refs/heads/${res.branch}`+ Buffer.alloc(1).fill("\u0000")  + " report-status side-band-64k agent=git/2.27.0.windows.1"
        const endOfPartialPayloadIndicator = "0000"
           
        const chunkTextLength = (4+res.oldSha.length+" ".length+newSha.length+" ".length+partialPayload.length).toString(16)
        const chunkLength = Buffer.alloc(4).fill("00"+chunkTextLength,0,4)
        const spaceForBody = 4+ res.oldSha.length+" ".length+newSha.length+" ".length+partialPayload.length+endOfPartialPayloadIndicator.length+payload.length
        const body =  Buffer.alloc(spaceForBody).fill(chunkLength.toString()+res.oldSha+ " "+ newSha + " "+ partialPayload+endOfPartialPayloadIndicator,0,4+res.oldSha.length+ " ".length+ newSha.length + " ".length+ partialPayload.length+endOfPartialPayloadIndicator.length)
        payload.copy(body, (4+res.oldSha.length+" ".length+newSha.length+" ".length+partialPayload.length+endOfPartialPayloadIndicator.length), 0, payload.length)
        return Promise.resolve(body)
    }
}

const ccgitpushInstance = new ccgitpush(new Commit(new Utils()))
ccgitpushInstance.push()