import type { JpegOptions, ResizeOptions, SharpOptions, WriteableMetadata } from "sharp";
import sharp from "sharp";
import { ATTEMPTS_TO_CREATE_PREVIEW, MainDir, NameSuffix, config } from "./constants";
import { ensureDir } from 'fs-extra';
import * as path from 'path';

const TIMEOUT = 1000

type MainFolder = typeof config.mainFolder[keyof typeof config.mainFolder]

type Input = {
    mainDirName: MainDir;
    fileNameWithExtension: string;
}

type Output = {
    mainDirName: MainDir;
    subfolder: string;
}

type ConfigProps = {
    input: Input;
    outputPreviewFilePath: string;
    outputFullSizeFilePath: string;
}

type SharpSettings = {
    withMetadata?: WriteableMetadata
    sharpOptions?: SharpOptions
    resizeOptions?: ResizeOptions
    jpegOptions?: JpegOptions
}

type ReturnData = {
    inputFilePath: string;
    fullSizePath: string;
    previewPath: string;
}

const wait = async (timeMs: number = 100, func?: Function) => {  
    await new Promise(resolve => { setTimeout(resolve, timeMs) })
      .then(() => func && func())
  }

const getConfig = ({input, outputPreviewFilePath, outputFullSizeFilePath}: ConfigProps): ReturnData => {
    const { mainDirName: inputMainDirName, fileNameWithExtension } = input;
    const inputMainDir = config.mainFolder[inputMainDirName];

    return {
        inputFilePath: `${inputMainDir}/${fileNameWithExtension}`,
        previewPath: path.normalize(`${inputMainDir}/${outputPreviewFilePath}`),
        fullSizePath: path.normalize(`${inputMainDir}/${outputFullSizeFilePath}`)
    }
}

export interface SharpProps extends ConfigProps {
  fileType?: string;
  options?: SharpSettings;
  convertHeicToFullSizeJpeg?: boolean;
}
export const processImage = async ({ 
    input,
    outputPreviewFilePath,
    outputFullSizeFilePath,
    fileType,
    options,
    convertHeicToFullSizeJpeg = true
}: SharpProps) => {
    const filePathConfig = getConfig({input, outputPreviewFilePath, outputFullSizeFilePath});
    const { inputFilePath, fullSizePath, previewPath } = filePathConfig;
    let filePaths: Record<string, string> = {}

    try {
        if (fileType === 'image/heic' && convertHeicToFullSizeJpeg) {
            const { resizeOptions: _omittedOptions, ...restOptions } = options || {};
            await createImagePreview(inputFilePath, fullSizePath, restOptions);
            await createImagePreview(fullSizePath, previewPath, options);
            filePaths = {
                fullSizePath: fullSizePath.replace(/^\/app\//, ''), // replace /app/ with empty string
                previewPath: previewPath.replace(/^\/app\//, '') // replace /app/ with empty string
            }
        } else {
            await createImagePreview(inputFilePath, previewPath, options);
            filePaths = {
                previewPath: previewPath.replace(/^\/app\//, '') // replace /app/ with empty string
            }
        }

        return filePaths
    } catch (error) {
        console.error('❌ Error processing file:', error);
        throw error;
    }
}

const createImagePreview = async (inputImagePath: string, outputImagePath: string, options?: SharpSettings, attempt: number = 1) => {
    const { withMetadata, sharpOptions, resizeOptions, jpegOptions } = options || {};
    const currentJpegOptions = jpegOptions?.quality ? jpegOptions : { ...jpegOptions, quality: config.quality };

    const outputDir = path.dirname(outputImagePath);
    await ensureDir(outputDir);

    return new Promise<void>(async (resolve, reject) => {
        while (attempt <= ATTEMPTS_TO_CREATE_PREVIEW) {
            try {
                if (resizeOptions) {
                    await sharp(inputImagePath, sharpOptions)
                    .jpeg(currentJpegOptions)
                    .resize(resizeOptions)
                    .toFile(outputImagePath);
                } else {
                    await sharp(inputImagePath, sharpOptions)
                    .jpeg()
                    .toFile(outputImagePath);
                }
                console.log(`✅ Preview created on attempt ${attempt}:`, outputImagePath);
                break; // Break the loop if successful
            } catch (error) {
                console.error(`❌ Error creating preview on attempt ${attempt}:`, error, outputImagePath);
                console.error('❌ Error props:', {inputImagePath, outputImagePath, resizeOptions, currentJpegOptions, sharpOptions});
    
                if (attempt === ATTEMPTS_TO_CREATE_PREVIEW) {
                    console.error('❌ All attempts failed. Throwing error.', outputImagePath);
                    reject(error);
                    break;
                }
                console.info(`🔄 Retrying to create preview after ${TIMEOUT}ms (Attempt ${attempt + 1}/3)`, outputImagePath);
                await wait(TIMEOUT); // Wait for 100ms before retrying
                attempt++;
            }
        }
        resolve();
    })
}