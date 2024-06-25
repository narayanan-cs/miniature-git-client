import * as fs from 'fs'
import * as zlib from 'zlib'
import {Diff} from './ccgitdiff-base';
import { convertChangesToXML } from './convert';
import { Commit } from './Commit';
import { Utils } from './Utils';
import { HashObject } from './HashObject';
    

export class ccgitdiff extends Diff
{
    private currentDirectory: string
    public commit: Commit
    constructor(commit: Commit)
    {
        super()
        this.currentDirectory = "."
        this.commit = commit
    
    }

public getDifferencesBetweenTwoFiles(deflatedFile: string, file: string): void
{
    
  const inflatedFile = zlib.inflateSync(fs. readFileSync(deflatedFile))
  const inflatedFileWithoutHeader = this.commit.utils.allocateBufferSpace(inflatedFile.length - inflatedFile.indexOf("\u0000") -1)//Buffer.alloc(inflatedFile.length - inflatedFile.indexOf("\u0000") -1)
  inflatedFile.copy(inflatedFileWithoutHeader,0,inflatedFile.indexOf("\u0000")+1,inflatedFile.length)
    const lines1 = inflatedFileWithoutHeader.toString()
    let secondFile
   try {
     secondFile = fs.readFileSync(file)
   } catch(e)
   {
    throw new Error(`${file} not found`)
   }
   
    const lines2 = secondFile.toString()
    const diff = this.diff(lines1, lines2, {})
    if(diff === null)
        {
            return null
        }
        console.log(convertChangesToXML(diff))
    
}

public getDifferencesBetweenTwoVersionsOf(fileName: string): void
{
    try{ 
        const fileContents = fs.readFileSync(fileName)
    } catch(e)
    {
        if(e.code === "ENOENT")
            {
                throw new Error(`${fileName} not found`)
            }
    }
    this.extractOldEntries()
    this.commit._individualOldEntries.forEach(oldEntry=>{
    const indexFileName = this._getFilenameOf(oldEntry)
    if(fileName === indexFileName)
            {
                this.prepareToCompare(oldEntry, fileName)  
                              
            }
    }) 
}

public prepareToCompare(oldEntry: Buffer, fileName: string): void
{
    const sha1OfOldEntry = this._getSha1Of(oldEntry)
    const dir = sha1OfOldEntry.toString('hex').substring(0,2)
const file = sha1OfOldEntry.toString('hex').substring(2)
const filePath  = ".git/objects/"+ dir+"/"+ file
console.log(`diff --git a/${fileName} `+`b/${fileName}`)
console.log(`index `+sha1OfOldEntry.toString('hex').substring(0,7)+`..`+this.calculateShaOf(fileName).substring(0,7))

console.log(`--- a/${fileName}`)
console.log(`+++ b/${fileName}`)

    this.getDifferencesBetweenTwoFiles(filePath, fileName)

}

public calculateShaOf(fileName: string): string
{
    const hash = new HashObject(fileName)
    const sha1 = hash.calculateshaOfStore()
    return sha1.substring(0,7)
}

public getDirectoryContents(): string[]
{
    let directoriesAndFiles = <string[]>fs.readdirSync(this.currentDirectory,{recursive: true})

        function ignoreGitDirectory(entry: string)
        {
            return entry.includes(".git")?false:true
            
        }
        directoriesAndFiles = directoriesAndFiles.filter(ignoreGitDirectory)

        return <string[]>directoriesAndFiles
}

public extractOldEntries(): void
    {
        this.commit._extractOldEntries()            
}
private _getFilenameOf(entry: Buffer): string
    {
        const fileNameLength = this.commit.utils.readIntegersFromBuffer(entry, 16, 60, 'BE')
        const fileName = Buffer.alloc(<number>fileNameLength)
        entry.copy(fileName, 0, 62, 62 + <number>fileNameLength)
        return fileName.toString()
    }
    private _getSha1Of(entry: Buffer): Buffer
    {
        const sha1 = Buffer.alloc(20)
        entry.copy(sha1, 0, 40, 60)
        return sha1
    }    
public compareAndDiff(): void
{
    if(process.argv.length === 3)
        {
        this.getDifferencesBetweenTwoVersionsOf(process.argv[2])
        return
        }
    const directoriesAndFiles = new Set(this.getDirectoryContents())
    this.extractOldEntries()
    this.commit._individualOldEntries.forEach(oldEntry=>{
        const fileName = this._getFilenameOf(oldEntry)
        if(directoriesAndFiles.has(fileName))
            {
              this.prepareToCompare(oldEntry, fileName)
                
            }
    })
}

}
    
    const diff =new ccgitdiff(new Commit(new Utils()))
    diff.compareAndDiff()