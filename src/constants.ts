enum Envs {
    DEV = 'development',
    DOCKER = 'docker',
}

const env: Envs = Envs.DOCKER;

export const PREVIEW_EXTENSION = 'jpg';

export enum MainDir {
    temp = 'temp',
    volumes = 'volumes',
    previews = 'previews',
}

export enum NameSuffix {
    fullSize = '-fullSize',
    preview = '-preview',
}

export type Folders = {
    [key in Envs]: {
        [MainDir.temp]: string;
        [MainDir.volumes]: string;
        [MainDir.previews]: string;
    }
} 

enum mainDirPath {
    dev = '../../test-data',
    docker = '/app',
}

const folders = Object.freeze({
    [Envs.DEV]: {
        [MainDir.temp]: `${mainDirPath.dev}/${MainDir.temp}`,
        [MainDir.volumes]: `${mainDirPath.dev}/${MainDir.volumes}`,
        [MainDir.previews]: `${mainDirPath.dev}/${MainDir.previews}`,
    },
    [Envs.DOCKER]: {
        [MainDir.temp]: `${mainDirPath.docker}/${MainDir.temp}`,
        [MainDir.volumes]: `${mainDirPath.docker}/${MainDir.volumes}`,
        [MainDir.previews]: `${mainDirPath.docker}/${MainDir.previews}`,
    }
} as const)

export const config = {
    previewExtension: PREVIEW_EXTENSION,
    mainFolder: folders[env],
    quality: 60,
}