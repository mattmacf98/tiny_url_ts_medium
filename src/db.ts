import { Client } from 'pg';

export class Database {
    private db: Client;
    private constructor(db: Client) {
        this.db = db;
        this._initTables();
    }

    public static async Connect(dsn: string): Promise<Database> {
        const db = new Client({
            connectionString: dsn,
        });
        await db.connect();
        return new Database(db);
    }

    public async addShortUrlEntry(shortId: string, originalUrl: string) {
        try {
            await this.db.query(
                'INSERT INTO short_urls (short_id, url) VALUES ($1, $2)',
                [shortId, originalUrl]
            );

            await this.db.query(
                `INSERT INTO short_url_stats (short_id, count) VALUES ($1, $2)`,
                [shortId, 0]
            )
        } catch (err) {
            if (err instanceof Error && err.message.includes('duplicate key value violates unique constraint')) {
                // Ignore duplicate inserts gracefully
                console.log("duplicate key")
                return;
            }
            throw err;
        }
    }

    public async getShortUrlByShortId(shortId: string): Promise<string | null> {
        try {
            const result = await this.db.query(
                'SELECT url FROM short_urls WHERE short_id=$1',
                [shortId]
            );
            if (result.rows.length > 0) {
                return result.rows[0].url;
            }
            return null;
        } catch (err) {
            console.warn(err);
            return null;
        }
    }

    public async incrementShortIdAccesses(shortId: string) {
        const result = await this.db.query(
            'SELECT count FROM short_url_stats WHERE short_id=$1',
            [shortId]
        );
        if (result.rows.length == 0) return;

        const currentCount = result.rows[0].count as number;

        await this.db.query(
            'UPDATE short_url_stats SET count=$1 WHERE short_id=$2',
            [currentCount + 1, shortId]
        )
    }

    public async destroy() {
        await this.db.end();
    }

    private _initTables() {
        const createShortUrlsQuery = `
            CREATE TABLE IF NOT EXISTS short_urls (
               short_id VARCHAR PRIMARY KEY,
               url TEXT NOT NULL
            )
        `
        this.db.query(createShortUrlsQuery);

        const createShortUrlStatsQuery = `
           CREATE TABLE IF NOT EXISTS short_url_stats (
                short_id VARCHAR PRIMARY KEY,
                count INTEGER NOT NULL DEFAULT 0
            );
        `
        this.db.query(createShortUrlStatsQuery);
    }

}