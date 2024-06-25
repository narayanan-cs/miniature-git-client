export class GarbageCollection
{
    constructor()
    {

    }

    public gc()
    {
        return 'git gc'
    }
    private changePermissionsToReadOnly()
    {
        //chmod 400 .git/objects/refs/heads/master
    }
}

const gc = new GarbageCollection()
eval(gc.gc())