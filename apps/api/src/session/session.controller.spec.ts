import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from './session.controller';
import { createCommunity, createSession } from '../utils/test-data';
import { request } from 'express';
import { SessionCreateDTO } from '../dtos/session/session-create.dto';
import { SessionUpdateDTO } from '../dtos/session/session-update.dto';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';

describe('Session Controller', () => {
  let controller: SessionController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('SessionController')],
      controllers: [SessionController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(SessionController);
    await cleanCollections(module);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get community sessions', async () => {
    const { community } = await createCommunity(module);
    await createSession(module, community);
    const result = await controller.getSessions(community._id.toHexString());
    expect(result.length).toEqual(1);
  });

  it('should get sessions by query', async () => {
    const { community } = await createCommunity(module);
    await createSession(module, community);
    const result = await controller.getSessions(community._id.toHexString(), 'Session');
    expect(result.length).toEqual(1);
  });

  it('should get sessions by track', async () => {
    const { community } = await createCommunity(module);
    await createSession(module, community, {
      session: { newTrackTimestamp: community.newTracks[0].timestamp },
    });
    const result = await controller.getSessions(
      community._id.toHexString(),
      '',
      community.newTracks[0].timestamp
    );
    expect(result.length).toEqual(1);
  });

  it('should get sessions by date', async () => {
    const { community } = await createCommunity(module);
    await createSession(module, community);
    const date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    const dates = [date.toString()];
    const result = await controller.getSessions(community._id.toHexString(), '', undefined, dates);
    expect(result.length).toEqual(1);
  });

  it('should get session by id', async () => {
    const { community } = await createCommunity(module);
    const { session } = await createSession(module, community);
    const result = await controller.getSession(session._id.toHexString());
    expect(result).toBeDefined();
  });

  it('should create session', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const sessionCreate: SessionCreateDTO = {
      title: 'New session',
      description: 'New session',
      community: community._id.toHexString(),
      dateStart: new Date(),
      dateEnd: new Date(),
      newTrackTimestamp: 15,
    };

    const session = await controller.createSession(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      sessionCreate
    );
    expect(session.description).toStrictEqual(sessionCreate.description);
  });

  it('should update session', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { session } = await createSession(module, community, {
      session: { newTrackTimestamp: community.newTracks[0].timestamp },
    });
    const sessionUpdatePayload: SessionUpdateDTO = {
      title: '     New    session  ',
      description: '        Updated session   ',
      dateStart: new Date(),
      dateEnd: new Date(),
      newTrackTimestamp: community.newTracks[0].timestamp,
      speakers: [
        {
          firstName: 'Joe',
          lastName: 'Perez',
          tags: ['keynote'],
          institutions: ['University'],
        },
      ],
      deposits: [],
    };

    const sessionDTO = await controller.updateSession(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      sessionUpdatePayload,
      session._id.toHexString()
    );

    expect(sessionDTO).toEqual({
      community: session.community._id.toHexString(),
      creator: session.creator._id.toHexString(),
      _id: session._id.toHexString(),
      actions: ['read', 'delete', 'edit'],
      title: 'New session',
      description: 'Updated session',
      dateStart: sessionUpdatePayload.dateStart,
      dateEnd: sessionUpdatePayload.dateEnd,
      newTrackTimestamp: community.newTracks[0].timestamp,
      speakers: [
        {
          firstName: 'Joe',
          lastName: 'Perez',
          tags: ['keynote'],
          institutions: ['University'],
          nickname: undefined,
          orcid: undefined,
          userId: undefined,
          gravatar: '6e6dd6d2d1c7d725de0d22a833bdd84b',
        },
      ],
      deposits: [],
    });
  });

  it('should delete session', async () => {
    const { community, communityOwner } = await createCommunity(module);
    const { session } = await createSession(module, community);

    await controller.deleteSession(
      { user: { sub: communityOwner.userId } } as unknown as typeof request,
      session._id.toHexString()
    );
    const result = await controller.getSessions(session.community.toString());
    expect(result.length).toEqual(0);
  });
});
