import * as zlib from 'zlib'
import * as fs from 'fs'
import { Utils } from './Utils'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'
dotenv.config()


export class Commit
{
    private _stagingArea: string
    public utils: Utils
    public _individualOldEntries: Buffer[]
    private treeSha:string
    private _treeShaSpace: Buffer
    public packDirectory: string
    public packFile: string
    constructor(utils: Utils)
    {
        this._stagingArea = '.git/index'//to move it to .local.env file
        this.utils = utils
        this._individualOldEntries = []
        this.packDirectory = ".git/objects/pack"
        this.packFile = ""
    }
    public _isStagingAreaPresent()
    {
        return fs.existsSync(this._stagingArea)
    }
    public _readIndex(): Buffer
    {
        if(!this._isStagingAreaPresent())
        {
            console.log("No staged files")
            return null
        }
      return  fs.readFileSync(this._stagingArea)
    }
    public _extractOldEntries(): void
    {
        
        let firstEntryLength
        let fileNameLength = this.utils.allocateBufferSpace(2)
        let firstEntry:Buffer
        
        let indexFileContents = this._readIndex()
        if(indexFileContents === null)
         {
            return 
         }
         
            let oldEntries = this.utils.allocateBufferSpace(indexFileContents.indexOf('TREE')!== -1?(indexFileContents.indexOf('TREE') - 12):(indexFileContents.length - 20 - 12))
            indexFileContents.copy(oldEntries,0,12,indexFileContents.indexOf('TREE')!== -1?indexFileContents.indexOf('TREE')+1:indexFileContents.length - 19)
            //first entry
            let i = 12// start of Index Entry 
             let j = i + 60//start of fileName length
             indexFileContents.copy(fileNameLength,0,j,j+2)
             firstEntryLength = <number>this.utils.readIntegersFromBuffer(fileNameLength,16,0,'BE')
            let spaceForNull = 8 - (j + 2 + firstEntryLength - i)%8
             firstEntry = this.utils.allocateBufferSpace(j+2+firstEntryLength+spaceForNull-i)
             indexFileContents.copy(firstEntry,0,i,j+2+firstEntryLength+spaceForNull)
             this._individualOldEntries.push(firstEntry)
            //second entry
            let secondEntry: Buffer
            let k = j+2+firstEntryLength+spaceForNull
            let l = k + 60 //start of fileName length
            
            while(indexFileContents.length > l)
            {
            indexFileContents.copy(fileNameLength,0,l,l+2)
            //console.log(fileNameLength,"FilenameLength Buffer")
             let secondEntryLength = <number>this.utils.readIntegersFromBuffer(fileNameLength,16,0,'BE')
             spaceForNull = 8 - (l + 2 + secondEntryLength - k)%8
             secondEntry = this.utils.allocateBufferSpace(l+2+secondEntryLength+spaceForNull-k)
             indexFileContents.copy(secondEntry,0,k,l+2+secondEntryLength+spaceForNull)
            this._individualOldEntries.push(secondEntry)
            
            k = l + 2 + secondEntryLength + spaceForNull
            l = k + 60
            
        }
    }
    private _getSha1Of(entry: Buffer): Buffer
    {
        const sha1 = Buffer.alloc(20)
        entry.copy(sha1, 0, 40, 60)
        return sha1
    }
    private _getFilenameOf(entry: Buffer): string
    {
        const fileNameLength = this.utils.readIntegersFromBuffer(entry, 16, 60, 'BE')
        const fileName = Buffer.alloc(<number>fileNameLength)
        entry.copy(fileName, 0, 62, 62 + <number>fileNameLength)
        return fileName.toString()
    }
   
public readFileContent(entry: Buffer): Buffer
{
    const fileName = this._getFilenameOf(entry)
    const fileContent = fs.readFileSync(fileName)
    return fileContent
}
public calculateshaOfStore(content: Buffer): string
{
    return crypto.createHash('sha1').update(content).digest('hex')
}
private _writeTreeObjectToDB(): string
{
    let offset = 0 
    let treeBodyLength = 0
    const space = " "
    const nullCharacter = "\u0000"
    
    this._individualOldEntries.forEach(entry=>{
        const mode = "100644"
       
       const fileName = this._getFilenameOf(entry)
       const sha1 = this._getSha1Of(entry)
       treeBodyLength += mode.length+space.length+fileName.length+nullCharacter.length+sha1.length
       })
    const treeBody = Buffer.alloc(treeBodyLength)

    this._individualOldEntries.forEach(entry=>{
        const mode = "100644"//this._getModeOf(entry)//to do : get mode dynmically
       treeBody.write(mode,offset)
       treeBody.write(space,offset+mode.length)
       const fileName = this._getFilenameOf(entry)
       treeBody.write(fileName,offset+mode.length+space.length)
       treeBody.write(nullCharacter,offset+mode.length+space.length+fileName.length)
       const sha1 = this._getSha1Of(entry)
        const sha1Copy = Buffer.alloc(20)
        sha1.copy(sha1Copy,0,0,20)
        sha1Copy.copy(treeBody,offset+mode.length+space.length+fileName.length+nullCharacter.length,0,sha1Copy.length)
       offset += mode.length+space.length+fileName.length+nullCharacter.length+sha1Copy.length
       
    })
    const treeSignature = 'tree'
    
    const treeHeader = treeSignature+ space+ treeBodyLength
    const tree = Buffer.alloc(treeHeader.length+nullCharacter.length+treeBodyLength)
    tree.write(treeHeader)
    
    tree.write(nullCharacter,treeHeader.length)
    treeBody.copy(tree,treeHeader.length+nullCharacter.length,0,treeBodyLength)

    const shaStore = this.calculateshaOfStore(tree)
    const dirPath = "./.git/objects/" + shaStore.substring(0,2) // to do : remove hardcoding of .git/objects
    !fs.existsSync(dirPath)?fs.mkdirSync(dirPath):""
    const filePath = dirPath + "/" + shaStore.substring(2)
    fs.writeFileSync('.git/inflatedTree',tree)
    fs.writeFileSync(filePath,zlib.deflateSync(tree))
    return shaStore
}

private _writeCommitObjectToDB(): void
{
    const parentCommitSha = this._getParentCommit()
    const doubleLineFeedCharacter = Buffer.alloc(2).fill("0A0A",0,2,'hex')
    const commitSignature = "commit"
    const treeSignature = "tree"
    const space = " "
    const nullCharacterLength = 1
    const treeSha = this._treeShaSpace.toString('hex')
    const lineFeedCharacter = Buffer.alloc(1).fill("0A",0,1,'hex')
    const parentCommitSignature = "parent "
    const parentCommit = parentCommitSha?parentCommitSignature+parentCommitSha:""
    const parentCommitLength = parentCommit.length? (parentCommit.length+lineFeedCharacter.length):0
    const author = "author "+ process.env.USER + " <"+ process.env.EMAIL + ">"
    const timeNow = Date.now().toString().substring(0,10) +" +0530"//new Date().getTime().toString()
    const committer = "committer " + process.env.USER + " <"+ process.env.EMAIL + ">"
    const commitMessage = process.argv[2]
    const commitBodyLength = nullCharacterLength+
                             treeSignature.length+
                             space.length+treeSha.length+
                             lineFeedCharacter.length+
                             parentCommitLength+
                             author.length+
                             space.length+
                             timeNow.toString().length+
                             lineFeedCharacter.length+
                             committer.length+
                             space.length+
                             timeNow.toString().length+
                             doubleLineFeedCharacter.length+
                             process.argv[2].length+
                             lineFeedCharacter.length
    const commitHeader = commitSignature+ space+ commitBodyLength
    const commit = Buffer.alloc(commitHeader.length+commitBodyLength)
    const bodyLengthToBeWritten = commitBodyLength-1
    commit.write(commitSignature+ " "+bodyLengthToBeWritten)
    commit.write("\u0000",commitHeader.length)
    commit.write(treeSignature+space+treeSha,commitHeader.length+nullCharacterLength)
    lineFeedCharacter.copy(commit,commitHeader.length+nullCharacterLength+treeSignature.length+
                           space.length+treeSha.length,0,lineFeedCharacter.length)
    parentCommit.length?commit.write(parentCommit,commitHeader.length+nullCharacterLength+treeSignature.length+
        space.length+treeSha.length+lineFeedCharacter.length):""
    parentCommit.length?lineFeedCharacter.copy(commit,commitHeader.length+nullCharacterLength+treeSignature.length+
            space.length+treeSha.length+lineFeedCharacter.length+parentCommit.length,0,lineFeedCharacter.length):""
    commit.write(author+space+timeNow,commitHeader.length+nullCharacterLength+treeSignature.length+
        space.length+treeSha.length+lineFeedCharacter.length+parentCommitLength)
        lineFeedCharacter.copy(commit,commitHeader.length+nullCharacterLength+treeSignature.length+
            space.length+treeSha.length+lineFeedCharacter.length+parentCommitLength+author.length+
            space.length+timeNow.length)
        lineFeedCharacter.copy(commit,commitHeader.length+nullCharacterLength+treeSignature.length+
                space.length+treeSha.length+lineFeedCharacter.length+parentCommitLength+author.length+
                space.length+timeNow.length,0,lineFeedCharacter.length)
    commit.write(committer+space+timeNow,commitHeader.length+nullCharacterLength+treeSignature.length+
        space.length+treeSha.length+lineFeedCharacter.length+parentCommitLength+author.length+
        space.length+timeNow.length+lineFeedCharacter.length)
    doubleLineFeedCharacter.copy(commit,commitHeader.length+nullCharacterLength+treeSignature.length+
        space.length+treeSha.length+lineFeedCharacter.length+parentCommitLength+author.length+
        space.length+timeNow.length+lineFeedCharacter.length+committer.length+space.length+timeNow.length,0,doubleLineFeedCharacter.length)
    commit.write(commitMessage,commitHeader.length+nullCharacterLength+treeSignature.length+
        space.length+treeSha.length+lineFeedCharacter.length+parentCommitLength+author.length+
        space.length+timeNow.length+lineFeedCharacter.length+committer.length+space.length+timeNow.length+doubleLineFeedCharacter.length)                    
    lineFeedCharacter.copy(commit,commitHeader.length+nullCharacterLength+treeSignature.length+
        space.length+treeSha.length+lineFeedCharacter.length+parentCommitLength+author.length+
        space.length+timeNow.length+lineFeedCharacter.length+committer.length+space.length+timeNow.length+doubleLineFeedCharacter.length
        +commitMessage.length,0,lineFeedCharacter.length)

    const shaStore = this.calculateshaOfStore(commit)
    const dirPath = "./.git/objects/" + shaStore.substring(0,2) // to do : remove hardcoding of .git/objects
    !fs.existsSync(dirPath)?fs.mkdirSync(dirPath):""
    const filePath = dirPath + "/" + shaStore.substring(2)
    fs.writeFileSync('.git/debugCommit',commit)
    fs.writeFileSync(filePath,zlib.deflateSync(commit))
    this._writeToMaster(shaStore)
    //Message to display to user
    console.log("committed to master: "+ shaStore)

   
}
private _writeToMaster(sha: string): void
{
    
    const masterFilePath = ".git/refs/heads/master"
    fs.writeFileSync(masterFilePath,sha)
    const lineFeedCharacter = Buffer.alloc(1)
        lineFeedCharacter.fill("0A",0,1,'hex')
        fs.appendFileSync(masterFilePath,lineFeedCharacter)
}
private _isParentCommitPresent(): boolean
{
    let data
    if(fs.existsSync('.git/refs/heads/master'))
        {
            data = fs.readFileSync('.git/refs/heads/master')
        } else {
            data = fs. readFileSync('.git/info/refs')
        }
    return data !== null
}

private _getParentCommit(): string
{
    if(!this._isParentCommitPresent())
    {
        return null
    }
    let data
    if(fs.existsSync('.git/refs/heads/master'))
         data = fs.readFileSync('.git/refs/heads/master',{encoding:'ascii'}).toString().substring(0,40)
    else {
        data = fs.readFileSync('.git/info/refs',{encoding:'ascii'}).toString().substring(0,40)
    }
    return data
}

public updateIndex()
{
    if(!this._isStagingAreaPresent())
        {
            console.log("No staged files")
            return
        }
    this._extractOldEntries()
    if(this._isAlreadyCommitted())
    {
        console.log("Nothing to commit.Working tree clean.")
        return 
    }
    if(process.argv.length < 3)
        {
                 console.log(`Expected 3 arguments. Got ${process.argv.length}`)
                 process.exit(1)
        }
    
    let stagingArea = fs.readFileSync(this._stagingArea)
    let stagingAreaCopy
    if(stagingArea.includes("TREE"))
    {
        stagingAreaCopy= Buffer.alloc(stagingArea.length - 1)//-1 because the tree extension is invalidated by -1 in number fo entries every time we stage a file(s) after commit(s). -1 occupies 2 bytes , not 1.
    } else{
        stagingAreaCopy = Buffer.alloc(stagingArea.length + 33-20)
    }
     
    stagingArea.copy(stagingAreaCopy,0,0,stagingArea.length)
    const nullPath= "\u0000"
    const numberOfEntries = this._individualOldEntries.length
    const spaceCharacter = " "
    const numberOfSubTrees = 0
    const lineFeedCharacter = Buffer.alloc(1).fill("0A",0,1,'hex')
    this.treeSha = this._writeTreeObjectToDB()
    
    this._treeShaSpace = Buffer.alloc(20)
    this._treeShaSpace.fill(this.treeSha,0,20,'hex')
    const lengthOfTreeExtensionData = 1+1+1+1+1+20//nullPath.length + numberOfEntries.length + spaceCharacter.length + numberOfSubTrees.length + lineFeedCharacter.length + this.treeSha.length
    const treeExtensionLength = this.utils.allocateBufferSpace(4)
    this.utils.writeIntegersToBuffer(treeExtensionLength,lengthOfTreeExtensionData,32,0,"BE")
    const treeSignature = "TREE"
    let overwritingPosition
    if(stagingAreaCopy.includes("TREE"))
    {
        overwritingPosition = stagingAreaCopy.indexOf("TREE")
    } else{
        overwritingPosition = stagingAreaCopy.length -20 -13 // -20
        
    }
        stagingAreaCopy.write(treeSignature,overwritingPosition)
        treeExtensionLength.copy(stagingAreaCopy,overwritingPosition+treeSignature.length,0,4)
        stagingAreaCopy.write(nullPath+numberOfEntries+spaceCharacter+numberOfSubTrees,overwritingPosition+treeSignature.length+treeExtensionLength.length)
        lineFeedCharacter.copy(stagingAreaCopy,overwritingPosition+treeSignature.length+treeExtensionLength.length+nullPath.length+1+spaceCharacter.length+1,0,1)
       this._treeShaSpace.copy(stagingAreaCopy, overwritingPosition+treeSignature.length+treeExtensionLength.length+nullPath.length+1+spaceCharacter.length+1+lineFeedCharacter.length,0,this._treeShaSpace.length)
        
   fs.writeFileSync(this._stagingArea,stagingAreaCopy)
  const sha = this._calculateShaOfStagingArea()
   const shaOfStagingArea = Buffer.alloc(20)
   shaOfStagingArea.fill(sha,0,20,'hex')
   let anotherCopyOfStagingArea = Buffer.alloc(stagingAreaCopy.length+20)
   stagingAreaCopy.copy(anotherCopyOfStagingArea,0,0,stagingAreaCopy.length)
   shaOfStagingArea.copy(anotherCopyOfStagingArea,overwritingPosition+treeSignature.length+treeExtensionLength.length+nullPath.length+1+spaceCharacter.length+1+lineFeedCharacter.length+this._treeShaSpace.length,0,20)
   fs.writeFileSync(this._stagingArea,anotherCopyOfStagingArea)
    this._writeCommitObjectToDB() 
}
private _calculateShaOfStagingArea(): string
{
    const stagingArea = fs.readFileSync(this._stagingArea)
    const shaOfStagingArea = crypto.createHash('sha1').update(stagingArea).digest('hex')
    return shaOfStagingArea
}
public _isAlreadyCommitted(): boolean
{
    if(!fs.existsSync(this._stagingArea))
    
    {
        return false
    }
    const stagingArea = fs.readFileSync(this._stagingArea)
    
    if(!stagingArea.includes("TREE"))
    {
        return false
    }
    let numberOfEntries  = Buffer.alloc(2)
     stagingArea.copy(numberOfEntries,0,stagingArea.indexOf("TREE")+9,stagingArea.indexOf("TREE")+11)
    if(numberOfEntries.toString() === "-1") 
    {
        return false
    }

     if(this.isDBPacked())
         {
            return true//Assuming user does not pack files manually at any time
    
         }
    let isAlreadyCommited = true     
    let treeSha = Buffer.alloc(20)
    stagingArea.copy(treeSha,0,stagingArea.length - 40, stagingArea.length - 20)
    
    const treeDir = treeSha.toString('hex').substring(0,2)
    const treeFile = treeSha.toString('hex').substring(2)
    const deflatedTreeContents = fs.readFileSync(".git/objects/"+ treeDir+"/"+ treeFile)
    const inflatedTreeContents = zlib.inflateSync(deflatedTreeContents)
    
    this._individualOldEntries.forEach(entry=>{
        if(!inflatedTreeContents.includes(this._getSha1Of(entry)))
        {
            isAlreadyCommited = false
        }
    })
return isAlreadyCommited
}

public isDBPacked(): boolean
{
    if(fs.existsSync(this.packDirectory))
    {
        this.packFile = fs.readdirSync(this.packDirectory).
        filter((content=>
            content.substring(content.length-4) === 'pack'
        )).join(",")
    }
     return this.packFile.length > 0   
}
}
    
/**
 * For committing,
 * check if index file exists
 * get all individual old entries in index file
 * get all the modes(25-28), sha1 values(41-60), filenames(65-76 bits is filename length and following that is the file name) in those individual entries
 * prepare the tree object
 *  * signature (tree<space><length of the remaining document>)
 *  * null character
 *  * repeat this
 *         * mode space filename null sha1 null(if it is not last entry) 
 * write down the tree object to DB and get the tree object key 
 * check if parent commit is present in refs/heads/master
 * if present then get the parent commit object key
 * get the name and email from config
 * prepare the commit object
 * write down the commit object to DB
 * Update the index with tree object that was inside commit object
 * * when updating the index with the tree object
 *      for the first time, update in place of integrity sha1 and append the new integrity sha1. The tree extension is not  present.
 *      for subsequent times, the tree entry is present and so update in place of the previous tree entry
 */

/**
 * when issuing the commit command more than 1 time, it should be idempotent
 * which means when a commit is issued then check for the parent commit , if it is there then , get its contents
 * and get the tree object and get its contents and check if all the filenames are present against the old individual entries
 * if present then pass the message as nothing to commit , working tree clean. if not present then go to line number 27
 */

