import { ConfigurationController } from './configuration.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseTestingModule } from '../utils/mongoose-testing.module';
import { VideoDTO } from '../dtos/video.dto';
import { ConfigurationService } from './configuration.service';

describe('ConfigurationController', () => {
  let controller: ConfigurationController;
  let configurationService: ConfigurationService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('ConfigurationController')],
      providers: [],
      controllers: [ConfigurationController],
    }).compile();

    controller = module.get(ConfigurationController);
    configurationService = module.get(ConfigurationService);

    await configurationService.configurationModel.deleteMany();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get Videos', async () => {
    const configVideosPayload: VideoDTO[] = [
      {
        name: '1st Video',
        videoUrl:
          'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/781ba680-a6d3-43f9-b0b2-4e5c62d93d2f/versions/12/transfers/target_transfer.mp4',
        videoType: 'video/mp4',
        actions: [],
      },
    ];
    await configurationService.configurationModel.create({
      senderEmail: 'email@example.com',
      videos: configVideosPayload,
    });
    const configVideos = await controller.getVideos();
    expect(configVideosPayload).toEqual(configVideos);
  });
});
