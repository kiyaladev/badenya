import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Group, Notification, User } from '../../models';
import DomainEvent from '../../models/DomainEvent';
import { deliverEvents, enqueueEvent } from '../../services/events.service';
import { sendPushNotification } from '../../services/notification.service';
import { isFirebaseReady } from '../../config/firebase';

const mockSendEach = jest.fn();
jest.mock('../../config/firebase', () => ({
  isFirebaseReady: jest.fn(() => true),
  getMessaging: jest.fn(() => ({ sendEachForMulticast: mockSendEach })),
}));
let mongo: MongoMemoryServer;
let userId: mongoose.Types.ObjectId;
let groupId: mongoose.Types.ObjectId;
const payload = {type: 'proposal_created' as const, title:'Proposal', message:'Vote now'};
const success = () => ({ok:true,json:async()=>({data:[{status:'ok',id:'ticket'}]})}) as Response;
beforeAll(async()=>{mongo=await MongoMemoryServer.create();await mongoose.connect(mongo.getUri());});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop();});
beforeEach(async()=>{
  jest.restoreAllMocks();mockSendEach.mockReset();jest.mocked(isFirebaseReady).mockReturnValue(true);
  mockSendEach.mockResolvedValue({successCount:1,failureCount:0,responses:[{success:true}]});
  await Promise.all([Group.deleteMany({}),User.deleteMany({}),Notification.deleteMany({}),DomainEvent.deleteMany({})]);
  const user=await User.create({fullName:'Receiver',email:'receiver@example.test',phone:'+22370000001',password:'test-hash',deviceTokens:['ExpoPushToken[test]'],isActive:true});
  userId=user._id as mongoose.Types.ObjectId;
  const group=await Group.create({name:'Notifications',type:'association',createdBy:userId,members:[{userId,role:'admin',status:'active'}]});
  groupId=group._id as mongoose.Types.ObjectId;
});
it('does not accept an Expo error ticket merely because the gateway returned HTTP 200',async()=>{
  const fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue({ok:true,json:async()=>({data:[{status:'error',details:{error:'MessageRateExceeded'}}]})} as Response);
  expect(await sendPushNotification(userId,payload,'expo')).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it.each([
  {push:false},
  {proposalCreated:false},
])('respects disabled user notification preferences %j',async preferences=>{
  await User.updateOne({_id:userId},{$set:Object.fromEntries(Object.entries(preferences).map(([key,value])=>[`preferences.notifications.${key}`,value]))});
  const fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue(success());
  expect(await sendPushNotification(userId,payload)).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();expect(mockSendEach).not.toHaveBeenCalled();
});
it('retries only a failed channel and keeps one in-app notification',async()=>{
  await User.updateOne({_id:userId},{$set:{deviceTokens:['ExpoPushToken[test]','fcm-token']}});
  const fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue(success());
  mockSendEach.mockResolvedValueOnce({successCount:0,failureCount:1,responses:[{success:false,error:{code:'messaging/internal-error'}}]});
  await enqueueEvent('channel-retry',groupId,'proposal_created','Proposal','Vote now');
  await deliverEvents();
  const waiting=await DomainEvent.findOne({key:'channel-retry'});
  expect(waiting!.get('deliveredAt')).toBeUndefined();
  const notification=await Notification.findOne({userId});
  expect(notification!.get('pushExpoDeliveredAt')).toBeInstanceOf(Date);
  expect(notification!.get('pushFcmDeliveredAt')).toBeUndefined();
  await DomainEvent.updateOne({_id:waiting!._id},{$set:{nextAttemptAt:new Date(0)}});
  await Notification.updateOne({_id:notification!._id},{$set:{pushLeaseUntil:new Date(0)}});
  await deliverEvents();
  expect(fetchMock).toHaveBeenCalledTimes(1);expect(mockSendEach).toHaveBeenCalledTimes(2);
  expect(await Notification.countDocuments({userId})).toBe(1);
  expect((await DomainEvent.findById(waiting!._id))!.get('deliveredAt')).toBeInstanceOf(Date);
});
it('does not mark an event delivered while another worker holds its notification lease',async()=>{
  const fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue(success());
  await enqueueEvent('leased',groupId,'proposal_created','Proposal','Vote now');
  await Notification.create({eventKey:`leased:${userId}`,userId,...payload,pushLeaseUntil:new Date(Date.now()+60000)});
  await deliverEvents();
  const event=await DomainEvent.findOne({key:'leased'});
  expect(event!.get('deliveredAt')).toBeUndefined();expect(event!.get('nextAttemptAt')).toBeInstanceOf(Date);
  expect(fetchMock).not.toHaveBeenCalled();
});
it('continues delivering later events when one provider delivery fails',async()=>{
  jest.spyOn(globalThis,'fetch').mockImplementation(async (_url, init)=>{
    const body=JSON.parse(String(init?.body)) as Array<{title:string}>;
    return body[0].title==='Fail' ? {ok:true,json:async()=>({data:[{status:'error'}]})} as Response : success();
  });
  await enqueueEvent('fail-first',groupId,'proposal_created','Fail','Retry later');
  await enqueueEvent('works-next',groupId,'proposal_created','Works','Available');
  await deliverEvents();
  expect((await DomainEvent.findOne({key:'fail-first'}))!.get('deliveredAt')).toBeUndefined();
  expect((await DomainEvent.findOne({key:'works-next'}))!.get('deliveredAt')).toBeInstanceOf(Date);
  expect(await Notification.countDocuments({userId})).toBe(2);
});
it('deduplicates an event and its delivered notification across worker retries',async()=>{
  const fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue(success());
  await enqueueEvent('once',groupId,'proposal_created','Proposal','Vote now');
  await enqueueEvent('once',groupId,'proposal_created','Proposal','Vote now');
  await deliverEvents();await deliverEvents();
  expect(await DomainEvent.countDocuments({key:'once'})).toBe(1);
  expect(await Notification.countDocuments({userId})).toBe(1);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('removes permanently invalid Expo tokens and avoids retransmitting to valid devices',async()=>{
  await User.updateOne(
    {_id:userId},
    {$set:{deviceTokens:['ExpoPushToken[valid]','ExpoPushToken[unregistered]']}}
  );
  const fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue({
    ok:true,
    json:async()=>({
      data:[
        {status:'ok',id:'valid-ticket'},
        {status:'error',details:{error:'DeviceNotRegistered'}},
      ],
    }),
  } as Response);
  await enqueueEvent('expo-invalid-cleanup',groupId,'proposal_created','Proposal','Vote now');
  await deliverEvents();
  const userAfter=await User.findById(userId);
  expect(userAfter?.deviceTokens).toEqual(['ExpoPushToken[valid]']);
  const event=await DomainEvent.findOne({key:'expo-invalid-cleanup'});
  expect(event?.get('deliveredAt')).toBeInstanceOf(Date);
  const notification=await Notification.findOne({userId});
  expect(notification?.get('pushExpoDeliveredAt')).toBeInstanceOf(Date);
  await deliverEvents();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

