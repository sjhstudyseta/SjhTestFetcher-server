export type File = { // only used in fetcher-base
    name: string | null,
    atchFileId: string | null,
    fileSn: string | null
}

export type FileData = {
    nttId: string | null,
    title: string | null,
    files: { 
        name: string | null,
        url: string 
    }[];
}