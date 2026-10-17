import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Request, Response } from 'express';
import Group from '../../models/Group';
import User from '../../models/User';
import { addMember, updateMemberRole, getGroupById } from '../../controllers/group.controller';
import { join, decideJoinRequest, invitationCode } from '../../controllers/community.controller';
import request from 'supertest';
import { createTestApp } from '../helpers/app';
import { generateAccessToken } from '../../utils/jwt';
let mongo: MongoMemoryServer;
let a: mongoose.Types.ObjectId,b: mongoose.Types.ObjectId,c: mongoose.Types.ObjectId;
function req(id: string, actor: mongoose.Types.ObjectId, body = {}, extra = {}) { return {params:{id},user:{id:String(actor),email:'test@example.test'},body,...extra} as unknown as Request; }
function res() { const response={status:jest.fn(),json:jest.fn()}; response.status.mockReturnValue(response);return response as unknown as Response & {status:jest.Mock;json:jest.Mock}; }
async function group(settings = {}, roles = ['admin','member']) { return Group.create({name:'Shared',type:'association',createdBy:a,members:[{userId:a,role:roles[0],status:'active'},{userId:b,role:roles[1],status:'active'}],settings:{requireApprovalToJoin:false,...settings}}); }
beforeAll(async()=>{mongo=await MongoMemoryServer.create();await mongoose.connect(mongo.getUri());});
afterAll(async()=>{await mongoose.disconnect();await mongo.stop();});
beforeEach(async()=>{await Group.deleteMany({});await User.deleteMany({});const users=await User.create(['A','B','C'].map((name,i)=>({fullName:name,email:`${name}@example.test`,phone:`+2237000000${i}`,password:'hashed-password',isActive:true})));[a,b,c]=users.map(user=>user._id as mongoose.Types.ObjectId);});
it('rejects assigning administrator privileges through a treasurer',async()=>{
 const saved=await group({},['admin','treasurer']);const response=res();await addMember(req(String(saved._id),b,{userId:String(c),role:'admin'}),response);
 expect(response.status).toHaveBeenCalledWith(403);expect((await Group.findById(saved._id))!.members).toHaveLength(2);
});
it('rejects nonexistent and globally suspended membership targets',async()=>{
 const saved=await group();for(const target of [new mongoose.Types.ObjectId(),c]) {if(target===c)await User.updateOne({_id:c},{$set:{isActive:false}});const response=res();await addMember(req(String(saved._id),a,{userId:String(target)}),response);expect(response.status).toHaveBeenCalledWith(404);}
});
it('applies group capacity and prevents simultaneous joins from exceeding it',async()=>{
 const saved=await group({maxMembers:3});const d=await User.create({fullName:'D',email:'d@example.test',phone:'+22370000004',password:'hashed'});
 const responses=[res(),res()];await Promise.all([join(req(String(saved._id),c),responses[0]),join(req(String(saved._id),d._id as mongoose.Types.ObjectId),responses[1])]);
 const after=await Group.findById(saved._id);expect(after!.members.filter(member=>member.status==='active')).toHaveLength(3);
 expect(responses.filter(response=>response.status.mock.calls.some(call=>call[0]===409))).toHaveLength(1);
});
it('suspended members cannot rejoin and archived groups never accept requests',async()=>{
 const saved=await group();saved.members[1].status='suspended';await saved.save();const suspended=res();await join(req(String(saved._id),b),suspended);expect(suspended.status).toHaveBeenCalledWith(403);
 saved.archivedAt=new Date();saved.isActive=false;await saved.save();const archived=res();await join(req(String(saved._id),c),archived);expect(archived.status).toHaveBeenCalledWith(404);
});
it('deduplicates concurrent join requests and removes requests on approval',async()=>{
 const saved=await group({requireApprovalToJoin:true});await Promise.all([join(req(String(saved._id),c),res()),join(req(String(saved._id),c),res())]);
 let after=await Group.findById(saved._id);expect(after!.joinRequests).toHaveLength(1);
 const requestId=String(after!.joinRequests[0]._id);await decideJoinRequest(req(String(saved._id),a,{}, {params:{id:String(saved._id),requestId},path:'/approve'}),res());
 after=await Group.findById(saved._id);expect(after!.joinRequests).toHaveLength(0);expect(after!.members.some(member=>String(member.userId)===String(c)&&member.status==='active')).toBe(true);
});
it('persists a public admission request when the HTTP POST has no body', async () => {
 const saved = await group({ isPrivate: false, requireApprovalToJoin: true });
 const app = createTestApp();
 const token = generateAccessToken({ id: String(c), email: 'C@example.test', sessionVersion: 0 });
 const response = await request(app).post(`/api/v1/groups/${saved.id}/join`).set('Authorization', `Bearer ${token}`);
 expect(response.status).toBe(200);
 expect(response.body.data.status).toBe('pending');
 const after = await Group.findById(saved._id);
 if (!after) throw new Error('Expected admission group to remain available');
 expect(after.joinRequests).toHaveLength(1);
 expect(String(after.joinRequests[0].userId)).toBe(String(c));
});
it('approval honors capacity and leaves the request available for retry',async()=>{
 const saved=await group({maxMembers:2,requireApprovalToJoin:true});saved.joinRequests.push({_id:new mongoose.Types.ObjectId(),userId:c,requestedAt:new Date()});await saved.save();const response=res();await decideJoinRequest(req(String(saved._id),a,{}, {params:{id:String(saved._id),requestId:String(saved.joinRequests[0]._id)},path:'/approve'}),response);
 expect(response.status).toHaveBeenCalledWith(409);expect((await Group.findById(saved._id))!.joinRequests).toHaveLength(1);
});
it('preserves at least one administrator when demotions race',async()=>{
 const saved=await group({},['admin','admin']);const responses=[res(),res()];await Promise.all([updateMemberRole(req(String(saved._id),a,{role:'member'},{params:{id:String(saved._id),userId:String(b)}}),responses[0]),updateMemberRole(req(String(saved._id),b,{role:'member'},{params:{id:String(saved._id),userId:String(a)}}),responses[1])]);
 expect((await Group.findById(saved._id))!.members.filter(member=>member.role==='admin'&&member.status==='active')).toHaveLength(1);
 expect(responses.filter(response=>response.status.mock.calls.some(call=>call[0]===409))).toHaveLength(1);
});
it('keeps legacy invitation code generation stable across parallel requests',async()=>{
 const saved=await group();await Group.collection.updateOne({_id:saved._id as mongoose.Types.ObjectId},{$unset:{invitationCode:''}});const responses=[res(),res()];await Promise.all(responses.map(response=>invitationCode(req(String(saved._id),a),response)));
 const codes=responses.map(response=>response.json.mock.calls[0][0].data.code);expect(codes[0]).toHaveLength(24);expect(codes[0]).toBe(codes[1]);
});
it('uses populated member identifiers without revealing admin-only requests and codes',async()=>{
 const saved=await group();const response=res();await getGroupById(req(String(saved._id),b),response);expect(response.status).toHaveBeenCalledWith(200);const data=response.json.mock.calls[0][0].data.group;expect(data.invitationCode).toBeUndefined();expect(data.joinRequests).toBeUndefined();expect(data.members[1].userId.fullName).toBe('B');
});
it('bounds governance and contribution settings at the schema level',async()=>{
 const saved=await group();saved.votingRules.quorum=101;saved.contributionSettings.amount=-1;saved.settings.maxMembers=0;await expect(saved.save()).rejects.toBeInstanceOf(mongoose.Error.ValidationError);
});
