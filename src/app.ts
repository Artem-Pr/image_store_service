import type { Request, Response } from 'express';
import express from 'express';
import { processImage, SharpProps } from './sharp';
import { MainDir } from './constants';
import { ResizeOptions } from 'sharp';

const app = express();

// Helper function to validate if the main directory is correct
function isValidMainDir(dir: any): dir is MainDir {
    // Replace with your actual validation logic
    return Object.values(MainDir).includes(dir);
}

interface ReqQuery {
    inputMainDirName: MainDir;
    fileNameWithExtension: string;
    outputPreviewMainDirName?: MainDir;
    outputFullSizeMainDirName?: MainDir;
    outputPreviewFilePath: string;
    outputFullSizeFilePath: string;
    previewSubfolder?: string;
    fullSizeSubfolder?: string;
    fileType?: string;
    convertHeicToFullSizeJpeg?: 'true' | 'false';
    resizeOptionsWidth?: string;
    resizeOptionsHeight?: string;
    resizeOptionsFit?: ResizeOptions['fit'];
    jpegOptionsQuality?: string;
}

app.get('/sharp', async (req: Request<undefined, undefined, undefined, ReqQuery>, res: Response) => {
    let options = undefined;
    let jpegOptions = undefined;
    let resizeOptions = undefined;

    console.log('🚀 ~ req.query:', req.query);
    
    try {
        const inputMainDirName = req.query.inputMainDirName;
        const fileNameWithExtension = req.query.fileNameWithExtension;
        const outputPreviewFilePath = req.query.outputPreviewFilePath;
        const outputFullSizeFilePath = req.query.outputFullSizeFilePath;

        const outputPreviewMainDirName = req.query.outputPreviewMainDirName || inputMainDirName;
        const outputFullSizeMainDirName = req.query.outputFullSizeMainDirName || inputMainDirName; // TODO: Check if needed
        const previewSubfolder = req.query.previewSubfolder || '';
        const fullSizeSubfolder = req.query.fullSizeSubfolder || ''; // TODO: Check if needed
        const fileType = req.query.fileType;
        const convertHeicToFullSizeJpeg = req.query.convertHeicToFullSizeJpeg === 'false' ? false : true;
        const width = req.query.resizeOptionsWidth;
        const height = req.query.resizeOptionsHeight;
        const fit = req.query.resizeOptionsFit;
        const quality = req.query.jpegOptionsQuality;

        if (!isValidMainDir(inputMainDirName) || !isValidMainDir(outputPreviewMainDirName) || !isValidMainDir(outputFullSizeMainDirName)) {
            return res.status(400).send('Invalid main directory name.');
        }
        if (typeof fileNameWithExtension !== 'string' || typeof previewSubfolder !== 'string' || typeof fullSizeSubfolder !== 'string') {
            return res.status(400).send('Invalid file name or subfolder.');
        }

        if (width || height) {
            resizeOptions = { 
                ...(width && { width: parseInt(width) }),
                ...(height && { height: parseInt(height) }),
                ...(fit && { fit }),
            };
        }

        if (quality) {
            jpegOptions = { quality: parseInt(quality) };
        }

        const input: SharpProps['input'] = { mainDirName: inputMainDirName, fileNameWithExtension };
        const output: SharpProps['output'] = {
            mainDirName: outputPreviewMainDirName,
            subfolder: previewSubfolder
        };
        
        if (jpegOptions || resizeOptions) {
            options = {
                ...(jpegOptions && { jpegOptions }),
                ...(resizeOptions && { resizeOptions }),
            };
        }

        // Call the processImage function with the parameters
        const result = await processImage({ input, output, outputPreviewFilePath, outputFullSizeFilePath, fileType, options, convertHeicToFullSizeJpeg});

        // Send the result back to the client
        res.json(result);
    } catch (error) {
        // Ensure that error.message is accessible
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).send(`❌ Error processing image: ${message}`);
    }
});

// interface FileProcessingJob {
//   fileName: string;
//   fileType: string;
// }


// const imageProcessingQueue = new Queue<FileProcessingJob>('file-processing', config.redis);


// imageProcessingQueue.process(8, async (job) => {
//   const { fileName, fileType } = job.data;

//   const filename = path.basename(fileName);
//   try {
//     const previewPath = await handleFileProcessing(job);
//     return { previewPath }
//   } catch (error) {
//     throw new Error('Failed to process image');
//   }
// });


const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});