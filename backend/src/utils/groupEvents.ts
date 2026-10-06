import { IGroup } from '../models/Group';
import { NotificationType } from '../models/Notification';
import { enqueueEvent } from '../services/events.service';
import logger from './logger';
/** Group changes have committed before notification persistence. Retry keys use the
 * successful document revision; a notification failure does not undo membership. */
export async function groupEvent(group: IGroup, action: string, type: NotificationType, title: string, message: string) {
  try {
    await enqueueEvent(`group:${group.id}:${group.get('__v') || 0}:${action}`,group._id,type,title,message.slice(0,500));
  } catch (error) { logger.warn('Group notification persistence failed', {groupId:group.id,action,error:error instanceof Error ? error.message : 'unknown'}); }
}
