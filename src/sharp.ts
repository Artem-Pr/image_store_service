import type { JpegOptions, ResizeOptions, SharpOptions, WriteableMetadata } from "sharp";
import sharp from "sharp";
import { MainDir, NameSuffix, config } from "./constants";
import { ensureDir } from 'fs-extra';
import * as path from 'path';

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
    outputPreview: Output;
    outputFullSize: Output;
}

type SharpSettings = {
    withMetadata?: WriteableMetadata
    sharpOptions?: SharpOptions
    resizeOptions?: ResizeOptions
    jpegOptions?: JpegOptions
}

type ReturnData = {
    inputMainDir: MainFolder;
    inputFilePath: string;
    outputPreviewMainDir: MainFolder;
    outputFullSizeMainDir: MainFolder;
    fullSizePath: string;
    previewPath: string;
}

const normalizePath = (path: string): string => {
    return path.replace(/\/{2,}/g, '/');
  };

const getConfig = ({input, outputPreview, outputFullSize}: ConfigProps): ReturnData => {
    const { mainDirName: inputMainDirName, fileNameWithExtension } = input;
    const { mainDirName: outputPreviewMainDirName, subfolder: previewSubfolder } = outputPreview;
    const { mainDirName: outputFullSizeMainDirName , subfolder: fullSizeSubfolder } = outputFullSize;
    const inputMainDir = config.mainFolder[inputMainDirName];
    const outputPreviewMainDir = config.mainFolder[outputPreviewMainDirName];
    const outputFullSizeMainDir = config.mainFolder[outputFullSizeMainDirName || outputPreviewMainDirName];

    // remove extension and filePath
    const inputFileName = fileNameWithExtension
        .replace(/.\w+$/, '')
        .split('/').at(-1)

    return {
        inputMainDir: inputMainDir,
        inputFilePath: `${inputMainDir}/${fileNameWithExtension}`,
        outputPreviewMainDir: outputPreviewMainDir,
        outputFullSizeMainDir: outputFullSizeMainDir,
        previewPath: normalizePath(`${outputPreviewMainDir}/${previewSubfolder}/${inputFileName}${NameSuffix.preview}.${config.previewExtension}`),
        fullSizePath: normalizePath(`${outputFullSizeMainDir}/${fullSizeSubfolder || previewSubfolder}/${inputFileName}${NameSuffix.fullSize}.${config.previewExtension}`),
    }
}

export interface SharpProps extends ConfigProps {
  fileType?: string;
  options?: SharpSettings;
  convertHeicToFullSizeJpeg?: boolean;
}
export const processImage = async ({ 
    input,
    fileType,
    outputFullSize,
    outputPreview,
    options,
    convertHeicToFullSizeJpeg = true
}: SharpProps) => {
    console.log('🚀 ~ options:', options)
    const filePathConfig = getConfig({input, outputFullSize, outputPreview});
    console.log('🚀 ~ filePathConfig:', filePathConfig)
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

        console.log('Preview created');
        console.log('Response:', filePaths)
        return filePaths
    } catch (error) {
        console.error('Error processing file:', error);
        throw error;
    }
}

const createImagePreview = async (inputImagePath: string, outputImagePath: string, options?: SharpSettings) => {  
    const { withMetadata, sharpOptions, resizeOptions, jpegOptions } = options || {};
    const currentJpegOptions = jpegOptions?.quality ? jpegOptions : {...jpegOptions, quality: config.quality };

    // Extract the directory path from the outputImagePath
    const outputDir = path.dirname(outputImagePath);

    // Ensure that the directory exists, if not, create it
    await ensureDir(outputDir);
    console.log(`Ensured existence of directory: ${outputDir}`);

    if (resizeOptions) {
        await sharp(inputImagePath, sharpOptions)
          .withMetadata(withMetadata)
          .jpeg(currentJpegOptions)
          .resize(resizeOptions)
          .toFile(outputImagePath)
          .then(() => {
            console.log(`Preview created at: ${outputImagePath}`);
          })
          .catch((error) => {
            console.error('Error creating preview:', error);
            throw error;
          })
    } else {
        await sharp(inputImagePath, sharpOptions)
          .withMetadata(withMetadata)
          .jpeg()
          .toFile(outputImagePath)
          .then(() => {
            console.log(`FullSize image created at: ${outputImagePath}`);
          })
          .catch((error) => {
            console.error('Error creating preview:', error);
            throw error;
          })
    }  
}