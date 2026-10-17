import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  AIReport,
  Group,
  Notification,
  Proposal,
  Transaction,
  User,
} from "../models";
import { hashPassword } from "../utils/password";
import logger from "../utils/logger";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEMO_PREFIX = "[DEMO]";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "BadenyaDemo123!";
const DEMO_NOTIFICATION_ACTION_PREFIX = "badenya://demo/";
const RESET_FLAG = "--reset";

type SeedUserKey = "admin" | "fatou" | "moussa" | "aicha" | "koffi";

interface SeedUserDefinition {
  key: SeedUserKey;
  fullName: string;
  email: string;
  phone: string;
  role: "user" | "admin";
}

const userDefinitions: SeedUserDefinition[] = [
  {
    key: "admin",
    fullName: "Admin Badenya",
    email: "admin@badenya.test",
    phone: "+2250700000001",
    role: "admin",
  },
  {
    key: "fatou",
    fullName: "Fatou Diarra",
    email: "fatou@badenya.test",
    phone: "+2250700000002",
    role: "user",
  },
  {
    key: "moussa",
    fullName: "Moussa Koné",
    email: "moussa@badenya.test",
    phone: "+2250700000003",
    role: "user",
  },
  {
    key: "aicha",
    fullName: "Aïcha Traoré",
    email: "aicha@badenya.test",
    phone: "+2250700000004",
    role: "user",
  },
  {
    key: "koffi",
    fullName: "Koffi Yao",
    email: "koffi@badenya.test",
    phone: "+2250700000005",
    role: "user",
  },
];

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const getMongoUri = (): string =>
  process.env.MONGODB_URI || "mongodb://localhost:27017/badenya";

const validateSeedConfiguration = (): void => {
  if (DEMO_PASSWORD.length < 12) {
    throw new Error(
      "SEED_DEMO_PASSWORD must contain at least 12 characters when provided.",
    );
  }
};

const createUsers = async (): Promise<
  Record<SeedUserKey, mongoose.Types.ObjectId>
