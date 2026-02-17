import { Prisma } from "prisma/generated/client";

export const SafeUser = {
    id: true,
    name: true,
    email: true,
    createdAt: true,
} as const satisfies Prisma.UserSelect;