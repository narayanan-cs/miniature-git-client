import * as fs from 'fs'
import * as axios from 'axios'
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

    
    private async getOldSha(): Promise<string>
    {
        let oldSha
        const url = process.env.REMOTE_URL + "/info/refs"
        await axios.get(url,{
            auth:{
                username: process.env.USER,
                password: process.env.PAT
            },
            params:{
                service: "git-receive-pack"
            }
        }).then(
            function(response:any, error:any)
            {
                console.log(response.data)
                oldSha = response.data.substring(39,79)
            }
        ).catch(function(error: any){
            console.log(error.errno,error.code)
        }).finally(function(){
    
        })
         return oldSha
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
            function(response:any, error:any)
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
        const oldSha = await this.getOldSha()
        const partialPayload = "refs/heads/master" + Buffer.alloc(1).fill("\u0000") +" report-status side-band-64k agent=git/2.27.0.windows.1"
        const endOfPartialPayloadIndicator = "0000"
        const chunkTextLength = (4+oldSha.length+" ".length+newSha.length+" ".length+partialPayload.length).toString(16)
        const chunkLength = Buffer.alloc(4).fill("00"+chunkTextLength,0,4)
        const spaceForBody = 4+ oldSha.length+" ".length+newSha.length+" ".length+partialPayload.length+endOfPartialPayloadIndicator.length+payload.length
        const body =  Buffer.alloc(spaceForBody).fill(chunkLength.toString()+oldSha+ " "+ newSha + " "+ partialPayload+endOfPartialPayloadIndicator,0,4+oldSha.length+ " ".length+ newSha.length + " ".length+ partialPayload.length+endOfPartialPayloadIndicator.length)
        payload.copy(body, (4+oldSha.length+" ".length+newSha.length+" ".length+partialPayload.length+endOfPartialPayloadIndicator.length), 0, payload.length)
        return Promise.resolve(body)
    }
}

const ccgitpushInstance = new ccgitpush(new Commit(new Utils()))
ccgitpushInstance.push()