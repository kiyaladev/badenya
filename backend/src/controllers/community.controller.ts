import { groupEvent } from '../services/events.service';
import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Group, User } from '../models';
import { IGroup } from '../models/Group';
import { AuthRequest } from '../middleware/auth';
import { activeMember, entityId } from '../utils/membership';
import { BusinessError } from '../services/financial.service';
function fail(res: Response, error: unknown) {
  if (error instanceof BusinessError) res.status(error.status).json({ status: 'error', message: error.message });
  else if (error instanceof mongoose.Error.VersionError) res.status(409).json({status:'error',message:'Le groupe a été modifié : réessayez'});
  else if (error instanceof mongoose.Error.CastError || error instanceof mongoose.Error.ValidationError) res.status(400).json({status:'error',message:'Données invalides'});
  else res.status(500).json({status:'error',message:'Échec de la demande'});
}
async function mutate<T>(read: () => Promise<IGroup | null>, work: (group: IGroup) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const group = await read();
    if (!group || !group.isActive || group.archivedAt) throw new BusinessError(404,'Groupe introuvable');
    try { return await work(group); }
    catch (error) { if (!(error instanceof mongoose.Error.VersionError) || attempt === 7) throw error; }
  }
  throw new BusinessError(409,'Modification concurrente');
}
function capacity(group: IGroup) {
  if (group.members.filter(member => member.status === 'active').length >= (group.settings.maxMembers || 100)) throw new BusinessError(409,'Capacité du groupe atteinte');
}
export async function discover(req:Request,res:Response) {
  try {
    const search=String(req.query.search || '').slice(0,100).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const groups=await Group.find({isActive:true,archivedAt:{$exists:false},'settings.isPrivate':false,...(search?{name:{$regex:search,$options:'i'}}:{})}).sort({createdAt:-1}).limit(100).lean();
    res.json({status:'success',data:{groups:groups.map(group=>({_id:group._id,name:group.name,description:group.description,type:group.type,currency:group.currency,contributionSettings:group.contributionSettings,settings:group.settings,memberCount:group.members.filter(member=>member.status==='active').length,avatar:group.avatar}))}});
  } catch(error) { fail(res,error); }
}
export async function join(req:Request,res:Response) {
  try {
    const actor=(req as AuthRequest).user?.id;
    if (!actor || !await User.exists({_id:actor,isActive:true})) throw new BusinessError(403,'Compte actif requis');
    const code=typeof req.body?.code==='string'?req.body.code.trim().toLowerCase():undefined;
    const result=await mutate(() => code ? Group.findOne({invitationCode:code}) : Group.findById(req.params.id), async group => {
      if (!code && group.settings.isPrivate) throw new BusinessError(404,'Groupe introuvable');
      const previous=group.members.find(member=>entityId(member.userId)===actor);
      if(previous?.status==='suspended') throw new BusinessError(403,'Adhésion suspendue : contactez un responsable');
      if(previous?.status==='active') return {status:'active',groupId:group.id};
      capacity(group);
      if(group.settings.requireApprovalToJoin) {
        if (!group.joinRequests.some(request=>entityId(request.userId)===actor)) {
          group.joinRequests.push({_id:new mongoose.Types.ObjectId(),userId:new mongoose.Types.ObjectId(actor),requestedAt:new Date()});
          await group.save();
        }
        return {status:'pending',groupId:group.id};
      }
      if(previous) { previous.status='active';previous.role='member';previous.joinedAt=new Date(); }
      else group.members.push({userId:new mongoose.Types.ObjectId(actor),role:'member',status:'active',joinedAt:new Date(),totalContributed:0});
      group.joinRequests=group.joinRequests.filter(request=>entityId(request.userId)!==actor);
      await group.save();
      await groupEvent(group, `member:${actor}`, 'member_joined', 'Membre ajouté', `Un nouveau membre a rejoint ${group.name}`);
      return {status:'active',groupId:group.id};
    });
    res.json({status:'success',data:result});
  }catch(error){fail(res,error);}
}
export async function listJoinRequests(req:Request,res:Response) {
  try {
    const group=await Group.findById(req.params.id).populate('joinRequests.userId','fullName avatar');
    if(!group || activeMember(group,(req as AuthRequest).user?.id || '')?.role!=='admin') throw new BusinessError(403,'Administrateur actif requis');
    res.json({status:'success',data:{requests:group.joinRequests}});
  }catch(error){fail(res,error);}
}
export async function decideJoinRequest(req:Request,res:Response) {
  try {
    const actor=(req as AuthRequest).user?.id || '';
    const approve=req.path.endsWith('/approve');
    const result=await mutate(()=>Group.findById(req.params.id),async group=>{
      if(activeMember(group,actor)?.role!=='admin') throw new BusinessError(403,'Administrateur actif requis');
      const pending=group.joinRequests.find(request=>entityId(request._id)===String(req.params.requestId));
      if(!pending) throw new BusinessError(404,'Demande introuvable');
      const previous=group.members.find(member=>entityId(member.userId)===entityId(pending.userId));
      const wasActive = previous?.status === 'active';
      if(approve) {
        if(previous?.status==='suspended') throw new BusinessError(403,'Membre suspendu');
        if(!await User.exists({_id:pending.userId,isActive:true})) throw new BusinessError(404,'Compte actif introuvable');
        if(previous?.status!=='active') {
          capacity(group);
          if(previous) {previous.status='active';previous.role='member';previous.joinedAt=new Date();}
          else group.members.push({userId:pending.userId,role:'member',status:'active',joinedAt:new Date(),totalContributed:0});
        }
      }
      group.joinRequests=group.joinRequests.filter(request=>entityId(request._id)!==entityId(pending._id));
      await group.save();
      if (approve && !wasActive) await groupEvent(group, `member:${entityId(pending.userId)}`, 'member_joined', 'Adhésion approuvée', `Un nouveau membre a rejoint ${group.name}`);
      return {status:approve?'active':'rejected',groupId:group.id};
    });
    res.json({status:'success',data:result});
  }catch(error){fail(res,error);}
}
export async function invitationCode(req:Request,res:Response) {
  try {
    const group=await Group.findById(req.params.id);
    const actor=(req as AuthRequest).user?.id || '';
    if(!group || activeMember(group,actor)?.role!=='admin') throw new BusinessError(403,'Administrateur actif requis');
    await Group.updateOne({_id:group._id,isActive:true,archivedAt:{$exists:false},members:{$elemMatch:{userId:actor,status:'active',role:'admin'}},$or:[{invitationCode:{$exists:false}},{invitationCode:null},{invitationCode:''}]},{$set:{invitationCode:crypto.randomBytes(12).toString('hex')},$inc:{__v:1}});
    const current=await Group.findById(group._id);
    if(!current || activeMember(current,actor)?.role!=='admin') throw new BusinessError(403,'Administrateur actif requis');
    res.json({status:'success',data:{code:current.invitationCode}});
  }catch(error){fail(res,error);}
}
