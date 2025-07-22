import * as fs from 'fs'
import { HashObject } from "./HashObject"
import { UpdateIndex } from './UpdateIndexAdd'
import { Utils } from './Utils'




type val = bigint|number|string

export class ccgitadd 
{
  public indexEntries: {[key:string]: val}[]   
  public utils: Utils
  public currentDirectory: string
  
  constructor(utils: Utils)
  {
    this.utils = utils
    this.currentDirectory = "."
    this.indexEntries = []
    
    if(process.argv.length < 3)
      {
        console.log(`Expecting atleast 3 arguments.Got ${process.argv.length}`)
        return 
      }

    if(process.argv.length === 3 && process.argv[2] === ".")
      {
         const files = this.walkCurrentDirectoryAndGetFiles()
         for(let i=0;i<files.length;i++)
          {
            this.prepareInputIndexEntries(<string>files[i])
          }
      }
    else {
    
    for(let i=2;i< process.argv.length;i++)
      {
        this.prepareInputIndexEntries(process.argv[i])
      }
    }
    const stagingArea = new UpdateIndex(new Utils(), this.indexEntries)
      stagingArea.updateIndex()  
  }

  
  public walkCurrentDirectoryAndGetFiles(): string[]
    {
        let directoriesAndFiles = fs.readdirSync(this.currentDirectory,{recursive: true})//<string[]>fs.readdirSync(this.currentDirectory,{recursive: true})
        let that = this
        function ignoreDirectories(entry: string)
        {
            if(entry.includes('.git'))
             return false  
            return that._isFile(entry)?true:false
            
        }
        const files = directoriesAndFiles.filter(ignoreDirectories)

        return <string[]>files
    }
    private _isFile(entry: string): boolean
    {
      try{
        const stats = fs.statSync(entry)
        return stats.isFile()?true:false
      }  catch(e)
      {
        console.log(e.message)
      }
    }
  public prepareInputIndexEntries(fileName: string): void
  {
const sha = new HashObject(fileName)
sha.writeToObjectDB()
const shaStore = sha.calculateshaOfStore()
let fileContent
try
{
   fileContent = fs.readFileSync(fileName)
}catch(e)
{
  console.log(e.message)
}
const indexEntry = {
  fileName: fileName,
  mode: 100644,
  fileContentLength: fileContent.length,//to do: omit this
  version: 2,
  signature: "DIRC",
  fileNameLength:fileName.length,
  sha: shaStore,
  spaceForNull:(8-(62 + fileName.length)%8)//2 inside parentheses is 2 bytes for length of filename
   }
 
this.indexEntries.push(indexEntry)
  }
  
}
const add = new ccgitadd(new Utils())
/**
 * 
 * when updating the index if tree extension is present then invalidate the tree extension after updating the index entries
 * if present. If tree extension is not present then don't bother
 */
