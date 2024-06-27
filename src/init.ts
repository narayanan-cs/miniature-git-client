import * as fs from 'fs'
import * as readline from 'readline'
import * as dotenv from 'dotenv'
dotenv.config()
export class Init 
{
    public repositoryName: string
    public gitDir: string
    public headFile: string
    public configFile: string
    public descriptionFile: string
    public hooksDir: string
    public infoDir: string
    public infoRefsFile: string
    public objectsDir: string
    public refsDir: string
    public headsDir: string
    public masterFile: string
    public tagsDir: string
    public pkg_json: string
    public config: {[key: string]: string}
    constructor()
    {
        const args = process.argv
        if(args.length <= 2)
        {
            console.log(`Expected 3 arguments. Got ${args.length}`)
            process.exit()
        }
       
        this.repositoryName = args[2]
        this.gitDir = this.repositoryName +"/" +".git"
        this.headFile = this.gitDir + "/" + "HEAD"
        this.configFile = this.gitDir + "/" + "config"
        this.descriptionFile = this.gitDir + "/" + "description"
        this.hooksDir = this.gitDir + "/" + "hooks"
        this.infoDir = this.gitDir + "/" + "/info"
        this.infoRefsFile = this.infoDir + "/refs"
        this.objectsDir = this.gitDir + "/" + "objects"
        this.refsDir = this.gitDir + "/" + "refs"
        this.headsDir = this.refsDir + "/" + "heads"
        this.tagsDir = this.refsDir + "/" + "tags"
        this.pkg_json = this.repositoryName + "/" + "package.json"
        this.config = {}
    }
    public getGitDirectoryPath(): string
    {
        return this.gitDir
    }

    public createGitDir(): void
    {
        if(fs.existsSync(this.gitDir))
        {
        console.log("Git repository already initialized") 
        process.exit() 
        }
        fs.mkdirSync(this.repositoryName)
        fs.mkdirSync(this.gitDir)
    }
    public async getUserInput(): Promise<void>
    {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          })
        console.log("Please provide your username")  
        const it = rl[Symbol.asyncIterator]()
        const username = await it.next().then(result=>result.value)
        this.config.username = <string><unknown>username
        console.log("Please provide your email")  
        const email = await it.next().then(result=>result.value)  
        this.config.email = <string><unknown>email
        console.log("Enter the remote repository url.Please enter the absolute path \n \
        Example: https://github.com/<your username>/<your repository name>.git \n \
        Mine is, say, https://github.com/narayanan-cs/myrepository.git")
        
        const url = await it.next().then(result=>result.value)
        this.config.remoteUrl = <string><unknown>url
        console.log("Please provide your Personal Access Token for your remote git repository")  
        const PAT = await it.next().then(result=>result.value)  
        this.config.PAT = <string><unknown>PAT
        rl.close()
    }

    private _writeToEnv(): void
    {
        fs.writeFileSync(this.repositoryName+"/.env", "")
        fs.appendFileSync(this.repositoryName+"/.env","USER="+this.config.username+"\n")              
        fs.appendFileSync(this.repositoryName+"/.env","EMAIL="+this.config.email+"\n")              
        fs.appendFileSync(this.repositoryName+"/.env","REMOTE_URL="+this.config.remoteUrl+"\n")              
        fs.appendFileSync(this.repositoryName+"/.env","PAT="+this.config.PAT+"\n")              
    }

    public createHeadFile(): void
    {
        fs.writeFileSync(this.headFile,"ref: refs/heads/master")
        const lineFeedCharacter = Buffer.alloc(1)
        lineFeedCharacter.fill("0A",0,1,'hex')
        fs.appendFileSync(this.headFile,lineFeedCharacter)
    }

    public createConfigFile(): void
    {
        fs.writeFileSync(this.configFile,Buffer.from("[core]\n\trepositoryformatversion = 0\n\tfilemode = false\n\tbare = false\n\tlogallrefupdates = true\n\tsymlinks = false\n\tignorecase = true\n")
    )
    }
    
    public createDescriptionFile(): void
    {
        fs.writeFileSync(this.descriptionFile,"Unnamed repository; edit this file 'description' to name the repository.")
    }

    public createHooksDir(): void
    {
        fs.mkdirSync(this.hooksDir)
    }

    public createInfoDir(): void
    {
        fs.mkdirSync(this.infoDir)
        fs.writeFileSync(this.infoRefsFile,"")
    }

    public createObjectsDir(): void
    {
        fs.mkdirSync(this.objectsDir)
    }

    public createRefsDir(): void
    {
        fs.mkdirSync(this.refsDir)
        fs.mkdirSync(this.headsDir)
        fs.mkdirSync(this.tagsDir)
        //fs.writeFileSync(this.masterFile,"")
    }

    public createPackageDotJsonFile(): void
    {
        fs.writeFileSync(this.pkg_json,"")
    }
    public async initializeGitRepo()
    {
        this.createGitDir()
        this.createHeadFile()
        this.createConfigFile()
        this.createDescriptionFile()
        this.createHooksDir()
        this.createInfoDir()
        this.createObjectsDir()
        this.createRefsDir()
        this.createPackageDotJsonFile()
        fs.copyFileSync(fs.realpathSync("scripts.json"),fs.realpathSync(this.pkg_json))
        await this.getUserInput()
        this._writeToEnv()
        console.log("Initialized empty Git repository :" + this.repositoryName)
    }
    
}

const init = new Init()
init.initializeGitRepo()
