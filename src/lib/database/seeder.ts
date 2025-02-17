import { ServerlessInjectable } from 'elea-di';
import { nanoid } from 'nanoid';
import { faker } from '@faker-js/faker';
import bcryptjs from 'bcryptjs';
import type { SQLiteTable, TableConfig } from 'drizzle-orm/sqlite-core';

export class SeederService extends ServerlessInjectable {
	static __dependencies__ = [];
	readonly faker = faker;
	readonly nanoid = nanoid;
	readonly bcryptjs = bcryptjs;

	constructor() {
		super();
		this.generateUniqueId.bind(this);
		this.seed.bind(this);
	}

	async seed<Table extends SQLiteTable<TableConfig>>(
		db: Types.db,
		table: Table,
		data: Table['$inferInsert'] | Table['$inferInsert'][]
	) {
		if (Array.isArray(data)) {
			const [first, ...rest] = data.map((user) =>
				db.insert(table).values(user).returning()
			);
			return await db.batch([first, ...rest]).catch((e: any) => {
				console.log({
					data,
					error: e,
				});
				null;
			});
		}
		return await db
			.insert(table)
			.values(data)
			.returning()
			.catch((e: any) => {
				console.log({
					data,
					error: e,
				});
				null;
			});
	}

	generateUniqueId(set: Set<string>, prefix: string): string {
		let id;
		do {
			id = this.id(prefix);
		} while (set.has(id));
		set.add(id);
		return id;
	}

	id(prefix: string): string {
		return `${prefix}${this.nanoid(21)}`;
	}

	boolean(chanceToBeTrue: number = 0.5): boolean {
		return this.faker.datatype.boolean(chanceToBeTrue);
	}

	status(chanceToBeTrue: number = 0.9): boolean {
		return this.faker.datatype.boolean(chanceToBeTrue);
	}

	firstName(sexType?: 'male' | 'female'): string {
		return this.faker.person.firstName(sexType);
	}

	lastName(sexType?: 'male' | 'female'): string {
		return this.faker.person.lastName(sexType);
	}

	email(name?: { firstName: string; lastName: string }): string {
		if (name) {
			const emailDomain = this.faker.internet.domainName().toLowerCase();
			const randomNumber = this.faker.number.int({ min: 1, max: 99 });
			const symbol = this.faker.helpers.arrayElement(['.', '_', '-']);
			return `${name.firstName}${symbol}${name.lastName}${randomNumber}@${emailDomain}`;
		}
		return this.faker.internet.email().toLowerCase();
	}

	hashedPassword(password: string = 'password'): string {
		return this.bcryptjs.hashSync(password, 10);
	}
	avatar(): string {
		return this.faker.image.avatar();
	}
	thumbnail(): string {
		return this.faker.image.avatar();
	}

	companyName(): string {
		return this.faker.company.name();
	}

	productName(): string {
		return this.faker.commerce.productName();
	}

	address(): string {
		return this.faker.location.streetAddress();
	}

	pastDate(): Date {
		return this.faker.date.past();
	}

	futureDate(): Date {
		return this.faker.date.future();
	}

	chooseFromArray<T extends unknown>(array: T[] | readonly T[]): T {
		return this.faker.helpers.arrayElement(array);
	}

	shortDescription(): string {
		return this.faker.lorem.sentence();
	}

	longDescription(): string {
		return this.faker.lorem.paragraph();
	}

	unit(): string {
		const units = ['kg', 'g', 'ml', 'l'];
		return faker.helpers.arrayElement(units);
	}
	wholeNumber(
		data: {
			min: number;
			max: number;
			multipleOf?: number;
		} = {
			min: 0,
			max: 100,
			multipleOf: 1,
		}
	): number {
		return this.faker.number.int(data);
	}

	floatingNumber(
		data: {
			min: number;
			max: number;
			fractionDigits?: number;
			multipleOf?: number;
		} = {
			min: 0,
			max: 100,
			fractionDigits: 2,
		}
	): number {
		return this.faker.number.float(data);
	}

	mapId(arr: { id: string }[]): string[] {
		return arr.map((item) => item.id);
	}
}

export const SEEDER_SERVICE = Object.freeze(new SeederService());
