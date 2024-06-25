enum FType {"blob" = "blob", "tree"= "tree", "commit" = "commit"}
export enum FileSignature {"DIRC" = "DIRC", "TREE" = "TREE", "COMMIT" = "COMMIT"}
export class FileType 
{
    constructor()
    {

    }

    public getFileType(path: string): string
    {
        //to implement
        return FType.blob 
    }
}

