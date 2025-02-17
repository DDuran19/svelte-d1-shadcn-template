import { relations } from 'drizzle-orm';
import { users } from './table';
import { systemMetaDataRelations } from '../helpers';

export const usersRelations = relations(users, ({ one, many }) => ({
	// @ts-expect-error
	...systemMetaDataRelations(one, users),
}));
