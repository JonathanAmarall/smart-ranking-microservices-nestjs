import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsService {
  private logger = new Logger(AwsService.name);
  async uploadArquivo(file: any, id: string) {
    const s3 = new AWS.S3({
      region: process.env.REGION,
      accessKeyId: process.env.ACESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    });

    const fileExtension = file.originalname.split('.')[1];

    const urlKey = `${id}.${fileExtension}`;

    this.logger.log(`urlKey ${urlKey}`);

    const params = {
      Body: file.buffer,
      Bucket: process.env.BUCKET,
      Key: urlKey,
    };

    const data = s3
      .putObject(params)
      .promise()
      .then(
        () => {
          return {
            url: `https://${process.env.BUCKET}.s3.amazonaws.com/${urlKey}`,
          };
        },
        (err) => {
          this.logger.error(JSON.stringify(err));
          return err;
        },
      );

    return data;
  }
}