> => {
  const password = await hashPassword(DEMO_PASSWORD);
  const ids = {} as Record<SeedUserKey, mongoose.Types.ObjectId>;

  for (const definition of userDefinitions) {
    const user = await User.findOneAndUpdate(
      { email: definition.email },
      {
        $set: {
          fullName: definition.fullName,
          phone: definition.phone,
          password,
          role: definition.role,
          isEmailVerified: true,
          isActive: true,
          preferences: {
            language: "fr",
            currency: "XOF",
            notifications: {
              push: true,
              email: true,
              proposalCreated: true,
              proposalVoted: true,
              contributionReceived: true,
            },
            theme: "light",
          },
        },
        $setOnInsert: {
          refreshTokens: [],
          deviceTokens: [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    if (!user) {
      throw new Error(`Unable to seed user ${definition.email}`);
    }
    ids[definition.key] = user._id;
  }

  return ids;
};

const createGroups = async (
  users: Record<SeedUserKey, mongoose.Types.ObjectId>,
): Promise<mongoose.Types.ObjectId[]> => {
  const groupDefinitions = [
    {
      name: `${DEMO_PREFIX} Tontine mensuelle`,
      description:
        "Tontine de démonstration pour tester les cotisations et les rapports.",
      type: "tontine" as const,
      amount: 25000,
      members: [
        { userId: users.admin, role: "admin" as const },
        { userId: users.fatou, role: "treasurer" as const },
        { userId: users.moussa, role: "member" as const },
        { userId: users.aicha, role: "member" as const },
      ],
    },
    {
      name: `${DEMO_PREFIX} Projet communautaire`,
      description:
        "Projet collectif de démonstration avec vote et suivi budgétaire.",
      type: "project" as const,
      amount: 50000,
      members: [
        { userId: users.admin, role: "admin" as const },
        { userId: users.moussa, role: "treasurer" as const },
        { userId: users.koffi, role: "member" as const },
      ],
    },
    {
      name: `${DEMO_PREFIX} Famille élargie`,
      description: "Epargne familiale de démonstration.",
      type: "family" as const,
      amount: 15000,
      members: [
        { userId: users.admin, role: "admin" as const },
        { userId: users.aicha, role: "member" as const },
        { userId: users.koffi, role: "member" as const },
      ],
    },
  ];

  const ids: mongoose.Types.ObjectId[] = [];
  for (const definition of groupDefinitions) {
    const group = await Group.findOneAndUpdate(
      { name: definition.name, createdBy: users.admin },
      {
        $set: {
          name: definition.name,
          description: definition.description,
          type: definition.type,
          currency: "XOF",
          targetAmount: definition.amount * definition.members.length * 6,
          contributionSettings: {
            frequency: "monthly",
            amount: definition.amount,
            dueDay: 5,
            autoReminder: true,
          },
          members: definition.members.map((member) => ({
            ...member,
            joinedAt: daysAgo(120),
            totalContributed: 0,
            status: "active" as const,
          })),
          votingRules: {
            quorum: 50,
            approvalThreshold: 50,
            votingDuration: 72,
            allowAbstention: true,
          },
          stats: {
            totalContributions: 0,
            totalExpenses: 0,
            totalProposals: 0,
            activeProposals: 0,
          },
          settings: {
            isPrivate: false,
            requireApprovalToJoin: false,
            allowMemberProposals: true,
            maxProposalsPerMonth: 10,
          },
          isActive: true,
          createdBy: users.admin,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    if (!group) {
      throw new Error(`Unable to seed group ${definition.name}`);
    }
    ids.push(group._id);
  }

  return ids;
};

const createTransactions = async (
  groupIds: mongoose.Types.ObjectId[],
  users: Record<SeedUserKey, mongoose.Types.ObjectId>,
): Promise<void> => {
  await Transaction.deleteMany({ groupId: { $in: groupIds } });

  const transactions = groupIds.flatMap((groupId, groupIndex) => {
    const memberKeys: SeedUserKey[] =
      groupIndex === 0
        ? ["fatou", "moussa", "aicha"]
        : groupIndex === 1
          ? ["moussa", "koffi"]
          : ["aicha", "koffi"];
    const monthlyContributions = memberKeys.flatMap((memberKey, memberIndex) =>
      [90, 60, 30].map((days, monthIndex) => ({
        groupId,
        type: "contribution" as const,
        amount: groupIndex === 0 ? 25000 : groupIndex === 1 ? 50000 : 15000,
        currency: "XOF",
        description: `Cotisation ${monthIndex + 1} — ${userDefinitions.find((user) => user.key === memberKey)?.fullName}`,
        category: "cotisation",
        initiatedBy: users[memberKey],
        paymentMethod: {
          type:
            monthIndex % 2 === 0
              ? ("mobile_money" as const)
              : ("cash" as const),
          provider: monthIndex % 2 === 0 ? "Orange Money" : undefined,
          reference: `DEMO-${groupIndex + 1}-${memberIndex + 1}-${monthIndex + 1}`,
        },
        status: "completed" as const,
        processedAt: daysAgo(days),
        createdAt: daysAgo(days),
        updatedAt: daysAgo(days),
      })),
    );

    const expenses = [
      {
        groupId,
        type: "expense" as const,
        amount: groupIndex === 0 ? 18000 : groupIndex === 1 ? 75000 : 12000,
        currency: "XOF",
        description:
          groupIndex === 1
            ? "Achat de matériel communautaire"
            : "Frais de fonctionnement",
        category: groupIndex === 1 ? "matériel" : "fonctionnement",
        initiatedBy: users.admin,
        paymentMethod: {
          type: "bank_transfer" as const,
          provider: "Badenya Demo",
        },
        status: "completed" as const,
        processedAt: daysAgo(20 + groupIndex),
        createdAt: daysAgo(20 + groupIndex),
        updatedAt: daysAgo(20 + groupIndex),
      },
    ];

    return [...monthlyContributions, ...expenses];
  });

  const created = await Transaction.insertMany(transactions);

  for (let index = 0; index < groupIds.length; index += 1) {
    const groupTransactions = created.filter(
      (transaction) =>
        transaction.groupId.toString() === groupIds[index].toString(),
    );
    const contributions = groupTransactions
      .filter((transaction) => transaction.type === "contribution")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = groupTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const group = await Group.findById(groupIds[index]);
    if (!group) continue;

    group.balance = contributions - expenses;
    group.stats.totalContributions = contributions;
    group.stats.totalExpenses = expenses;
    group.members = group.members.map((member) => ({
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      status: member.status,
      totalContributed: groupTransactions
        .filter(
          (transaction) =>
            transaction.type === "contribution" &&
            transaction.initiatedBy.toString() === member.userId.toString(),
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      lastContributionAt: daysAgo(30),
    }));
    await group.save();
  }
};

const createProposalsAndVotes = async (
  groupIds: mongoose.Types.ObjectId[],
  users: Record<SeedUserKey, mongoose.Types.ObjectId>,
): Promise<void> => {
  await Proposal.deleteMany({ groupId: { $in: groupIds } });

  await Proposal.create({
    groupId: groupIds[0],
    title: "Achat de fournitures pour la prochaine réunion",
    description:
      "Prévoir les fournitures et la location de la salle pour la prochaine rencontre.",
    amount: 45000,
    currency: "XOF",
    proposedBy: users.fatou,
    category: "event",
    priority: "medium",
    attachments: [],
    votes: [
      {
        userId: users.admin,
        decision: "for",
        comment: "Budget cohérent.",
        votedAt: daysAgo(2),
      },
      { userId: users.moussa, decision: "for", votedAt: daysAgo(1) },
    ],
    votingDeadline: daysFromNow(4),
    status: "pending",
  });

  await Proposal.create({
    groupId: groupIds[1],
    title: "Valider le fournisseur du matériel",
    description: "Choisir le fournisseur pour équiper le projet communautaire.",
    amount: 75000,
    currency: "XOF",
    proposedBy: users.moussa,
    category: "investment",
    priority: "high",
    attachments: [],
    votes: [],
    votingDeadline: daysAgo(8),
    status: "approved",
    result: {
      totalVotes: 3,
      votesFor: 2,
      votesAgainst: 1,
      votesAbstain: 0,
      participationRate: 100,
      decidedAt: daysAgo(8),
    },
  });


  for (let index = 0; index < groupIds.length; index += 1) {
    const group = await Group.findById(groupIds[index]);
    if (!group) continue;

    group.stats.totalProposals = index < 2 ? 1 : 0;
    group.stats.activeProposals = index === 0 ? 1 : 0;
    await group.save();
  }
};

const createNotifications = async (
  groupIds: mongoose.Types.ObjectId[],
  users: Record<SeedUserKey, mongoose.Types.ObjectId>,
): Promise<void> => {
  await Notification.deleteMany({
    userId: { $in: Object.values(users) },
    "data.actionUrl": { $regex: `^${DEMO_NOTIFICATION_ACTION_PREFIX}` },
  });

  await Notification.insertMany([
    {
      userId: users.admin,
      type: "proposal_created",
      title: "Nouvelle proposition",
      message: "Fatou a créé une proposition dans la tontine mensuelle.",
      data: {
        groupId: groupIds[0],
        actionUrl: `${DEMO_NOTIFICATION_ACTION_PREFIX}proposal-created`,
      },
      isRead: false,
      priority: "normal",
    },
    {
      userId: users.fatou,
      type: "contribution_received",
      title: "Contribution enregistrée",
      message: "Votre dernière cotisation a bien été enregistrée.",
      data: {
        groupId: groupIds[0],
        amount: 25000,
        actionUrl: `${DEMO_NOTIFICATION_ACTION_PREFIX}contribution-received`,
      },
      isRead: false,
      priority: "normal",
    },
    {
      userId: users.moussa,
      type: "vote_reminder",
      title: "Vote en attente",
      message: "N’oubliez pas de voter pour la prochaine réunion.",
      data: {
        groupId: groupIds[0],
        actionUrl: `${DEMO_NOTIFICATION_ACTION_PREFIX}vote-reminder`,
      },
      isRead: false,
      priority: "high",
    },
    {
      userId: users.aicha,
      type: "member_joined",
      title: "Nouveau membre",
      message: "Koffi a rejoint le groupe de démonstration.",
      data: {
        groupId: groupIds[2],
        actionUrl: `${DEMO_NOTIFICATION_ACTION_PREFIX}member-joined`,
      },
      isRead: true,
      readAt: daysAgo(2),
      priority: "low",
    },
  ]);
};

const createAiReport = async (
  groupId: mongoose.Types.ObjectId,
  generatedBy: mongoose.Types.ObjectId,
): Promise<void> => {
  await AIReport.deleteMany({ groupId });
  await AIReport.create({
    groupId,
    generatedBy,
    periodStart: daysAgo(90),
    periodEnd: new Date(),
    transactionsAnalyzed: 10,
    modelUsed: "seed-demo",
    tokensUsed: 0,
    report: {
      summary:
        "Les contributions sont régulières et le groupe conserve une capacité de dépense saine.",
      totalContributions: 225000,
      totalExpenses: 18000,
      netBalance: 207000,
      insights: [
        {
          category: "Régularité",
          observation: "Les cotisations des trois derniers mois sont stables.",
          recommendation: "Conserver le rappel automatique avant le 5 du mois.",
        },
        {
          category: "Dépenses",
          observation:
            "Les frais de fonctionnement représentent une faible part du budget.",
          recommendation:
            "Maintenir une réserve minimale de deux cotisations mensuelles.",
        },
      ],
      trends: [
        { metric: "Contributions", value: 225000, change: 8, direction: "up" },
        { metric: "Dépenses", value: 18000, change: -4, direction: "down" },
      ],
      predictions: [
        {
          timeframe: "30 jours",
          metric: "Solde estimé",
          predictedValue: 282000,
          confidence: 0.82,
        },
      ],
    },
  });
};

const resetDatabase = async (): Promise<void> => {
  if (process.env.SEED_ALLOW_RESET !== "true") {
    throw new Error("Refusing --reset: set SEED_ALLOW_RESET=true explicitly.");
  }

  await Promise.all([
    AIReport.deleteMany({}),
    Group.deleteMany({}),
    Notification.deleteMany({}),
    Proposal.deleteMany({}),
    Transaction.deleteMany({}),
    User.deleteMany({}),
  ]);
};

const seed = async (): Promise<void> => {
  const reset = process.argv.includes(RESET_FLAG);
  validateSeedConfiguration();
  await mongoose.connect(getMongoUri());

  if (reset) {
    await resetDatabase();
    logger.warn("Seed reset completed: all collections were cleared.");
  }

  const users = await createUsers();
  const groupIds = await createGroups(users);
  await createTransactions(groupIds, users);
  await createProposalsAndVotes(groupIds, users);
  await createNotifications(groupIds, users);
  await createAiReport(groupIds[0], users.admin);

  logger.info("Seed completed successfully", {
    database: mongoose.connection.name,
    users: userDefinitions.length,
    groups: groupIds.length,
    demoUsers: userDefinitions.map(({ email }) => email),
  });
};

seed()
  .catch((error) => {
    logger.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
