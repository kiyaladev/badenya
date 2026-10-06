import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Request, Response } from 'express';
import Vote from '../../models/Vote';
import Group from '../../models/Group';
import { castVote, closeVote, serializeVote } from '../../controllers/vote.controller';
let mongo: MongoMemoryServer;
const a = new mongoose.Types.ObjectId(), b = new mongoose.Types.ObjectId(), c = new mongoose.Types.ObjectId();
const options = [{ id: 'yes', label: 'Oui' }, { id: 'no', label: 'Non' }];
let groupId: mongoose.Types.ObjectId;
const request = (id: string, userId: mongoose.Types.ObjectId, body = {}) => ({ params: { id }, user: { id: userId.toString(), email: 'test@example.test' }, body } as unknown as Request);
function response() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res); res.json.mockReturnValue(res);
  return res as unknown as Response & { status: jest.Mock; json: jest.Mock };
}
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });
beforeEach(async () => {
  await Vote.deleteMany({}); await Group.deleteMany({});
  const group = await Group.create({ name: 'Governance', type: 'association', createdBy: a, members: [{ userId: a, role: 'admin', status: 'active' }, { userId: b, role: 'member', status: 'active' }, { userId: c, role: 'member', status: 'suspended' }] });
  groupId = group._id as mongoose.Types.ObjectId;
});
async function poll(config = {}) { return Vote.create({ groupId, title: 'Decision', description: 'A real poll', createdBy: a, options, endDate: new Date(Date.now() + 60000), ...config }); }
it('recounts both options after a ballot changes', async () => {
  const vote = await poll();
  await castVote(request(String(vote._id), a, { optionId: 'yes' }), response());
  await castVote(request(String(vote._id), a, { optionId: 'no' }), response());
  const saved = await Vote.findById(vote._id);
  expect(saved!.votes).toHaveLength(1);
  expect(saved!.options.map(option => option.votes)).toEqual([0, 1]);
});
it('preserves concurrent votes and forbids duplicate ballots', async () => {
  const vote = await poll();
  const results = [response(), response(), response()];
  await Promise.all([castVote(request(String(vote._id), a, { optionId: 'yes' }), results[0]), castVote(request(String(vote._id), b, { optionId: 'no' }), results[1]), castVote(request(String(vote._id), a, { optionId: 'no' }), results[2])]);
  results.forEach(res => expect(res.status).toHaveBeenCalledWith(200));
  const saved = await Vote.findById(vote._id);
  expect(saved!.votes).toHaveLength(2);
  expect(saved!.options.reduce((sum, option) => sum + option.votes, 0)).toBe(2);
});
it('blocks a suspended member from casting or closing even as creator', async () => {
  const vote = await poll({ createdBy: c });
  for (const handler of [castVote, closeVote]) {
    const res = response(); await handler(request(String(vote._id), c, { optionId: 'yes' }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  }
});
it('never exposes ballots for anonymous polls and hides all intermediate counts', async () => {
  const vote = await poll({ anonymousVoting: true, showIntermediateResults: false, votes: [{ userId: a, optionId: 'yes', comment: 'Identifiable comment' }] });
  const hidden = serializeVote(vote, b.toString());
  expect(hidden.votes).toEqual([]);
  expect(hidden.options.every((option: { votes?: number }) => option.votes === undefined)).toBe(true);
  expect(hidden.result).toBeUndefined();
  vote.status = 'closed'; vote.result = vote.calculateResults(2);
  const closed = serializeVote(vote, b.toString());
  expect(closed.votes).toEqual([]);
  expect(JSON.stringify(closed)).not.toContain('Identifiable comment');
});
it('applies quorum, unanimity, participation and ties', async () => {
  const vote = await poll({ type: 'quorum', quorumPercentage: 75, votes: [{ userId: a, optionId: 'yes' }] });
  expect(vote.calculateResults(2).participationRate).toBe(50);
  expect(vote.calculateResults(2).winningOptionId).toBeUndefined();
  vote.type = 'unanimous'; expect(vote.calculateResults(2).winningOptionId).toBeUndefined();
  vote.votes.push({ userId: b, optionId: 'yes', votedAt: new Date() });
  expect(vote.calculateResults(2).winningOptionId).toBe('yes');
  vote.type = 'simple'; vote.votes[1].optionId = 'no';
  expect(vote.calculateResults(2).winningOptionId).toBeUndefined();
});
it('closes with the active electorate count and remains idempotent', async () => {
  const vote = await poll({ votes: [{ userId: a, optionId: 'yes' }] });
  const res = response(); await closeVote(request(String(vote._id), a), res);
  expect(res.status).toHaveBeenCalledWith(200);
  const saved = await Vote.findById(vote._id);
  expect(saved!.result!.participationRate).toBe(50);
  await closeVote(request(String(vote._id), a), response());
  expect((await Vote.findById(vote._id))!.result!.decidedAt).toEqual(saved!.result!.decidedAt);
});
