import * as fs from 'fs'
import { Zlib } from 'zlib'
import * as sha1 from 'crypto'
import * as Ftype from './FileType'
import { indexSignature,indexEntry } from './types/index'
import {BufferSpace} from './types/BufferSpace'
import { Utils } from './Utils'
import * as version from './types/version'

type val = bigint|number|string

export class UpdateIndex
{
    indexEntries: indexEntry[]
    utils: Utils
    stats: fs.Stats
    args: string[]
    newFileNames: string[]
    oldEntries: Buffer
    individualOldEntries: Buffer[]
    extensions: Buffer
    modifiedExtensions: Buffer
    numberOfIndexEntriesToWriteInIndexSignature: number
   private _fileName: string

    constructor(utils: Utils,indexEntries: {[key:string]: val}[])
    {
        this._fileName = "./.git/index"
        this.newFileNames = []
        this.utils = utils
        this.modifiedExtensions = Buffer.alloc(0)    
        const inputNumberOfEntries = this.getNumberOfIndexEntriesToWriteInIndex(indexEntries)
        this._initializeIndexEntries(inputNumberOfEntries)
        this.calculateNumberOfIndexEntriesToWriteInIndexSignature(indexEntries)
        this.allocateSpaceForProps()
        if(fs.existsSync(this._fileName))
        {
            this._extractExtensions()
            this._invalidateExtensions()
            
        }
        
        this.fillOrWriteProps(indexEntries)
    
        if(fs.existsSync(this._fileName))
        {
            this._prepareIndexEntries()
        }
    }
    private _readIndex(): Buffer
    {
      return  fs.readFileSync(this._fileName)
    }
    private _extractOldEntries(): void
    {
        let firstEntryLength
        let fileNameLength = this.utils.allocateBufferSpace(2)
        let firstEntry:Buffer
        
        let indexFileContents = this._readIndex()
            this.oldEntries = this.utils.allocateBufferSpace(indexFileContents.indexOf('TREE')!== -1?(indexFileContents.indexOf('TREE') - 12):(indexFileContents.length - 20 - 12))
            indexFileContents.copy(this.oldEntries,0,12,indexFileContents.indexOf('TREE')!== -1?indexFileContents.indexOf('TREE')+1:indexFileContents.length - 19)
            //first entry
            
            let i = 12// start of Index Entry 
             let j = i + 60//start of fileName length
             
             indexFileContents.copy(fileNameLength,0,j,j+2)
             firstEntryLength = <number>this.utils.readIntegersFromBuffer(fileNameLength,16,0,'BE')
             let spaceForNull = 8 - (j + 2 + firstEntryLength - i)%8
             firstEntry = this.utils.allocateBufferSpace(j+2+firstEntryLength+spaceForNull-i)
             indexFileContents.copy(firstEntry,0,i,j+2+firstEntryLength+spaceForNull)
             this.individualOldEntries.push(firstEntry)
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
            this.individualOldEntries.push(secondEntry)
            
            k = l + 2 + secondEntryLength + spaceForNull
            l = k + 60
            
        }
        }
    
    private _extractExtensions(): void
    {
        
        let indexFileContents = this._readIndex()
        
        if(!indexFileContents.includes("TREE"))
        {
            return null
        }
        
        this.extensions = this.utils.allocateBufferSpace(indexFileContents.length-indexFileContents.indexOf('TREE'))
        indexFileContents.copy(this.extensions,0,indexFileContents.indexOf('TREE'),indexFileContents.length)
        }

    private _invalidateExtensions():void
    {
        this.modifiedExtensions = Buffer.alloc(14)//14 is for tree extension data
        const invalidatedEntry = Buffer.alloc(2)
        invalidatedEntry.write("-1")
        const treeSignature = "TREE"
        const nullPath= "\u0000"
    
    const spaceCharacter = " "
    const numberOfSubTrees = 0
    const lineFeedCharacter = Buffer.alloc(1).fill("0A",0,1,'hex')
    const lengthOfTreeExtensionData = 1+2+1+1+1//nullPath.length + invalidatedEntry.length + spaceCharacter.length + numberOfSubTrees.length + lineFeedCharacter.length
    const treeExtensionLength = this.utils.allocateBufferSpace(4)
    this.utils.writeIntegersToBuffer(treeExtensionLength,lengthOfTreeExtensionData,32,0,"BE")
    
        this.modifiedExtensions.write(treeSignature)
        treeExtensionLength.copy(this.modifiedExtensions,treeSignature.length,0,4)
        this.modifiedExtensions.write(nullPath+invalidatedEntry+spaceCharacter+numberOfSubTrees,treeSignature.length+treeExtensionLength.length)
        
        lineFeedCharacter.copy(this.modifiedExtensions,treeSignature.length+treeExtensionLength.length+nullPath.length+invalidatedEntry.length+spaceCharacter.length+1,0,1)
    }
    private _initializeIndexEntries(inputNumberOfEntries: number): void
    {
        this.indexEntries = []
        this.individualOldEntries = []
        
        for(let i=0;i< inputNumberOfEntries;i++)
        {
        this.indexEntries[i] = 
             {
                fileName: null,
                birthTime: null,
                mtime: null,
                birthtimeInNanoSeconds: null,
                mtimeInNanoSeconds: null,
                device: null,
                inode: null,
                mode: null,//100644-normal file,1007455-exe,120000-symlink
                userId: null,
                groupId: null,
                fileContentLength: null,
                sha: null,
                flags: null,
            }
        } 
    }

    public allocateSpaceForProps(): void
    {
        this.oldEntries = this.utils.allocateBufferSpace(0)
        this.indexEntries.forEach(indexEntry=>{
        indexEntry.birthTime = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.birthtimeInNanoSeconds = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.device = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.fileContentLength = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.flags = this.utils.allocateBufferSpace(BufferSpace.flags)
        indexEntry.groupId = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.inode = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.mtime = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.mtimeInNanoSeconds = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.sha = this.utils.allocateBufferSpace(BufferSpace.sha)
        indexEntry.userId = this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        indexEntry.mode =  this.utils.allocateBufferSpace(BufferSpace.indexEntry)
        })
        this.extensions = this.utils.allocateBufferSpace(0)
    }
    
    public fillOrWriteProps(indexEntries: {[key:string]: bigint|number|string}[]): void
    {
        if(!this.indexEntries.length)
        {
            return
        }
        let i=0
        //here we should take care that duplicate entries are allowed to override previous entries in index and original entries are preserved and new entries are appended
        indexEntries.forEach(indexEntry=>{
           
           this.indexEntries[i].fileName = <string>indexEntry.fileName
            this.setStats(this.indexEntries[i].fileName)
            this.indexEntries[i].fileContentLength = this.utils.writeIntegersToBuffer(this.indexEntries[i].fileContentLength,<number> indexEntry.fileContentLength,32)//thisthis.getFileContentLength(this.indexEntries[i].fileName)
           this.indexEntries[i].birthTime = this.utils.writeIntegersToBuffer(this.indexEntries[i].birthTime, Math.floor( new Date(this.stats.birthtime).getTime()/1000),32,0, 'BE')
           this.indexEntries[i].mtime = this.utils.writeIntegersToBuffer(this.indexEntries[i].mtime, Math.floor( new Date(this.stats.mtime).getTime()/1000),32,0, 'BE')
           this.indexEntries[i].birthtimeInNanoSeconds = this.utils.fillBuffer(this.indexEntries[i].birthtimeInNanoSeconds,0)//to do: understand nanoseconds concept and fill inthe values in buffer
           this.indexEntries[i].mtimeInNanoSeconds = this.utils.fillBuffer(this.indexEntries[i].mtimeInNanoSeconds,0)
           this.indexEntries[i].device = this.utils.fillBuffer(this.indexEntries[i].device,0)
           this.indexEntries[i].inode = this.utils.fillBuffer(this.indexEntries[i].inode,0)
           this.indexEntries[i].mode = this.utils.writeIntegersToBuffer(this.indexEntries[i].mode,0x81A4,32,0,'BE') //To do: get the mode based on type of file: text file or exe or links/symlinks..
           this.indexEntries[i].userId = this.utils.fillBuffer(this.indexEntries[i].userId,0)
           this.indexEntries[i].groupId = this.utils.fillBuffer(this.indexEntries[i].groupId,0)
           this.indexEntries[i].flags = this.utils.writeIntegersToBuffer(this.indexEntries[i].flags,<number>indexEntry.fileNameLength,16,0,'BE')       
           this.indexEntries[i].sha = this.utils.fillBuffer(this.indexEntries[i].sha,<string>indexEntry.sha,0,BufferSpace.sha,'hex')
           this.indexEntries[i].spaceForNull = <number>indexEntry.spaceForNull 
            i++
        })
        
    }
    
    private _getFilenameOf(entry: Buffer): string
    {
        const fileNameLength = this.utils.readIntegersFromBuffer(entry, 16, 60, 'BE')
        const fileName = Buffer.alloc(<number>fileNameLength)
        entry.copy(fileName, 0, 62, 62 + <number>fileNameLength)
        return fileName.toString()
    }

    private _prepareIndexEntries(): void
    {
        if(!this.indexEntries.length || !this.individualOldEntries.length)
        {
            return 
        }
        
        this.indexEntries.forEach(entry=>{
            
             this.individualOldEntries.forEach(oldEntry=>{
                 const oldFilename = this._getFilenameOf(oldEntry)
                 if(oldFilename.toUpperCase() === entry.fileName.toUpperCase())   
                {
                    this.individualOldEntries.splice(this.individualOldEntries.indexOf(oldEntry),1)
                }
            })
        
        })
    }
    
    public setStats(fileName: string): void
    {
        this.stats = fs.statSync(fileName)
    }
    
    
    public getNumberOfIndexEntriesToWriteInIndex(indexEntries: any[]): number
    {
        return indexEntries.length
    }
    public calculateNumberOfIndexEntriesToWriteInIndexSignature(indexEntries: any[]): void
    {
        let currentNumberOfEntries = 0
        let inputNumberOfEntries = 0
        
        if(fs.existsSync(this._fileName))
        {   this._extractOldEntries()
            let indexFileContents = fs.readFileSync(this._fileName)
            currentNumberOfEntries = <number>this.utils.readIntegersFromBuffer(indexFileContents,32,8,"BE")//indexFileContents[11]
            let oldEntriesSet = new Set()
            this.individualOldEntries.forEach((oldEntry)=>{
                const oldFilename = this._getFilenameOf(oldEntry)
                oldEntriesSet.add(oldFilename)
            })
                indexEntries.forEach(indexEntry=>{
                        if(!oldEntriesSet.has(indexEntry.fileName))
                        {
                            inputNumberOfEntries++
                        }
                })
            this.numberOfIndexEntriesToWriteInIndexSignature = currentNumberOfEntries + inputNumberOfEntries
        } else {
            this.numberOfIndexEntriesToWriteInIndexSignature = indexEntries.length
        }
    }
    public createIndex(): void
    {
        let signature = this.utils.allocateBufferSpace(4)
        this.utils.fillBuffer(signature, Ftype.FileSignature.DIRC)
        const versionNumber = this.utils.allocateBufferSpace(4)
        this.utils.fillBuffer(versionNumber,version.versionNumber.TWO,3)
        let numberOfEntries = this.utils.allocateBufferSpace(4)
        this.utils.fillBuffer(numberOfEntries, this.numberOfIndexEntriesToWriteInIndexSignature,3)
        if(fs.existsSync(this._fileName))
        {
            fs.unlinkSync(this._fileName)//move this to utils
        }
        
        this.utils.writeDataToFile(this._fileName, signature)
        this.utils.appendDataToFile(this._fileName, versionNumber)
        this.utils.appendDataToFile(this._fileName, numberOfEntries)
        
    }

    public updateIndex(): void
    {
            this.createIndex()
        if(this.individualOldEntries.length)
        {
            this.individualOldEntries.forEach(entry=>{
                this.utils.appendDataToFile(this._fileName, entry)
            })
        }
        
        this.indexEntries.forEach(indexEntry=>{
        this.utils.appendDataToFile(this._fileName, indexEntry.birthTime)
        this.utils.appendDataToFile(this._fileName, indexEntry.birthtimeInNanoSeconds)
        this.utils.appendDataToFile(this._fileName, indexEntry.mtime)
        this.utils.appendDataToFile(this._fileName, indexEntry.mtimeInNanoSeconds)
        this.utils.appendDataToFile(this._fileName, indexEntry.device)
        this.utils.appendDataToFile(this._fileName, indexEntry.inode)
        this.utils.appendDataToFile(this._fileName, indexEntry.mode)
        this.utils.appendDataToFile(this._fileName, indexEntry.userId)
        this.utils.appendDataToFile(this._fileName, indexEntry.groupId)
        this.utils.appendDataToFile(this._fileName, indexEntry.fileContentLength)
        this.utils.appendDataToFile(this._fileName, indexEntry.sha)
        this.utils.appendDataToFile(this._fileName, indexEntry.flags)
        let nullCharaters = ''
        for(let i=0;i< indexEntry.spaceForNull;i++)
        {
            nullCharaters += '\u0000'
        }
        this.utils.appendDataToFile(this._fileName, indexEntry.fileName + nullCharaters)
        })
        this.individualOldEntries = []
        this._extractOldEntries()
        
        this.individualOldEntries.sort((a,b)=>{
            const firstFileName = this._getFilenameOf(a).toUpperCase()
            const secondFileName = this._getFilenameOf(b).toUpperCase()
            if(firstFileName > secondFileName)
             {
                 return 1
             }
             if(firstFileName < secondFileName)
             {
                 return -1
             }    
     
             return 0
         })
        
         fs.unlinkSync(this._fileName)
         this.createIndex()
         
         if(this.individualOldEntries.length)
            {
                this.individualOldEntries.forEach(entry=>{
                    this.utils.appendDataToFile(this._fileName, entry)
                })
            }
        if(this.modifiedExtensions.length)
        {
            this.utils.appendDataToFile(this._fileName, this.modifiedExtensions)
        }
        
         const sha = this._calculateSha()
         let indexFileSha1Signature = Buffer.alloc(20)
         indexFileSha1Signature.fill(sha,0,20,'hex')
         this.utils.appendDataToFile(this._fileName, indexFileSha1Signature)
         }
    
    public _calculateSha(): string
    {
        const fileContent = fs.readFileSync(this._fileName)
        return sha1.createHash('sha1').update(fileContent).digest('hex')
    }
}

