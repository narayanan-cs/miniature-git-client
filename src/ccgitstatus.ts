import * as fs from 'fs'
import * as crypto from 'crypto'
import {Utils} from './Utils'
import { HashObject } from './HashObject'
import {FileType} from './FileType'
import { Commit } from './Commit'
import { Init } from './init'
import * as os from 'os'


export class Ccgitstatus
{
    private _individualEntries: Buffer[]
    private _stagingArea: string
    private currentDirectory: string
    private deletedFiles: string[]
    private untrackedFiles: string[]
    private stagedFiles: string[]
    private modifiedFiles: string[]
    public utils: Utils
    public init: Init
    private stagingArea: Commit
    constructor(utils: Utils, stagingArea?: Commit, init?: Init,  hashObject?: HashObject)
    {
        this._individualEntries = []
        this.untrackedFiles = []
        this.modifiedFiles = []
        this.deletedFiles = []
        this.utils = utils
        this.init = init
        this._stagingArea = ".git/index"
        this.currentDirectory = "."
        this.stagingArea = stagingArea
        this._extractIndividualEntriesFromStagingArea()
    }
    private _readIndex(): Buffer
    {
        if(!this._isStagingAreaPresent())
        {
            console.log("No staged files")
            this.getUntrackedFiles()
            this.printStatusOfFiles()
            return Buffer.alloc(0)
        }
      return  fs.readFileSync(this._stagingArea)
    }
    private _isStagingAreaPresent()
    {
        return fs.existsSync(this._stagingArea)
    }
    
    private _extractIndividualEntriesFromStagingArea(): void
    {
        let firstEntryLength
        let fileNameLength = this.utils.allocateBufferSpace(2)
        let firstEntry:Buffer
        if(!this._isStagingAreaPresent())
        {
            console.log("No staged files")
            return
        }
        let indexFileContents = this._readIndex()
            
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
             this._individualEntries.push(firstEntry)
            //second entry
            let secondEntry: Buffer
            let k = j+2+firstEntryLength+spaceForNull
            let l = k + 60 //start of fileName length
            
            while(indexFileContents.length > l)
            {
            indexFileContents.copy(fileNameLength,0,l,l+2)
             let secondEntryLength = <number>this.utils.readIntegersFromBuffer(fileNameLength,16,0,'BE')
             spaceForNull = 8 - (l + 2 + secondEntryLength - k)%8
             secondEntry = this.utils.allocateBufferSpace(l+2+secondEntryLength+spaceForNull-k)
             indexFileContents.copy(secondEntry,0,k,l+2+secondEntryLength+spaceForNull)
            this._individualEntries.push(secondEntry)
            k = l + 2 + secondEntryLength + spaceForNull
            l = k + 60
        }
    }

    public walkDirectory(): string[]
    {
        let directoriesAndFiles = <string[]>fs.readdirSync(this.currentDirectory,{recursive: true})
        
        function ignoreGitDirectory(entry: string)
        {
            return entry.includes(".git")?false:true
            
        }
        directoriesAndFiles = directoriesAndFiles.filter(ignoreGitDirectory)
        return <string[]>directoriesAndFiles
    }
    private _getSha1Of(entry: Buffer): string
    {
        const sha1 = Buffer.alloc(20)
        entry.copy(sha1, 0, 40, 60)
        return sha1.toString('hex')
    }
    private _getFilenameOf(entry: Buffer): string
    {
        const fileNameLength = this.utils.readIntegersFromBuffer(entry, 16, 60, 'BE')
        const fileName = Buffer.alloc(<number>fileNameLength)
        entry.copy(fileName, 0, 62, 62 + <number>fileNameLength)
        return fileName.toString()
    }
    
    public getUntrackedFiles(): void
    {
        const directoriesAndFiles = new Set(this.walkDirectory())
        if(!this._isStagingAreaPresent())
        {
            directoriesAndFiles.forEach(entry=>{
                this.untrackedFiles.push(entry)
            })
        return    
        }
        directoriesAndFiles.forEach(entry=>{
             let isFileFound = false
            if(this._isFile(entry))
            {
                this._individualEntries.forEach(indexEntry=>{
                     if(this._getFilenameOf(indexEntry) === entry)
                    {
                        isFileFound = true
                    }
                })
            }
            if(!isFileFound)
            {
                this.untrackedFiles.push(entry)
            }
            isFileFound = false
        })
    }
    public getFilesStatus(): void
    {
        this.getUntrackedFiles()
        this.stagedFiles = []
        this.modifiedFiles = []
        this.deletedFiles = []
        const directoriesAndFiles = new Set(this.walkDirectory())

        const hashesOfFiles = new Set()
        
         if(this.stagingArea._isAlreadyCommitted())
        {
            console.log("Nothing to commit. Working tree clean")
            return 
        }

        directoriesAndFiles.forEach(entry=>{
            if(this._isFile(entry))
            {
                const hashObject = new HashObject(entry)
                hashesOfFiles.add(hashObject.calculateshaOfStore())
            }
        })
        this._individualEntries.forEach(entry=>
            {
            const fileName = this._getFilenameOf(entry)
            let hashOfFilename
            if(fs.existsSync(fileName))
            {
                const hashObject = new HashObject(fileName)
                hashOfFilename = hashObject.calculateshaOfStore()
            
            }
            if(!directoriesAndFiles.has(fileName))
            {
               this.stagedFiles.push(fileName)
               this.deletedFiles.push(fileName)
            
            } else {
               if(hashOfFilename === this._getSha1Of(entry))
                {
                    this.stagedFiles.push(fileName)
                } else {
                    this.stagedFiles.push(fileName)
                    this.modifiedFiles.push(fileName)
                }
            }

            })
}
    private _isFile(entry: string): boolean
    {
        const stats = fs.statSync(entry)
        return stats.isFile()?true:false
        
    }
    private getFileSize(file: string): number
    {
        const stats = fs.statSync(file)
        return stats.size
    }
    public calculateshaOf(file: string): string
{
    return crypto.createHash('sha1').update(this.createStore(file)).digest('hex')
}
public getHeader(file: string): string
{
    const newFileType = new FileType()
    return newFileType.getFileType(file)+ " " + this.getFileSize(file) + "\u0000"
}

public readFileContent(file: string): Buffer
{
    const fileContent = fs.readFileSync(file)
    return fileContent
}

public createStore(file: string): string
{
    return this.getHeader(file) + this.readFileContent(file)
}

public printStatusOfFiles()
{
    this.getFilesStatus()
    this.untrackedFiles.length?console.log(`Untracked files:`,...this.untrackedFiles):""
    this.stagedFiles.length?console.log(`Changes to be committed:`,...this.stagedFiles):""
    this.modifiedFiles.length?console.log(`Modified files:`,...this.modifiedFiles):""
    this.deletedFiles.length?console.log(`Deleted files:`,...this.deletedFiles):""
}
    
}

 const ccgitstatus = new Ccgitstatus(new Utils(),new Commit(new Utils()))//, new Init())//,new Commit(new Utils()))
ccgitstatus.printStatusOfFiles()
/**
 * check if all the files are committed and if the hash is same for directory files and index files. If so,
 * then working tree is clean
 * if the hash is the same for directory files and index files and the files are not committed then the files are staged
 * if hash is different then it is a modified file
 * if hash of an index file is not present in directory file then it is a deleted file
 * if the hash of a directory file is not present in index file then it is an untracked file
 *
 */