import { createTRPCRouter } from "../trpc";
import { propertyRouter } from "./property";
import { profileRouter } from "./profile";

export const appRouter = createTRPCRouter({
  property: propertyRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
