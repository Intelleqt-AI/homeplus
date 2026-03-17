import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "../db";
import { properties, rooms, appliances } from "../db/schema";

export const propertyRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(properties)
      .where(eq(properties.userId, ctx.user.id));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [property] = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, input.id),
            eq(properties.userId, ctx.user.id)
          )
        );

      return property ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        addressLine1: z.string().min(1),
        addressLine2: z.string().optional(),
        city: z.string().min(1),
        county: z.string().optional(),
        postcode: z.string().min(1),
        propertyType: z.enum([
          "house",
          "flat",
          "bungalow",
          "maisonette",
          "terraced",
          "semi_detached",
          "detached",
          "other",
        ]),
        ownershipType: z.enum(["owner_occupier", "tenant", "landlord"]),
        bedrooms: z.number().int().optional(),
        bathrooms: z.number().int().optional(),
        yearBuilt: z.number().int().optional(),
        localAuthority: z.string().optional(),
        epcRating: z.string().max(1).optional(),
        epcData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [property] = await db
        .insert(properties)
        .values({
          ...input,
          userId: ctx.user.id,
          isDefault: true,
        })
        .returning();

      return property;
    }),

  addRooms: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().uuid(),
        rooms: z.array(
          z.object({
            name: z.string().min(1),
            floor: z.number().int().default(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [property] = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, input.propertyId),
            eq(properties.userId, ctx.user.id)
          )
        );

      if (!property) {
        throw new Error("Property not found");
      }

      const inserted = await db
        .insert(rooms)
        .values(
          input.rooms.map((room, index) => ({
            propertyId: input.propertyId,
            name: room.name,
            floor: room.floor,
            sortOrder: index,
          }))
        )
        .returning();

      return inserted;
    }),

  addAppliance: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().uuid(),
        roomId: z.string().uuid().optional(),
        name: z.string().min(1),
        brand: z.string().optional(),
        model: z.string().optional(),
        serialNumber: z.string().optional(),
        purchaseDate: z.string().datetime().optional(),
        warrantyExpiry: z.string().datetime().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [property] = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, input.propertyId),
            eq(properties.userId, ctx.user.id)
          )
        );

      if (!property) {
        throw new Error("Property not found");
      }

      const [appliance] = await db
        .insert(appliances)
        .values({
          propertyId: input.propertyId,
          roomId: input.roomId,
          name: input.name,
          brand: input.brand,
          model: input.model,
          serialNumber: input.serialNumber,
          purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
          warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
          notes: input.notes,
        })
        .returning();

      return appliance;
    }),

  getRooms: protectedProcedure
    .input(z.object({ propertyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const [property] = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, input.propertyId),
            eq(properties.userId, ctx.user.id)
          )
        );

      if (!property) {
        throw new Error("Property not found");
      }

      return db
        .select()
        .from(rooms)
        .where(eq(rooms.propertyId, input.propertyId));
    }),

  getAppliances: protectedProcedure
    .input(z.object({ propertyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const [property] = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, input.propertyId),
            eq(properties.userId, ctx.user.id)
          )
        );

      if (!property) {
        throw new Error("Property not found");
      }

      return db
        .select()
        .from(appliances)
        .where(eq(appliances.propertyId, input.propertyId));
    }),
});
