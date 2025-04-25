import { pgTable, integer, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'

export const files = pgTable("files", {
    id: uuid("id").defaultRandom().primaryKey(),

    // basic info
    name: text("name").notNull(),
    path: text("path").notNull(),
    size: integer("size").notNull(),
    type: text("type").notNull(),

    // storage info
    fileUrl: text("file_url").notNull(),
    thumbnilUrl: text("thumbnil_url"),

    // Ownership
    userId: text("user_id").notNull(),
    parentId: text("parent_id"),

    // file/folder flag
    isFolder: boolean("is_folder").default(false).notNull(),
    isStarred: boolean("is_starred").default(false).notNull(),
    isTrash: boolean("is_trashed").default(false).notNull(),

    // timestamp
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

})


export const filesRelations = relations(files, ({one, many}) => ({
    parent: one(files, {
        fields: [files.parentId],
        references: [files.id]
    } ),

    // relationship to child file/folder
    child: many(files)
}))


// type definations

export const File = typeof files.$inferSelect
export const NewFile = typeof files.$inferInsert